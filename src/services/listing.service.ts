import prisma from "@/config/prisma.config";
import { cleanObject } from "@/utils/lodash.util";
import type { PaginatedResult } from "@/types/common.types";
import type { CreateListingInput, UpdateListingInput, ListingListOptions, SafeListing } from "@/types/listing.types";

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

function generateSlug(title: string): string {
    return (
        title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "") + "-" + Date.now()
    );
}

export interface ListingStats {
    total: number;
    active: number;
    pending: number;
    sold: number;
    rented: number;
}

class ListingService {
    private baseInclude = {
        owner: true,
        project: true,
        images: { orderBy: { order: "asc" as const } },
        amenities: { include: { amenity: true } },
    };

    async list(options: ListingListOptions = {}): Promise<PaginatedResult<SafeListing>> {
        const page = options.page && options.page > 0 ? options.page : 1;
        const limit = options.limit && options.limit > 0 ? options.limit : 10;
        const skip = (page - 1) * limit;

        const where: any = { deletedAt: null };

        if (options.search) {
            where.OR = [
                { title: { contains: options.search, mode: "insensitive" } },
                { city: { contains: options.search, mode: "insensitive" } },
                { locality: { contains: options.search, mode: "insensitive" } },
            ];
        }
        if (options.city) where.city = options.city;
        if (options.locality) where.locality = options.locality;
        if (options.listingType) where.listingType = options.listingType;
        if (options.propertyType) where.propertyType = options.propertyType;
        if (options.status) where.status = options.status;
        if (options.minPrice != null) where.price = { ...(where.price || {}), gte: options.minPrice };
        if (options.maxPrice != null) where.price = { ...(where.price || {}), lte: options.maxPrice };
        if (options.bedrooms != null) where.bedrooms = options.bedrooms;
        if (options.ownerId) where.ownerId = options.ownerId;
        if (options.projectId) where.projectId = options.projectId;
        if (options.isFeatured != null) where.isFeatured = options.isFeatured;
        if (options.isVerified != null) where.isVerified = options.isVerified;

        const orderBy: any = {
            [options.sortBy || "createdAt"]: options.sortOrder || "desc",
        };

        const [data, total] = await Promise.all([
            prisma.listing.findMany({
                where,
                skip,
                take: limit,
                include: this.baseInclude,
                orderBy,
            }),
            prisma.listing.count({ where }),
        ]);

        return {
            data: data as SafeListing[],
            meta: buildPagination(total, page, limit),
        };
    }

    async findById(id: string): Promise<SafeListing | null> {
        const listing = await prisma.listing.findFirst({
            where: { id, deletedAt: null as any },
            include: this.baseInclude,
        });
        return listing as SafeListing | null;
    }

    async create(ownerId: string, input: CreateListingInput): Promise<SafeListing> {
        const { amenityIds, images, ...listingData } = input;

        const listing = await prisma.listing.create({
            data: {
                ...listingData,
                slug: generateSlug(input.title),
                ownerId,
                status: "DRAFT",
            },
        });

        if (images?.length) {
            await prisma.listingImage.createMany({
                data: images.map((img, index) => ({
                    listingId: listing.id,
                    url: img.url,
                    isPrimary: img.isPrimary || index === 0,
                    order: img.order ?? index,
                })),
            });
        }

        if (amenityIds?.length) {
            await prisma.amenityOnListing.createMany({
                data: amenityIds.map((amenityId) => ({
                    listingId: listing.id,
                    amenityId,
                })),
            });
        }

        return (await this.findById(listing.id)) as SafeListing;
    }

    async update(id: string, input: UpdateListingInput): Promise<SafeListing> {
        const data = cleanObject(input);

        const listing = await prisma.listing.update({
            where: { id },
            data,
            include: this.baseInclude,
        });

        return listing as SafeListing;
    }

    async softDelete(id: string): Promise<void> {
        await prisma.listing.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
    }

    async stats(): Promise<ListingStats> {
        const [total, active, pending, sold, rented] = await Promise.all([
            prisma.listing.count({ where: { deletedAt: null } }),
            prisma.listing.count({ where: { status: "ACTIVE", deletedAt: null } }),
            prisma.listing.count({ where: { status: "PENDING_APPROVAL", deletedAt: null } }),
            prisma.listing.count({ where: { status: "SOLD", deletedAt: null } }),
            prisma.listing.count({ where: { status: "RENTED", deletedAt: null } }),
        ]);

        return { total, active, pending, sold, rented };
    }

    /** Haversine distance in km between two points */
    private static distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    async nearby(
        latitude: number,
        longitude: number,
        radiusKm: number = 10,
        limit: number = 20
    ): Promise<PaginatedResult<SafeListing & { distanceKm?: number }>> {
        const degPerKm = 1 / 111; // rough
        const delta = radiusKm * degPerKm;
        const where = {
            deletedAt: null,
            status: "ACTIVE",
            latitude: { gte: latitude - delta, lte: latitude + delta },
            longitude: { gte: longitude - delta, lte: longitude + delta },
        };
        const rows = await prisma.listing.findMany({
            where,
            include: this.baseInclude,
            take: Math.min(limit * 3, 200),
        });
        const withDistance = (rows as SafeListing[]).map((r) => ({
            ...r,
            distanceKm: ListingService.distanceKm(latitude, longitude, Number(r.latitude), Number(r.longitude)),
        }));
        withDistance.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
        const data = withDistance.slice(0, limit);
        return {
            data,
            meta: buildPagination(data.length, 1, limit),
        };
    }
}

export const listingService = new ListingService();

