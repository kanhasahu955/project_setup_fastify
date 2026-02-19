import nodemailer from "nodemailer";
import { env } from "@/config/env.config";

// Create Gmail transporter
const transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: env.SMTP_USER,
		pass: env.SMTP_PASS,
	},
});

export default transporter;
