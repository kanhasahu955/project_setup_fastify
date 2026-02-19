import { FastifyRequest, FastifyReply } from "fastify";
import { storageService } from "@/services/storage.service";
import { FastifyResponseHelper } from "@/helpers/httpStatus";
import type { StorageFolder } from "@/types/storage.types";
import { ALLOWED_MIME_TYPES } from "@/types/storage.types";

interface UploadQuery {
    folder?: StorageFolder;
    makePublic?: boolean;
}

interface FilePathQuery {
    path: string;
}

interface SignedUrlQuery {
    path: string;
    expiresIn?: number;
}

interface ListFilesQuery {
    folder?: StorageFolder;
    maxResults?: number;
}

interface DeleteFilesBody {
    paths: string[];
}

interface CopyMoveBody {
    sourcePath: string;
    destinationPath: string;
}

class StorageController {
    async upload(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { folder = "misc", makePublic = true } = FastifyResponseHelper.query<UploadQuery>(request);
            const file = await request.file();

            if (!file) {
                FastifyResponseHelper.badRequest(reply, "No file provided", request);
                return;
            }

            const buffer = await file.toBuffer();
            const mimeType = file.mimetype;

            storageService.validateFile(buffer, mimeType, ALLOWED_MIME_TYPES.all);

            const result = await storageService.upload(buffer, mimeType, file.filename, {
                folder,
                makePublic,
            });

            FastifyResponseHelper.created(reply, result, "File uploaded successfully", request);
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
            const { folder = "misc", makePublic = true } = FastifyResponseHelper.query<UploadQuery>(request);
            const parts = request.files();

            const files: Array<{ buffer: Buffer; mimeType: string; originalName: string }> = [];

            for await (const part of parts) {
                const buffer = await part.toBuffer();
                files.push({
                    buffer,
                    mimeType: part.mimetype,
                    originalName: part.filename,
                });
            }

            if (files.length === 0) {
                FastifyResponseHelper.badRequest(reply, "No files provided", request);
                return;
            }

            const result = await storageService.uploadMultiple(files, { folder, makePublic });
            FastifyResponseHelper.ok(reply, result, "Files upload completed", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async delete(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { path } = FastifyResponseHelper.query<FilePathQuery>(request);

            if (!path) {
                FastifyResponseHelper.badRequest(reply, "File path is required", request);
                return;
            }

            const result = await storageService.delete(path);

            if (!result.success) {
                FastifyResponseHelper.notFound(reply, "File not found", request);
                return;
            }

            FastifyResponseHelper.ok(reply, result, "File deleted successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async deleteMultiple(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { paths } = FastifyResponseHelper.body<DeleteFilesBody>(request);

            if (!paths || paths.length === 0) {
                FastifyResponseHelper.badRequest(reply, "File paths are required", request);
                return;
            }

            const results = await storageService.deleteMultiple(paths);
            FastifyResponseHelper.ok(reply, results, "Files deleted", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async getInfo(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { path } = FastifyResponseHelper.query<FilePathQuery>(request);

            if (!path) {
                FastifyResponseHelper.badRequest(reply, "File path is required", request);
                return;
            }

            const info = await storageService.getFileInfo(path);

            if (!info) {
                FastifyResponseHelper.notFound(reply, "File not found", request);
                return;
            }

            FastifyResponseHelper.ok(reply, info, "File info retrieved", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async list(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { folder = "misc", maxResults = 100 } = FastifyResponseHelper.query<ListFilesQuery>(request);
            const files = await storageService.listFiles(folder, maxResults);
            FastifyResponseHelper.ok(reply, files, "Files listed successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async getSignedUrl(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { path, expiresIn = 60 } = FastifyResponseHelper.query<SignedUrlQuery>(request);

            if (!path) {
                FastifyResponseHelper.badRequest(reply, "File path is required", request);
                return;
            }

            const exists = await storageService.exists(path);
            if (!exists) {
                FastifyResponseHelper.notFound(reply, "File not found", request);
                return;
            }

            const url = await storageService.getSignedUrl(path, expiresIn);
            const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000);

            FastifyResponseHelper.ok(reply, { url, expiresAt }, "Signed URL generated", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async copy(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { sourcePath, destinationPath } = FastifyResponseHelper.body<CopyMoveBody>(request);

            if (!sourcePath || !destinationPath) {
                FastifyResponseHelper.badRequest(reply, "Source and destination paths are required", request);
                return;
            }

            const exists = await storageService.exists(sourcePath);
            if (!exists) {
                FastifyResponseHelper.notFound(reply, "Source file not found", request);
                return;
            }

            const result = await storageService.copyFile(sourcePath, destinationPath);
            FastifyResponseHelper.ok(reply, result, "File copied successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }

    async move(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { sourcePath, destinationPath } = FastifyResponseHelper.body<CopyMoveBody>(request);

            if (!sourcePath || !destinationPath) {
                FastifyResponseHelper.badRequest(reply, "Source and destination paths are required", request);
                return;
            }

            const exists = await storageService.exists(sourcePath);
            if (!exists) {
                FastifyResponseHelper.notFound(reply, "Source file not found", request);
                return;
            }

            const result = await storageService.moveFile(sourcePath, destinationPath);
            FastifyResponseHelper.ok(reply, result, "File moved successfully", request);
        } catch (error: any) {
            FastifyResponseHelper.internalServerError(reply, error.message, request);
        }
    }
}

export const storageController = new StorageController();
