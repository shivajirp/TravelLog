import { PrismaClient } from "@prisma/client";
import logger from "./logger.js";

export const prisma = new PrismaClient();

process.on('beforeExit', async () => {
    logger.info("Prisma beforeExit event triggered, disconnecting...");
    await prisma.$disconnect();
});

prisma.$connect().catch((error) => {
    logger.error("Prisma connect failed:", error);
    process.exit(1);
});