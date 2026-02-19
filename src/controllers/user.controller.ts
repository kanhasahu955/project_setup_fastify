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
}

export const userController = new UserController();
