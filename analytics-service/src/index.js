import dotenv from "dotenv";
dotenv.config();

import logger from "./logger.js";
import { createConsumer, createProducer, ensureTopicExists } from "./kafka.js";
import { startConsumer } from "./consumer.js";
import { startServer } from "./server.js";

global.consumerConnected = false;
global.ready = false;

const PORT = process.env.PORT || 5001;
const TOPIC = process.env.KAFKA_TOPIC || "review.created";

const start = async () => {
  const consumer = createConsumer(
    process.env.KAFKA_CONSUMER_GROUP_ID || "analytics-group"
  );
  const producer = createProducer();

  await consumer.connect();
  await producer.connect();
  global.consumerConnected = true;

  await ensureTopicExists(TOPIC);
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  startConsumer(producer, consumer).catch((error) => {
    logger.error({ error }, "Kafka consumer stopped unexpectedly");
    process.exit(1);
  });

  const shutdown = startServer(PORT, consumer, producer);
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
  global.ready = true;

  logger.info("Analytics Service is up and running");
};

start().catch((error) => {
  logger.error({ error }, "Failed to start Analytics Service");
  process.exit(1);
});