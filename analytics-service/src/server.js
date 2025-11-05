import express from "express";
import helmet from "helmet";
import compression from "compression";
import { register } from "prom-client";
import logger from "./logger.js";
import prisma from "./db.js";
import {
  metricsScrapeErrors,
  httpRequests,
  kafkaConsumerLag,
} from "./metrics.js";

const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use((req, res, next) => {
  logger.info({ method: req.method, path: req.path });
  next();
});

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequests.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
  });
  next();
});

app.get("/metrics", async (_, res) => {
  try {
    const metricsPromise = register.metrics();
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("metrics timeout")), 5000);
    });

    const data = await Promise.race([metricsPromise, timeout]);
    res.set("Content-Type", register.contentType);
    res.end(data);
  } catch (error) {
    metricsScrapeErrors.inc();
    logger.error(error, "Failed to collect metrics");
    res.status(500).end("Metrics collection failed");
  }
});

// healthz - confirms db + kafka connectivity
app.get("/healthz", async (_, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (global.consumerConnected) res.status(200).send("ok");
    else {
      logger.error("Kafka consumer is not connected");
      res.status(503).send("kafka consumer not connected");
    }
  } catch (error) {
    logger.error(error, "Database is not reachable");
    res.status(503).send("database not reachable");
  }
});

// readyz
app.get("/readyz", (_, res) => {
  res
    .status(global.ready ? 200 : 503)
    .send(global.ready ? "ready" : "not ready");
});

// admin/retry-dlq
app.post("/admin/retry-dlq", async (req, res) => {
  res.status(501).send("Not implemented - use manual tooling for demo");
});

// 404 handler
app.use((_, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error Handler
app.use((err, req, res, next) => {
  logger.error(err, "Unhandled error");
  res.status(500).json({ error: "Internal Server Error" });
});

// Graceful shutdown
export function startServer(port, consumer, producer) {
  const server = app.listen(port, () =>
    logger.info(`Analytics service listening on port ${port}`)
  );

  const shutdown = async () => {
    logger.info("Shutting down gracefully...");
    try {
      await consumer.disconnect();
      global.consumerConnected = false;
    } catch (error) {
      logger.warn(error, "Error during Kafka consumer disconnect");
    }
    try {
      await producer.disconnect();
    } catch (error) {
      logger.warn(error, "Error during Kafka producer disconnect");
    }

    await prisma.$disconnect();

    server.close(() => {
      logger.info("HTTP Server closed");
      process.exit(0);
    });
  };

  return shutdown;
}

export default app;