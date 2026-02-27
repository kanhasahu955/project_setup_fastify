import { env } from "@/config/env.config";

const BASE = "https://maps.googleapis.com/maps/api";

export const googleMapsConfig = {
    get apiKey(): string {
        return env.GOOGLE_MAPS_API_KEY || "";
    },
    isConfigured(): boolean {
        return Boolean(this.apiKey);
    },
    autocompleteUrl(input: string, sessionToken?: string): string {
        const params = new URLSearchParams({
            input: input.trim(),
            key: this.apiKey,
            components: "country:in",
        });
        if (sessionToken) params.set("sessiontoken", sessionToken);
        return `${BASE}/place/autocomplete/json?${params.toString()}`;
    },
    placeDetailsUrl(placeId: string): string {
        const params = new URLSearchParams({
            place_id: placeId,
            fields: "geometry,formatted_address,address_components",
            key: this.apiKey,
        });
        return `${BASE}/place/details/json?${params.toString()}`;
    },
    geocodeUrl(lat: number, lng: number): string {
        const params = new URLSearchParams({
            latlng: `${lat},${lng}`,
            key: this.apiKey,
            result_type: "street_address|premise|subpremise|locality|sublocality|administrative_area_level_1|postal_code",
        });
        return `${BASE}/geocode/json?${params.toString()}`;
    },
};
