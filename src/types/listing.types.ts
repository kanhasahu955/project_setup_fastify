import type { Listing, ListingStatus, ListingType, PropertyType } from "../../generated/prisma/client";
import type { ListOptions } from "./common.types";

export interface CreateListingInput {
    title: string;
    description: string;
    price: number;
    pricePerSqft?: number | null;
    listingType: ListingType;
    propertyType: PropertyType;
    condition?: string | null;
    bedrooms?: number | null;
    bathrooms?: number | null;
    balconies?: number | null;
    floor?: number | null;
    totalFloors?: number | null;
    area?: number | null;
    carpetArea?: number | null;
    builtUpArea?: number | null;
    furnishing?: string | null;
    facing?: string | null;
    city: string;
    locality: string;
    state: string;
    pincode?: string | null;
    latitude: number;
    longitude: number;
    projectId?: string | null;
    amenityIds?: string[];
    images?: {
        url: string;
        isPrimary?: boolean;
        order?: number;
    }[];
}

export interface UpdateListingInput extends Partial<CreateListingInput> {
    status?: ListingStatus;
    isFeatured?: boolean;
    isVerified?: boolean;
}

export interface ListingListOptions extends ListOptions {
    city?: string;
    locality?: string;
    listingType?: ListingType;
    propertyType?: PropertyType;
    status?: ListingStatus;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    ownerId?: string;
    projectId?: string;
    isFeatured?: boolean;
    isVerified?: boolean;
    sortBy?: keyof Listing;
}

export type SafeListing = Listing;

