import type { FastifySchema } from "fastify";

type JsonSchemaType = "string" | "number" | "integer" | "boolean" | "object" | "array" | "null";

interface SchemaProperty {
    type: JsonSchemaType | JsonSchemaType[];
    description?: string;
    example?: unknown;
    format?: string;
    enum?: readonly string[] | string[];
    items?: SchemaProperty | { $ref: string };
    properties?: Record<string, SchemaProperty>;
    required?: string[];
    minimum?: number;
    maximum?: number;
    minLength?: number;
    maxLength?: number;
    default?: unknown;
    nullable?: boolean;
    $ref?: string;
}

interface ObjectSchema {
    type: "object";
    required?: string[];
    properties: Record<string, SchemaProperty>;
    additionalProperties?: boolean;
}

// ============================================
// ENUMS
// ============================================

export const UserRoleEnum = ["BUYER", "OWNER", "AGENT", "BUILDER", "ADMIN"] as const;
export const SortOrderEnum = ["asc", "desc"] as const;

// ============================================
// COMMON PARAMS
// ============================================

export const IdParam: ObjectSchema = {
    type: "object",
    required: ["id"],
    properties: {
        id: { type: "string", description: "Resource ID (MongoDB ObjectId)" },
    },
};

export const SlugParam: ObjectSchema = {
    type: "object",
    required: ["slug"],
    properties: {
        slug: { type: "string", description: "URL-friendly slug" },
    },
};

// ============================================
// PAGINATION
// ============================================

export const PaginationQuery: ObjectSchema = {
    type: "object",
    properties: {
        page: { type: "integer", minimum: 1, default: 1, description: "Page number" },
        limit: { type: "integer", minimum: 1, maximum: 100, default: 10, description: "Items per page" },
        sortOrder: { type: "string", enum: [...SortOrderEnum], default: "desc", description: "Sort order" },
    },
};

export const PaginationMeta: ObjectSchema = {
    type: "object",
    properties: {
        total: { type: "integer", example: 100 },
        page: { type: "integer", example: 1 },
        limit: { type: "integer", example: 10 },
        totalPages: { type: "integer", example: 10 },
        hasNext: { type: "boolean", example: true },
        hasPrev: { type: "boolean", example: false },
    },
};

// ============================================
// RESPONSE BUILDERS
// ============================================

export function successResponse(dataSchema?: SchemaProperty | ObjectSchema, message = "Success"): ObjectSchema {
    return {
        type: "object",
        properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: message },
            statusCode: { type: "integer", example: 200 },
            requestId: { type: "string", example: "req-123" },
            ...(dataSchema && { data: dataSchema as SchemaProperty }),
        },
    };
}

export function createdResponse(dataSchema?: SchemaProperty | ObjectSchema, message = "Created successfully"): ObjectSchema {
    return {
        type: "object",
        properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: message },
            statusCode: { type: "integer", example: 201 },
            requestId: { type: "string", example: "req-123" },
            ...(dataSchema && { data: dataSchema as SchemaProperty }),
        },
    };
}

export function paginatedResponse(itemSchema: SchemaProperty | ObjectSchema, message = "Success"): ObjectSchema {
    return {
        type: "object",
        properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: message },
            statusCode: { type: "integer", example: 200 },
            requestId: { type: "string", example: "req-123" },
            data: {
                type: "object",
                properties: {
                    data: { type: "array", items: itemSchema as SchemaProperty },
                    meta: PaginationMeta.properties as unknown as SchemaProperty,
                },
            },
        },
    };
}

export function errorResponse(statusCode: number, message: string): ObjectSchema {
    return {
        type: "object",
        properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: message },
            statusCode: { type: "integer", example: statusCode },
            requestId: { type: "string", example: "req-123" },
        },
    };
}

export function validationErrorResponse(message = "Validation failed"): ObjectSchema {
    return {
        type: "object",
        properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: message },
            statusCode: { type: "integer", example: 400 },
            requestId: { type: "string", example: "req-123" },
            errors: {
                type: "array",
                items: {
                    type: "object",
                    properties: {
                        field: { type: "string", example: "email", description: "Field that failed validation" },
                        message: { type: "string", example: "must be a valid email", description: "Validation error message" },
                        value: { type: "string", example: "invalid-email", description: "The invalid value provided" },
                        constraint: { type: "string", example: "format", description: "The constraint that was violated" },
                    },
                },
                example: [
                    { field: "email", message: "must be a valid email", value: "invalid-email", constraint: "format" },
                    { field: "password", message: "must be at least 6 characters", constraint: "minLength" },
                ],
            },
        },
    };
}

// Pre-built error responses
export const ErrorResponses = {
    BadRequest: errorResponse(400, "Bad Request"),
    Unauthorized: errorResponse(401, "Unauthorized"),
    Forbidden: errorResponse(403, "Forbidden"),
    NotFound: errorResponse(404, "Not Found"),
    Conflict: errorResponse(409, "Resource already exists"),
    UnprocessableEntity: errorResponse(422, "Unprocessable Entity"),
    TooManyRequests: errorResponse(429, "Too Many Requests"),
    InternalServerError: errorResponse(500, "Internal Server Error"),
    ValidationError: validationErrorResponse("Validation failed"),
};

// ============================================
// MODEL SCHEMAS
// ============================================

export const UserSchema: ObjectSchema = {
    type: "object",
    properties: {
        id: { type: "string", example: "507f1f77bcf86cd799439011" },
        name: { type: "string", example: "John Doe" },
        email: { type: "string", format: "email", example: "john@example.com" },
        phone: { type: "string", example: "9876543210" },
        role: { type: "string", enum: [...UserRoleEnum], example: "BUYER" },
        isVerified: { type: "boolean", example: false },
        isBlocked: { type: "boolean", example: false },
        avatar: { type: "string", format: "uri", nullable: true },
        lastLogin: { type: "string", format: "date-time", nullable: true },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

export const ProfileSchema: ObjectSchema = {
    type: "object",
    properties: {
        id: { type: "string", example: "507f1f77bcf86cd799439012" },
        userId: { type: "string", example: "507f1f77bcf86cd799439011" },
        bio: { type: "string", nullable: true },
        companyName: { type: "string", nullable: true },
        designation: { type: "string", nullable: true },
        experienceYears: { type: "integer", nullable: true },
        reraNumber: { type: "string", nullable: true },
        gstNumber: { type: "string", nullable: true },
        address: { type: "string", nullable: true },
        city: { type: "string", nullable: true },
        state: { type: "string", nullable: true },
        pincode: { type: "string", nullable: true },
        website: { type: "string", format: "uri", nullable: true },
        facebookUrl: { type: "string", format: "uri", nullable: true },
        linkedinUrl: { type: "string", format: "uri", nullable: true },
        isReraVerified: { type: "boolean", example: false },
        isCompanyVerified: { type: "boolean", example: false },
        rating: { type: "number", example: 4.5 },
        totalReviews: { type: "integer", example: 10 },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

export const UserStatsSchema: ObjectSchema = {
    type: "object",
    properties: {
        total: { type: "integer", example: 1000 },
        verified: { type: "integer", example: 800 },
        blocked: { type: "integer", example: 50 },
        byRole: {
            type: "object",
            properties: {
                BUYER: { type: "integer", example: 500 },
                OWNER: { type: "integer", example: 200 },
                AGENT: { type: "integer", example: 150 },
                BUILDER: { type: "integer", example: 100 },
                ADMIN: { type: "integer", example: 50 },
            },
        },
    },
};

// ============================================
// REQUEST BODY SCHEMAS
// ============================================

export const CreateUserBody: ObjectSchema = {
    type: "object",
    required: ["name", "email", "phone"],
    properties: {
        name: { type: "string", minLength: 2, maxLength: 100, description: "Full name" },
        email: { type: "string", format: "email", description: "Email address" },
        phone: { type: "string", minLength: 10, maxLength: 15, description: "Phone number" },
        password: { type: "string", minLength: 6, description: "Password (optional for OAuth)" },
        role: { type: "string", enum: [...UserRoleEnum], default: "BUYER", description: "User role" },
        avatar: { type: "string", format: "uri", description: "Profile picture URL" },
    },
};

export const UpdateUserBody: ObjectSchema = {
    type: "object",
    properties: {
        name: { type: "string", minLength: 2, maxLength: 100, description: "Full name" },
        email: { type: "string", format: "email", description: "Email address" },
        phone: { type: "string", minLength: 10, maxLength: 15, description: "Phone number" },
        avatar: { type: "string", format: "uri", description: "Profile picture URL" },
        role: { type: "string", enum: [...UserRoleEnum], description: "User role" },
    },
};

export const LoginBody: ObjectSchema = {
    type: "object",
    required: ["identifier", "password"],
    properties: {
        identifier: { type: "string", description: "Email or phone number" },
        password: { type: "string", minLength: 1, description: "Account password" },
    },
};

export const UpdatePasswordBody: ObjectSchema = {
    type: "object",
    required: ["currentPassword", "newPassword"],
    properties: {
        currentPassword: { type: "string", minLength: 1, description: "Current password" },
        newPassword: { type: "string", minLength: 6, description: "New password" },
    },
};

export const UpdateRoleBody: ObjectSchema = {
    type: "object",
    required: ["role"],
    properties: {
        role: { type: "string", enum: [...UserRoleEnum], description: "New user role" },
    },
};

export const UpdateProfileBody: ObjectSchema = {
    type: "object",
    properties: {
        bio: { type: "string", maxLength: 500, description: "Short biography" },
        companyName: { type: "string", maxLength: 100, description: "Company name" },
        designation: { type: "string", maxLength: 50, description: "Job title" },
        experienceYears: { type: "integer", minimum: 0, maximum: 50, description: "Years of experience" },
        reraNumber: { type: "string", description: "RERA registration number" },
        gstNumber: { type: "string", description: "GST number" },
        address: { type: "string", maxLength: 200, description: "Office address" },
        city: { type: "string", maxLength: 50, description: "City" },
        state: { type: "string", maxLength: 50, description: "State" },
        pincode: { type: "string", maxLength: 10, description: "PIN code" },
        website: { type: "string", format: "uri", description: "Website URL" },
        facebookUrl: { type: "string", format: "uri", description: "Facebook profile" },
        linkedinUrl: { type: "string", format: "uri", description: "LinkedIn profile" },
    },
};

// ============================================
// QUERY SCHEMAS
// ============================================

export const UserListQuery: ObjectSchema = {
    type: "object",
    properties: {
        ...PaginationQuery.properties,
        search: { type: "string", description: "Search by name, email, or phone" },
        role: { type: "string", enum: [...UserRoleEnum], description: "Filter by role" },
        isVerified: { type: "boolean", description: "Filter by verification status" },
        isBlocked: { type: "boolean", description: "Filter by blocked status" },
        sortBy: { type: "string", default: "createdAt", description: "Field to sort by" },
    },
};

export const ExistsQuery: ObjectSchema = {
    type: "object",
    properties: {
        email: { type: "string", format: "email", description: "Email to check" },
        phone: { type: "string", description: "Phone to check" },
    },
};

// ============================================
// SCHEMA BUILDER HELPER
// ============================================

interface RouteSchemaOptions {
    description: string;
    tags: string[];
    summary?: string;
    security?: Array<Record<string, string[]>>;
    params?: ObjectSchema;
    querystring?: ObjectSchema;
    body?: ObjectSchema;
    response?: Record<number, ObjectSchema>;
}

export function buildSchema(options: RouteSchemaOptions): FastifySchema {
    return {
        description: options.description,
        tags: options.tags,
        summary: options.summary,
        security: options.security,
        params: options.params,
        querystring: options.querystring,
        body: options.body,
        response: options.response,
    } as FastifySchema;
}

// ============================================
// PRE-BUILT ROUTE SCHEMAS
// ============================================

export const UserRouteSchemas = {
    register: buildSchema({
        description: "Register a new user account",
        tags: ["Auth"],
        body: CreateUserBody,
        response: {
            201: createdResponse(UserSchema, "User registered successfully"),
            400: ErrorResponses.ValidationError,
            409: ErrorResponses.Conflict,
        },
    }),

    login: buildSchema({
        description: "Login with email/phone and password",
        tags: ["Auth"],
        body: LoginBody,
        response: {
            200: successResponse(UserSchema, "Login successful"),
            400: ErrorResponses.ValidationError,
            401: ErrorResponses.Unauthorized,
            403: ErrorResponses.Forbidden,
        },
    }),

    getMe: buildSchema({
        description: "Get current authenticated user profile",
        tags: ["Users"],
        security: [{ bearerAuth: [] }],
        response: {
            200: successResponse(UserSchema, "Profile retrieved successfully"),
            401: ErrorResponses.Unauthorized,
        },
    }),

    list: buildSchema({
        description: "List users with pagination and filters",
        tags: ["Users"],
        querystring: UserListQuery,
        response: {
            200: paginatedResponse(UserSchema, "Users retrieved successfully"),
            400: ErrorResponses.ValidationError,
        },
    }),

    getById: buildSchema({
        description: "Get user by ID",
        tags: ["Users"],
        params: IdParam,
        querystring: {
            type: "object",
            properties: {
                includeProfile: { type: "boolean", default: false, description: "Include profile data" },
            },
        },
        response: {
            200: successResponse(UserSchema, "User retrieved successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),

    update: buildSchema({
        description: "Update user details",
        tags: ["Users"],
        params: IdParam,
        body: UpdateUserBody,
        response: {
            200: successResponse(UserSchema, "User updated successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
            409: ErrorResponses.Conflict,
        },
    }),

    delete: buildSchema({
        description: "Delete user by ID",
        tags: ["Users"],
        params: IdParam,
        response: {
            200: successResponse(undefined, "User deleted successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    updatePassword: buildSchema({
        description: "Update user password",
        tags: ["Users"],
        params: IdParam,
        body: UpdatePasswordBody,
        response: {
            200: successResponse(undefined, "Password updated successfully"),
            400: ErrorResponses.ValidationError,
            401: ErrorResponses.Unauthorized,
            404: ErrorResponses.NotFound,
        },
    }),

    block: buildSchema({
        description: "Block a user",
        tags: ["Users", "Admin"],
        params: IdParam,
        response: {
            200: successResponse(UserSchema, "User blocked successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    unblock: buildSchema({
        description: "Unblock a user",
        tags: ["Users", "Admin"],
        params: IdParam,
        response: {
            200: successResponse(UserSchema, "User unblocked successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    verify: buildSchema({
        description: "Verify a user",
        tags: ["Users", "Admin"],
        params: IdParam,
        response: {
            200: successResponse(UserSchema, "User verified successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    updateRole: buildSchema({
        description: "Update user role",
        tags: ["Users", "Admin"],
        params: IdParam,
        body: UpdateRoleBody,
        response: {
            200: successResponse(UserSchema, "User role updated successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),

    getProfile: buildSchema({
        description: "Get user profile",
        tags: ["Users", "Profile"],
        params: IdParam,
        response: {
            200: successResponse(ProfileSchema, "Profile retrieved successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    upsertProfile: buildSchema({
        description: "Create or update user profile",
        tags: ["Users", "Profile"],
        params: IdParam,
        body: UpdateProfileBody,
        response: {
            200: successResponse(ProfileSchema, "Profile updated successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),

    getStats: buildSchema({
        description: "Get user statistics grouped by role",
        tags: ["Users"],
        response: {
            200: successResponse(UserStatsSchema, "User statistics retrieved successfully"),
        },
    }),

    checkExists: buildSchema({
        description: "Check if user exists by email or phone",
        tags: ["Users"],
        querystring: ExistsQuery,
        response: {
            200: successResponse({
                type: "object",
                properties: {
                    exists: { type: "boolean" },
                },
            }, "Check completed"),
            400: ErrorResponses.ValidationError,
        },
    }),
};
