import { FastifyInstance } from "fastify";
import { imagekitController } from "@/controllers/imagekit.controller";
import { ImageKitRouteSchemas } from "@/schemas/imagekit.schema";

export async function imagekitRoutes(app: FastifyInstance) {
    // Upload routes
    app.post("/images/upload", { schema: ImageKitRouteSchemas.upload }, imagekitController.upload);
    app.post("/images/upload/multiple", { schema: ImageKitRouteSchemas.uploadMultiple }, imagekitController.uploadMultiple);
    app.post("/images/upload/url", { schema: ImageKitRouteSchemas.uploadFromUrl }, imagekitController.uploadFromUrl);

    // File operations
    app.delete("/images/delete", { schema: ImageKitRouteSchemas.delete }, imagekitController.delete);
    app.post("/images/delete/multiple", { schema: ImageKitRouteSchemas.deleteMultiple }, imagekitController.deleteMultiple);

    // File info
    app.get("/images/details", { schema: ImageKitRouteSchemas.getDetails }, imagekitController.getDetails);
    app.get("/images/list", { schema: ImageKitRouteSchemas.list }, imagekitController.list);
    app.patch("/images/details", { schema: ImageKitRouteSchemas.updateDetails }, imagekitController.updateDetails);

    // Image transformations
    app.get("/images/transform", { schema: ImageKitRouteSchemas.getTransformedUrl }, imagekitController.getTransformedUrl);

    // Copy/Move
    app.post("/images/copy", { schema: ImageKitRouteSchemas.copy }, imagekitController.copy);
    app.post("/images/move", { schema: ImageKitRouteSchemas.move }, imagekitController.move);

    // Auth (for client-side uploads)
    app.get("/images/auth", { schema: ImageKitRouteSchemas.getAuthParams }, imagekitController.getAuthParams);

    // Folder management
    app.post("/images/folder", { schema: ImageKitRouteSchemas.createFolder }, imagekitController.createFolder);
    app.delete("/images/folder", { schema: ImageKitRouteSchemas.deleteFolder }, imagekitController.deleteFolder);
}
