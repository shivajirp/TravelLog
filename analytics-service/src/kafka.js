import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'analytics-service',
    brokers: [process.env.KAFKA_BROKER],
    connectionTimeout: 3000,
});

export const createProducer = () => {
    return kafka.producer();
};

export const createConsumer = (groupId) => {
    return kafka.consumer({ groupId });
};