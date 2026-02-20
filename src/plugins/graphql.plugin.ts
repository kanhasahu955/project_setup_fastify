import { FastifyInstance, FastifyRequest } from "fastify";
import mercurius from "mercurius";
import { typeDefs } from "@/graphql/schema";
import { resolvers } from "@/graphql/resolvers";
import { env } from "@/config/env.config";

async function extractUser(request: FastifyRequest, app: FastifyInstance) {
    try {
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return null;
        }

        const token = authHeader.substring(7);
        const decoded = app.jwt.verify(token) as { id: string; role: string; email: string };
        return decoded;
    } catch (error) {
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
            const user = await extractUser(request, app);
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
