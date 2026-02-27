import type { FastifyRequest, FastifyReply } from "fastify";

/**
 * Pre-handler that verifies JWT from Authorization: Bearer <token>.
 * On success, request.user is set by @fastify/jwt (id, email, role).
 * On failure, replies with 401 and does not call the route handler.
 */
export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    try {
        await request.jwtVerify();
    } catch {
        void reply.status(401).send({
            success: false,
            message: "Not authenticated",
            statusCode: 401,
        });
    }
}
