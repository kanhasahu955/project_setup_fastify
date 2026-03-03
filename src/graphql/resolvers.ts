import { userService } from "@/services/user.service";
import { authService } from "@/services/auth.service";
import { listingService } from "@/services/listing.service";
import { imagekitService } from "@/services/imagekit.service";
import { googleMapsService } from "@/services/googleMaps.service";
import prisma from "@/config/prisma.config";
import { getPrismaErrorMessage } from "@/utils/prismaError.util";
import { formatDate } from "@/utils/date.util";
import {
    registerSchema,
    verifyOtpSchema,
    resendOtpSchema,
    loginSchema,
    aadharKycSchema,
    panKycSchema,
    verifyKycSchema,
} from "@/validations/auth.validation";
import type { MercuriusContext } from "mercurius";
import { HttpStatusCode } from "@/utils/httpStatusCodes.util";

interface Context extends MercuriusContext {
    user?: { id: string; role: string; email?: string };
}

function formatZodErrors(error: any) {
    if (error.issues) {
        return error.issues.map((issue: any) => ({
            field: issue.path?.join(".") || "unknown",
            message: issue.message,
        }));
    }
    return [{ field: "unknown", message: error.message || "Validation failed" }];
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") + "-" + Date.now();
}

function buildPagination(total: number, page: number, limit: number) {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}

export const resolvers = {
    Query: {
        // ============================================
        // HEALTH
        // ============================================
        health: async (_: unknown, { detailed }: { detailed?: boolean }) => {
            const response: any = {
                status: "ok",
                uptime: process.uptime(),
                timestamp: formatDate(),
            };

            if (detailed) {
                try {
                    await prisma.$runCommandRaw({ ping: 1 });
                    response.services = { database: "connected" };
                } catch {
                    response.services = { database: "disconnected" };
                    response.status = "degraded";
                }
                response.memory = {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + " MB",
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + " MB",
                };
            }

            return response;
        },

        // ============================================
        // USER QUERIES
        // ============================================
        me: async (_: unknown, __: unknown, context: Context) => {
            if (!context.user?.id) {
                throw new Error("Not authenticated");
            }
            return userService.findById(context.user.id, {
                profile: true,
                subscriptions: true,
            });
        },

        myLocation: async (_: unknown, __: unknown, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            const loc = await userService.getLocation(context.user.id);
            if (!loc) return null;
            return { ...loc, lastLocationAt: loc.lastLocationAt.toISOString() };
        },

        myLocationHistory: async (_: unknown, { limit }: { limit?: number }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            const history = await userService.getLocationHistory(context.user.id, limit ?? 50);
            return history.map((h) => ({ ...h, createdAt: h.createdAt.toISOString() }));
        },

        user: async (_: unknown, { id }: { id: string }) => {
            const user = await userService.findById(id, {
                profile: true,
                subscriptions: true,
            });
            if (!user) {
                throw new Error("User not found");
            }
            return user;
        },

        users: async (_: unknown, { input }: { input?: any }) => {
            const options = {
                page: input?.page || 1,
                limit: input?.limit || 10,
                search: input?.search,
                role: input?.role,
                isEmailVerified: input?.isEmailVerified,
                isBlocked: input?.isBlocked,
                sortBy: input?.sortBy || "createdAt",
                sortOrder: (input?.sortOrder || "desc") as "asc" | "desc",
            };
            const result = await userService.list(options);
            return {
                data: result.data,
                pagination: {
                    total: result.meta.total,
                    page: result.meta.page,
                    limit: result.meta.limit,
                    totalPages: result.meta.totalPages,
                    hasNext: result.meta.hasNext,
                    hasPrev: result.meta.hasPrev,
                },
            };
        },

        userStats: async () => {
            return userService.getStats();
        },

        userExists: async (_: unknown, { email, phone }: { email?: string; phone?: string }) => {
            if (!email && !phone) {
                throw new Error("Email or phone is required");
            }
            const exists = email
                ? await userService.existsByEmail(email)
                : await userService.existsByPhone(phone!);
            return { exists };
        },

        profile: async (_: unknown, { userId }: { userId: string }) => {
            const user = await userService.findById(userId, { profile: true });
            return user?.profile || null;
        },

        kycStatus: async (_: unknown, { userId }: { userId: string }) => {
            return userService.getKycStatus(userId);
        },

        documentVerification: async (_: unknown, { id }: { id: string }) => {
            return prisma.documentVerification.findUnique({ where: { id } });
        },

        documentVerifications: async (
            _: unknown,
            { userId, status }: { userId?: string; status?: string },
        ) => {
            const where: any = {};
            if (userId) where.userId = userId;
            if (status) where.status = status;
            return prisma.documentVerification.findMany({
                where,
                orderBy: { submittedAt: "desc" },
            });
        },

        // ============================================
        // PROJECT QUERIES
        // ============================================
        project: async (_: unknown, { id }: { id: string }) => {
            return prisma.project.findUnique({
                where: { id },
                include: { builder: true, listings: true },
            });
        },

        projectBySlug: async (_: unknown, { slug }: { slug: string }) => {
            return prisma.project.findUnique({
                where: { slug },
                include: { builder: true, listings: true },
            });
        },

        projects: async (_: unknown, { input }: { input?: any }) => {
            const page = input?.page || 1;
            const limit = input?.limit || 10;
            const skip = (page - 1) * limit;

            const where: any = {};
            if (input?.search) {
                where.OR = [
                    { name: { contains: input.search, mode: "insensitive" } },
                    { city: { contains: input.search, mode: "insensitive" } },
                ];
            }
            if (input?.city) where.city = input.city;
            if (input?.builderId) where.builderId = input.builderId;

            const [data, total] = await Promise.all([
                prisma.project.findMany({
                    where,
                    skip,
                    take: limit,
                    include: { builder: true },
                    orderBy: { [input?.sortBy || "createdAt"]: input?.sortOrder || "desc" },
                }),
                prisma.project.count({ where }),
            ]);

            return { data, pagination: buildPagination(total, page, limit) };
        },

        // ============================================
        // LISTING QUERIES (same logic as REST via listingService)
        // ============================================
        listing: async (_: unknown, { id }: { id: string }) => {
            try {
                return await listingService.findById(id);
            } catch (e) {
                throw new Error(getPrismaErrorMessage(e, "Failed to get listing"));
            }
        },

        listingBySlug: async (_: unknown, { slug }: { slug: string }) => {
            const listing = await prisma.listing.findFirst({
                where: { slug, deletedAt: null },
                include: {
                    owner: true,
                    project: true,
                    images: { orderBy: { order: "asc" } },
                    amenities: { include: { amenity: true } },
                },
            });
            return listing;
        },

        listings: async (_: unknown, { input }: { input?: any }) => {
            try {
                const result = await listingService.list(input ?? {});
                return { data: result.data, pagination: result.meta };
            } catch (e) {
                throw new Error(getPrismaErrorMessage(e, "Failed to list listings"));
            }
        },

        listingStats: async () => {
            try {
                return await listingService.stats();
            } catch (e) {
                throw new Error(getPrismaErrorMessage(e, "Failed to get listing stats"));
            }
        },

        myListings: async (_: unknown, { input }: { input?: any }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            try {
                const result = await listingService.list({ ...input, ownerId: context.user.id });
                return { data: result.data, pagination: result.meta };
            } catch (e) {
                throw new Error(getPrismaErrorMessage(e, "Failed to list your listings"));
            }
        },

        featuredListings: async (_: unknown, { limit = 10 }: { limit?: number }) => {
            return prisma.listing.findMany({
                where: {
                    isFeatured: true,
                    status: "ACTIVE",
                    deletedAt: null,
                    boostExpiry: { gt: new Date() },
                },
                take: limit,
                include: { owner: true, images: { where: { isPrimary: true }, take: 1 } },
                orderBy: { createdAt: "desc" },
            });
        },

        nearbyListings: async (
            _: unknown,
            { latitude, longitude, radiusKm = 10, limit = 20 }: { latitude: number; longitude: number; radiusKm?: number; limit?: number }
        ) => {
            const result = await listingService.nearby(latitude, longitude, radiusKm ?? 10, limit ?? 20);
            return result.data;
        },

        listingComments: async (_: unknown, { listingId }: { listingId: string }) => {
            return prisma.listingComment.findMany({
                where: { listingId },
                include: { user: true },
                orderBy: { createdAt: "asc" },
            });
        },

        listingReviews: async (_: unknown, { listingId }: { listingId: string }) => {
            return prisma.listingReview.findMany({
                where: { listingId },
                include: { user: true },
                orderBy: { createdAt: "desc" },
            });
        },

        myFavoriteListingIds: async (_: unknown, __: unknown, context: Context) => {
            if (!context.user?.id) return [];
            const favs = await prisma.listingFavorite.findMany({
                where: { userId: context.user.id },
                select: { listingId: true },
            });
            return favs.map((f) => f.listingId);
        },

        // ============================================
        // LEAD QUERIES
        // ============================================
        lead: async (_: unknown, { id }: { id: string }) => {
            return prisma.lead.findUnique({
                where: { id },
                include: { listing: true, buyer: true, owner: true },
            });
        },

        leads: async (_: unknown, { input }: { input?: any }) => {
            const page = input?.page || 1;
            const limit = input?.limit || 10;
            const skip = (page - 1) * limit;

            const where: any = {};
            if (input?.listingId) where.listingId = input.listingId;
            if (input?.buyerId) where.buyerId = input.buyerId;
            if (input?.ownerId) where.ownerId = input.ownerId;
            if (input?.status) where.status = input.status;
            if (input?.source) where.source = input.source;

            const [data, total] = await Promise.all([
                prisma.lead.findMany({
                    where,
                    skip,
                    take: limit,
                    include: { listing: true, buyer: true, owner: true },
                    orderBy: { [input?.sortBy || "createdAt"]: input?.sortOrder || "desc" },
                }),
                prisma.lead.count({ where }),
            ]);

            return { data, pagination: buildPagination(total, page, limit) };
        },

        myLeadsAsBuyer: async (_: unknown, { input }: { input?: any }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            return resolvers.Query.leads(_, { input: { ...input, buyerId: context.user.id } });
        },

        myLeadsAsOwner: async (_: unknown, { input }: { input?: any }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            return resolvers.Query.leads(_, { input: { ...input, ownerId: context.user.id } });
        },

        call: async (_: unknown, { id }: { id: string }) => {
            return prisma.call.findUnique({
                where: { id },
                include: { caller: true, callee: true, listing: true, lead: true },
            });
        },

        calls: async (
            _: unknown,
            {
                callerId,
                calleeId,
                leadId,
                listingId,
                limit,
            }: {
                callerId?: string;
                calleeId?: string;
                leadId?: string;
                listingId?: string;
                limit?: number;
            },
        ) => {
            const where: any = {};
            if (callerId) where.callerId = callerId;
            if (calleeId) where.calleeId = calleeId;
            if (leadId) where.leadId = leadId;
            if (listingId) where.listingId = listingId;
            const take = Math.min(limit ?? 50, 100);
            return prisma.call.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take,
                include: { caller: true, callee: true, listing: true, lead: true },
            });
        },

        message: async (_: unknown, { id }: { id: string }) => {
            return prisma.message.findUnique({
                where: { id },
                include: { sender: true, receiver: true, listing: true, lead: true },
            });
        },

        messages: async (
            _: unknown,
            {
                senderId,
                receiverId,
                leadId,
                listingId,
                limit,
            }: {
                senderId?: string;
                receiverId?: string;
                leadId?: string;
                listingId?: string;
                limit?: number;
            },
        ) => {
            const where: any = {};
            if (senderId) where.senderId = senderId;
            if (receiverId) where.receiverId = receiverId;
            if (leadId) where.leadId = leadId;
            if (listingId) where.listingId = listingId;
            const take = Math.min(limit ?? 50, 100);
            return prisma.message.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take,
                include: { sender: true, receiver: true, listing: true, lead: true },
            });
        },

        // ============================================
        // REVIEW QUERIES
        // ============================================
        review: async (_: unknown, { id }: { id: string }) => {
            return prisma.review.findUnique({
                where: { id },
                include: { reviewer: true, user: true },
            });
        },

        reviews: async (_: unknown, { input }: { input?: any }) => {
            const page = input?.page || 1;
            const limit = input?.limit || 10;
            const skip = (page - 1) * limit;

            const where: any = {};
            if (input?.userId) where.userId = input.userId;
            if (input?.reviewerId) where.reviewerId = input.reviewerId;
            if (input?.minRating) where.rating = { gte: input.minRating };

            const [data, total] = await Promise.all([
                prisma.review.findMany({
                    where,
                    skip,
                    take: limit,
                    include: { reviewer: true, user: true },
                    orderBy: { [input?.sortBy || "createdAt"]: input?.sortOrder || "desc" },
                }),
                prisma.review.count({ where }),
            ]);

            return { data, pagination: buildPagination(total, page, limit) };
        },

        userReviews: async (_: unknown, { userId, input }: { userId: string; input?: any }) => {
            return resolvers.Query.reviews(_, { input: { ...input, userId } });
        },

        // ============================================
        // AMENITY QUERIES
        // ============================================
        advertisement: async (_: unknown, { id }: { id: string }) => {
            return prisma.advertisement.findUnique({
                where: { id },
                include: { listing: true, project: true, createdBy: true },
            });
        },

        advertisements: async (
            _: unknown,
            {
                type,
                activeOnly,
                limit,
            }: { type?: string; activeOnly?: boolean; limit?: number },
        ) => {
            const where: any = {};
            if (type) where.type = type;
            if (activeOnly !== false) {
                where.isActive = true;
                where.startDate = { lte: new Date() };
                where.endDate = { gte: new Date() };
            }
            const take = Math.min(limit ?? 20, 100);
            return prisma.advertisement.findMany({
                where,
                orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
                take,
                include: { listing: true, project: true, createdBy: true },
            });
        },

        amenity: async (_: unknown, { id }: { id: string }) => {
            return prisma.amenity.findUnique({ where: { id } });
        },

        amenities: async (_: unknown, { category }: { category?: string }) => {
            const where: any = {};
            if (category) where.category = category;
            return prisma.amenity.findMany({ where, orderBy: { name: "asc" } });
        },

        // ============================================
        // SUBSCRIPTION QUERIES
        // ============================================
        subscription: async (_: unknown, { id }: { id: string }) => {
            return prisma.subscription.findUnique({ where: { id } });
        },

        userSubscriptions: async (_: unknown, { userId }: { userId: string }) => {
            return prisma.subscription.findMany({
                where: { userId },
                orderBy: { expiry: "desc" },
            });
        },

        activeSubscription: async (_: unknown, { userId }: { userId: string }) => {
            return prisma.subscription.findFirst({
                where: { userId, active: true, expiry: { gt: new Date() } },
            });
        },

        subscriptionPlans: async (
            _: unknown,
            { planType, activeOnly }: { planType?: string; activeOnly?: boolean },
        ) => {
            const where: any = {};
            if (planType) where.planType = planType;
            if (activeOnly !== false) where.isActive = true;
            return prisma.subscriptionPlan.findMany({
                where,
                orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            });
        },

        subscriptionPlan: async (_: unknown, { id }: { id: string }) => {
            return prisma.subscriptionPlan.findUnique({ where: { id } });
        },

        subscriptionPlanBySlug: async (_: unknown, { slug }: { slug: string }) => {
            return prisma.subscriptionPlan.findUnique({ where: { slug } });
        },

        subscriptionPlanByType: async (_: unknown, { planType }: { planType: string }) => {
            return prisma.subscriptionPlan.findUnique({ where: { planType } });
        },

        // ============================================
        // IMAGEKIT QUERIES
        // ============================================
        imageKitAuthParams: async () => {
            return imagekitService.getAuthenticationParameters();
        },

        imageKitFiles: async (_: unknown, { path = "/", limit = 100 }: any) => {
            const files = await imagekitService.listFiles({ path, limit });
            return files;
        },

        // ============================================
        // MAPS (Google Places / Geocoding)
        // ============================================
        mapsAutocomplete: async (_: unknown, { input, sessionToken }: { input: string; sessionToken?: string }) => {
            if (!input?.trim()) throw new Error("input is required");
            return googleMapsService.autocomplete(input, sessionToken);
        },

        mapsPlaceDetails: async (_: unknown, { placeId }: { placeId: string }) => {
            if (!placeId?.trim()) throw new Error("placeId is required");
            return googleMapsService.getPlaceDetails(placeId);
        },

        mapsGeocode: async (_: unknown, { lat, lng }: { lat: number; lng: number }) => {
            if (typeof lat !== "number" || typeof lng !== "number" || Number.isNaN(lat) || Number.isNaN(lng)) {
                throw new Error("lat and lng must be valid numbers");
            }
            return googleMapsService.reverseGeocode(lat, lng);
        },
    },

    Mutation: {
        // ============================================
        // AUTH MUTATIONS
        // ============================================
        register: async (_: unknown, { input }: { input: any }) => {
            const validation = registerSchema.safeParse(input);
            if (!validation.success) {
                const errors = formatZodErrors(validation.error);
                throw new Error(`Validation failed: ${errors.map((e: any) => e.message).join(", ")}`);
            }
            const data = await authService.register(validation.data);
            return { success: true, message: data.message, data, statusCode: HttpStatusCode.OK };
        },

        verifyOtp: async (_: unknown, { input }: { input: any }, context: Context) => {
            const validation = verifyOtpSchema.safeParse(input);
            if (!validation.success) {
                const errors = formatZodErrors(validation.error);
                throw new Error(`Validation failed: ${errors.map((e: any) => e.message).join(", ")}`);
            }
            const user = await authService.verifyOtp(validation.data);
            const token = context.app?.jwt.sign({ id: user.id, email: user.email, role: user.role });
            const data = { user, token };
            return { success: true, message: "Registration completed successfully", data, statusCode: HttpStatusCode.CREATED };
        },

        resendOtp: async (_: unknown, { input }: { input: any }) => {
            const validation = resendOtpSchema.safeParse(input);
            if (!validation.success) {
                const errors = formatZodErrors(validation.error);
                throw new Error(`Validation failed: ${errors.map((e: any) => e.message).join(", ")}`);
            }
            const result = await authService.resendOtp(validation.data.email);
            const data = { message: result.message };
            return { success: true, message: result.message, data, statusCode: HttpStatusCode.OK };
        },

        login: async (_: unknown, { input }: { input: any }, context: Context) => {
            const validation = loginSchema.safeParse(input);
            if (!validation.success) {
                const errors = formatZodErrors(validation.error);
                throw new Error(`Validation failed: ${errors.map((e: any) => e.message).join(", ")}`);
            }
            const { user } = await authService.login(validation.data);
            const token = context.app?.jwt.sign({ id: user.id, email: user.email, role: user.role });
            const data = { user, token };
            return { success: true, message: "Login successful", data, statusCode: HttpStatusCode.OK };
        },

        // ============================================
        // USER MUTATIONS
        // ============================================
        updateMyLocation: async (
            _: unknown,
            { latitude, longitude, accuracy }: { latitude: number; longitude: number; accuracy?: number },
            context: Context
        ) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            const loc = await userService.updateLocation(context.user.id, { latitude, longitude, accuracy });
            return { ...loc, lastLocationAt: loc.lastLocationAt.toISOString() };
        },

        updateUser: async (_: unknown, { id, input }: { id: string; input: any }) => {
            const user = await userService.update(id, input);
            if (!user) throw new Error("User not found");
            return user;
        },

        deleteUser: async (_: unknown, { id }: { id: string }) => {
            const deleted = await userService.delete(id);
            if (!deleted) throw new Error("User not found");
            return { success: true, message: "User deleted successfully" };
        },

        updatePassword: async (
            _: unknown,
            { id, input }: { id: string; input: { currentPassword: string; newPassword: string } }
        ) => {
            await userService.updatePassword(id, input.currentPassword, input.newPassword);
            return { success: true, message: "Password updated successfully" };
        },

        blockUser: async (_: unknown, { id }: { id: string }) => {
            const user = await userService.block(id);
            if (!user) throw new Error("User not found");
            return user;
        },

        unblockUser: async (_: unknown, { id }: { id: string }) => {
            const user = await userService.unblock(id);
            if (!user) throw new Error("User not found");
            return user;
        },

        verifyUser: async (_: unknown, { id }: { id: string }) => {
            const user = await userService.verify(id);
            if (!user) throw new Error("User not found");
            return user;
        },

        updateUserRole: async (_: unknown, { id, role }: { id: string; role: string }) => {
            const user = await userService.updateRole(id, role as any);
            if (!user) throw new Error("User not found");
            return user;
        },

        upsertProfile: async (_: unknown, { userId, input }: { userId: string; input: any }) => {
            return userService.upsertProfile(userId, input);
        },

        submitAadharKyc: async (_: unknown, { userId, input }: { userId: string; input: any }) => {
            const validation = aadharKycSchema.safeParse(input);
            if (!validation.success) {
                const errors = formatZodErrors(validation.error);
                throw new Error(`Validation failed: ${errors.map((e: any) => e.message).join(", ")}`);
            }
            return userService.submitAadharKyc(userId, validation.data);
        },

        submitPanKyc: async (_: unknown, { userId, input }: { userId: string; input: any }) => {
            const validation = panKycSchema.safeParse(input);
            if (!validation.success) {
                const errors = formatZodErrors(validation.error);
                throw new Error(`Validation failed: ${errors.map((e: any) => e.message).join(", ")}`);
            }
            return userService.submitPanKyc(userId, validation.data);
        },

        verifyKyc: async (_: unknown, { userId, input }: { userId: string; input: any }, context: Context) => {
            const validation = verifyKycSchema.safeParse(input);
            if (!validation.success) {
                const errors = formatZodErrors(validation.error);
                throw new Error(`Validation failed: ${errors.map((e: any) => e.message).join(", ")}`);
            }
            const adminId = context.user?.id || "admin";
            return userService.verifyKyc(userId, adminId, validation.data);
        },

        submitDocumentVerification: async (
            _: unknown,
            { input }: { input: { documentType: string; documentName?: string; documentUrl: string } },
            context: Context,
        ) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            return prisma.documentVerification.create({
                data: {
                    userId: context.user.id,
                    documentType: input.documentType,
                    documentName: input.documentName ?? null,
                    documentUrl: input.documentUrl,
                },
            });
        },

        updateDocumentVerificationStatus: async (
            _: unknown,
            {
                id,
                input,
            }: {
                id: string;
                input: { status: string; remarks?: string };
            },
            context: Context,
        ) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            const data: any = {
                status: input.status,
                remarks: input.remarks ?? null,
            };
            if (input.status === "VERIFIED" || input.status === "REJECTED") {
                data.verifiedAt = new Date();
                data.verifiedBy = context.user.id;
            }
            return prisma.documentVerification.update({
                where: { id },
                data,
            });
        },

        // ============================================
        // PROJECT MUTATIONS
        // ============================================
        createProject: async (_: unknown, { input }: { input: any }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            return prisma.project.create({
                data: {
                    ...input,
                    slug: generateSlug(input.name),
                    builderId: context.user.id,
                },
                include: { builder: true },
            });
        },

        updateProject: async (_: unknown, { id, input }: { id: string; input: any }) => {
            return prisma.project.update({
                where: { id },
                data: input,
                include: { builder: true },
            });
        },

        deleteProject: async (_: unknown, { id }: { id: string }) => {
            await prisma.project.delete({ where: { id } });
            return { success: true, message: "Project deleted successfully" };
        },

        // ============================================
        // LISTING MUTATIONS (same logic as REST via listingService)
        // ============================================
        createListing: async (_: unknown, { input }: { input: any }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            try {
                return await listingService.create(context.user.id, input);
            } catch (e: any) {
                context.app?.log?.error?.(e, "createListing failed");
                throw new Error(getPrismaErrorMessage(e, "Failed to create listing"));
            }
        },

        updateListing: async (_: unknown, { id, input }: { id: string; input: any }) => {
            try {
                return await listingService.update(id, input);
            } catch (e) {
                throw new Error(getPrismaErrorMessage(e, "Failed to update listing"));
            }
        },

        deleteListing: async (_: unknown, { id }: { id: string }) => {
            try {
                await listingService.softDelete(id);
                return { success: true, message: "Listing deleted successfully" };
            } catch (e) {
                throw new Error(getPrismaErrorMessage(e, "Failed to delete listing"));
            }
        },

        publishListing: async (_: unknown, { id }: { id: string }) => {
            return prisma.listing.update({
                where: { id },
                data: { status: "PENDING_APPROVAL" },
                include: { owner: true },
            });
        },

        unpublishListing: async (_: unknown, { id }: { id: string }) => {
            return prisma.listing.update({
                where: { id },
                data: { status: "DRAFT" },
                include: { owner: true },
            });
        },

        featureListing: async (_: unknown, { id, days }: { id: string; days: number }) => {
            const boostExpiry = new Date();
            boostExpiry.setDate(boostExpiry.getDate() + days);
            return prisma.listing.update({
                where: { id },
                data: { isFeatured: true, boostExpiry },
                include: { owner: true },
            });
        },

        verifyListing: async (_: unknown, { id }: { id: string }) => {
            return prisma.listing.update({
                where: { id },
                data: { isVerified: true, status: "ACTIVE" },
                include: { owner: true },
            });
        },

        incrementListingViews: async (_: unknown, { id }: { id: string }) => {
            return prisma.listing.update({
                where: { id },
                data: { views: { increment: 1 } },
            });
        },

        incrementListingClicks: async (_: unknown, { id }: { id: string }) => {
            return prisma.listing.update({
                where: { id },
                data: { clicks: { increment: 1 } },
            });
        },

        addListingFavorite: async (_: unknown, { listingId }: { listingId: string }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            await prisma.listingFavorite.upsert({
                where: {
                    userId_listingId: { userId: context.user.id, listingId },
                },
                create: { userId: context.user.id, listingId },
                update: {},
            });
            return { success: true, message: "Added to favorites" };
        },

        removeListingFavorite: async (_: unknown, { listingId }: { listingId: string }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            await prisma.listingFavorite.deleteMany({
                where: { userId: context.user.id, listingId },
            });
            return { success: true, message: "Removed from favorites" };
        },

        createListingComment: async (
            _: unknown,
            { listingId, content }: { listingId: string; content: string },
            context: Context
        ) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            return prisma.listingComment.create({
                data: { listingId, userId: context.user.id, content: content.trim() },
                include: { user: true },
            });
        },

        deleteListingComment: async (_: unknown, { id }: { id: string }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            const comment = await prisma.listingComment.findUnique({ where: { id } });
            if (!comment) throw new Error("Comment not found");
            if (comment.userId !== context.user.id) throw new Error("Not authorized to delete this comment");
            await prisma.listingComment.delete({ where: { id } });
            return { success: true, message: "Comment deleted" };
        },

        createListingReview: async (
            _: unknown,
            { listingId, rating, comment }: { listingId: string; rating: number; comment?: string | null },
            context: Context
        ) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");
            return prisma.listingReview.upsert({
                where: {
                    userId_listingId: { userId: context.user.id, listingId },
                },
                create: { listingId, userId: context.user.id, rating, comment: comment?.trim() ?? null },
                update: { rating, comment: comment?.trim() ?? null, updatedAt: new Date() },
                include: { user: true },
            });
        },

        updateListingReview: async (
            _: unknown,
            { id, rating, comment }: { id: string; rating: number; comment?: string | null },
            context: Context
        ) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            if (rating < 1 || rating > 5) throw new Error("Rating must be between 1 and 5");
            const review = await prisma.listingReview.findUnique({ where: { id } });
            if (!review) throw new Error("Review not found");
            if (review.userId !== context.user.id) throw new Error("Not authorized to update this review");
            return prisma.listingReview.update({
                where: { id },
                data: { rating, comment: comment?.trim() ?? null },
                include: { user: true },
            });
        },

        deleteListingReview: async (_: unknown, { id }: { id: string }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            const review = await prisma.listingReview.findUnique({ where: { id } });
            if (!review) throw new Error("Review not found");
            if (review.userId !== context.user.id) throw new Error("Not authorized to delete this review");
            await prisma.listingReview.delete({ where: { id } });
            return { success: true, message: "Review deleted" };
        },

        addListingImage: async (_: unknown, { listingId, input }: { listingId: string; input: any }) => {
            const maxOrder = await prisma.listingImage.findFirst({
                where: { listingId },
                orderBy: { order: "desc" },
                select: { order: true },
            });
            return prisma.listingImage.create({
                data: {
                    listingId,
                    url: input.url,
                    isPrimary: input.isPrimary || false,
                    order: input.order ?? (maxOrder?.order ?? -1) + 1,
                },
            });
        },

        removeListingImage: async (_: unknown, { imageId }: { imageId: string }) => {
            await prisma.listingImage.delete({ where: { id: imageId } });
            return { success: true, message: "Image removed successfully" };
        },

        reorderListingImages: async (_: unknown, { listingId, imageIds }: { listingId: string; imageIds: string[] }) => {
            await Promise.all(
                imageIds.map((id, index) =>
                    prisma.listingImage.update({ where: { id }, data: { order: index } })
                )
            );
            return prisma.listingImage.findMany({
                where: { listingId },
                orderBy: { order: "asc" },
            });
        },

        addListingAmenity: async (
            _: unknown,
            { listingId, amenityId, isHighlighted }: { listingId: string; amenityId: string; isHighlighted?: boolean }
        ) => {
            return prisma.amenityOnListing.create({
                data: { listingId, amenityId, isHighlighted: isHighlighted || false },
                include: { amenity: true },
            });
        },

        removeListingAmenity: async (_: unknown, { listingId, amenityId }: { listingId: string; amenityId: string }) => {
            await prisma.amenityOnListing.deleteMany({ where: { listingId, amenityId } });
            return { success: true, message: "Amenity removed from listing" };
        },

        // ============================================
        // LEAD MUTATIONS
        // ============================================
        createLead: async (_: unknown, { input }: { input: any }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");

            const listing = await prisma.listing.findUnique({
                where: { id: input.listingId },
                select: { ownerId: true },
            });
            if (!listing) throw new Error("Listing not found");

            return prisma.lead.create({
                data: {
                    listingId: input.listingId,
                    buyerId: context.user.id,
                    ownerId: listing.ownerId,
                    message: input.message,
                    source: input.source,
                },
                include: { listing: true, buyer: true, owner: true },
            });
        },

        updateLeadStatus: async (_: unknown, { id, input }: { id: string; input: { status: string } }) => {
            return prisma.lead.update({
                where: { id },
                data: { status: input.status as any },
                include: { listing: true, buyer: true, owner: true },
            });
        },

        deleteLead: async (_: unknown, { id }: { id: string }) => {
            await prisma.lead.delete({ where: { id } });
            return { success: true, message: "Lead deleted successfully" };
        },

        createCall: async (_: unknown, { input }: { input: any }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            return prisma.call.create({
                data: {
                    callerId: context.user.id,
                    calleeId: input.calleeId,
                    listingId: input.listingId ?? null,
                    leadId: input.leadId ?? null,
                },
                include: { caller: true, callee: true, listing: true, lead: true },
            });
        },

        updateCallStatus: async (
            _: unknown,
            { id, status, durationSeconds }: { id: string; status: string; durationSeconds?: number },
        ) => {
            const data: any = { status };
            if (durationSeconds != null) data.durationSeconds = durationSeconds;
            return prisma.call.update({
                where: { id },
                data,
                include: { caller: true, callee: true, listing: true, lead: true },
            });
        },

        createMessage: async (_: unknown, { input }: { input: any }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");
            return prisma.message.create({
                data: {
                    senderId: context.user.id,
                    receiverId: input.receiverId,
                    content: input.content,
                    listingId: input.listingId ?? null,
                    leadId: input.leadId ?? null,
                },
                include: { sender: true, receiver: true, listing: true, lead: true },
            });
        },

        markMessageRead: async (_: unknown, { id }: { id: string }) => {
            return prisma.message.update({
                where: { id },
                data: { readAt: new Date() },
                include: { sender: true, receiver: true, listing: true, lead: true },
            });
        },

        // ============================================
        // REVIEW MUTATIONS
        // ============================================
        createReview: async (_: unknown, { input }: { input: any }, context: Context) => {
            if (!context.user?.id) throw new Error("Not authenticated");

            const review = await prisma.review.create({
                data: {
                    userId: input.userId,
                    reviewerId: context.user.id,
                    rating: input.rating,
                    comment: input.comment,
                },
                include: { reviewer: true, user: true },
            });

            // Update user's profile rating
            const reviews = await prisma.review.findMany({ where: { userId: input.userId } });
            const avgRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length;

            await prisma.profile.updateMany({
                where: { userId: input.userId },
                data: { rating: avgRating, totalReviews: reviews.length },
            });

            return review;
        },

        updateReview: async (_: unknown, { id, input }: { id: string; input: any }) => {
            const review = await prisma.review.update({
                where: { id },
                data: input,
                include: { reviewer: true, user: true },
            });

            // Recalculate rating
            const reviews = await prisma.review.findMany({ where: { userId: review.userId } });
            const avgRating = reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length;

            await prisma.profile.updateMany({
                where: { userId: review.userId },
                data: { rating: avgRating },
            });

            return review;
        },

        deleteReview: async (_: unknown, { id }: { id: string }) => {
            const review = await prisma.review.delete({ where: { id } });

            // Recalculate rating
            const reviews = await prisma.review.findMany({ where: { userId: review.userId } });
            const avgRating = reviews.length ? reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length : 0;

            await prisma.profile.updateMany({
                where: { userId: review.userId },
                data: { rating: avgRating, totalReviews: reviews.length },
            });

            return { success: true, message: "Review deleted successfully" };
        },

        // ============================================
        // AMENITY MUTATIONS
        // ============================================
        createAdvertisement: async (_: unknown, { input }: { input: any }, context: Context) => {
            const createdById = context.user?.id ?? null;
            return prisma.advertisement.create({
                data: {
                    title: input.title,
                    type: input.type,
                    imageUrl: input.imageUrl,
                    targetUrl: input.targetUrl ?? null,
                    description: input.description ?? null,
                    listingId: input.listingId ?? null,
                    projectId: input.projectId ?? null,
                    createdById,
                    startDate: new Date(input.startDate),
                    endDate: new Date(input.endDate),
                    isActive: input.isActive ?? true,
                    sortOrder: input.sortOrder ?? 0,
                },
                include: { listing: true, project: true, createdBy: true },
            });
        },

        updateAdvertisement: async (_: unknown, { id, input }: { id: string; input: any }) => {
            const data: any = {};
            if (input.title != null) data.title = input.title;
            if (input.type != null) data.type = input.type;
            if (input.imageUrl != null) data.imageUrl = input.imageUrl;
            if (input.targetUrl !== undefined) data.targetUrl = input.targetUrl;
            if (input.description !== undefined) data.description = input.description;
            if (input.listingId !== undefined) data.listingId = input.listingId;
            if (input.projectId !== undefined) data.projectId = input.projectId;
            if (input.startDate != null) data.startDate = new Date(input.startDate);
            if (input.endDate != null) data.endDate = new Date(input.endDate);
            if (input.isActive != null) data.isActive = input.isActive;
            if (input.sortOrder != null) data.sortOrder = input.sortOrder;
            return prisma.advertisement.update({
                where: { id },
                data,
                include: { listing: true, project: true, createdBy: true },
            });
        },

        deleteAdvertisement: async (_: unknown, { id }: { id: string }) => {
            await prisma.advertisement.delete({ where: { id } });
            return { success: true, message: "Advertisement deleted successfully" };
        },

        incrementAdvertisementClicks: async (_: unknown, { id }: { id: string }) => {
            return prisma.advertisement.update({
                where: { id },
                data: { clicks: { increment: 1 } },
                include: { listing: true, project: true, createdBy: true },
            });
        },

        createAmenity: async (_: unknown, { input }: { input: any }) => {
            return prisma.amenity.create({ data: input });
        },

        updateAmenity: async (_: unknown, { id, input }: { id: string; input: any }) => {
            return prisma.amenity.update({ where: { id }, data: input });
        },

        deleteAmenity: async (_: unknown, { id }: { id: string }) => {
            await prisma.amenity.delete({ where: { id } });
            return { success: true, message: "Amenity deleted successfully" };
        },

        // ============================================
        // SUBSCRIPTION MUTATIONS
        // ============================================
        createSubscription: async (_: unknown, { input }: { input: any }) => {
            return prisma.subscription.create({ data: input });
        },

        cancelSubscription: async (_: unknown, { id }: { id: string }) => {
            return prisma.subscription.update({
                where: { id },
                data: { active: false },
            });
        },

        createSubscriptionPlan: async (_: unknown, { input }: { input: any }) => {
            return prisma.subscriptionPlan.create({
                data: {
                    planType: input.planType,
                    name: input.name,
                    slug: input.slug,
                    description: input.description ?? null,
                    priceAmount: input.priceAmount,
                    priceCurrency: input.priceCurrency ?? "INR",
                    billingInterval: input.billingInterval ?? "MONTHLY",
                    features: input.features ?? null,
                    maxListings: input.maxListings ?? null,
                    isActive: input.isActive ?? true,
                    sortOrder: input.sortOrder ?? 0,
                },
            });
        },

        updateSubscriptionPlan: async (_: unknown, { id, input }: { id: string; input: any }) => {
            const data: any = {};
            if (input.name != null) data.name = input.name;
            if (input.slug != null) data.slug = input.slug;
            if (input.description != null) data.description = input.description;
            if (input.priceAmount != null) data.priceAmount = input.priceAmount;
            if (input.priceCurrency != null) data.priceCurrency = input.priceCurrency;
            if (input.billingInterval != null) data.billingInterval = input.billingInterval;
            if (input.features != null) data.features = input.features;
            if (input.maxListings != null) data.maxListings = input.maxListings;
            if (input.isActive != null) data.isActive = input.isActive;
            if (input.sortOrder != null) data.sortOrder = input.sortOrder;
            return prisma.subscriptionPlan.update({
                where: { id },
                data,
            });
        },
    },

    // ============================================
    // FIELD RESOLVERS
    // ============================================
    User: {
        profile: async (parent: any) => {
            if (parent.profile) return parent.profile;
            return prisma.profile.findUnique({ where: { userId: parent.id } });
        },
        subscriptions: async (parent: any) => {
            if (parent.subscriptions) return parent.subscriptions;
            return prisma.subscription.findMany({
                where: { userId: parent.id, active: true },
                orderBy: { expiry: "desc" },
            });
        },
        listings: async (parent: any) => {
            if (parent.listings) return parent.listings;
            return prisma.listing.findMany({
                where: { ownerId: parent.id, deletedAt: null },
                orderBy: { createdAt: "desc" },
            });
        },
        projects: async (parent: any) => {
            if (parent.projects) return parent.projects;
            return prisma.project.findMany({
                where: { builderId: parent.id },
                orderBy: { createdAt: "desc" },
            });
        },
        leadsAsBuyer: async (parent: any) => {
            if (parent.leadsAsBuyer) return parent.leadsAsBuyer;
            return prisma.lead.findMany({ where: { buyerId: parent.id } });
        },
        leadsAsOwner: async (parent: any) => {
            if (parent.leadsAsOwner) return parent.leadsAsOwner;
            return prisma.lead.findMany({ where: { ownerId: parent.id } });
        },
        reviewsGiven: async (parent: any) => {
            if (parent.reviewsGiven) return parent.reviewsGiven;
            return prisma.review.findMany({ where: { reviewerId: parent.id } });
        },
        reviewsReceived: async (parent: any) => {
            if (parent.reviewsReceived) return parent.reviewsReceived;
            return prisma.review.findMany({ where: { userId: parent.id } });
        },
        channelPartnerLinksAsBuilder: async (parent: any) => {
            if (parent.channelPartnerLinksAsBuilder) return parent.channelPartnerLinksAsBuilder;
            return prisma.builderChannelPartner.findMany({
                where: { builderId: parent.id },
                orderBy: { createdAt: "desc" },
            });
        },
        builderLinksAsChannelPartner: async (parent: any) => {
            if (parent.builderLinksAsChannelPartner) return parent.builderLinksAsChannelPartner;
            return prisma.builderChannelPartner.findMany({
                where: { channelPartnerId: parent.id },
                orderBy: { createdAt: "desc" },
            });
        },
        documentVerifications: async (parent: any) => {
            if (parent.documentVerifications) return parent.documentVerifications;
            return prisma.documentVerification.findMany({
                where: { userId: parent.id },
                orderBy: { submittedAt: "desc" },
            });
        },
        callsAsCaller: async (parent: any) => {
            if (parent.callsAsCaller) return parent.callsAsCaller;
            return prisma.call.findMany({
                where: { callerId: parent.id },
                orderBy: { createdAt: "desc" },
            });
        },
        callsAsCallee: async (parent: any) => {
            if (parent.callsAsCallee) return parent.callsAsCallee;
            return prisma.call.findMany({
                where: { calleeId: parent.id },
                orderBy: { createdAt: "desc" },
            });
        },
        messagesSent: async (parent: any) => {
            if (parent.messagesSent) return parent.messagesSent;
            return prisma.message.findMany({
                where: { senderId: parent.id },
                orderBy: { createdAt: "desc" },
            });
        },
        messagesReceived: async (parent: any) => {
            if (parent.messagesReceived) return parent.messagesReceived;
            return prisma.message.findMany({
                where: { receiverId: parent.id },
                orderBy: { createdAt: "desc" },
            });
        },
    },

    DocumentVerification: {
        user: async (parent: any) => {
            if (parent.user) return parent.user;
            return prisma.user.findUnique({ where: { id: parent.userId } });
        },
    },

    BuilderChannelPartner: {
        builder: async (parent: any) => {
            if (parent.builder) return parent.builder;
            return prisma.user.findUnique({ where: { id: parent.builderId } });
        },
        channelPartner: async (parent: any) => {
            if (parent.channelPartner) return parent.channelPartner;
            return prisma.user.findUnique({ where: { id: parent.channelPartnerId } });
        },
    },

    Project: {
        builder: async (parent: any) => {
            if (parent.builder) return parent.builder;
            return prisma.user.findUnique({ where: { id: parent.builderId } });
        },
        listings: async (parent: any) => {
            if (parent.listings) return parent.listings;
            return prisma.listing.findMany({ where: { projectId: parent.id, deletedAt: null } });
        },
        advertisements: async (parent: any) => {
            if (parent.advertisements) return parent.advertisements;
            return prisma.advertisement.findMany({
                where: { projectId: parent.id },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            });
        },
    },

    Advertisement: {
        listing: async (parent: any) => {
            if (!parent.listingId) return null;
            if (parent.listing) return parent.listing;
            return prisma.listing.findUnique({ where: { id: parent.listingId } });
        },
        project: async (parent: any) => {
            if (!parent.projectId) return null;
            if (parent.project) return parent.project;
            return prisma.project.findUnique({ where: { id: parent.projectId } });
        },
        createdBy: async (parent: any) => {
            if (!parent.createdById) return null;
            if (parent.createdBy) return parent.createdBy;
            return prisma.user.findUnique({ where: { id: parent.createdById } });
        },
    },

    Listing: {
        owner: async (parent: any) => {
            if (parent.owner) return parent.owner;
            return prisma.user.findUnique({ where: { id: parent.ownerId } });
        },
        project: async (parent: any) => {
            if (parent.project) return parent.project;
            if (!parent.projectId) return null;
            return prisma.project.findUnique({ where: { id: parent.projectId } });
        },
        images: async (parent: any) => {
            if (parent.images) return parent.images;
            return prisma.listingImage.findMany({
                where: { listingId: parent.id },
                orderBy: { order: "asc" },
            });
        },
        amenities: async (parent: any) => {
            if (parent.amenities) return parent.amenities;
            return prisma.amenityOnListing.findMany({
                where: { listingId: parent.id },
                include: { amenity: true },
            });
        },
        leads: async (parent: any) => {
            if (parent.leads) return parent.leads;
            return prisma.lead.findMany({ where: { listingId: parent.id } });
        },
        advertisements: async (parent: any) => {
            if (parent.advertisements) return parent.advertisements;
            return prisma.advertisement.findMany({
                where: { listingId: parent.id },
                orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
            });
        },
        favoritesCount: async (parent: any) => {
            if (parent.favoritesCount != null) return parent.favoritesCount;
            return prisma.listingFavorite.count({ where: { listingId: parent.id } });
        },
        isFavoritedByMe: async (parent: any, _args: unknown, context: Context) => {
            if (!context.user?.id) return false;
            const fav = await prisma.listingFavorite.findUnique({
                where: {
                    userId_listingId: { userId: context.user.id, listingId: parent.id },
                },
            });
            return !!fav;
        },
        averageRating: async (parent: any) => {
            const agg = await prisma.listingReview.aggregate({
                where: { listingId: parent.id },
                _avg: { rating: true },
                _count: { id: true },
            });
            return agg._count.id === 0 ? null : agg._avg.rating ?? null;
        },
        totalRatings: async (parent: any) => {
            return prisma.listingReview.count({ where: { listingId: parent.id } });
        },
        isRatedByMe: async (parent: any, _args: unknown, context: Context) => {
            if (!context.user?.id) return false;
            const review = await prisma.listingReview.findUnique({
                where: {
                    userId_listingId: { userId: context.user.id, listingId: parent.id },
                },
            });
            return !!review;
        },
        myRating: async (parent: any, _args: unknown, context: Context) => {
            if (!context.user?.id) return null;
            const review = await prisma.listingReview.findUnique({
                where: {
                    userId_listingId: { userId: context.user.id, listingId: parent.id },
                },
            });
            return review?.rating ?? null;
        },
    },

    ListingReview: {
        user: async (parent: any) => {
            if (parent.user) return parent.user;
            return prisma.user.findUnique({ where: { id: parent.userId } });
        },
    },

    ListingComment: {
        user: async (parent: any) => {
            if (parent.user) return parent.user;
            return prisma.user.findUnique({ where: { id: parent.userId } });
        },
    },

    Lead: {
        listing: async (parent: any) => {
            if (parent.listing) return parent.listing;
            return prisma.listing.findUnique({ where: { id: parent.listingId } });
        },
        buyer: async (parent: any) => {
            if (parent.buyer) return parent.buyer;
            return prisma.user.findUnique({ where: { id: parent.buyerId } });
        },
        owner: async (parent: any) => {
            if (parent.owner) return parent.owner;
            return prisma.user.findUnique({ where: { id: parent.ownerId } });
        },
        calls: async (parent: any) => {
            if (parent.calls) return parent.calls;
            return prisma.call.findMany({ where: { leadId: parent.id }, orderBy: { createdAt: "desc" } });
        },
        messages: async (parent: any) => {
            if (parent.messages) return parent.messages;
            return prisma.message.findMany({ where: { leadId: parent.id }, orderBy: { createdAt: "desc" } });
        },
    },

    Call: {
        caller: async (parent: any) => {
            if (parent.caller) return parent.caller;
            return prisma.user.findUnique({ where: { id: parent.callerId } });
        },
        callee: async (parent: any) => {
            if (parent.callee) return parent.callee;
            return prisma.user.findUnique({ where: { id: parent.calleeId } });
        },
        listing: async (parent: any) => {
            if (!parent.listingId) return null;
            if (parent.listing) return parent.listing;
            return prisma.listing.findUnique({ where: { id: parent.listingId } });
        },
        lead: async (parent: any) => {
            if (!parent.leadId) return null;
            if (parent.lead) return parent.lead;
            return prisma.lead.findUnique({ where: { id: parent.leadId } });
        },
    },

    Message: {
        sender: async (parent: any) => {
            if (parent.sender) return parent.sender;
            return prisma.user.findUnique({ where: { id: parent.senderId } });
        },
        receiver: async (parent: any) => {
            if (parent.receiver) return parent.receiver;
            return prisma.user.findUnique({ where: { id: parent.receiverId } });
        },
        listing: async (parent: any) => {
            if (!parent.listingId) return null;
            if (parent.listing) return parent.listing;
            return prisma.listing.findUnique({ where: { id: parent.listingId } });
        },
        lead: async (parent: any) => {
            if (!parent.leadId) return null;
            if (parent.lead) return parent.lead;
            return prisma.lead.findUnique({ where: { id: parent.leadId } });
        },
    },

    Review: {
        reviewer: async (parent: any) => {
            if (parent.reviewer) return parent.reviewer;
            return prisma.user.findUnique({ where: { id: parent.reviewerId } });
        },
        user: async (parent: any) => {
            if (parent.user) return parent.user;
            return prisma.user.findUnique({ where: { id: parent.userId } });
        },
    },

    AmenityOnListing: {
        amenity: async (parent: any) => {
            if (parent.amenity) return parent.amenity;
            return prisma.amenity.findUnique({ where: { id: parent.amenityId } });
        },
    },
};
