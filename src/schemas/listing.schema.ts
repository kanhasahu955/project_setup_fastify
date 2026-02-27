import {
    type ObjectSchema,
    IdParam,
    PaginationQuery,
    ErrorResponses,
    successResponse,
    paginatedResponse,
    buildSchema,
} from "./common.schema";

// ============================================
// ENUMS
// ============================================

export const ListingTypeEnum = ["SALE", "RENT", "LEASE"] as const;
export const ListingStatusEnum = [
    "DRAFT",
    "PENDING_APPROVAL",
    "ACTIVE",
    "UNDER_REVIEW",
    "SOLD",
    "RENTED",
    "EXPIRED",
    "REJECTED",
    "BLOCKED",
    "ARCHIVED",
] as const;

export const PropertyTypeEnum = [
    "APARTMENT",
    "INDEPENDENT_HOUSE",
    "VILLA",
    "STUDIO_APARTMENT",
    "PENTHOUSE",
    "BUILDER_FLOOR",
    "OFFICE_SPACE",
    "SHOP",
    "SHOWROOM",
    "WAREHOUSE",
    "INDUSTRIAL_BUILDING",
    "CO_WORKING",
    "RESIDENTIAL_PLOT",
    "COMMERCIAL_PLOT",
    "AGRICULTURAL_LAND",
    "PG",
    "HOSTEL",
] as const;

export const PropertyConditionEnum = ["NEW", "RESALE", "UNDER_CONSTRUCTION", "READY_TO_MOVE"] as const;
export const FurnishingTypeEnum = ["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"] as const;

// ============================================
// MODEL SCHEMAS
// ============================================

export const ListingImageSchema: ObjectSchema = {
    type: "object",
    properties: {
        id: { type: "string" },
        listingId: { type: "string" },
        url: { type: "string", format: "uri" },
        isPrimary: { type: "boolean" },
        order: { type: "integer" },
        createdAt: { type: "string", format: "date-time" },
    },
};

export const ListingSchema: ObjectSchema = {
    type: "object",
    properties: {
        id: { type: "string", example: "507f1f77bcf86cd799439021" },
        title: { type: "string", example: "3 BHK Apartment in Bangalore" },
        slug: { type: "string", example: "3-bhk-apartment-in-bangalore-1234567890" },
        description: { type: "string" },
        price: { type: "number", example: 7500000 },
        pricePerSqft: { type: "number", nullable: true },
        listingType: { type: "string", enum: [...ListingTypeEnum] },
        propertyType: { type: "string", example: "APARTMENT" },
        condition: { type: "string", nullable: true },
        status: { type: "string", enum: [...ListingStatusEnum] },
        bedrooms: { type: "integer", nullable: true },
        bathrooms: { type: "integer", nullable: true },
        balconies: { type: "integer", nullable: true },
        floor: { type: "integer", nullable: true },
        totalFloors: { type: "integer", nullable: true },
        area: { type: "number", nullable: true },
        carpetArea: { type: "number", nullable: true },
        builtUpArea: { type: "number", nullable: true },
        furnishing: { type: "string", nullable: true },
        facing: { type: "string", nullable: true },
        city: { type: "string" },
        locality: { type: "string" },
        state: { type: "string" },
        pincode: { type: "string", nullable: true },
        latitude: { type: "number" },
        longitude: { type: "number" },
        isVerified: { type: "boolean" },
        isFeatured: { type: "boolean" },
        boostExpiry: { type: "string", format: "date-time", nullable: true },
        expiryDate: { type: "string", format: "date-time", nullable: true },
        views: { type: "integer" },
        clicks: { type: "integer" },
        ownerId: { type: "string" },
        projectId: { type: "string", nullable: true },
        images: {
            type: "array",
            items: ListingImageSchema as any,
        },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

export const ListingStatsSchema: ObjectSchema = {
    type: "object",
    properties: {
        total: { type: "integer", example: 100 },
        active: { type: "integer", example: 60 },
        pending: { type: "integer", example: 20 },
        sold: { type: "integer", example: 10 },
        rented: { type: "integer", example: 10 },
    },
};

// ============================================
// QUERY SCHEMAS
// ============================================

export const ListingListQuery: ObjectSchema = {
    type: "object",
    properties: {
        ...PaginationQuery.properties,
        search: { type: "string", description: "Search in title/city/locality" },
        city: { type: "string" },
        locality: { type: "string" },
        listingType: { type: "string", enum: [...ListingTypeEnum] },
        propertyType: { type: "string" },
        status: { type: "string", enum: [...ListingStatusEnum] },
        minPrice: { type: "number" },
        maxPrice: { type: "number" },
        bedrooms: { type: "integer" },
        ownerId: { type: "string" },
        projectId: { type: "string" },
        isFeatured: { type: "boolean" },
        isVerified: { type: "boolean" },
        sortBy: { type: "string", description: "Sort field", example: "createdAt" },
    },
};

// ============================================
// BODY SCHEMAS
// ============================================

export const CreateListingBody: ObjectSchema = {
    type: "object",
    required: ["title", "description", "price", "listingType", "propertyType", "city", "locality", "state", "latitude", "longitude"],
    properties: {
        title: { type: "string" },
        description: { type: "string" },
        price: { type: "number" },
        pricePerSqft: { type: "number" },
        listingType: { type: "string", enum: [...ListingTypeEnum] },
        propertyType: { type: "string", enum: [...PropertyTypeEnum], description: "e.g. APARTMENT, VILLA, INDEPENDENT_HOUSE" },
        condition: { type: "string", enum: [...PropertyConditionEnum] },
        bedrooms: { type: "integer" },
        bathrooms: { type: "integer" },
        balconies: { type: "integer" },
        floor: { type: "integer" },
        totalFloors: { type: "integer" },
        area: { type: "number" },
        carpetArea: { type: "number" },
        builtUpArea: { type: "number" },
        furnishing: { type: "string", enum: [...FurnishingTypeEnum] },
        facing: { type: "string" },
        city: { type: "string" },
        locality: { type: "string" },
        state: { type: "string" },
        pincode: { type: "string" },
        latitude: { type: "number" },
        longitude: { type: "number" },
        projectId: { type: "string" },
        amenityIds: {
            type: "array",
            items: { type: "string" },
        },
        images: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    url: { type: "string", description: "Image URL (e.g. from ImageKit)" },
                    isPrimary: { type: "boolean" },
                    order: { type: "integer" },
                },
            },
        },
    },
};

export const UpdateListingBody: ObjectSchema = {
    type: "object",
    properties: {
        ...CreateListingBody.properties,
        status: { type: "string", enum: [...ListingStatusEnum] },
        isFeatured: { type: "boolean" },
        isVerified: { type: "boolean" },
    },
};

// ============================================
// ROUTE SCHEMAS
// ============================================

export const ListingRouteSchemas = {
    list: buildSchema({
        description: "List listings with pagination and filters",
        tags: ["Listings"],
        querystring: ListingListQuery,
        response: {
            200: paginatedResponse(ListingSchema, "Listings retrieved successfully"),
            400: ErrorResponses.ValidationError,
        },
    }),

    stats: buildSchema({
        description: "Get listing statistics",
        tags: ["Listings"],
        response: {
            200: successResponse(ListingStatsSchema, "Listing statistics retrieved successfully"),
        },
    }),

    nearby: buildSchema({
        description: "Listings near a point (latitude, longitude). Optional radiusKm (default 10), limit (default 20).",
        tags: ["Listings"],
        querystring: {
            type: "object",
            required: ["latitude", "longitude"],
            properties: {
                latitude: { type: "string", description: "Latitude" },
                longitude: { type: "string", description: "Longitude" },
                radiusKm: { type: "string", description: "Radius in km (default 10)" },
                limit: { type: "string", description: "Max results (default 20)" },
            },
        },
        response: {
            200: paginatedResponse(ListingSchema, "Nearby listings"),
            400: ErrorResponses.ValidationError,
        },
    }),

    getById: buildSchema({
        description: "Get listing by ID",
        tags: ["Listings"],
        params: IdParam,
        response: {
            200: successResponse(ListingSchema, "Listing retrieved successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),

    create: buildSchema({
        description: "Create a new listing (owner must be authenticated)",
        tags: ["Listings"],
        security: [{ bearerAuth: [] }],
        body: CreateListingBody,
        response: {
            201: successResponse(ListingSchema, "Listing created successfully"),
            400: ErrorResponses.ValidationError,
            401: ErrorResponses.Unauthorized,
        },
    }),

    update: buildSchema({
        description: "Update an existing listing",
        tags: ["Listings"],
        params: IdParam,
        body: UpdateListingBody,
        response: {
            200: successResponse(ListingSchema, "Listing updated successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),

    delete: buildSchema({
        description: "Soft delete a listing",
        tags: ["Listings"],
        params: IdParam,
        response: {
            200: successResponse(undefined, "Listing deleted successfully"),
            404: ErrorResponses.NotFound,
        },
    }),
};

