import { z } from "zod";

export const registerSchema = z.object({
    name: z
        .string({ error: "Name is required" })
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .trim(),

    email: z
        .email("Invalid email format")
        .toLowerCase()
        .trim(),

    phone: z
        .string({ error: "Phone number is required" })
        .regex(/^[6-9]\d{9}$/, "Phone number must be a valid 10-digit Indian mobile number")
        .trim(),

    password: z
        .string({ error: "Password is required" })
        .min(8, "Password must be at least 8 characters")
        .max(50, "Password must be at most 50 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
        ),
});

export const verifyOtpSchema = z.object({
    email: z
        .string({ error: "Email is required" })
        .email("Invalid email format")
        .toLowerCase()
        .trim(),

    otp: z
        .string({ error: "OTP is required" })
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^\d{6}$/, "OTP must contain only digits"),
});

export const resendOtpSchema = z.object({
    email: z
        .string({ error: "Email is required" })
        .email("Invalid email format")
        .toLowerCase()
        .trim(),
});

export const loginSchema = z.object({
    identifier: z
        .string({ error: "Email or phone is required" })
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
        .string({ error: "Password is required" })
        .min(1, "Password is required"),
});

// KYC Validation Schemas
export const aadharKycSchema = z.object({
    aadharNumber: z
        .string({ error: "Aadhar number is required" })
        .length(12, "Aadhar number must be exactly 12 digits")
        .regex(/^\d{12}$/, "Aadhar number must contain only digits")
        .trim(),

    aadharName: z
        .string({ error: "Name as on Aadhar is required" })
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .trim(),

    aadharDob: z
        .string({ error: "Date of birth is required" })
        .regex(/^(0[1-9]|[12]\d|3[01])-(0[1-9]|1[0-2])-\d{4}$/, "Date of birth must be in DD-MM-YYYY format")
        .trim(),

    aadharDocUrl: z
        .string()
        .url("Invalid document URL")
        .optional(),
});

export const panKycSchema = z.object({
    panNumber: z
        .string({ error: "PAN number is required" })
        .length(10, "PAN number must be exactly 10 characters")
        .regex(/^[A-Z]{5}\d{4}[A-Z]$/, "Invalid PAN format. Must be like ABCDE1234F")
        .toUpperCase()
        .trim(),

    panName: z
        .string({ error: "Name as on PAN is required" })
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name must be at most 100 characters")
        .trim(),

    panDocUrl: z
        .string()
        .url("Invalid document URL")
        .optional(),
});

export const verifyKycSchema = z.object({
    kycStatus: z.enum(["PENDING", "SUBMITTED", "UNDER_REVIEW", "VERIFIED", "REJECTED"], {
        error: "KYC status is required",
    }),
    kycRemarks: z.string().max(500).optional(),
    verifyAadhar: z.boolean().optional(),
    verifyPan: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput = z.infer<typeof resendOtpSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AadharKycInput = z.infer<typeof aadharKycSchema>;
export type PanKycInput = z.infer<typeof panKycSchema>;
export type VerifyKycInput = z.infer<typeof verifyKycSchema>;
