import { Kafka } from 'kafkajs';
import dotenv from 'dotenv';
dotenv.config();

const kafka = new Kafka({
    clientId: 'travellog-producer',
    brokers: [process.env.KAFKA_BROKER]
})

export const producer = kafka.producer();

export const initProducer = async () => {
    try {
        await producer.connect();
        console.log('Kafka producer connected');        
    } catch (error) {
        console.error('Error connecting Kafka producer:', error);
    }
}

export const publishEvent = async (topic, message) => {
    await producer.send({
        topic,
        messages: [{ key: String(message.reviewId || Date.now()), value: JSON.stringify(message) }]
    });
};