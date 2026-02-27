
import _ from "lodash";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export type NodeEnv = "development" | "production" | "test";

export type DatabaseType = "mongodb" | "mysql" | "postgresql";

interface EnvConfig {
	PORT: number;
	HOST: string;
	NODE_ENV: NodeEnv;
	DATABASE_TYPE: DatabaseType;
	DATABASE_URL: string;
	DATABASE_URL_MONGODB: string;
	DATABASE_URL_MYSQL: string;
	LOG_LEVEL: string;
	FRONTEND_URL: string[];
	COOKIE_SECRET: string;
	JWT_SECRET: string;
	JWT_EXPIRES_IN: string;
	USE_HTTPS: boolean;
	API_URL: string;
	// Mail: Resend (preferred) or SMTP
	RESEND_API_KEY: string;
	RESEND_FROM: string;
	SMTP_USER: string;
	SMTP_PASS: string;
	SMTP_HOST: string;
	SMTP_PORT: number;
	MAIL_FROM_NAME: string;
	MAIL_FROM_EMAIL: string;
	// Firebase Configuration
	FIREBASE_PROJECT_ID: string;
	FIREBASE_CLIENT_EMAIL: string;
	FIREBASE_PRIVATE_KEY: string;
	FIREBASE_STORAGE_BUCKET: string;
	// ImageKit Configuration
	IMAGEKIT_PUBLIC_KEY: string;
	IMAGEKIT_PRIVATE_KEY: string;
	IMAGEKIT_URL_ENDPOINT: string;
	// Redis (optional – for caching)
	REDIS_URL: string;
	// Google Maps (Places + Geocoding)
	GOOGLE_MAPS_API_KEY: string;
}

class Environment implements EnvConfig {
	public readonly PORT: number;
	public readonly HOST: string;
	public readonly NODE_ENV: NodeEnv;
	public readonly DATABASE_TYPE: DatabaseType;
	public readonly DATABASE_URL: string;
	public readonly DATABASE_URL_MONGODB: string;
	public readonly DATABASE_URL_MYSQL: string;
	public readonly LOG_LEVEL: string;
	public readonly FRONTEND_URL: string[];
	public readonly COOKIE_SECRET: string;
	public readonly JWT_SECRET: string;
	public readonly JWT_EXPIRES_IN: string;
	public readonly USE_HTTPS: boolean;
	public readonly API_URL: string;
	// Mail: Resend (preferred) or SMTP
	public readonly RESEND_API_KEY: string;
	public readonly RESEND_FROM: string;
	public readonly SMTP_USER: string;
	public readonly SMTP_PASS: string;
	public readonly SMTP_HOST: string;
	public readonly SMTP_PORT: number;
	public readonly MAIL_FROM_NAME: string;
	public readonly MAIL_FROM_EMAIL: string;
	// Firebase Configuration
	public readonly FIREBASE_PROJECT_ID: string;
	public readonly FIREBASE_CLIENT_EMAIL: string;
	public readonly FIREBASE_PRIVATE_KEY: string;
	public readonly FIREBASE_STORAGE_BUCKET: string;
	// ImageKit Configuration
	public readonly IMAGEKIT_PUBLIC_KEY: string;
	public readonly IMAGEKIT_PRIVATE_KEY: string;
	public readonly IMAGEKIT_URL_ENDPOINT: string;
	// Redis (optional – empty = no Redis, use in-memory fallback)
	public readonly REDIS_URL: string;
	public readonly GOOGLE_MAPS_API_KEY: string;

	constructor() {
		this.PORT = this.getNumber("PORT", 3000);
		this.HOST = this.getString("HOST", "0.0.0.0");
		this.NODE_ENV = this.getString("NODE_ENV", "development") as NodeEnv;
		
		// Database Configuration
		// Default database type is MongoDB in all environments; can be overridden via env.
		this.DATABASE_TYPE = (this.getString("DATABASE_TYPE", "mongodb") as DatabaseType) || "mongodb";
		// Single primary URL variable used by Prisma schemas: DATABASE_URL.
		// Optional per-engine URLs are supported but default back to DATABASE_URL.
		this.DATABASE_URL_MONGODB = this.getString("DATABASE_URL_MONGODB", process.env.DATABASE_URL || "");
		this.DATABASE_URL_MYSQL = this.getString("DATABASE_URL_MYSQL", process.env.DATABASE_URL || "");
		
		// Set DATABASE_URL based on DATABASE_TYPE, falling back to generic DATABASE_URL.
		if (this.DATABASE_TYPE === "mysql") {
			this.DATABASE_URL = this.DATABASE_URL_MYSQL || this.getString("DATABASE_URL", "");
		} else {
			this.DATABASE_URL = this.DATABASE_URL_MONGODB || this.getString("DATABASE_URL", "");
		}
		
		this.LOG_LEVEL = this.getString("LOG_LEVEL", "info");
		this.FRONTEND_URL = _
			.chain(this.getString("FRONTEND_URL", ""))
			.split(",")
			.map((url) => _.trim(url).replace(/\/+$/, ""))
			.compact()
			.value();
		this.COOKIE_SECRET = this.getString("COOKIE_SECRET");
		this.JWT_SECRET = this.getString("JWT_SECRET");
		this.JWT_EXPIRES_IN = this.getString("JWT_EXPIRES_IN", "1d");
		this.USE_HTTPS = this.getBoolean("USE_HTTPS", false);
		// Render provides RENDER_EXTERNAL_URL automatically
		this.API_URL = this.getString("API_URL", process.env.RENDER_EXTERNAL_URL || "");
		// Mail: Resend (preferred for local + production) or SMTP fallback
		this.RESEND_API_KEY = this.getString("RESEND_API_KEY", "");
		this.RESEND_FROM = this.getString("RESEND_FROM", "onboarding@resend.dev");
		this.SMTP_USER = this.getString("SMTP_USER", "");
		this.SMTP_PASS = this.getString("SMTP_PASS", "");
		this.SMTP_HOST = this.getString("SMTP_HOST", "smtp.gmail.com");
		this.SMTP_PORT = this.getNumber("SMTP_PORT", 587);
		this.MAIL_FROM_NAME = this.getString("MAIL_FROM_NAME", "Live Bhoomi");
		this.MAIL_FROM_EMAIL = this.getString("MAIL_FROM_EMAIL", this.SMTP_USER || "");
		// Firebase Configuration
		this.FIREBASE_PROJECT_ID = this.getString("FIREBASE_PROJECT_ID", "");
		this.FIREBASE_CLIENT_EMAIL = this.getString("FIREBASE_CLIENT_EMAIL", "");
		this.FIREBASE_PRIVATE_KEY = this.getString("FIREBASE_PRIVATE_KEY", "").replace(/\\n/g, "\n");
		this.FIREBASE_STORAGE_BUCKET = this.getString("FIREBASE_STORAGE_BUCKET", "");
		// ImageKit Configuration (IMAGEKIT_ENDPOINT accepted as alias for IMAGEKIT_URL_ENDPOINT)
		this.IMAGEKIT_PUBLIC_KEY = this.getString("IMAGEKIT_PUBLIC_KEY", "");
		this.IMAGEKIT_PRIVATE_KEY = this.getString("IMAGEKIT_PRIVATE_KEY", "");
		this.IMAGEKIT_URL_ENDPOINT = this.getString("IMAGEKIT_URL_ENDPOINT", "") || this.getString("IMAGEKIT_ENDPOINT", "");
		// Redis – optional; default redis://localhost:6379 for local dev
		this.REDIS_URL = this.getString("REDIS_URL", "");
		// Google Maps – optional; empty = maps endpoints return 503
		this.GOOGLE_MAPS_API_KEY = this.getString("GOOGLE_MAPS_API_KEY", "");
	}

	private getString(key: string, defaultValue?: string): string {
		const value = process.env[key];
		if (value !== undefined) return value;
		if (defaultValue !== undefined) return defaultValue;
		throw new Error(`Missing required environment variable: ${key}`);
	}

	private getNumber(key: string, defaultValue?: number): number {
		const value = process.env[key];
		if (value !== undefined) {
			const num = Number(value);
			if (isNaN(num)) throw new Error(`Environment variable ${key} is not a valid number`);
			return num;
		}
		if (defaultValue !== undefined) return defaultValue;
		throw new Error(`Missing required environment variable: ${key}`);
	}

	private getBoolean(key: string, defaultValue?: boolean): boolean {
		const value = process.env[key];
		if (value !== undefined) {
			return value.toLowerCase() === 'true' || value === '1';
		}
		if (defaultValue !== undefined) return defaultValue;
		throw new Error(`Missing required environment variable: ${key}`);
	}
}

export const env = new Environment();