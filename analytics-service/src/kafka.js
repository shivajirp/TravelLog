import { Kafka } from "kafkajs";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

const kafka = new Kafka({
  clientId: "analytics-service",
  brokers: [process.env.KAFKA_BROKER],
  connectionTimeout: 3000,
});

export const ensureTopicExists = async (topic) => {
  const admin = kafka.admin();
  await admin.connect();
  const topics = await admin.listTopics();
  if (!topics.includes(topic)) {
    try {
      await admin.createTopics({
        topics: [
          { topic, numPartitions: 3, replicationFactor: 1 },
        ],
      });
      logger.info("Created missing topic:", topic);
    } catch (error) {
      logger.error("Failed to create topic", error);
    }
    await admin.disconnect();
  }
};

export const createProducer = () => {
  return kafka.producer();
};

export const createConsumer = (groupId) => {
  return kafka.consumer({ groupId });
};
