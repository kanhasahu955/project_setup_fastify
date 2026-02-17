
import { PrismaClient } from "../../generated/prisma/client";
import { env } from "@/config/env.config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => {
  return new PrismaClient({
    log: env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
};

const prisma = globalForPrisma.prisma ?? createPrismaClient();

export async function connectPrisma(logger?: { info: (msg: string) => void; error?: (msg: string) => void }) {
  try {
    await prisma.$connect();
    if (logger && logger.info) logger.info("Prisma database connected successfully");
  } catch (error: any) {
    if (logger && logger.error) logger.error(`Prisma connection error: ${error.message}`);
    throw error;
  }
}

export async function disconnectPrisma(logger?: { info: (msg: string) => void; error?: (msg: string) => void }) {
  try {
    await prisma.$disconnect();
    if (logger && logger.info) logger.info("Prisma database disconnected successfully");
  } catch (error: any) {
    if (logger && logger.error) logger.error(`Prisma disconnect error: ${error.message}`);
    throw error;
  }
}

export default prisma;
