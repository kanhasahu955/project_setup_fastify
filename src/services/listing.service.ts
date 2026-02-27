import prisma from "@/config/prisma.config";
import { env } from "@/config/env.config";
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
        const opts = options ?? {};
        const page = opts.page && opts.page > 0 ? opts.page : 1;
        const limit = opts.limit && opts.limit > 0 ? opts.limit : 10;
        const skip = (page - 1) * limit;
        const sortBy = opts.sortBy || "createdAt";
        const sortOrder = opts.sortOrder || "desc";

        // Only add optional filters when explicitly set (avoid empty string / undefined excluding rows)
        const where: any = { deletedAt: null };
        if (opts.search != null && opts.search !== "") {
            where.OR = [
                { title: { contains: opts.search, mode: "insensitive" } },
                { city: { contains: opts.search, mode: "insensitive" } },
                { locality: { contains: opts.search, mode: "insensitive" } },
            ];
        }
        if (opts.city != null && opts.city !== "") where.city = opts.city;
        if (opts.locality != null && opts.locality !== "") where.locality = opts.locality;
        if (opts.listingType != null) where.listingType = opts.listingType;
        if (opts.propertyType != null) where.propertyType = opts.propertyType;
        if (opts.status != null) where.status = opts.status;
        if (opts.minPrice != null) where.price = { ...(where.price || {}), gte: opts.minPrice };
        if (opts.maxPrice != null) where.price = { ...(where.price || {}), lte: opts.maxPrice };
        if (opts.bedrooms != null) where.bedrooms = opts.bedrooms;
        if (opts.ownerId != null && opts.ownerId !== "") where.ownerId = opts.ownerId;
        if (opts.projectId != null && opts.projectId !== "") where.projectId = opts.projectId;
        if (opts.isFeatured != null) where.isFeatured = opts.isFeatured;
        if (opts.isVerified != null) where.isVerified = opts.isVerified;

        const orderBy: any = { [sortBy]: sortOrder };

        // MongoDB: { deletedAt: null } does not match documents where the field is missing.
        // Use raw aggregation to match "deletedAt is null OR deletedAt does not exist", then load full docs.
        // Skip raw path when search is used (where.OR uses Prisma filter shape, not MongoDB).
        if (env.DATABASE_TYPE === "mongodb" && !where.OR) {
            const deletedOr = { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] };
            const clauses: object[] = [deletedOr];
            if (where.city != null) clauses.push({ city: where.city });
            if (where.locality != null) clauses.push({ locality: where.locality });
            if (where.listingType != null) clauses.push({ listingType: where.listingType });
            if (where.propertyType != null) clauses.push({ propertyType: where.propertyType });
            if (where.status != null) clauses.push({ status: where.status });
            if (where.ownerId != null) clauses.push({ ownerId: where.ownerId });
            if (where.projectId != null) clauses.push({ projectId: where.projectId });
            if (where.bedrooms != null) clauses.push({ bedrooms: where.bedrooms });
            if (where.isFeatured != null) clauses.push({ isFeatured: where.isFeatured });
            if (where.isVerified != null) clauses.push({ isVerified: where.isVerified });
            if (where.price && (where.price.gte != null || where.price.lte != null)) {
                const priceCond: Record<string, number> = {};
                if (where.price.gte != null) priceCond.$gte = where.price.gte;
                if (where.price.lte != null) priceCond.$lte = where.price.lte;
                clauses.push({ price: priceCond });
            }
            const mongoMatch = clauses.length === 1 ? deletedOr : { $and: clauses };
            const sortDir = sortOrder === "asc" ? 1 : -1;
            const pipeline: object[] = [
                { $match: mongoMatch },
                { $sort: { [sortBy]: sortDir } },
                { $skip: skip },
                { $limit: limit },
                { $project: { _id: 1 } },
            ];
            const rawResult = (await prisma.listing.aggregateRaw({ pipeline })) as { _id: { $oid: string } }[] | unknown;
            const list = Array.isArray(rawResult) ? rawResult : [];
            const ids = list.map((d) => (d as { _id: { $oid: string } })._id?.$oid ?? (d as any)._id?.toString()).filter(Boolean);
            if (ids.length === 0) {
                const countResult = (await prisma.listing.aggregateRaw({
                    pipeline: [{ $match: mongoMatch }, { $count: "n" }],
                })) as { n: number }[];
                const total = countResult[0]?.n ?? 0;
                return { data: [], meta: buildPagination(total, page, limit) };
            }
            const rows = await prisma.listing.findMany({
                where: { id: { in: ids } },
                include: this.baseInclude,
            });
            const orderMap = new Map(ids.map((id, i) => [id, i]));
            (rows as SafeListing[]).sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
            const countResult = (await prisma.listing.aggregateRaw({
                pipeline: [{ $match: mongoMatch }, { $count: "n" }],
            })) as { n: number }[];
            const total = countResult[0]?.n ?? 0;
            return { data: rows as SafeListing[], meta: buildPagination(total, page, limit) };
        }

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
        if (env.DATABASE_TYPE === "mongodb") {
            // MongoDB: deletedAt: null doesn't match documents where the field is missing
            const listing = await prisma.listing.findFirst({
                where: { id },
                include: this.baseInclude,
            });
            if (!listing) return null;
            const deletedAt = (listing as any).deletedAt;
            if (deletedAt instanceof Date) return null;
            return listing as SafeListing | null;
        }
        const listing = await prisma.listing.findFirst({
            where: { id, deletedAt: null },
            include: this.baseInclude,
        });
        return listing as SafeListing | null;
    }

    /** Keys allowed on Prisma Listing create (excludes relations and client-only fields like __typename). */
    private static readonly LISTING_CREATE_KEYS = [
        "title", "description", "price", "pricePerSqft", "listingType", "propertyType", "condition",
        "bedrooms", "bathrooms", "balconies", "floor", "totalFloors", "area", "carpetArea", "builtUpArea",
        "furnishing", "facing", "city", "locality", "state", "pincode", "latitude", "longitude", "projectId",
    ] as const;

    private static readonly LISTING_NUMERIC_KEYS = new Set([
        "price", "pricePerSqft", "bedrooms", "bathrooms", "balconies", "floor", "totalFloors",
        "area", "carpetArea", "builtUpArea", "latitude", "longitude",
    ]);

    async create(ownerId: string, input: CreateListingInput): Promise<SafeListing> {
        const { amenityIds, images, ...rest } = input;
        const raw: Record<string, unknown> = {};
        for (const key of ListingService.LISTING_CREATE_KEYS as readonly string[]) {
            if (!(key in rest)) continue;
            let value = (rest as any)[key];
            if (value === undefined) continue;
            if (ListingService.LISTING_NUMERIC_KEYS.has(key) && typeof value === "string") {
                const n = Number(value);
                if (Number.isFinite(n)) value = n;
            }
            if (key === "projectId" && (value === "" || value === null)) continue;
            raw[key] = value;
        }

        const listing = await prisma.listing.create({
            data: {
                ...raw,
                slug: generateSlug(String(input.title)),
                ownerId,
                status: "DRAFT",
            },
            include: this.baseInclude,
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

        // Return the created listing with relations (from create include). If we need fresh images/amenities, refetch.
        if (images?.length || amenityIds?.length) {
            const fresh = await this.findById(listing.id);
            if (!fresh) throw new Error("Listing was created but could not be retrieved");
            return fresh as SafeListing;
        }
        return listing as SafeListing;
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

