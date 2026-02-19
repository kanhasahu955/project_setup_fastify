import { z } from "zod";

export const registerSchema = z.object({
    name: z
        .string({ required_error: "Name is required" })
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .trim(),

    email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email format")
        .toLowerCase()
        .trim(),

    phone: z
        .string({ required_error: "Phone number is required" })
        .regex(/^[6-9]\d{9}$/, "Phone number must be a valid 10-digit Indian mobile number")
        .trim(),

    password: z
        .string({ required_error: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(50, "Password must be at most 50 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
        ),
});

export const verifyOtpSchema = z.object({
    email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email format")
        .toLowerCase()
        .trim(),

    otp: z
        .string({ required_error: "OTP is required" })
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^\d{6}$/, "OTP must contain only digits"),
});

export const resendOtpSchema = z.object({
    email: z
        .string({ required_error: "Email is required" })
        .email("Invalid email format")
        .toLowerCase()
        .trim(),
});

export const loginSchema = z.object({
    identifier: z
        .string({ required_error: "Email or phone is required" })
        .trim()
        .refine(
            (val) => {
                const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
                const isPhone = /^[6-9]\d{9}$/.test(val);
                return isEmail || isPhone;
            },
            { message: "Must be a valid email or 10-digit phone number" }
        ),

    password: z
        .string({ required_error: "Password is required" })
        .min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
