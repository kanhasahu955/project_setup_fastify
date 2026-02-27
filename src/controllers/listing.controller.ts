import { FastifyRequest, FastifyReply } from "fastify";
import { listingService } from "@/services/listing.service";
import { FastifyResponseHelper, type ValidationError } from "@/helpers/httpStatus";
import { normalizePrismaError } from "@/utils/prismaError.util";
import type { CreateListingInput, UpdateListingInput, ListingListOptions } from "@/types/listing.types";

interface IdParam {
    id: string;
}

function toValidationResponse(error: any): { message: string; errors?: ValidationError[] } {
    const normalized = normalizePrismaError(error);
    return {
        message: normalized.message,
        errors: normalized.errors?.map((e) => ({ field: e.field, message: e.message })),
    };
}

class ListingController {
    async list(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = FastifyResponseHelper.query<ListingListOptions>(request);
            const result = await listingService.list(query);
            FastifyResponseHelper.ok(reply, result, "Listings retrieved successfully", request);
        } catch (error: any) {
            const { message, errors } = toValidationResponse(error);
            if (errors?.length) FastifyResponseHelper.validationError(reply, errors, message, request);
            else FastifyResponseHelper.badRequest(reply, message || "Failed to list listings", request);
        }
    }

    async stats(_request: FastifyRequest, reply: FastifyReply) {
        try {
            const stats = await listingService.stats();
            FastifyResponseHelper.ok(reply, stats, "Listing statistics retrieved successfully");
        } catch (error: any) {
            const { message } = toValidationResponse(error);
            FastifyResponseHelper.badRequest(reply, message || "Failed to get listing statistics");
        }
    }

    async nearby(request: FastifyRequest, reply: FastifyReply) {
        try {
            const query = FastifyResponseHelper.query<{
                latitude: string;
                longitude: string;
                radiusKm?: string;
                limit?: string;
            }>(request);
            const latitude = parseFloat(query.latitude);
            const longitude = parseFloat(query.longitude);
            if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                FastifyResponseHelper.badRequest(reply, "latitude and longitude must be valid numbers", request);
                return;
            }
            const radiusKm = query.radiusKm != null ? parseFloat(query.radiusKm) : 10;
            const limit = query.limit != null ? parseInt(query.limit, 10) : 20;
            const result = await listingService.nearby(latitude, longitude, radiusKm, limit);
            FastifyResponseHelper.ok(reply, result, "Nearby listings", request);
        } catch (error: any) {
            const { message } = toValidationResponse(error);
            FastifyResponseHelper.badRequest(reply, message || "Failed to get nearby listings", request);
        }
    }

    async getById(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            const listing = await listingService.findById(id);

            if (!listing) {
                FastifyResponseHelper.notFound(reply, "Listing not found", request);
                return;
            }

            FastifyResponseHelper.ok(reply, listing, "Listing retrieved successfully", request);
        } catch (error: any) {
            const { message, errors } = toValidationResponse(error);
            if (errors?.length) FastifyResponseHelper.validationError(reply, errors, message, request);
            else FastifyResponseHelper.badRequest(reply, message || "Failed to get listing", request);
        }
    }

    async create(request: FastifyRequest, reply: FastifyReply) {
        try {
            const ownerId = (request as any).user?.id;
            if (!ownerId) {
                FastifyResponseHelper.unauthorized(reply, "Not authenticated", request);
                return;
            }

            const body = FastifyResponseHelper.body<CreateListingInput>(request);
            const listing = await listingService.create(ownerId, body);
            FastifyResponseHelper.created(reply, listing, "Listing created successfully", request);
        } catch (error: any) {
            const { message, errors } = toValidationResponse(error);
            if (errors?.length) FastifyResponseHelper.validationError(reply, errors, message, request);
            else FastifyResponseHelper.badRequest(reply, message || "Failed to create listing", request);
        }
    }

    async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            const body = FastifyResponseHelper.body<UpdateListingInput>(request);
            const listing = await listingService.update(id, body);
            FastifyResponseHelper.ok(reply, listing, "Listing updated successfully", request);
        } catch (error: any) {
            const { message, errors } = toValidationResponse(error);
            if (errors?.length) FastifyResponseHelper.validationError(reply, errors, message, request);
            else FastifyResponseHelper.badRequest(reply, message || "Failed to update listing", request);
        }
    }

    async remove(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id } = FastifyResponseHelper.params<IdParam>(request);
            await listingService.softDelete(id);
            FastifyResponseHelper.ok(reply, null, "Listing deleted successfully", request);
        } catch (error: any) {
            const { message, errors } = toValidationResponse(error);
            if (errors?.length) FastifyResponseHelper.validationError(reply, errors, message, request);
            else FastifyResponseHelper.badRequest(reply, message || "Failed to delete listing", request);
        }
    }
}

export const listingController = new ListingController();

