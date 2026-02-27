/**
 * Normalize Prisma/client errors to a user-friendly message and optional field errors.
 * Used by both REST (listing controller) and GraphQL (listing resolvers).
 */
export interface NormalizedError {
    message: string;
    errors?: { field: string; message: string }[];
}

export function normalizePrismaError(error: unknown): NormalizedError {
    const msg = (error as any)?.message ?? "";
    const match = msg.match(/argument\s+`(\w+)`\.\s*Expected\s+(\w+)\.?/i);
    if (match) {
        const [, field, expected] = match;
        const fieldName = field.replace(/([A-Z])/g, " $1").replace(/^./, (s: string) => s.toUpperCase()).trim();
        return {
            message: "Validation failed",
            errors: [{ field, message: `Invalid ${fieldName}. Expected ${expected}.` }],
        };
    }
    const unknownArgMatch = msg.match(/Unknown arg `([^`]+)`/);
    if (unknownArgMatch) {
        return {
            message: "Validation failed",
            errors: [{ field: unknownArgMatch[1], message: `Unknown or invalid field: ${unknownArgMatch[1]}` }],
        };
    }
    if (msg.includes("Invalid ")) {
        const firstLine = msg.split("\n")[0]?.trim() || "Invalid request data.";
        return {
            message: "Validation failed",
            errors: [{ field: "body", message: firstLine }],
        };
    }
    return { message: msg.split("\n")[0] || "Request failed." };
}

/** Get a single user-friendly message for throwing in GraphQL or logging */
export function getPrismaErrorMessage(error: unknown, fallback = "Request failed."): string {
    const { message, errors } = normalizePrismaError(error);
    if (errors?.length) return errors.map((e) => `${e.field}: ${e.message}`).join("; ") || message;
    return message || fallback;
}
