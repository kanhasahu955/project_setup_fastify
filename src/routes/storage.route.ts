import { FastifyInstance } from "fastify";
import { storageController } from "@/controllers/storage.controller";
import { StorageRouteSchemas } from "@/schemas/storage.schema";

export async function storageRoutes(app: FastifyInstance) {
    // Upload routes
    app.post("/storage/upload", { schema: StorageRouteSchemas.upload }, storageController.upload);
    app.post("/storage/upload/multiple", { schema: StorageRouteSchemas.uploadMultiple }, storageController.uploadMultiple);

    // File operations
    app.delete("/storage/delete", { schema: StorageRouteSchemas.delete }, storageController.delete);
    app.post("/storage/delete/multiple", { schema: StorageRouteSchemas.deleteMultiple }, storageController.deleteMultiple);

    // File info
    app.get("/storage/info", { schema: StorageRouteSchemas.getInfo }, storageController.getInfo);
    app.get("/storage/list", { schema: StorageRouteSchemas.list }, storageController.list);
    app.get("/storage/signed-url", { schema: StorageRouteSchemas.getSignedUrl }, storageController.getSignedUrl);

    // Copy/Move
    app.post("/storage/copy", { schema: StorageRouteSchemas.copy }, storageController.copy);
    app.post("/storage/move", { schema: StorageRouteSchemas.move }, storageController.move);
}
