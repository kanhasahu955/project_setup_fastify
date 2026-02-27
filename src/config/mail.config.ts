import nodemailer from "nodemailer";
import { env } from "@/config/env.config";

// Create generic SMTP transporter (Gmail, SendGrid, etc.)
const transporter = nodemailer.createTransport({
	host: env.SMTP_HOST,
	port: env.SMTP_PORT,
	secure: env.SMTP_PORT === 465,
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS,
	},
});

export default transporter;
