import { FastifyRequest, FastifyReply } from "fastify";
import { imagekitService } from "@/services/imagekit.service";
import { FastifyResponseHelper } from "@/helpers/httpStatus";
import type { ImageKitFolder, ImageTransformOptions, ImageListOptions } from "@/types/imagekit.types";
import { ALLOWED_IMAGE_TYPES } from "@/types/imagekit.types";

interface ImageUploadQuery {
    folder?: ImageKitFolder;
    tags?: string;
    useUniqueFileName?: boolean;
    isPrivateFile?: boolean;
}

interface FileIdQuery {
    fileId: string;
}

interface ImageTransformQuery extends ImageTransformOptions {
    filePath: string;
}

interface UploadFromUrlBody {
    imageUrl: string;
    folder?: ImageKitFolder;
    fileName?: string;
    tags?: string[];
}

interface DeleteMultipleBody {
    fileIds: string[];
}

interface CopyMoveBody {
    sourceFilePath: string;
    destinationPath: string;
}

interface UpdateFileBody {
    tags?: string[];
    customMetadata?: Record<string, string | number | boolean>;
}

interface CreateFolderBody {
    folderPath: string;
}

class ImageKitController {
    async upload(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = FastifyResponseHelper.query<ImageUploadQuery>(request);
            const { folder = "misc", tags, useUniqueFileName = true, isPrivateFile = false } = query;
            const file = await request.file();

            if (!file) {
                FastifyResponseHelper.badRequest(reply, "No image file provided", request);
                return;
            }

            const buffer = await file.toBuffer();
            const mimeType = file.mimetype;

            imagekitService.validateImage(buffer, mimeType);

            const result = await imagekitService.upload(buffer, mimeType, file.filename, {
                folder,
                tags: tags?.split(",").map((t) => t.trim()) || [],
                useUniqueFileName,
                isPrivateFile,
            });

            FastifyResponseHelper.created(reply, result, "Image uploaded successfully", request);
        } catch (error: any) {
            if (error.message.includes("not allowed") || error.message.includes("exceeds")) {
                FastifyResponseHelper.badRequest(reply, error.message, request);
            } else {
                FastifyResponseHelper.internalServerError(reply, error.message, request);
            }
        }
    }

    async uploadMultiple(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = FastifyResponseHelper.query<ImageUploadQuery>(request);
            const { folder = "misc", tags, useUniqueFileName = true, isPrivateFile = false } = query;
            const parts = request.files();

            const files: Array<{ buffer: Buffer; mimeType: string; originalName: string }> = [];

            for await (const part of parts) {
                const buffer = await part.toBuffer();
                if (ALLOWED_IMAGE_TYPES.includes(part.mimetype)) {
                    files.push({
                        buffer,
                        mimeType: part.mimetype,
                        originalName: part.filename,
                    });
                }
            }

            if (files.length === 0) {
                FastifyResponseHelper.badRequest(reply, "No valid image files provided", request);
                return;
            }

            const result = await imagekitService.uploadMultiple(files, {
                folder,
                tags: tags?.split(",").map((t) => t.trim()) || [],
                useUniqueFileName,
                isPrivateFile,
            });

            FastifyResponseHelper.ok(reply, result, "Images upload completed", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async uploadFromUrl(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { imageUrl, folder = "misc", fileName, tags = [] } = FastifyResponseHelper.body<UploadFromUrlBody>(request);

            if (!imageUrl) {
                FastifyResponseHelper.badRequest(reply, "Image URL is required", request);
                return;
            }

            const result = await imagekitService.uploadFromUrl(imageUrl, {
                folder,
                fileName,
                tags,
            });

            FastifyResponseHelper.created(reply, result, "Image uploaded successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { fileId } = FastifyResponseHelper.query<FileIdQuery>(request);

            if (!fileId) {
                FastifyResponseHelper.badRequest(reply, "File ID is required", request);
                return;
            }

            const result = await imagekitService.delete(fileId);

            if (!result.success) {
                FastifyResponseHelper.notFound(reply, "Image not found", request);
                return;
            }

            FastifyResponseHelper.ok(reply, result, "Image deleted successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async deleteMultiple(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { fileIds } = FastifyResponseHelper.body<DeleteMultipleBody>(request);

            if (!fileIds || fileIds.length === 0) {
                FastifyResponseHelper.badRequest(reply, "File IDs are required", request);
                return;
            }

            const results = await imagekitService.deleteMultiple(fileIds);
            FastifyResponseHelper.ok(reply, results, "Images deleted", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async getDetails(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { fileId } = FastifyResponseHelper.query<FileIdQuery>(request);

            if (!fileId) {
                FastifyResponseHelper.badRequest(reply, "File ID is required", request);
                return;
            }

            const details = await imagekitService.getFileDetails(fileId);

            if (!details) {
                FastifyResponseHelper.notFound(reply, "Image not found", request);
                return;
            }

            FastifyResponseHelper.ok(reply, details, "File details retrieved", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async list(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = FastifyResponseHelper.query<ImageListOptions & { tags?: string }>(request);
            const options: ImageListOptions = {
                ...query,
                tags: query.tags?.split(",").map((t) => t.trim()),
            };

            const files = await imagekitService.listFiles(options);
            FastifyResponseHelper.ok(reply, files, "Images listed successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async getTransformedUrl(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { filePath, ...transformations } = FastifyResponseHelper.query<ImageTransformQuery>(request);

            if (!filePath) {
                FastifyResponseHelper.badRequest(reply, "File path is required", request);
                return;
            }

            const url = imagekitService.getTransformedUrl(filePath, transformations);
            FastifyResponseHelper.ok(reply, { url, transformations }, "Transformed URL generated", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async copy(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { sourceFilePath, destinationPath } = FastifyResponseHelper.body<CopyMoveBody>(request);

            if (!sourceFilePath || !destinationPath) {
                FastifyResponseHelper.badRequest(reply, "Source and destination paths are required", request);
                return;
            }

            const result = await imagekitService.copyFile(sourceFilePath, destinationPath);
            FastifyResponseHelper.ok(reply, result, "Image copied successfully", request);
        } catch (error: any) {
            if (error.message?.includes("not found")) {
                FastifyResponseHelper.notFound(reply, "Source image not found", request);
            } else {
                FastifyResponseHelper.internalServerError(reply, error.message, request);
            }
        }
    }

    async move(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { sourceFilePath, destinationPath } = FastifyResponseHelper.body<CopyMoveBody>(request);

            if (!sourceFilePath || !destinationPath) {
                FastifyResponseHelper.badRequest(reply, "Source and destination paths are required", request);
                return;
            }

            const result = await imagekitService.moveFile(sourceFilePath, destinationPath);
            FastifyResponseHelper.ok(reply, result, "Image moved successfully", request);
        } catch (error: any) {
            if (error.message?.includes("not found")) {
                FastifyResponseHelper.notFound(reply, "Source image not found", request);
            } else {
                FastifyResponseHelper.internalServerError(reply, error.message, request);
            }
        }
    }

    async updateDetails(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { fileId } = FastifyResponseHelper.query<FileIdQuery>(request);
            const updates = FastifyResponseHelper.body<UpdateFileBody>(request);

            if (!fileId) {
                FastifyResponseHelper.badRequest(reply, "File ID is required", request);
                return;
            }

            const result = await imagekitService.updateFileDetails(fileId, updates);
            FastifyResponseHelper.ok(reply, result, "File details updated", request);
        } catch (error: any) {
            if (error.message?.includes("not found")) {
                FastifyResponseHelper.notFound(reply, "Image not found", request);
            } else {
                FastifyResponseHelper.internalServerError(reply, error.message, request);
            }
        }
    }

    async getAuthParams(request: FastifyRequest, reply: FastifyReply) {
        try {
            const params = imagekitService.getAuthenticationParameters();
            FastifyResponseHelper.ok(reply, params, "Auth parameters generated", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async createFolder(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { folderPath } = FastifyResponseHelper.body<CreateFolderBody>(request);

            if (!folderPath) {
                FastifyResponseHelper.badRequest(reply, "Folder path is required", request);
                return;
            }

            await imagekitService.createFolder(folderPath);
            FastifyResponseHelper.created(reply, null, "Folder created successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async deleteFolder(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { folderPath } = FastifyResponseHelper.query<{ folderPath: string }>(request);

            if (!folderPath) {
                FastifyResponseHelper.badRequest(reply, "Folder path is required", request);
                return;
            }

            await imagekitService.deleteFolder(folderPath);
            FastifyResponseHelper.ok(reply, null, "Folder deleted successfully", request);
        } catch (error: any) {
            if (error.message?.includes("not found")) {
                FastifyResponseHelper.notFound(reply, "Folder not found", request);
            } else {
                FastifyResponseHelper.internalServerError(reply, error.message, request);
            }
        }
    }
}

export const imagekitController = new ImageKitController();
