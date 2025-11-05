import logger from "./logger.js";
import { prisma } from "./prismaClient.js";
import { reviewProcessedCounter, reviewProcessingDuration } from "./metrics.js";
import dotenv from "dotenv";
import { retryWithBackoff } from "./utils/backoff.js";

dotenv.config();

const DLQ_TOPIC = process.env.KAFKA_DLQ_TOPIC || "review.created.dlq";

export const startConsumer = async (producer, consumer) => {
  await consumer.run({
    eachBatchAutoResolve: false,
    eachBatch: async ({
      batch,
      resolveOffset,
      heartbeat,
      commitOffsetsIfNecessary,
      uncommittedOffsets,
      isRunning,
      isStale,
      pause,
    }) => {
      for (let message of batch.messages) {
        if (!isRunning() || isStale()) break;

        const timer = reviewProcessingDuration.startTimer();
        let payload;

        try {
          payload = JSON.parse(message.value.toString());
        } catch (error) {
          logger.error(
            { err, offset: message.offset },
            "Failed to parse kafka message JSON"
          );
          reviewProcessedCounter.inc({ status: "invalid_payload" });
          continue;
        }

        try {
          await retryWithBackoff({ retries: 3, baseMs: 100 }, async () => {
            // Process the message: store analytics data in db
            await prisma.$transaction(async (txn) => {
              const { reviewId, placeId, userId, rating, comment, createdAt } =
                payload;

              // upsert place_stats
              await txn.$executeRaw`
                Insert into place_stats(place_id, total_reviews, total_rating, avg_rating)
                Values (${placeId}, 1, ${rating}, ${rating})
                On Conflict (place_id)
                Do update set
                    total_reviews = place_stats.total_reviews + 1,
                    total_rating = place_stats.total_rating + ${rating},
                    avg_rating = (place_stats.total_rating +  ${rating})::float / (place_stats.total_reviews + 1)
              `;

              // Insert into review_events
              await txn.$executeRaw`
                Insert into review_events(review_id, user_id, place_id, rating, comment, created_at)
                values(${reviewId}, ${userId}, ${placeId}, ${rating}, ${comment}, ${createdAt})
                On conflict (review_id) DO NOTHING
              `;
            });
          });

          reviewProcessedCounter.inc({ status: "success" });
          // mark message as processed
          resolveOffset(message.offset);
        } catch (error) {
          logger.error(
            {
              error,
              offset: message.offset,
              reviewId: payload?.reviewId,
              placeId: payload?.placeId,
              userId: payload?.userId,
            },
            "Failed to process message after retries, sending to DLQ"
          );

          reviewProcessedCounter.inc({ status: "dlq" });

          //sending to DLQ
          try {
            await producer.send({
              topic: DLQ_TOPIC,
              messages: [
                {
                  key: message.key?.toString(),
                  value: message.value?.toString(),
                },
              ],
            });

            resolveOffset(message.offset);
          } catch (dlqError) {
            logger.error(
              {
                dlqError,
                offset: message.offset,
              },
              "Failed to publish message to DLQ"
            );
          }
        } finally {
          timer();
          await heartbeat();
        }
      }

      await commitOffsetsIfNecessary();
    },
  });
};
