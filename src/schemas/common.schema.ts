import type { FastifySchema } from "fastify";

// ============================================
// TYPES
// ============================================

export type JsonSchemaType = "string" | "number" | "integer" | "boolean" | "object" | "array" | "null";

export interface SchemaProperty {
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
    minItems?: number;
    maxItems?: number;
    default?: unknown;
    nullable?: boolean;
    additionalProperties?: boolean;
    $ref?: string;
}

export interface ObjectSchema {
    type: "object";
    required?: string[];
    properties: Record<string, SchemaProperty>;
    additionalProperties?: boolean;
}

export interface RouteSchemaOptions {
    description: string;
    tags: string[];
    summary?: string;
    security?: Array<Record<string, string[]>>;
    params?: ObjectSchema;
    querystring?: ObjectSchema;
    body?: ObjectSchema;
    response?: Record<number, ObjectSchema>;
}

// ============================================
// ENUMS
// ============================================

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

// ============================================
// PRE-BUILT ERROR RESPONSES
// ============================================

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
// SCHEMA BUILDER HELPER
// ============================================

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
