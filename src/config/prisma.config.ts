import { env } from "@/config/env.config";
import { createRequire } from "module";
import { join } from "path";

const require = createRequire(import.meta.url);

// Resolve generated Prisma client from project root (cwd). Using process.cwd() so it works
// when the app is bundled (e.g. tsup) and run from dist/, and in monorepos.
const generatedDir = join(process.cwd(), "generated", "prisma");

let PrismaClient: any;

if (env.DATABASE_TYPE === "mysql") {
  PrismaClient = require(join(generatedDir, "client-mysql")).PrismaClient;
} else if (env.DATABASE_TYPE === "postgresql") {
  PrismaClient = require(join(generatedDir, "client-postgres")).PrismaClient;
} else {
  PrismaClient = require(join(generatedDir, "client-mongodb")).PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
	prisma: any;
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
		if (logger && logger.info) {
			logger.info(`Prisma database connected successfully (${env.DATABASE_TYPE})`);
		}
	} catch (error: any) {
		if (logger && logger.error) logger.error(`Prisma connection error: ${error.message}`);
		throw error;
	}
}

export async function disconnectPrisma(logger?: { info: (msg: string) => void; error?: (msg: string) => void }) {
	try {
		await prisma.$disconnect();
		if (logger && logger.info) {
			logger.info(`Prisma database disconnected successfully (${env.DATABASE_TYPE})`);
		}
	} catch (error: any) {
		if (logger && logger.error) logger.error(`Prisma disconnect error: ${error.message}`);
		throw error;
	}
}

export default prisma;
