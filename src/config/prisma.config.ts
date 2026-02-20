import { env } from "@/config/env.config";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Dynamically import the correct Prisma client based on database type
let PrismaClient: any;

if (env.DATABASE_TYPE === "mysql") {
	const mysqlPath = join(__dirname, "../../generated/prisma/client-mysql");
	PrismaClient = require(mysqlPath).PrismaClient;
} else {
	const mongodbPath = join(__dirname, "../../generated/prisma/client-mongodb");
	PrismaClient = require(mongodbPath).PrismaClient;
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
