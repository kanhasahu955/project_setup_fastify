import nodemailer from "nodemailer";
import { env } from "@/config/env.config";

// Create generic SMTP transporter (Gmail, SendGrid, etc.)
// Use longer timeouts on cloud (e.g. Render) where Gmail SMTP may be slow or blocked
const transporter = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: env.SMTP_PORT,
	secure: env.SMTP_PORT === 465,
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS,
	},
	connectionTimeout: 20000,
	greetingTimeout: 20000,
});

export default transporter;
