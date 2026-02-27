import { buildSchema, ErrorResponses, successResponse } from "./common.schema";

const AutocompleteQuery: import("./common.schema").ObjectSchema = {
    type: "object",
    required: ["input"],
    properties: {
        input: { type: "string", description: "Address or place search text" },
        sessionToken: { type: "string", description: "Optional session token for billing" },
    },
};

const PlaceDetailsQuery: import("./common.schema").ObjectSchema = {
    type: "object",
    required: ["placeId"],
    properties: {
        placeId: { type: "string", description: "Google Place ID" },
    },
};

const GeocodeQuery: import("./common.schema").ObjectSchema = {
    type: "object",
    required: ["lat", "lng"],
    properties: {
        lat: { type: "string", description: "Latitude" },
        lng: { type: "string", description: "Longitude" },
    },
};

export const MapsRouteSchemas = {
    autocomplete: buildSchema({
        description: "Address autocomplete (Google Places). Requires GOOGLE_MAPS_API_KEY.",
        tags: ["Maps"],
        querystring: AutocompleteQuery,
        response: {
            200: successResponse(
                {
                    type: "object",
                    properties: {
                        predictions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    placeId: { type: "string" },
                                    description: { type: "string" },
                                    mainText: { type: "string" },
                                    secondaryText: { type: "string" },
                                },
                            },
                        },
                    },
                },
                "Autocomplete results"
            ),
            400: ErrorResponses.ValidationError,
        },
    }),

    placeDetails: buildSchema({
        description: "Get place details (lat, lng, formatted address) by place_id. Requires GOOGLE_MAPS_API_KEY.",
        tags: ["Maps"],
        querystring: PlaceDetailsQuery,
        response: {
            200: successResponse(
                {
                    type: "object",
                    properties: {
                        placeId: { type: "string" },
                        formattedAddress: { type: "string" },
                        latitude: { type: "number" },
                        longitude: { type: "number" },
                        city: { type: "string", nullable: true },
                        locality: { type: "string", nullable: true },
                        state: { type: "string", nullable: true },
                        pincode: { type: "string", nullable: true },
                    },
                },
                "Place details"
            ),
            400: ErrorResponses.ValidationError,
        },
    }),

    geocode: buildSchema({
        description: "Reverse geocode: lat/lng to address. Requires GOOGLE_MAPS_API_KEY.",
        tags: ["Maps"],
        querystring: GeocodeQuery,
        response: {
            200: successResponse(
                {
                    type: "object",
                    properties: {
                        formattedAddress: { type: "string" },
                        latitude: { type: "number" },
                        longitude: { type: "number" },
                        city: { type: "string", nullable: true },
                        locality: { type: "string", nullable: true },
                        state: { type: "string", nullable: true },
                        pincode: { type: "string", nullable: true },
                    },
                },
                "Reverse geocode result"
            ),
            400: ErrorResponses.ValidationError,
        },
    }),
};
