import client from 'prom-client';

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 10000 })

export const reviewProcessedCounter = new client.Counter({
    name: "analytics_reviews_processed_total",
    help: "Number of reviews processed",
    labelNames: ["status"]
});

export const reviewProcessingDuration = new client.Histogram({
    name: "analytics_review_processing_duration_seconds",
    help: "Processing time in seconds for review events",
    bucket: [0.01, 0.05, 0.1, 0.5, 1, 5]
});

export default client;