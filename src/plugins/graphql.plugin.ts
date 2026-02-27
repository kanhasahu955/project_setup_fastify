import { FastifyInstance, FastifyRequest } from "fastify";
import mercurius from "mercurius";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { env } from "@/config/env.config";

/**
 * Same JWT verification as REST: use request.jwtVerify() so Bearer token
 * is validated identically and request.user is set by @fastify/jwt.
 */
async function extractUser(request: FastifyRequest): Promise<{ id: string; role: string; email: string } | null> {
    try {
        await request.jwtVerify();
        return (request as any).user ?? null;
    } catch {
        return null;
    }
}

export async function registerGraphQL(app: FastifyInstance): Promise<void> {
    await app.register(mercurius, {
        schema: typeDefs,
        resolvers,
        graphiql: env.NODE_ENV !== "production",
        ide: env.NODE_ENV !== "production",
        path: "/graphql",
        context: async (request) => {
            const user = await extractUser(request);
            return {
                user,
                app,
            };
        },
        errorFormatter: (error, ctx) => {
            const response = mercurius.defaultErrorFormatter(error, ctx);
            
            if (env.NODE_ENV === "production") {
                response.response.errors = response.response.errors?.map((err) => ({
                    ...err,
                    extensions: undefined,
                }));
            }
            
            return response;
        },
    });

    // Register Altair GraphQL IDE (better than GraphiQL - supports headers)
    if (env.NODE_ENV !== "production") {
        try {
            const altairPlugin = await import("altair-fastify-plugin");
            const AltairFastify = altairPlugin.default || altairPlugin;
            await app.register(AltairFastify, {
                path: "/altair",
                baseURL: "/altair/",
                endpointURL: "/graphql",
            });
            app.log.info("Altair GraphQL IDE available at /altair (supports headers)");
        } catch (error) {
            app.log.warn("Altair plugin not available, using GraphiQL only");
        }
    }

    app.log.info("GraphQL registered at /graphql");
    if (env.NODE_ENV !== "production") {
        app.log.info("GraphiQL IDE available at /graphiql");
    }
}
