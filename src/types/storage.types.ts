export type StorageFolder = "documents" | "avatars" | "properties" | "projects" | "misc";

export interface UploadOptions {
    folder?: StorageFolder;
    fileName?: string;
    makePublic?: boolean;
    contentType?: string;
    metadata?: Record<string, string>;
}

export interface UploadResult {
    url: string;
    path: string;
    fileName: string;
    contentType: string;
    size: number;
    bucket: string;
    metadata?: Record<string, string>;
}

export interface FileInfo {
    name: string;
    path: string;
    url: string;
    contentType: string;
    size: number;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, string>;
}

export interface DeleteResult {
    success: boolean;
    path: string;
}

export interface BulkUploadResult {
    successful: UploadResult[];
    failed: Array<{ fileName: string; error: string }>;
}

export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
    document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    spreadsheet: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    all: [
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
        "application/pdf", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
};

export const MAX_FILE_SIZE = {
    image: 5 * 1024 * 1024,      // 5MB
    document: 10 * 1024 * 1024,  // 10MB
    default: 10 * 1024 * 1024,   // 10MB
} as const;
