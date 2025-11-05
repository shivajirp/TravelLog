import dotenv from "dotenv";
dotenv.config();

import logger from "./logger.js";
import { createConsumer, createProducer } from "./kafka.js";
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

  await consumer.subscribe({ topic: TOPIC, fromBeginning: false });
  await startConsumer(producer, consumer);

  startServer(PORT, consumer, producer);
  global.ready = true;

  logger.info("Analytics Service is up and running");
};

start().catch((error) => {
  logger.error({ error }, "Failed to start Analytics Service");
  process.exit(1);
}); 