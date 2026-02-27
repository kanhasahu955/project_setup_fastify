import { Resend } from "resend";
import transporter from "@/config/mail.config";
import { env } from "@/config/env.config";
import {
	otpTemplate, OtpTemplateData,
	welcomeTemplate, WelcomeTemplateData,
	passwordResetTemplate, PasswordResetTemplateData
} from "@/templates/index"

export interface SendMailOptions {
	to: string | string[];
	subject: string;
	html: string;
	text?: string;
}

class MailService {
	private smtpFrom: string;
	private resend: Resend | null = null;

	constructor() {
		this.smtpFrom = `"${env.MAIL_FROM_NAME}" <${env.SMTP_USER || "noreply@localhost"}>`;
		if (env.RESEND_API_KEY) {
			this.resend = new Resend(env.RESEND_API_KEY);
		}
	}

	private get resendFrom(): string {
		return `${env.MAIL_FROM_NAME} <${env.RESEND_FROM}>`;
	}

	/**
	 * Send a generic email (via Resend if RESEND_API_KEY is set, falling back to SMTP)
	 */
	async send(options: SendMailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
		const to = Array.isArray(options.to) ? options.to : [options.to];
		try {
			// 1) Try Resend when configured
			if (this.resend) {
				const { data, error } = await this.resend.emails.send({
					from: this.resendFrom,
					to,
					subject: options.subject,
					html: options.html,
					text: options.text,
				});
				if (!error) {
					console.log("Email sent via Resend:", data?.id);
					return { success: true, id: data?.id };
				}
				// Resend misconfigured or rejected; log and fall back to SMTP if possible
				console.error("Resend send failed, falling back to SMTP if available:", error);
			}

			// 2) Fallback: Gmail SMTP
			if (env.SMTP_USER && env.SMTP_PASS) {
				const info = await transporter.sendMail({
					from: this.smtpFrom,
					to: options.to,
					subject: options.subject,
					html: options.html,
					text: options.text,
				});
				console.log(`Email sent (SMTP): ${info.messageId}`);
				return { success: true, id: info.messageId };
			}

			console.warn("Mail not configured: set RESEND_API_KEY or SMTP_USER/SMTP_PASS");
			return { success: false, error: "Mail not configured. Set RESEND_API_KEY or SMTP credentials." };
		} catch (error: any) {
			console.error("Failed to send email:", error);
			return { success: false, error: error?.message ?? String(error) };
		}
	}

	/**
	 * Send OTP verification email
	 */
	async sendOtp(to: string, data: OtpTemplateData) {
		return this.send({
			to,
			subject: `${data.otp} is your verification code`,
			html: otpTemplate(data),
			text: `Hi ${data.name}, your OTP is ${data.otp}. Valid for ${data.expiryMinutes || 10} minutes.`,
		});
	}

	/**
	 * Send welcome email after registration
	 */
	async sendWelcome(to: string, data: WelcomeTemplateData) {
		return this.send({
			to,
			subject: `Welcome to Live Bhoomi, ${data.name}!`,
			html: welcomeTemplate(data),
			text: `Hi ${data.name}, welcome to Live Bhoomi! Your account (${data.email}) has been created successfully.`,
		});
	}

	/**
	 * Send password reset email
	 */
	async sendPasswordReset(to: string, data: PasswordResetTemplateData) {
		return this.send({
			to,
			subject: "Reset your Live Bhoomi password",
			html: passwordResetTemplate(data),
			text: `Hi ${data.name}, reset your password using this link: ${data.resetUrl}. Valid for ${data.expiryMinutes || 30} minutes.`,
		});
	}

	/**
	 * Generate a random numeric OTP
	 */
	generateOtp(length: number = 6): string {
		const digits = "0123456789";
		let otp = "";
		for (let i = 0; i < length; i++) {
			otp += digits[Math.floor(Math.random() * digits.length)];
		}
		return otp;
	}
}

// Export singleton instance
export const mailService = new MailService();
