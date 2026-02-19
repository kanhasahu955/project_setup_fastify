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
	private from: string;

	constructor() {
		this.from = `"${env.MAIL_FROM_NAME}" <${env.SMTP_USER}>`;
	}

	/**
	 * Send a generic email
	 */
	async send(options: SendMailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
		try {
			if (!env.SMTP_USER || !env.SMTP_PASS) {
				console.warn("SMTP credentials not configured, skipping email send");
				return { success: false, error: "SMTP not configured" };
			}

			const info = await transporter.sendMail({
				from: this.from,
				to: options.to,
				subject: options.subject,
				html: options.html,
				text: options.text,
			});

			console.log(`Email sent: ${info.messageId}`);
			return { success: true, id: info.messageId };
		} catch (error: any) {
			console.error("Failed to send email:", error);
			return { success: false, error: error.message };
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
