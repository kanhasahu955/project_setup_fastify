import _ from "lodash";
import prisma from "@/config/prisma.config";
import { hashPassword, comparePassword } from "@/utils/password.util";
import { omitFields, cleanObject } from "@/utils/lodash.util";
import { type User, type Profile, type UserRole, type Prisma } from "../../generated/prisma/client";
import type {
    CreateUserInput,
    UpdateUserInput,
    UpdateProfileInput,
    UserListOptions,
    UserStats,
    UserRelationsOptions,
    SafeUser,
} from "@/types/user.types";
import type { PaginatedResult } from "@/types/common.types";

class UserService {
    private readonly sensitiveFields = ["password"] as const;

    private sanitizeUser(user: User | null): SafeUser | null {
        if (!user) return null;
        return omitFields(user, [...this.sensitiveFields]) as SafeUser;
    }

    private sanitizeUsers(users: User[]): SafeUser[] {
        return users.map((user) => this.sanitizeUser(user)!);
    }

    async create(data: CreateUserInput): Promise<SafeUser> {
        const existing = await prisma.user.findFirst({
            where: {
                OR: [{ email: data.email }, { phone: data.phone }],
            },
        });

        if (existing) {
            const field = existing.email === data.email ? "email" : "phone";
            throw new Error(`User with this ${field} already exists`);
        }

        const hashedPassword = data.password ? await hashPassword(data.password) : undefined;

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                role: data.role,
                avatar: data.avatar,
            },
        });

        return this.sanitizeUser(user)!;
    }

    async login(identifier: string, password: string): Promise<SafeUser> {
        const isEmail = _.includes(identifier, "@");

        const user = await prisma.user.findFirst({
            where: isEmail ? { email: identifier } : { phone: identifier },
        });

        if (!user || !user.password) {
            throw new Error("Invalid credentials");
        }

        if (user.isBlocked) {
            throw new Error("Account is blocked. Please contact support.");
        }

        const isValid = await comparePassword(password, user.password);

        if (!isValid) {
            throw new Error("Invalid credentials");
        }

        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        return this.sanitizeUser(user)!;
    }

    async findById(id: string, includeProfile = false): Promise<SafeUser | null> {
        const user = await prisma.user.findUnique({
            where: { id },
            include: includeProfile ? { profile: true } : undefined,
        });

        return this.sanitizeUser(user);
    }

    async findByEmail(email: string): Promise<SafeUser | null> {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        return this.sanitizeUser(user);
    }

    async findByPhone(phone: string): Promise<SafeUser | null> {
        const user = await prisma.user.findUnique({
            where: { phone },
        });

        return this.sanitizeUser(user);
    }

    async update(id: string, data: UpdateUserInput): Promise<SafeUser> {
        const cleanedData = cleanObject(data);

        if (_.isEmpty(cleanedData)) {
            throw new Error("No valid fields to update");
        }

        if (cleanedData.email) {
            const existing = await prisma.user.findFirst({
                where: { email: cleanedData.email, NOT: { id } },
            });
            if (existing) throw new Error("Email already in use");
        }

        if (cleanedData.phone) {
            const existing = await prisma.user.findFirst({
                where: { phone: cleanedData.phone, NOT: { id } },
            });
            if (existing) throw new Error("Phone already in use");
        }

        const user = await prisma.user.update({
            where: { id },
            data: cleanedData,
        });

        return this.sanitizeUser(user)!;
    }

    async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
        const user = await prisma.user.findUnique({
            where: { id },
            select: { password: true },
        });

        if (!user?.password) {
            throw new Error("User not found or no password set");
        }

        const isValid = await comparePassword(currentPassword, user.password);

        if (!isValid) {
            throw new Error("Current password is incorrect");
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });

        return true;
    }

    async setPassword(id: string, password: string): Promise<boolean> {
        const hashedPassword = await hashPassword(password);

        await prisma.user.update({
            where: { id },
            data: { password: hashedPassword },
        });

        return true;
    }

    async delete(id: string): Promise<boolean> {
        await prisma.user.delete({
            where: { id },
        });

        return true;
    }

    async list(options: UserListOptions = {}): Promise<PaginatedResult<SafeUser>> {
        const { page = 1, limit = 10, search, role, isVerified, isBlocked, sortBy = "createdAt", sortOrder = "desc" } = options;

        const skip = (page - 1) * limit;

        const where: Prisma.UserWhereInput = {
            ...(search && {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                    { phone: { contains: search } },
                ],
            }),
            ...(role && { role }),
            ...(!_.isNil(isVerified) && { isVerified }),
            ...(!_.isNil(isBlocked) && { isBlocked }),
        };

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
            }),
            prisma.user.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            data: this.sanitizeUsers(users),
            meta: {
                total,
                page,
                limit,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        };
    }

    async block(id: string): Promise<SafeUser> {
        const user = await prisma.user.update({
            where: { id },
            data: { isBlocked: true },
        });

        return this.sanitizeUser(user)!;
    }

    async unblock(id: string): Promise<SafeUser> {
        const user = await prisma.user.update({
            where: { id },
            data: { isBlocked: false },
        });

        return this.sanitizeUser(user)!;
    }

    async verify(id: string): Promise<SafeUser> {
        const user = await prisma.user.update({
            where: { id },
            data: { isVerified: true },
        });

        return this.sanitizeUser(user)!;
    }

    async updateRole(id: string, role: UserRole): Promise<SafeUser> {
        const user = await prisma.user.update({
            where: { id },
            data: { role },
        });

        return this.sanitizeUser(user)!;
    }

    async getProfile(userId: string): Promise<Profile | null> {
        return prisma.profile.findUnique({
            where: { userId },
        });
    }

    async upsertProfile(userId: string, data: UpdateProfileInput): Promise<Profile> {
        const cleanedData = cleanObject(data);

        return prisma.profile.upsert({
            where: { userId },
            create: {
                userId,
                ...cleanedData,
            },
            update: cleanedData,
        });
    }

    async getUserWithRelations(id: string, relations: UserRelationsOptions = {}): Promise<SafeUser | null> {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                profile: relations.profile ?? false,
                listings: relations.listings ?? false,
                subscriptions: relations.subscriptions ?? false,
                projects: relations.projects ?? false,
            },
        });

        return this.sanitizeUser(user);
    }

    async countByRole(role: UserRole): Promise<number> {
        return prisma.user.count({
            where: { role },
        });
    }

    async getStats(): Promise<UserStats> {
        const [total, verified, blocked, roleStats] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { isVerified: true } }),
            prisma.user.count({ where: { isBlocked: true } }),
            prisma.user.groupBy({
                by: ["role"],
                _count: { role: true },
            }),
        ]);

        const byRole = _.reduce(
            roleStats,
            (acc, stat) => {
                acc[stat.role] = stat._count.role;
                return acc;
            },
            {} as Record<UserRole, number>
        );

        return { total, verified, blocked, byRole };
    }

    async exists(id: string): Promise<boolean> {
        const count = await prisma.user.count({
            where: { id },
        });
        return count > 0;
    }

    async existsByEmail(email: string): Promise<boolean> {
        const count = await prisma.user.count({
            where: { email },
        });
        return count > 0;
    }

    async existsByPhone(phone: string): Promise<boolean> {
        const count = await prisma.user.count({
            where: { phone },
        });
        return count > 0;
    }
}

export const userService = new UserService();
