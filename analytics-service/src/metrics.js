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
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5]
});

export const metricsScrapeErrors = new client.Counter({
    name: "analytics_metrics_scrape_errors_total",
    help: "Total number of metrics scrape errors"
});

export const httpRequests = new client.Counter({
    name: "analytics_http_requests_total",
    help: "Total number of HTTP requests",
    labelNames: ["method", "path", "status"]
});

export const kafkaConsumerLag = new client.Gauge({
    name: "analytics_kafka_consumer_lag",
    help: "Lag of the Kafka consumer",
});

export default client;