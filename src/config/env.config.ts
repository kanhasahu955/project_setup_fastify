
import _ from "lodash";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export type NodeEnv = "development" | "production" | "test";

interface EnvConfig {
	PORT: number;
	HOST: string;
	NODE_ENV: NodeEnv;
	DATABASE_URL: string;
	LOG_LEVEL: string;
	FRONTEND_URL: string[];
	COOKIE_SECRET: string;
	JWT_SECRET: string;
	JWT_EXPIRES_IN: string;
	USE_HTTPS: boolean;
}

class Environment implements EnvConfig {
	public readonly PORT: number;
	public readonly HOST: string;
	public readonly NODE_ENV: NodeEnv;
	public readonly DATABASE_URL: string;
	public readonly LOG_LEVEL: string;
	public readonly FRONTEND_URL: string[];
	public readonly COOKIE_SECRET: string;
	public readonly JWT_SECRET: string;
	public readonly JWT_EXPIRES_IN: string;
	public readonly USE_HTTPS: boolean;

	constructor() {
		this.PORT = this.getNumber("PORT", 3000);
		this.HOST = this.getString("HOST", "0.0.0.0");
		this.NODE_ENV = this.getString("NODE_ENV", "development") as NodeEnv;
		this.DATABASE_URL = this.getString("DATABASE_URL");
		this.LOG_LEVEL = this.getString("LOG_LEVEL", "info");
		this.FRONTEND_URL = _
			.chain(this.getString("FRONTEND_URL", ""))
			.split(",")
			.map((url) => _.trim(url))
			.compact()
			.value();
		this.COOKIE_SECRET = this.getString("COOKIE_SECRET");
		this.JWT_SECRET = this.getString("JWT_SECRET");
		this.JWT_EXPIRES_IN = this.getString("JWT_EXPIRES_IN", "1d");
		this.USE_HTTPS = this.getBoolean("USE_HTTPS", false);
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