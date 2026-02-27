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

    async findById(
        id: string,
        includes?: { profile?: boolean; subscriptions?: boolean } | boolean
    ): Promise<(SafeUser & { profile?: any; subscriptions?: any }) | null> {
        let include: any = undefined;
        
        if (typeof includes === "boolean") {
            include = includes ? { profile: true } : undefined;
        } else if (includes) {
            include = {};
            if (includes.profile) include.profile = true;
            if (includes.subscriptions) {
                include.subscriptions = {
                    where: { isActive: true },
                    orderBy: { createdAt: "desc" as const },
                };
            }
        }

        const user = await prisma.user.findUnique({
            where: { id },
            include,
        });

        if (!user) return null;
        
        const sanitized = this.sanitizeUser(user) as any;
        if (include?.profile && (user as any).profile) {
            sanitized.profile = (user as any).profile;
        }
        if (include?.subscriptions && (user as any).subscriptions) {
            sanitized.subscriptions = (user as any).subscriptions;
        }
        
        return sanitized;
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
        const { page = 1, limit = 10, search, role, isEmailVerified, isBlocked, sortBy = "createdAt", sortOrder = "desc" } = options;

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
            ...(!_.isNil(isEmailVerified) && { isEmailVerified }),
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
            data: { isEmailVerified: true },
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
            prisma.user.count({ where: { isEmailVerified: true } }),
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

    // KYC Methods
    async submitAadharKyc(
        userId: string,
        data: { aadharNumber: string; aadharName: string; aadharDob: string; aadharDocUrl?: string }
    ) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }

        const maskedAadhar = `XXXX-XXXX-${data.aadharNumber.slice(-4)}`;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                kyc: {
                    ...user.kyc,
                    aadharNumber: maskedAadhar,
                    aadharName: data.aadharName,
                    aadharDob: data.aadharDob,
                    aadharDocUrl: data.aadharDocUrl,
                    isAadharVerified: false,
                    kycStatus: user.kyc?.isPanVerified ? "SUBMITTED" : "SUBMITTED",
                },
            },
        });

        return updatedUser.kyc;
    }

    async submitPanKyc(
        userId: string,
        data: { panNumber: string; panName: string; panDocUrl?: string }
    ) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                kyc: {
                    ...user.kyc,
                    panNumber: data.panNumber,
                    panName: data.panName,
                    panDocUrl: data.panDocUrl,
                    isPanVerified: false,
                    kycStatus: "SUBMITTED",
                },
            },
        });

        return updatedUser.kyc;
    }

    async getKycStatus(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { kyc: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        return user.kyc || {
            kycStatus: "PENDING",
            isAadharVerified: false,
            isPanVerified: false,
        };
    }

    async verifyKyc(
        userId: string,
        adminId: string,
        data: { kycStatus: string; kycRemarks?: string; verifyAadhar?: boolean; verifyPan?: boolean }
    ) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }

        const now = new Date();
        const kycUpdate: any = {
            ...user.kyc,
            kycStatus: data.kycStatus,
            kycRemarks: data.kycRemarks,
        };

        if (data.kycStatus === "VERIFIED") {
            kycUpdate.kycVerifiedAt = now;
            kycUpdate.kycVerifiedBy = adminId;
        }

        if (data.verifyAadhar) {
            kycUpdate.isAadharVerified = true;
            kycUpdate.aadharVerifiedAt = now;
        }

        if (data.verifyPan) {
            kycUpdate.isPanVerified = true;
            kycUpdate.panVerifiedAt = now;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { kyc: kycUpdate },
        });

        return updatedUser.kyc;
    }

    async updateLocation(
        userId: string,
        data: { latitude: number; longitude: number; accuracy?: number }
    ): Promise<{ latitude: number; longitude: number; lastLocationAt: Date }> {
        const now = new Date();
        await prisma.user.update({
            where: { id: userId },
            data: {
                lastLatitude: data.latitude,
                lastLongitude: data.longitude,
                lastLocationAt: now,
            },
        });
        await prisma.locationLog.create({
            data: {
                userId,
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: data.accuracy ?? undefined,
            },
        });
        return { latitude: data.latitude, longitude: data.longitude, lastLocationAt: now };
    }

    async getLocation(userId: string): Promise<{ latitude: number; longitude: number; lastLocationAt: Date } | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { lastLatitude: true, lastLongitude: true, lastLocationAt: true },
        });
        if (!user || user.lastLatitude == null || user.lastLongitude == null) return null;
        return {
            latitude: user.lastLatitude,
            longitude: user.lastLongitude,
            lastLocationAt: user.lastLocationAt!,
        };
    }

    async getLocationHistory(
        userId: string,
        limit: number = 50
    ): Promise<{ latitude: number; longitude: number; accuracy?: number; createdAt: Date }[]> {
        const logs = await prisma.locationLog.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: Math.min(limit, 100),
        });
        return logs.map((l: { latitude: number; longitude: number; accuracy: number | null; createdAt: Date }) => ({
            latitude: l.latitude,
            longitude: l.longitude,
            accuracy: l.accuracy ?? undefined,
            createdAt: l.createdAt,
        }));
    }
}

export const userService = new UserService();
