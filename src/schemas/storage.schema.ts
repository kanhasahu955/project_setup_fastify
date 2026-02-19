import {
    type ObjectSchema,
    ErrorResponses,
    successResponse,
    buildSchema,
} from "./common.schema";

// ============================================
// ENUMS
// ============================================

export const StorageFolderEnum = ["documents", "avatars", "properties", "projects", "misc"] as const;

// ============================================
// MODEL SCHEMAS
// ============================================

export const UploadResultSchema: ObjectSchema = {
    type: "object",
    properties: {
        url: { type: "string", format: "uri", example: "https://storage.googleapis.com/bucket/file.jpg" },
        path: { type: "string", example: "documents/file-123456.jpg" },
        fileName: { type: "string", example: "file-123456.jpg" },
        contentType: { type: "string", example: "image/jpeg" },
        size: { type: "integer", example: 102400 },
        bucket: { type: "string", example: "my-bucket" },
        metadata: {
            type: "object",
            properties: {},
            additionalProperties: true,
        },
    },
};

export const FileInfoSchema: ObjectSchema = {
    type: "object",
    properties: {
        name: { type: "string", example: "document.pdf" },
        path: { type: "string", example: "documents/document.pdf" },
        url: { type: "string", format: "uri" },
        contentType: { type: "string", example: "application/pdf" },
        size: { type: "integer", example: 102400 },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
        metadata: {
            type: "object",
            properties: {},
            additionalProperties: true,
        },
    },
};

export const BulkUploadResultSchema: ObjectSchema = {
    type: "object",
    properties: {
        successful: {
            type: "array",
            items: UploadResultSchema,
        },
        failed: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    fileName: { type: "string" },
                    error: { type: "string" },
                },
            },
        },
    },
};

export const DeleteResultSchema: ObjectSchema = {
    type: "object",
    properties: {
        success: { type: "boolean", example: true },
        path: { type: "string", example: "documents/file.pdf" },
    },
};

// ============================================
// QUERY SCHEMAS
// ============================================

export const UploadQuery: ObjectSchema = {
    type: "object",
    properties: {
        folder: {
            type: "string",
            enum: [...StorageFolderEnum],
            default: "misc",
            description: "Target folder for upload",
        },
        makePublic: {
            type: "boolean",
            default: true,
            description: "Make file publicly accessible",
        },
    },
};

export const ListFilesQuery: ObjectSchema = {
    type: "object",
    properties: {
        folder: {
            type: "string",
            enum: [...StorageFolderEnum],
            default: "misc",
            description: "Folder to list files from",
        },
        maxResults: {
            type: "integer",
            minimum: 1,
            maximum: 1000,
            default: 100,
            description: "Maximum number of files to return",
        },
    },
};

export const FilePathQuery: ObjectSchema = {
    type: "object",
    required: ["path"],
    properties: {
        path: { type: "string", description: "File path in storage" },
    },
};

export const SignedUrlQuery: ObjectSchema = {
    type: "object",
    required: ["path"],
    properties: {
        path: { type: "string", description: "File path in storage" },
        expiresIn: {
            type: "integer",
            minimum: 1,
            maximum: 10080,
            default: 60,
            description: "URL expiration time in minutes",
        },
    },
};

// ============================================
// REQUEST BODY SCHEMAS
// ============================================

export const DeleteFilesBody: ObjectSchema = {
    type: "object",
    required: ["paths"],
    properties: {
        paths: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            description: "Array of file paths to delete",
        },
    },
};

export const CopyMoveBody: ObjectSchema = {
    type: "object",
    required: ["sourcePath", "destinationPath"],
    properties: {
        sourcePath: { type: "string", description: "Source file path" },
        destinationPath: { type: "string", description: "Destination file path" },
    },
};

// ============================================
// ROUTE SCHEMAS
// ============================================

export const StorageRouteSchemas = {
    upload: buildSchema({
        description: "Upload a single file to Firebase Storage",
        tags: ["Storage"],
        querystring: UploadQuery,
        response: {
            201: successResponse(UploadResultSchema, "File uploaded successfully"),
            400: ErrorResponses.ValidationError,
            500: ErrorResponses.InternalServerError,
        },
    }),

    uploadMultiple: buildSchema({
        description: "Upload multiple files to Firebase Storage",
        tags: ["Storage"],
        querystring: UploadQuery,
        response: {
            200: successResponse(BulkUploadResultSchema, "Files upload completed"),
            400: ErrorResponses.ValidationError,
            500: ErrorResponses.InternalServerError,
        },
    }),

    delete: buildSchema({
        description: "Delete a file from storage",
        tags: ["Storage"],
        querystring: FilePathQuery,
        response: {
            200: successResponse(DeleteResultSchema, "File deleted successfully"),
            400: ErrorResponses.ValidationError,
            404: ErrorResponses.NotFound,
        },
    }),

    deleteMultiple: buildSchema({
        description: "Delete multiple files from storage",
        tags: ["Storage"],
        body: DeleteFilesBody,
        response: {
            200: successResponse({
                type: "array",
                items: DeleteResultSchema,
            }, "Files deleted"),
            400: ErrorResponses.ValidationError,
        },
    }),

    getInfo: buildSchema({
        description: "Get file information",
        tags: ["Storage"],
        querystring: FilePathQuery,
        response: {
            200: successResponse(FileInfoSchema, "File info retrieved"),
            404: ErrorResponses.NotFound,
        },
    }),

    list: buildSchema({
        description: "List files in a folder",
        tags: ["Storage"],
        querystring: ListFilesQuery,
        response: {
            200: successResponse({
                type: "array",
                items: FileInfoSchema,
            }, "Files listed successfully"),
            400: ErrorResponses.ValidationError,
        },
    }),

    getSignedUrl: buildSchema({
        description: "Get a signed URL for private file access",
        tags: ["Storage"],
        querystring: SignedUrlQuery,
        response: {
            200: successResponse({
                type: "object",
                properties: {
                    url: { type: "string", format: "uri" },
                    expiresAt: { type: "string", format: "date-time" },
                },
            }, "Signed URL generated"),
            404: ErrorResponses.NotFound,
        },
    }),

    copy: buildSchema({
        description: "Copy a file to a new location",
        tags: ["Storage"],
        body: CopyMoveBody,
        response: {
            200: successResponse(UploadResultSchema, "File copied successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    move: buildSchema({
        description: "Move a file to a new location",
        tags: ["Storage"],
        body: CopyMoveBody,
        response: {
            200: successResponse(UploadResultSchema, "File moved successfully"),
            404: ErrorResponses.NotFound,
        },
    }),
};
