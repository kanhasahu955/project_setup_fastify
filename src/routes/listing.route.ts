import { FastifyInstance } from "fastify";
import { listingController } from "@/controllers/listing.controller";
import { ListingRouteSchemas } from "@/schemas/listing.schema";
import { authenticate } from "@/hooks/auth.hook";

export async function listingRoutes(app: FastifyInstance) {
    app.get("/listings", { schema: ListingRouteSchemas.list }, listingController.list);
    app.get("/listings/stats", { schema: ListingRouteSchemas.stats }, listingController.stats);
    app.get("/listings/nearby", { schema: ListingRouteSchemas.nearby }, listingController.nearby);
    app.get("/listings/:id", { schema: ListingRouteSchemas.getById }, listingController.getById);
    app.post("/listings", { schema: ListingRouteSchemas.create, preHandler: [authenticate] }, listingController.create);
    app.patch("/listings/:id", { schema: ListingRouteSchemas.update }, listingController.update);
    app.delete("/listings/:id", { schema: ListingRouteSchemas.delete }, listingController.remove);
}

