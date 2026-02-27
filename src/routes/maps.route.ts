import { FastifyInstance } from "fastify";
import { mapsController } from "@/controllers/maps.controller";
import { MapsRouteSchemas } from "@/schemas/maps.schema";

export async function mapsRoutes(app: FastifyInstance) {
    app.get("/maps/autocomplete", { schema: MapsRouteSchemas.autocomplete }, mapsController.autocomplete);
    app.get("/maps/place-details", { schema: MapsRouteSchemas.placeDetails }, mapsController.placeDetails);
    app.get("/maps/geocode", { schema: MapsRouteSchemas.geocode }, mapsController.geocode);
}
