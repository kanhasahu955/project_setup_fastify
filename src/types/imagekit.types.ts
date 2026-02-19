export type ImageKitFolder = "avatars" | "properties" | "projects" | "banners" | "misc";

export interface ImageUploadOptions {
    folder?: ImageKitFolder;
    fileName?: string;
    tags?: string[];
    useUniqueFileName?: boolean;
    isPrivateFile?: boolean;
    customMetadata?: Record<string, string | number | boolean>;
}

export interface ImageUploadResult {
    fileId: string;
    name: string;
    url: string;
    thumbnailUrl: string;
    filePath: string;
    fileType: string;
    size: number;
    width?: number;
    height?: number;
    tags?: string[];
}

export interface ImageTransformOptions {
    width?: number;
    height?: number;
    quality?: number;
    format?: "auto" | "webp" | "jpg" | "png" | "avif";
    crop?: "maintain_ratio" | "force" | "at_least" | "at_max";
    focus?: "auto" | "center" | "top" | "left" | "bottom" | "right" | "top_left" | "top_right" | "bottom_left" | "bottom_right" | "face";
    blur?: number;
    grayscale?: boolean;
    rotation?: number;
}

export interface ImageFileDetails {
    fileId: string;
    name: string;
    filePath: string;
    url: string;
    fileType: string;
    size: number;
    width?: number;
    height?: number;
    tags?: string[];
    isPrivateFile: boolean;
    customMetadata?: Record<string, string | number | boolean>;
    createdAt: string;
    updatedAt: string;
}

export interface ImageListOptions {
    path?: string;
    fileType?: "image" | "non-image" | "all";
    tags?: string[];
    limit?: number;
    skip?: number;
    sort?: "ASC_UPDATED" | "DESC_UPDATED" | "ASC_CREATED" | "DESC_CREATED" | "ASC_SIZE" | "DESC_SIZE" | "ASC_NAME" | "DESC_NAME";
}

export interface BulkImageUploadResult {
    successful: ImageUploadResult[];
    failed: Array<{ fileName: string; error: string }>;
}

export interface ImageDeleteResult {
    success: boolean;
    fileId: string;
}

export const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/avif",
];

export const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25MB (ImageKit limit)
