import { FastifyRequest, FastifyReply } from "fastify";
import { googleMapsService } from "@/services/googleMaps.service";
import { googleMapsConfig } from "@/config/googleMaps.config";
import { FastifyResponseHelper } from "@/helpers/httpStatus";

class MapsController {
    async autocomplete(request: FastifyRequest, reply: FastifyReply) {
        if (!googleMapsConfig.isConfigured()) {
            FastifyResponseHelper.serviceUnavailable(reply, "Google Maps API key not configured", request);
            return;
        }
        try {
            const { input, sessionToken } = FastifyResponseHelper.query<{ input: string; sessionToken?: string }>(request);
            if (!input?.trim()) {
                FastifyResponseHelper.badRequest(reply, "Query 'input' is required", request);
                return;
            }
            const predictions = await googleMapsService.autocomplete(input, sessionToken);
            FastifyResponseHelper.ok(reply, { predictions }, "Autocomplete results", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message || "Autocomplete failed", request);
        }
    }

    async placeDetails(request: FastifyRequest, reply: FastifyReply) {
        if (!googleMapsConfig.isConfigured()) {
            FastifyResponseHelper.serviceUnavailable(reply, "Google Maps API key not configured", request);
            return;
        }
        try {
            const { placeId } = FastifyResponseHelper.query<{ placeId: string }>(request);
            if (!placeId?.trim()) {
                FastifyResponseHelper.badRequest(reply, "Query 'placeId' is required", request);
                return;
            }
            const place = await googleMapsService.getPlaceDetails(placeId);
            FastifyResponseHelper.ok(reply, place, "Place details", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message || "Place details failed", request);
        }
    }

    async geocode(request: FastifyRequest, reply: FastifyReply) {
        if (!googleMapsConfig.isConfigured()) {
            FastifyResponseHelper.serviceUnavailable(reply, "Google Maps API key not configured", request);
            return;
        }
        try {
            const { lat, lng } = FastifyResponseHelper.query<{ lat: string; lng: string }>(request);
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                FastifyResponseHelper.badRequest(reply, "Query 'lat' and 'lng' must be valid numbers", request);
                return;
            }
            const result = await googleMapsService.reverseGeocode(latitude, longitude);
            FastifyResponseHelper.ok(reply, result, "Reverse geocode result", request);
        } catch (error: any) {
            FastifyResponseHelper.badRequest(reply, error.message || "Geocode failed", request);
        }
    }
}

export const mapsController = new MapsController();
