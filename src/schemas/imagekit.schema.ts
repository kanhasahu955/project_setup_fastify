import {
    type ObjectSchema,
    ErrorResponses,
    successResponse,
    createdResponse,
    buildSchema,
} from "./common.schema";

// ============================================
// ENUMS
// ============================================

export const ImageKitFolderEnum = ["avatars", "properties", "projects", "banners", "misc"] as const;
export const ImageFormatEnum = ["auto", "webp", "jpg", "png", "avif"] as const;
export const ImageCropEnum = ["maintain_ratio", "force", "at_least", "at_max"] as const;
export const ImageFocusEnum = ["auto", "center", "top", "left", "bottom", "right", "top_left", "top_right", "bottom_left", "bottom_right", "face"] as const;
export const ImageSortEnum = ["ASC_UPDATED", "DESC_UPDATED", "ASC_CREATED", "DESC_CREATED", "ASC_SIZE", "DESC_SIZE", "ASC_NAME", "DESC_NAME"] as const;

// ============================================
// MODEL SCHEMAS
// ============================================

export const ImageUploadResultSchema: ObjectSchema = {
    type: "object",
    properties: {
        fileId: { type: "string", example: "629f3d5e7eb0f30028f4d5a1" },
        name: { type: "string", example: "image-1234567890.jpg" },
        url: { type: "string", format: "uri", example: "https://ik.imagekit.io/your_id/image.jpg" },
        thumbnailUrl: { type: "string", format: "uri" },
        filePath: { type: "string", example: "/avatars/image-1234567890.jpg" },
        fileType: { type: "string", example: "image" },
        size: { type: "integer", example: 102400 },
        width: { type: "integer", example: 1920 },
        height: { type: "integer", example: 1080 },
        tags: { type: "array", items: { type: "string" } },
    },
};

export const ImageFileDetailsSchema: ObjectSchema = {
    type: "object",
    properties: {
        fileId: { type: "string", example: "629f3d5e7eb0f30028f4d5a1" },
        name: { type: "string", example: "image.jpg" },
        filePath: { type: "string", example: "/avatars/image.jpg" },
        url: { type: "string", format: "uri" },
        fileType: { type: "string", example: "image" },
        size: { type: "integer", example: 102400 },
        width: { type: "integer", example: 1920 },
        height: { type: "integer", example: 1080 },
        tags: { type: "array", items: { type: "string" } },
        isPrivateFile: { type: "boolean", example: false },
        customMetadata: { type: "object", additionalProperties: true },
        createdAt: { type: "string", format: "date-time" },
        updatedAt: { type: "string", format: "date-time" },
    },
};

export const BulkImageUploadResultSchema: ObjectSchema = {
    type: "object",
    properties: {
        successful: { type: "array", items: ImageUploadResultSchema },
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

export const ImageDeleteResultSchema: ObjectSchema = {
    type: "object",
    properties: {
        success: { type: "boolean", example: true },
        fileId: { type: "string", example: "629f3d5e7eb0f30028f4d5a1" },
    },
};

export const AuthParamsSchema: ObjectSchema = {
    type: "object",
    properties: {
        token: { type: "string" },
        expire: { type: "integer" },
        signature: { type: "string" },
    },
};

// ============================================
// QUERY SCHEMAS
// ============================================

export const ImageUploadQuery: ObjectSchema = {
    type: "object",
    properties: {
        folder: {
            type: "string",
            enum: [...ImageKitFolderEnum],
            default: "misc",
            description: "Target folder for upload",
        },
        tags: {
            type: "string",
            description: "Comma-separated tags",
        },
        useUniqueFileName: {
            type: "boolean",
            default: true,
            description: "Generate unique filename",
        },
        isPrivateFile: {
            type: "boolean",
            default: false,
            description: "Make file private",
        },
    },
};

export const ImageListQuery: ObjectSchema = {
    type: "object",
    properties: {
        path: { type: "string", default: "/", description: "Folder path to list" },
        fileType: { type: "string", enum: ["image", "non-image", "all"], default: "image" },
        tags: { type: "string", description: "Comma-separated tags to filter" },
        limit: { type: "integer", minimum: 1, maximum: 1000, default: 100 },
        skip: { type: "integer", minimum: 0, default: 0 },
        sort: { type: "string", enum: [...ImageSortEnum], default: "DESC_CREATED" },
    },
};

export const ImageTransformQuery: ObjectSchema = {
    type: "object",
    required: ["filePath"],
    properties: {
        filePath: { type: "string", description: "File path in ImageKit" },
        width: { type: "integer", minimum: 1, maximum: 5000 },
        height: { type: "integer", minimum: 1, maximum: 5000 },
        quality: { type: "integer", minimum: 1, maximum: 100 },
        format: { type: "string", enum: [...ImageFormatEnum] },
        crop: { type: "string", enum: [...ImageCropEnum] },
        focus: { type: "string", enum: [...ImageFocusEnum] },
        blur: { type: "integer", minimum: 1, maximum: 100 },
        grayscale: { type: "boolean" },
        rotation: { type: "integer", minimum: 0, maximum: 360 },
    },
};

export const FileIdQuery: ObjectSchema = {
    type: "object",
    required: ["fileId"],
    properties: {
        fileId: { type: "string", description: "ImageKit file ID" },
    },
};

// ============================================
// REQUEST BODY SCHEMAS
// ============================================

export const UploadFromUrlBody: ObjectSchema = {
    type: "object",
    required: ["imageUrl"],
    properties: {
        imageUrl: { type: "string", format: "uri", description: "URL of the image to upload" },
        folder: { type: "string", enum: [...ImageKitFolderEnum], default: "misc" },
        fileName: { type: "string", description: "Custom filename" },
        tags: { type: "array", items: { type: "string" } },
    },
};

export const DeleteMultipleBody: ObjectSchema = {
    type: "object",
    required: ["fileIds"],
    properties: {
        fileIds: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            description: "Array of file IDs to delete",
        },
    },
};

export const CopyMoveImageBody: ObjectSchema = {
    type: "object",
    required: ["sourceFilePath", "destinationPath"],
    properties: {
        sourceFilePath: { type: "string", description: "Source file path" },
        destinationPath: { type: "string", description: "Destination folder path" },
    },
};

export const UpdateFileBody: ObjectSchema = {
    type: "object",
    properties: {
        tags: { type: "array", items: { type: "string" } },
        customMetadata: { type: "object", additionalProperties: true },
    },
};

export const CreateFolderBody: ObjectSchema = {
    type: "object",
    required: ["folderPath"],
    properties: {
        folderPath: { type: "string", description: "Full folder path to create" },
    },
};

// ============================================
// ROUTE SCHEMAS
// ============================================

export const ImageKitRouteSchemas = {
    upload: {
        description: "Upload a single image to ImageKit. Use 'file' as the field name.",
        tags: ["ImageKit"],
        querystring: ImageUploadQuery,
        body: {
            type: "object",
            properties: {
                file: { isFile: true },
            },
        },
        response: {
            201: createdResponse(ImageUploadResultSchema, "Image uploaded successfully"),
            400: ErrorResponses.ValidationError,
            500: ErrorResponses.InternalServerError,
        },
    },

    uploadMultiple: {
        description: "Upload multiple images to ImageKit. Use 'files' as the field name.",
        tags: ["ImageKit"],
        querystring: ImageUploadQuery,
        body: {
            type: "object",
            properties: {
                files: { isFile: true },
            },
        },
        response: {
            200: successResponse(BulkImageUploadResultSchema, "Images upload completed"),
            400: ErrorResponses.ValidationError,
            500: ErrorResponses.InternalServerError,
        },
    },

    uploadFromUrl: buildSchema({
        description: "Upload an image from URL to ImageKit",
        tags: ["ImageKit"],
        body: UploadFromUrlBody,
        response: {
            201: createdResponse(ImageUploadResultSchema, "Image uploaded successfully"),
            400: ErrorResponses.ValidationError,
            500: ErrorResponses.InternalServerError,
        },
    }),

    delete: buildSchema({
        description: "Delete an image from ImageKit",
        tags: ["ImageKit"],
        querystring: FileIdQuery,
        response: {
            200: successResponse(ImageDeleteResultSchema, "Image deleted successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    deleteMultiple: buildSchema({
        description: "Delete multiple images from ImageKit",
        tags: ["ImageKit"],
        body: DeleteMultipleBody,
        response: {
            200: successResponse({
                type: "array",
                items: ImageDeleteResultSchema,
            }, "Images deleted"),
            400: ErrorResponses.ValidationError,
        },
    }),

    getDetails: buildSchema({
        description: "Get image file details",
        tags: ["ImageKit"],
        querystring: FileIdQuery,
        response: {
            200: successResponse(ImageFileDetailsSchema, "File details retrieved"),
            404: ErrorResponses.NotFound,
        },
    }),

    list: buildSchema({
        description: "List images in ImageKit",
        tags: ["ImageKit"],
        querystring: ImageListQuery,
        response: {
            200: successResponse({
                type: "array",
                items: ImageFileDetailsSchema,
            }, "Images listed successfully"),
            400: ErrorResponses.ValidationError,
        },
    }),

    getTransformedUrl: buildSchema({
        description: "Get transformed image URL with optimizations",
        tags: ["ImageKit"],
        querystring: ImageTransformQuery,
        response: {
            200: successResponse({
                type: "object",
                properties: {
                    url: { type: "string", format: "uri" },
                    transformations: { type: "object" },
                },
            }, "Transformed URL generated"),
            400: ErrorResponses.ValidationError,
        },
    }),

    copy: buildSchema({
        description: "Copy an image to a new location",
        tags: ["ImageKit"],
        body: CopyMoveImageBody,
        response: {
            200: successResponse(ImageUploadResultSchema, "Image copied successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    move: buildSchema({
        description: "Move an image to a new location",
        tags: ["ImageKit"],
        body: CopyMoveImageBody,
        response: {
            200: successResponse(ImageUploadResultSchema, "Image moved successfully"),
            404: ErrorResponses.NotFound,
        },
    }),

    updateDetails: buildSchema({
        description: "Update image file details (tags, metadata)",
        tags: ["ImageKit"],
        querystring: FileIdQuery,
        body: UpdateFileBody,
        response: {
            200: successResponse(ImageFileDetailsSchema, "File details updated"),
            404: ErrorResponses.NotFound,
        },
    }),

    getAuthParams: buildSchema({
        description: "Get authentication parameters for client-side upload",
        tags: ["ImageKit"],
        response: {
            200: successResponse(AuthParamsSchema, "Auth parameters generated"),
        },
    }),

    createFolder: buildSchema({
        description: "Create a new folder in ImageKit",
        tags: ["ImageKit"],
        body: CreateFolderBody,
        response: {
            201: createdResponse(undefined, "Folder created successfully"),
            400: ErrorResponses.ValidationError,
        },
    }),

    deleteFolder: buildSchema({
        description: "Delete a folder from ImageKit",
        tags: ["ImageKit"],
        querystring: {
            type: "object",
            required: ["folderPath"],
            properties: {
                folderPath: { type: "string", description: "Folder path to delete" },
            },
        },
        response: {
            200: successResponse(undefined, "Folder deleted successfully"),
            404: ErrorResponses.NotFound,
        },
    }),
};
