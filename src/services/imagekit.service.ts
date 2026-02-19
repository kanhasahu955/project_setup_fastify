import { getImageKit, getUrlEndpoint, getPublicKey } from "@/config/imagekit.config";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
import type {
    ImageUploadOptions,
    ImageUploadResult,
    ImageTransformOptions,
    ImageFileDetails,
    ImageListOptions,
    BulkImageUploadResult,
    ImageDeleteResult,
} from "@/types/imagekit.types";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/types/imagekit.types";

class ImageKitService {
    private getFileExtension(mimeType: string): string {
        const mimeToExt: Record<string, string> = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
            "image/webp": "webp",
            "image/svg+xml": "svg",
            "image/avif": "avif",
        };
        return mimeToExt[mimeType] || "jpg";
    }

    private generateFileName(originalName: string | undefined, mimeType: string): string {
        const ext = this.getFileExtension(mimeType);
        const baseName = originalName
            ? _.chain(originalName).split(".").initial().join(".").kebabCase().value()
            : uuidv4();
        return `${baseName}-${Date.now()}.${ext}`;
    }

    validateImage(buffer: Buffer, mimeType: string): void {
        if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
            throw new Error(`Image type ${mimeType} is not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(", ")}`);
        }

        if (buffer.length > MAX_IMAGE_SIZE) {
            const maxSizeMB = MAX_IMAGE_SIZE / (1024 * 1024);
            throw new Error(`Image size exceeds maximum allowed size of ${maxSizeMB}MB`);
        }
    }

    async upload(
        buffer: Buffer,
        mimeType: string,
        originalName?: string,
        options: ImageUploadOptions = {}
    ): Promise<ImageUploadResult> {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        const {
            folder = "misc",
            fileName = this.generateFileName(originalName, mimeType),
            tags = [],
            useUniqueFileName = true,
            isPrivateFile = false,
            customMetadata = {},
        } = options;

        const response = await imagekit.files.upload({
            file: buffer.toString("base64"),
            fileName,
            folder: `/${folder}`,
            tags,
            useUniqueFileName,
            isPrivateFile,
            customMetadata: {
                ...customMetadata,
                originalName: originalName || fileName,
                uploadedAt: new Date().toISOString(),
            },
        });

        return {
            fileId: response.fileId || "",
            name: response.name || "",
            url: response.url || "",
            thumbnailUrl: response.thumbnailUrl || "",
            filePath: response.filePath || "",
            fileType: response.fileType || "",
            size: response.size || 0,
            width: response.width,
            height: response.height,
            tags: response.tags || undefined,
        };
    }

    async uploadFromUrl(
        imageUrl: string,
        options: ImageUploadOptions = {}
    ): Promise<ImageUploadResult> {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        const {
            folder = "misc",
            fileName = `url-upload-${Date.now()}.jpg`,
            tags = [],
            useUniqueFileName = true,
            isPrivateFile = false,
            customMetadata = {},
        } = options;

        const response = await imagekit.files.upload({
            file: imageUrl,
            fileName,
            folder: `/${folder}`,
            tags,
            useUniqueFileName,
            isPrivateFile,
            customMetadata: {
                ...customMetadata,
                sourceUrl: imageUrl,
                uploadedAt: new Date().toISOString(),
            },
        });

        return {
            fileId: response.fileId || "",
            name: response.name || "",
            url: response.url || "",
            thumbnailUrl: response.thumbnailUrl || "",
            filePath: response.filePath || "",
            fileType: response.fileType || "",
            size: response.size || 0,
            width: response.width,
            height: response.height,
            tags: response.tags || undefined,
        };
    }

    async uploadMultiple(
        files: Array<{ buffer: Buffer; mimeType: string; originalName?: string }>,
        options: ImageUploadOptions = {}
    ): Promise<BulkImageUploadResult> {
        const successful: ImageUploadResult[] = [];
        const failed: Array<{ fileName: string; error: string }> = [];

        for (const file of files) {
            try {
                this.validateImage(file.buffer, file.mimeType);
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

    async delete(fileId: string): Promise<ImageDeleteResult> {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        try {
            await imagekit.files.delete(fileId);
            return { success: true, fileId };
        } catch (error: any) {
            if (error.message?.includes("not found")) {
                return { success: false, fileId };
            }
            throw error;
        }
    }

    async deleteMultiple(fileIds: string[]): Promise<ImageDeleteResult[]> {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        try {
            await imagekit.files.bulk.delete({ fileIds });
            return fileIds.map((fileId) => ({ success: true, fileId }));
        } catch (error: any) {
            return fileIds.map((fileId) => ({ success: false, fileId }));
        }
    }

    async getFileDetails(fileId: string): Promise<ImageFileDetails | null> {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        try {
            const details = await imagekit.files.get(fileId);
            return {
                fileId: details.fileId || "",
                name: details.name || "",
                filePath: details.filePath || "",
                url: details.url || "",
                fileType: details.fileType || "",
                size: details.size || 0,
                width: details.width,
                height: details.height,
                tags: details.tags || undefined,
                isPrivateFile: details.isPrivateFile || false,
                customMetadata: details.customMetadata as Record<string, string | number | boolean>,
                createdAt: details.createdAt || "",
                updatedAt: details.updatedAt || "",
            };
        } catch (error: any) {
            if (error.message?.includes("not found")) {
                return null;
            }
            throw error;
        }
    }

    async listFiles(options: ImageListOptions = {}): Promise<ImageFileDetails[]> {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        const {
            path = "/",
            fileType = "image",
            limit = 100,
            skip = 0,
            sort = "DESC_CREATED",
        } = options;

        const response = await imagekit.assets.list({
            path,
            fileType,
            limit,
            skip,
            sort,
        });

        return response.map((file: any) => ({
            fileId: file.fileId || "",
            name: file.name || "",
            filePath: file.filePath || "",
            url: file.url || "",
            fileType: file.fileType || "",
            size: file.size || 0,
            width: file.width,
            height: file.height,
            tags: file.tags || undefined,
            isPrivateFile: file.isPrivateFile || false,
            customMetadata: file.customMetadata,
            createdAt: file.createdAt || "",
            updatedAt: file.updatedAt || "",
        }));
    }

    getTransformedUrl(filePath: string, transformations: ImageTransformOptions = {}): string {
        const urlEndpoint = getUrlEndpoint();
        if (!urlEndpoint) {
            throw new Error("ImageKit URL endpoint is not configured");
        }

        const transforms: string[] = [];

        if (transformations.width) {
            transforms.push(`w-${transformations.width}`);
        }
        if (transformations.height) {
            transforms.push(`h-${transformations.height}`);
        }
        if (transformations.quality) {
            transforms.push(`q-${transformations.quality}`);
        }
        if (transformations.format && transformations.format !== "auto") {
            transforms.push(`f-${transformations.format}`);
        }
        if (transformations.crop) {
            transforms.push(`c-${transformations.crop}`);
        }
        if (transformations.focus) {
            transforms.push(`fo-${transformations.focus}`);
        }
        if (transformations.blur) {
            transforms.push(`bl-${transformations.blur}`);
        }
        if (transformations.grayscale) {
            transforms.push(`e-grayscale`);
        }
        if (transformations.rotation) {
            transforms.push(`rt-${transformations.rotation}`);
        }

        const transformString = transforms.length > 0 ? `tr:${transforms.join(",")}` : "";
        const cleanPath = filePath.startsWith("/") ? filePath.slice(1) : filePath;
        
        return transformString
            ? `${urlEndpoint}/${transformString}/${cleanPath}`
            : `${urlEndpoint}/${cleanPath}`;
    }

    async copyFile(sourceFilePath: string, destinationPath: string): Promise<ImageUploadResult> {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        await imagekit.files.copy({
            sourceFilePath,
            destinationPath,
            includeFileVersions: false,
        });

        return {
            fileId: "",
            name: sourceFilePath.split("/").pop() || "",
            url: `${getUrlEndpoint()}${destinationPath}/${sourceFilePath.split("/").pop()}`,
            thumbnailUrl: "",
            filePath: `${destinationPath}/${sourceFilePath.split("/").pop()}`,
            fileType: "image",
            size: 0,
        };
    }

    async moveFile(sourceFilePath: string, destinationPath: string): Promise<ImageUploadResult> {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        await imagekit.files.move({
            sourceFilePath,
            destinationPath,
        });

        return {
            fileId: "",
            name: sourceFilePath.split("/").pop() || "",
            url: `${getUrlEndpoint()}${destinationPath}/${sourceFilePath.split("/").pop()}`,
            thumbnailUrl: "",
            filePath: `${destinationPath}/${sourceFilePath.split("/").pop()}`,
            fileType: "image",
            size: 0,
        };
    }

    async updateFileDetails(
        fileId: string,
        updates: { tags?: string[]; customMetadata?: Record<string, string | number | boolean> }
    ): Promise<ImageFileDetails> {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        const response = await imagekit.files.update(fileId, {
            tags: updates.tags,
            customMetadata: updates.customMetadata,
        });

        return {
            fileId: response.fileId || "",
            name: response.name || "",
            filePath: response.filePath || "",
            url: response.url || "",
            fileType: response.fileType || "",
            size: response.size || 0,
            width: response.width,
            height: response.height,
            tags: response.tags || undefined,
            isPrivateFile: response.isPrivateFile || false,
            customMetadata: response.customMetadata as Record<string, string | number | boolean>,
            createdAt: response.createdAt || "",
            updatedAt: response.updatedAt || "",
        };
    }

    getAuthenticationParameters(): { token: string; expire: number; signature: string; publicKey: string; urlEndpoint: string } {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        const authParams = imagekit.helper.getAuthenticationParameters();
        return {
            ...authParams,
            publicKey: getPublicKey(),
            urlEndpoint: getUrlEndpoint(),
        };
    }

    async createFolder(folderPath: string): Promise<void> {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        const parts = folderPath.split("/").filter(Boolean);
        const folderName = parts.pop() || folderPath;
        const parentFolderPath = parts.length > 0 ? `/${parts.join("/")}` : "/";

        await imagekit.folders.create({
            folderName,
            parentFolderPath,
        });
    }

    async deleteFolder(folderPath: string): Promise<void> {
        const imagekit = getImageKit();
        if (!imagekit) {
            throw new Error("ImageKit is not configured");
        }

        await imagekit.folders.delete({
            folderPath,
        });
    }
}

export const imagekitService = new ImageKitService();
