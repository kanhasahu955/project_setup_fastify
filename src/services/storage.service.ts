import { getStorageBucket } from "@/config/firebase.config";
import { env } from "@/config/env.config";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import type {
    UploadOptions,
    UploadResult,
    FileInfo,
    DeleteResult,
    BulkUploadResult,
    StorageFolder,
} from "@/types/storage.types";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from "@/types/storage.types";

class StorageService {
    private getFileExtension(mimeType: string): string {
        const mimeToExt: Record<string, string> = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
            "image/webp": "webp",
            "image/svg+xml": "svg",
            "application/pdf": "pdf",
            "application/msword": "doc",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
            "application/vnd.ms-excel": "xls",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
        };
        return mimeToExt[mimeType] || "bin";
    }

    private generateFileName(originalName: string | undefined, mimeType: string): string {
        const ext = this.getFileExtension(mimeType);
        const baseName = originalName
            ? _.chain(originalName).split(".").initial().join(".").kebabCase().value()
            : uuidv4();
        return `${baseName}-${Date.now()}.${ext}`;
    }

    private buildFilePath(folder: StorageFolder, fileName: string): string {
        return `${folder}/${fileName}`;
    }

    validateFile(buffer: Buffer, mimeType: string, allowedTypes: string[] = ALLOWED_MIME_TYPES.all): void {
        if (!allowedTypes.includes(mimeType)) {
            throw new Error(`File type ${mimeType} is not allowed. Allowed types: ${allowedTypes.join(", ")}`);
        }

        const maxSize = ALLOWED_MIME_TYPES.image.includes(mimeType)
            ? MAX_FILE_SIZE.image
            : MAX_FILE_SIZE.document;

        if (buffer.length > maxSize) {
            const maxSizeMB = maxSize / (1024 * 1024);
            throw new Error(`File size exceeds maximum allowed size of ${maxSizeMB}MB`);
        }
    }

    async upload(
        buffer: Buffer,
        mimeType: string,
        originalName?: string,
        options: UploadOptions = {}
    ): Promise<UploadResult> {
        const storage = getStorageBucket();
        if (!storage) {
            throw new Error("Firebase storage is not configured");
        }

        const {
            folder = "misc",
            fileName = this.generateFileName(originalName, mimeType),
            makePublic = true,
            metadata = {},
        } = options;

        const filePath = this.buildFilePath(folder, fileName);
        const bucket = storage.bucket(env.FIREBASE_STORAGE_BUCKET);
        const file = bucket.file(filePath);

        await file.save(buffer, {
            contentType: mimeType,
            metadata: {
                metadata: {
                    ...metadata,
                    originalName: originalName || fileName,
                    uploadedAt: new Date().toISOString(),
                },
            },
        });

        if (makePublic) {
            await file.makePublic();
        }

        const publicUrl = makePublic
            ? `https://storage.googleapis.com/${env.FIREBASE_STORAGE_BUCKET}/${filePath}`
            : await this.getSignedUrl(filePath);

        return {
            url: publicUrl,
            path: filePath,
            fileName,
            contentType: mimeType,
            size: buffer.length,
            bucket: env.FIREBASE_STORAGE_BUCKET,
            metadata,
        };
    }

    async uploadMultiple(
        files: Array<{ buffer: Buffer; mimeType: string; originalName?: string }>,
        options: UploadOptions = {}
    ): Promise<BulkUploadResult> {
        const successful: UploadResult[] = [];
        const failed: Array<{ fileName: string; error: string }> = [];

        for (const file of files) {
            try {
                this.validateFile(file.buffer, file.mimeType);
                const result = await this.upload(file.buffer, file.mimeType, file.originalName, options);
                successful.push(result);
            } catch (error: any) {
                failed.push({
                    fileName: file.originalName || "unknown",
                    error: error.message,
                });
            }
        }

        return { successful, failed };
    }

    async delete(filePath: string): Promise<DeleteResult> {
        const storage = getStorageBucket();
        if (!storage) {
            throw new Error("Firebase storage is not configured");
        }

        const bucket = storage.bucket(env.FIREBASE_STORAGE_BUCKET);
        const file = bucket.file(filePath);

        try {
            await file.delete();
            return { success: true, path: filePath };
        } catch (error: any) {
            if (error.code === 404) {
                return { success: false, path: filePath };
            }
            throw error;
        }
    }

    async deleteMultiple(filePaths: string[]): Promise<DeleteResult[]> {
        return Promise.all(filePaths.map((path) => this.delete(path)));
    }

    async getFileInfo(filePath: string): Promise<FileInfo | null> {
        const storage = getStorageBucket();
        if (!storage) {
            throw new Error("Firebase storage is not configured");
        }

        const bucket = storage.bucket(env.FIREBASE_STORAGE_BUCKET);
        const file = bucket.file(filePath);

        try {
            const [metadata] = await file.getMetadata();
            const [exists] = await file.exists();

            if (!exists) {
                return null;
            }

            return {
                name: metadata.name || filePath,
                path: filePath,
                url: `https://storage.googleapis.com/${env.FIREBASE_STORAGE_BUCKET}/${filePath}`,
                contentType: metadata.contentType || "application/octet-stream",
                size: Number(metadata.size) || 0,
                createdAt: new Date(metadata.timeCreated || Date.now()),
                updatedAt: new Date(metadata.updated || Date.now()),
                metadata: metadata.metadata as Record<string, string>,
            };
        } catch (error: any) {
            if (error.code === 404) {
                return null;
            }
            throw error;
        }
    }

    async getSignedUrl(filePath: string, expiresInMinutes: number = 60): Promise<string> {
        const storage = getStorageBucket();
        if (!storage) {
            throw new Error("Firebase storage is not configured");
        }

        const bucket = storage.bucket(env.FIREBASE_STORAGE_BUCKET);
        const file = bucket.file(filePath);

        const [url] = await file.getSignedUrl({
            action: "read",
            expires: Date.now() + expiresInMinutes * 60 * 1000,
        });

        return url;
    }

    async listFiles(folder: StorageFolder, maxResults: number = 100): Promise<FileInfo[]> {
        const storage = getStorageBucket();
        if (!storage) {
            throw new Error("Firebase storage is not configured");
        }

        const bucket = storage.bucket(env.FIREBASE_STORAGE_BUCKET);
        const [files] = await bucket.getFiles({
            prefix: `${folder}/`,
            maxResults,
        });

        const fileInfos: FileInfo[] = [];

        for (const file of files) {
            const [metadata] = await file.getMetadata();
            fileInfos.push({
                name: file.name,
                path: file.name,
                url: `https://storage.googleapis.com/${env.FIREBASE_STORAGE_BUCKET}/${file.name}`,
                contentType: metadata.contentType || "application/octet-stream",
                size: Number(metadata.size) || 0,
                createdAt: new Date(metadata.timeCreated || Date.now()),
                updatedAt: new Date(metadata.updated || Date.now()),
                metadata: metadata.metadata as Record<string, string>,
            });
        }

        return fileInfos;
    }

    async exists(filePath: string): Promise<boolean> {
        const storage = getStorageBucket();
        if (!storage) {
            throw new Error("Firebase storage is not configured");
        }

        const bucket = storage.bucket(env.FIREBASE_STORAGE_BUCKET);
        const file = bucket.file(filePath);
        const [exists] = await file.exists();
        return exists;
    }

    async copyFile(sourcePath: string, destinationPath: string): Promise<UploadResult> {
        const storage = getStorageBucket();
        if (!storage) {
            throw new Error("Firebase storage is not configured");
        }

        const bucket = storage.bucket(env.FIREBASE_STORAGE_BUCKET);
        const sourceFile = bucket.file(sourcePath);
        const destinationFile = bucket.file(destinationPath);

        await sourceFile.copy(destinationFile);
        await destinationFile.makePublic();

        const [metadata] = await destinationFile.getMetadata();

        return {
            url: `https://storage.googleapis.com/${env.FIREBASE_STORAGE_BUCKET}/${destinationPath}`,
            path: destinationPath,
            fileName: destinationPath.split("/").pop() || destinationPath,
            contentType: metadata.contentType || "application/octet-stream",
            size: Number(metadata.size) || 0,
            bucket: env.FIREBASE_STORAGE_BUCKET,
        };
    }

    async moveFile(sourcePath: string, destinationPath: string): Promise<UploadResult> {
        const result = await this.copyFile(sourcePath, destinationPath);
        await this.delete(sourcePath);
        return result;
    }
}

export const storageService = new StorageService();
