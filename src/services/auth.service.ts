import prisma from "@/config/prisma.config";
import { hashPassword, comparePassword } from "@/utils/password.util";
import { mailService } from "@/services/mail.service";
import { omitFields } from "@/utils/lodash.util";
import type { User, UserRole } from "../../generated/prisma/client";
import type { RegisterInput, VerifyOtpInput, LoginInput } from "@/validations/auth.validation";

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;

type SafeUser = Omit<User, "password">;

class AuthService {
    private sanitizeUser(user: User | null): SafeUser | null {
        if (!user) return null;
        return omitFields(user, ["password"]) as SafeUser;
    }

    async register(data: RegisterInput): Promise<{ message: string; email: string }> {
        const { name, email, phone, password } = data;

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { phone }],
            },
        });

        if (existingUser) {
            const field = existingUser.email === email ? "email" : "phone";
            throw new Error(`User with this ${field} already exists`);
        }

        // Check for existing pending OTP
        const existingOtp = await prisma.otp.findFirst({
            where: {
                OR: [{ email }, { phone }],
                expiresAt: { gt: new Date() },
                verified: false,
            },
        });

        if (existingOtp) {
            // Delete old OTP and create new one
            await prisma.otp.delete({ where: { id: existingOtp.id } });
        }

        // Generate OTP
        const otp = mailService.generateOtp(6);
        const hashedPassword = await hashPassword(password);

        // Store OTP with registration data
        await prisma.otp.create({
            data: {
                email,
                phone,
                name,
                password: hashedPassword,
                otp,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
            },
        });

        // Send OTP email
        const emailResult = await mailService.sendOtp(email, {
            name,
            otp,
            expiryMinutes: OTP_EXPIRY_MINUTES,
        });

        if (!emailResult.success) {
            // Clean up OTP if email fails
            await prisma.otp.deleteMany({ where: { email } });
            throw new Error("Failed to send verification email. Please try again.");
        }

        return {
            message: `OTP sent to ${email}. Please verify to complete registration.`,
            email,
        };
    }

    async verifyOtp(data: VerifyOtpInput): Promise<SafeUser> {
        const { email, otp } = data;

        // Find OTP record
        const otpRecord = await prisma.otp.findFirst({
            where: {
                email,
                verified: false,
            },
            orderBy: { createdAt: "desc" },
        });

        if (!otpRecord) {
            throw new Error("No pending verification found. Please register again.");
        }

        // Check if OTP is expired
        if (otpRecord.expiresAt < new Date()) {
            await prisma.otp.delete({ where: { id: otpRecord.id } });
            throw new Error("OTP has expired. Please request a new one.");
        }

        // Check attempts
        if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
            await prisma.otp.delete({ where: { id: otpRecord.id } });
            throw new Error("Maximum OTP attempts exceeded. Please register again.");
        }

        // Verify OTP
        if (otpRecord.otp !== otp) {
            await prisma.otp.update({
                where: { id: otpRecord.id },
                data: { attempts: { increment: 1 } },
            });
            const remainingAttempts = MAX_OTP_ATTEMPTS - otpRecord.attempts - 1;
            throw new Error(`Invalid OTP. ${remainingAttempts} attempt(s) remaining.`);
        }

        // Create user
        const user = await prisma.user.create({
            data: {
                name: otpRecord.name,
                email: otpRecord.email,
                phone: otpRecord.phone,
                password: otpRecord.password,
                role: otpRecord.role,
                isVerified: true,
            },
        });

        // Delete OTP record
        await prisma.otp.delete({ where: { id: otpRecord.id } });

        // Send welcome email
        await mailService.sendWelcome(email, {
            name: user.name,
            email: user.email,
        });

        return this.sanitizeUser(user)!;
    }

    async resendOtp(email: string): Promise<{ message: string }> {
        // Find existing OTP record
        const otpRecord = await prisma.otp.findFirst({
            where: {
                email,
                verified: false,
            },
            orderBy: { createdAt: "desc" },
        });

        if (!otpRecord) {
            throw new Error("No pending registration found for this email.");
        }

        // Generate new OTP
        const newOtp = mailService.generateOtp(6);

        // Update OTP record
        await prisma.otp.update({
            where: { id: otpRecord.id },
            data: {
                otp: newOtp,
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
                attempts: 0,
            },
        });

        // Send OTP email
        const emailResult = await mailService.sendOtp(email, {
            name: otpRecord.name,
            otp: newOtp,
            expiryMinutes: OTP_EXPIRY_MINUTES,
        });

        if (!emailResult.success) {
            throw new Error("Failed to send verification email. Please try again.");
        }

        return {
            message: `New OTP sent to ${email}.`,
        };
    }

    async login(data: LoginInput): Promise<{ user: SafeUser; token: string }> {
        const { identifier, password } = data;
        const isEmail = identifier.includes("@");

        const user = await prisma.user.findFirst({
            where: isEmail ? { email: identifier } : { phone: identifier },
        });

        if (!user || !user.password) {
            throw new Error("Invalid credentials");
        }

        if (user.isBlocked) {
            throw new Error("Your account has been blocked. Please contact support.");
        }

        if (!user.isVerified) {
            throw new Error("Please verify your email before logging in.");
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            throw new Error("Invalid credentials");
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        return {
            user: this.sanitizeUser(user)!,
            token: "", // Token will be generated by controller using Fastify JWT
        };
    }

    async cleanupExpiredOtps(): Promise<number> {
        const result = await prisma.otp.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        return result.count;
    }
}

export const authService = new AuthService();
