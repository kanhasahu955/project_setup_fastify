import { FastifyRequest, FastifyReply } from "fastify";
import { authService } from "@/services/auth.service";
import { FastifyResponseHelper } from "@/helpers/httpStatus";
import {
    registerSchema,
    verifyOtpSchema,
    resendOtpSchema,
    loginSchema,
    type RegisterInput,
    type VerifyOtpInput,
    type ResendOtpInput,
    type LoginInput,
} from "@/validations/auth.validation";
import { ZodError } from "zod";

function formatZodErrors(error: any) {
    // Handle both Zod v3 (errors) and Zod v4 (issues)
    let issues: any[] = [];
    
    if (error.issues && Array.isArray(error.issues)) {
        issues = error.issues;
    } else if (error.errors && Array.isArray(error.errors)) {
        issues = error.errors;
    } else if (error.error && error.error.issues) {
        issues = error.error.issues;
    }
    
    if (issues.length === 0) {
        return [{ field: "unknown", message: error.message || "Validation failed" }];
    }
    
    return issues.map((err: any) => ({
        field: Array.isArray(err.path) ? err.path.join(".") : (err.path || "unknown"),
        message: err.message || "Invalid value",
    }));
}

function isZodError(error: any): boolean {
    return error instanceof ZodError || 
           error?.name === "ZodError" || 
           (error?.issues && Array.isArray(error.issues));
}

class AuthController {
    register = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = FastifyResponseHelper.body<RegisterInput>(request);

            // Validate with Zod
            const validatedData = registerSchema.parse(body);

            const result = await authService.register(validatedData);
            FastifyResponseHelper.ok(reply, result, result.message, request);
        } catch (error: any) {
            if (isZodError(error)) {
                const errors = formatZodErrors(error);
                return reply.status(400).send({
                    success: false,
                    message: "Validation failed",
                    statusCode: 400,
                    errors,
                });
            }

            if (error.message?.includes("already exists")) {
                FastifyResponseHelper.conflict(reply, error.message, request);
            } else {
                FastifyResponseHelper.badRequest(reply, error.message || "Registration failed", request);
            }
        }
    };

    verifyOtp = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = FastifyResponseHelper.body<VerifyOtpInput>(request);

            // Validate with Zod
            const validatedData = verifyOtpSchema.parse(body);

            const user = await authService.verifyOtp(validatedData);

            // Generate JWT token
            const token = await reply.jwtSign({ id: user.id, email: user.email, role: user.role });

            FastifyResponseHelper.created(
                reply,
                { user, token },
                "Registration completed successfully",
                request
            );
        } catch (error: any) {
            if (isZodError(error)) {
                const errors = formatZodErrors(error);
                return reply.status(400).send({
                    success: false,
                    message: "Validation failed",
                    statusCode: 400,
                    errors,
                });
            }

            if (error.message?.includes("expired") || error.message?.includes("Invalid OTP")) {
                FastifyResponseHelper.badRequest(reply, error.message, request);
            } else if (error.message?.includes("No pending")) {
                FastifyResponseHelper.notFound(reply, error.message, request);
            } else {
                FastifyResponseHelper.badRequest(reply, error.message || "Verification failed", request);
            }
        }
    };

    resendOtp = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = FastifyResponseHelper.body<ResendOtpInput>(request);

            // Validate with Zod
            const validatedData = resendOtpSchema.parse(body);

            const result = await authService.resendOtp(validatedData.email);
            FastifyResponseHelper.ok(reply, result, result.message, request);
        } catch (error: any) {
            if (isZodError(error)) {
                const errors = formatZodErrors(error);
                return reply.status(400).send({
                    success: false,
                    message: "Validation failed",
                    statusCode: 400,
                    errors,
                });
            }

            if (error.message?.includes("No pending")) {
                FastifyResponseHelper.notFound(reply, error.message, request);
            } else {
                FastifyResponseHelper.badRequest(reply, error.message || "Failed to resend OTP", request);
            }
        }
    };

    login = async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const body = FastifyResponseHelper.body<LoginInput>(request);

            // Validate with Zod
            const validatedData = loginSchema.parse(body);

            const { user } = await authService.login(validatedData);

            // Generate JWT token
            const token = await reply.jwtSign({ id: user.id, email: user.email, role: user.role });

            FastifyResponseHelper.ok(reply, { user, token }, "Login successful", request);
        } catch (error: any) {
            if (isZodError(error)) {
                const errors = formatZodErrors(error);
                return reply.status(400).send({
                    success: false,
                    message: "Validation failed",
                    statusCode: 400,
                    errors,
                });
            }

            if (error.message?.includes("blocked")) {
                FastifyResponseHelper.forbidden(reply, error.message, request);
            } else if (error.message?.includes("Invalid credentials")) {
                FastifyResponseHelper.unauthorized(reply, error.message, request);
            } else if (error.message?.includes("verify")) {
                FastifyResponseHelper.forbidden(reply, error.message, request);
            } else {
                FastifyResponseHelper.badRequest(reply, error.message || "Login failed", request);
            }
        }
    };
}

export const authController = new AuthController();
