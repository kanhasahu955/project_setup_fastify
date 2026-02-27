import { FastifyRequest, FastifyReply } from "fastify";
import { userService } from "@/services/user.service";
import { FastifyResponseHelper } from "@/helpers/httpStatus";
import type {
    CreateUserInput,
    UpdateUserInput,
    UpdateProfileInput,
    UserListOptions,
} from "@/types/user.types";
import type { UserRole } from "../../generated/prisma/client";
import {
    aadharKycSchema,
    panKycSchema,
    verifyKycSchema,
    type AadharKycInput,
    type PanKycInput,
    type VerifyKycInput,
} from "@/validations/auth.validation";

interface IdParam {
    id: string;
}

class UserController {
    async register(request: FastifyRequest, reply: FastifyReply) {
        try {
            const data = FastifyResponseHelper.body<CreateUserInput>(request);
            const user = await userService.create(data);
            FastifyResponseHelper.created(reply, user, "User registered successfully", request);
        } catch (error: any) {
            if (error.message.includes("already exists")) {
                FastifyResponseHelper.conflict(reply, error.message, request);
            } else {
                FastifyResponseHelper.badRequest(reply, error.message, request);
            }
        }
    }

    async login(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { identifier, password } = FastifyResponseHelper.body<{ identifier: string; password: string }>(request);
            const user = await userService.login(identifier, password);
            FastifyResponseHelper.ok(reply, user, "Login successful", request);
        } catch (error: any) {
            if (error.message.includes("blocked")) {
                FastifyResponseHelper.forbidden(reply, error.message, request);
            } else {
                FastifyResponseHelper.unauthorized(reply, error.message, request);
            }
        }
    }

    async getById(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            const { includeProfile } = FastifyResponseHelper.query<{ includeProfile?: boolean }>(request);
            const user = await userService.findById(id, includeProfile);

            if (!user) {
                FastifyResponseHelper.notFound(reply, "User not found", request);
                return;
            }

            FastifyResponseHelper.ok(reply, user, "User retrieved successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async getMe(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request as any).user?.id;
            if (!userId) {
                FastifyResponseHelper.unauthorized(reply, "Not authenticated", request);
                return;
            }

            const user = await userService.findById(userId, true);
            if (!user) {
                FastifyResponseHelper.notFound(reply, "User not found", request);
                return;
            }

            FastifyResponseHelper.ok(reply, user, "Profile retrieved successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async getLocation(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request as any).user?.id;
            if (!userId) {
                FastifyResponseHelper.unauthorized(reply, "Not authenticated", request);
                return;
            }
            const location = await userService.getLocation(userId);
            if (!location) {
                FastifyResponseHelper.notFound(reply, "No location set for user", request);
                return;
            }
            FastifyResponseHelper.ok(reply, location, "Location retrieved", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async updateLocation(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request as any).user?.id;
            if (!userId) {
                FastifyResponseHelper.unauthorized(reply, "Not authenticated", request);
                return;
            }
            const body = FastifyResponseHelper.body<{ latitude: number; longitude: number; accuracy?: number }>(request);
            const { latitude, longitude, accuracy } = body;
            if (typeof latitude !== "number" || typeof longitude !== "number") {
                FastifyResponseHelper.badRequest(reply, "latitude and longitude are required numbers", request);
                return;
            }
            const location = await userService.updateLocation(userId, { latitude, longitude, accuracy });
            FastifyResponseHelper.ok(reply, location, "Location updated", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async getLocationHistory(request: FastifyRequest, reply: FastifyReply) {
        try {
            const userId = (request as any).user?.id;
            if (!userId) {
                FastifyResponseHelper.unauthorized(reply, "Not authenticated", request);
                return;
            }
            const { limit } = FastifyResponseHelper.query<{ limit?: string }>(request);
            const limitNum = limit != null ? parseInt(limit, 10) : 50;
            const history = await userService.getLocationHistory(userId, limitNum);
            FastifyResponseHelper.ok(reply, { history }, "Location history", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            const data = FastifyResponseHelper.body<UpdateUserInput>(request);
            const user = await userService.update(id, data);
            FastifyResponseHelper.ok(reply, user, "User updated successfully", request);
        } catch (error: any) {
            if (error.message.includes("already in use")) {
                FastifyResponseHelper.conflict(reply, error.message, request);
            } else if (error.message.includes("No valid fields")) {
                FastifyResponseHelper.badRequest(reply, error.message, request);
            } else {
                FastifyResponseHelper.badRequest(reply, error.message, request);
            }
        }
    }

    async updatePassword(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            const { currentPassword, newPassword } = FastifyResponseHelper.body<{
                currentPassword: string;
                newPassword: string;
            }>(request);

            await userService.updatePassword(id, currentPassword, newPassword);
            FastifyResponseHelper.ok(reply, null, "Password updated successfully", request);
        } catch (error: any) {
            if (error.message.includes("incorrect")) {
                FastifyResponseHelper.unauthorized(reply, error.message, request);
            } else {
                FastifyResponseHelper.badRequest(reply, error.message, request);
            }
        }
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            await userService.delete(id);
            FastifyResponseHelper.ok(reply, null, "User deleted successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async list(request: FastifyRequest, reply: FastifyReply) {
        try {
            const options = FastifyResponseHelper.query<UserListOptions>(request);
            const result = await userService.list(options);
            FastifyResponseHelper.ok(reply, result, "Users retrieved successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async block(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            const user = await userService.block(id);
            FastifyResponseHelper.ok(reply, user, "User blocked successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async unblock(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            const user = await userService.unblock(id);
            FastifyResponseHelper.ok(reply, user, "User unblocked successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async verify(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            const user = await userService.verify(id);
            FastifyResponseHelper.ok(reply, user, "User verified successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async updateRole(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            const { role } = FastifyResponseHelper.body<{ role: UserRole }>(request);
            const user = await userService.updateRole(id, role);
            FastifyResponseHelper.ok(reply, user, "User role updated successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async getProfile(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            const profile = await userService.getProfile(id);

            if (!profile) {
                FastifyResponseHelper.notFound(reply, "Profile not found", request);
                return;
            }

            FastifyResponseHelper.ok(reply, profile, "Profile retrieved successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async upsertProfile(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            const data = FastifyResponseHelper.body<UpdateProfileInput>(request);
            const profile = await userService.upsertProfile(id, data);
            FastifyResponseHelper.ok(reply, profile, "Profile updated successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async getStats(request: FastifyRequest, reply: FastifyReply) {
        try {
            const stats = await userService.getStats();
            FastifyResponseHelper.ok(reply, stats, "User statistics retrieved successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    async checkExists(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { email, phone } = FastifyResponseHelper.query<{ email?: string; phone?: string }>(request);

            if (!email && !phone) {
                FastifyResponseHelper.badRequest(reply, "Email or phone is required", request);
                return;
            }

            const exists = email
                ? await userService.existsByEmail(email)
                : await userService.existsByPhone(phone!);

            FastifyResponseHelper.ok(reply, { exists }, "Check completed", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message, request);
        }
    }

    // KYC Methods
    async submitAadharKyc(request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const body = request.body as AadharKycInput;

            const validation = aadharKycSchema.safeParse(body);
            if (!validation.success) {
                const errors = validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }));
                FastifyResponseHelper.validationError(reply, errors, "Validation failed", request);
                return;
            }

            const kyc = await userService.submitAadharKyc(id, validation.data);
            FastifyResponseHelper.ok(reply, kyc, "Aadhar details submitted successfully", request);
        } catch (error: any) {
            if (error.message === "User not found") {
                FastifyResponseHelper.notFound(reply, error.message, request);
            } else {
                FastifyResponseHelper.badRequest(reply, error.message, request);
            }
        }
    }

    async submitPanKyc(request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const body = request.body as PanKycInput;

            const validation = panKycSchema.safeParse(body);
            if (!validation.success) {
                const errors = validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }));
                FastifyResponseHelper.validationError(reply, errors, "Validation failed", request);
                return;
            }

            const kyc = await userService.submitPanKyc(id, validation.data);
            FastifyResponseHelper.ok(reply, kyc, "PAN details submitted successfully", request);
        } catch (error: any) {
            if (error.message === "User not found") {
                FastifyResponseHelper.notFound(reply, error.message, request);
            } else {
                FastifyResponseHelper.badRequest(reply, error.message, request);
            }
        }
    }

    async getKycStatus(request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const kyc = await userService.getKycStatus(id);
            FastifyResponseHelper.ok(reply, kyc, "KYC details retrieved", request);
        } catch (error: any) {
            if (error.message === "User not found") {
                FastifyResponseHelper.notFound(reply, error.message, request);
            } else {
                FastifyResponseHelper.badRequest(reply, error.message, request);
            }
        }
    }

    async verifyKyc(request: FastifyRequest<{ Params: IdParam }>, reply: FastifyReply) {
        try {
            const { id } = request.params;
            const body = request.body as VerifyKycInput;

            const validation = verifyKycSchema.safeParse(body);
            if (!validation.success) {
                const errors = validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                }));
                FastifyResponseHelper.validationError(reply, errors, "Validation failed", request);
                return;
            }

            // TODO: Get admin ID from authenticated user
            const adminId = "admin"; // Replace with actual admin ID from auth

            const kyc = await userService.verifyKyc(id, adminId, validation.data);
            FastifyResponseHelper.ok(reply, kyc, "KYC status updated", request);
        } catch (error: any) {
            if (error.message === "User not found") {
                FastifyResponseHelper.notFound(reply, error.message, request);
            } else {
                FastifyResponseHelper.badRequest(reply, error.message, request);
            }
        }
    }
}

export const userController = new UserController();
