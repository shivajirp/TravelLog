import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({
    clientId: 'travllog-producer',
    brokers: [process.env.KAFKA_BROKER]
})

export const producer = kafka.producer();

export const initProducer = async () => {
    await producer.connect();
    console.log('Kafka producer connected');
}

export const publishEvent = async (topic, message) => {
    await producer.send({
        topic,
        messages: [{ key: String(message.reviewId || Date.now()), value: JSON.stringify(message) }]
    });
};