import { googleMapsConfig } from "@/config/googleMaps.config";

export interface AutocompletePrediction {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
}

export interface PlaceDetails {
    placeId: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
    city?: string;
    locality?: string;
    state?: string;
    pincode?: string;
}

export interface GeocodeResult {
    formattedAddress: string;
    latitude: number;
    longitude: number;
    city?: string;
    locality?: string;
    state?: string;
    pincode?: string;
}

class GoogleMapsService {
    async autocomplete(input: string, sessionToken?: string): Promise<AutocompletePrediction[]> {
        if (!googleMapsConfig.isConfigured()) throw new Error("Google Maps API key not configured");
        const url = googleMapsConfig.autocompleteUrl(input, sessionToken);
        const res = await fetch(url);
        const data = (await res.json()) as any;
        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
            throw new Error(data.error_message || data.status || "Autocomplete failed");
        }
        const predictions = data.predictions || [];
        return predictions.map((p: any) => ({
            placeId: p.place_id,
            description: p.description,
            mainText: p.structured_formatting?.main_text || p.description,
            secondaryText: p.structured_formatting?.secondary_text || "",
        }));
    }

    async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
        if (!googleMapsConfig.isConfigured()) throw new Error("Google Maps API key not configured");
        const url = googleMapsConfig.placeDetailsUrl(placeId);
        const res = await fetch(url);
        const data = (await res.json()) as any;
        if (data.status !== "OK") {
            throw new Error(data.error_message || data.status || "Place details failed");
        }
        const result = data.result;
        const loc = result.geometry?.location;
        if (!loc) throw new Error("No geometry for place");
        const components = result.address_components || [];
        return {
            placeId: result.place_id || placeId,
            formattedAddress: result.formatted_address || "",
            latitude: loc.lat,
            longitude: loc.lng,
            ...this.parseAddressComponents(components),
        };
    }

    async reverseGeocode(latitude: number, longitude: number): Promise<GeocodeResult> {
        if (!googleMapsConfig.isConfigured()) throw new Error("Google Maps API key not configured");
        const url = googleMapsConfig.geocodeUrl(latitude, longitude);
        const res = await fetch(url);
        const data = (await res.json()) as any;
        if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
            throw new Error(data.error_message || data.status || "Geocode failed");
        }
        const result = data.results?.[0];
        if (!result) throw new Error("No results for coordinates");
        const loc = result.geometry?.location;
        return {
            formattedAddress: result.formatted_address || "",
            latitude: loc?.lat ?? latitude,
            longitude: loc?.lng ?? longitude,
            ...this.parseAddressComponents(result.address_components || []),
        };
    }

    private parseAddressComponents(components: any[]): { city?: string; locality?: string; state?: string; pincode?: string } {
        const out: { city?: string; locality?: string; state?: string; pincode?: string } = {};
        for (const c of components) {
            const types = c.types || [];
            const long = c.long_name;
            if (types.includes("postal_code")) out.pincode = long;
            if (types.includes("administrative_area_level_1")) out.state = long;
            if (types.includes("locality")) out.city = long;
            if (types.includes("sublocality") || types.includes("neighborhood")) out.locality = out.locality || long;
        }
        if (!out.locality && out.city) out.locality = out.city;
        return out;
    }
}

export const googleMapsService = new GoogleMapsService();
