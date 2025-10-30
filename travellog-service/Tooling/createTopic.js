import { Kafka } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'travellog-admin',
    brokers: ["localhost:9092"],
});

const createTopic = async () => {
    const admin = kafka.admin();
    await admin.connect();

    try {
        await admin.createTopics({
            topics: [
                { topic: 'review.created', numPartitions: 3, replicationFactor: 1 },
            ]
        });
        console.log('Topic created');
    } catch (error) {
        console.error('Failed to create topic', error);
    }
    await admin.disconnect();
};

createTopic().catch(e => {
    console.error(e)
    process.exit(1)
});