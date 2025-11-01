import { PrismaClient } from "@prisma/client";
import logger from "./logger.js";

export const prisma = new PrismaClient();

prisma.$on('beforeExit', async () => {
    logger.info("Prisma beforeExit event triggered, disconnecting...");
});

prisma.$connect().catch((error) => {
    logger.error("Prisma connect failed:", error);
    process.exit(1);
});