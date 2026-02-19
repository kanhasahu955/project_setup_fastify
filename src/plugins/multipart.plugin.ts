import fp from "fastify-plugin";
import multipart from "@fastify/multipart";
import { FastifyInstance } from "fastify";

async function multipartPlugin(app: FastifyInstance) {
    await app.register(multipart, {
        limits: {
            fieldNameSize: 100,
            fieldSize: 100,
            fields: 10,
            fileSize: 10 * 1024 * 1024, // 10MB max file size
            files: 10, // max 10 files per request
            headerPairs: 2000,
        },
        attachFieldsToBody: false,
    });

    app.log.info("📁 Multipart plugin registered");
}

export default fp(multipartPlugin, {
    name: "multipart-plugin",
});
