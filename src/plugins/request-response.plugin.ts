
import _ from 'lodash';
import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { cleanObject, formatResponse, formatError } from '@/utils/lodash.util';

const requestResponsePlugin = async (app: FastifyInstance) => {

    app.addHook('preHandler', async (request: FastifyRequest) => {
        if (request.body && _.isObject(request.body)) {
            request.body = cleanObject(request.body);
        }
        if (request.query && _.isObject(request.query)) {
            request.query = cleanObject(request.query);
        }
        if (request.params && _.isObject(request.params)) {
            request.params = cleanObject(request.params);
        }
    });


    app.addHook('preSerialization', async (request: FastifyRequest, reply: FastifyReply, payload: any) => {
        // Skip if already formatted (success responses or error responses)
        if (_.isObject(payload) && 'success' in payload) {
            return payload;
        }

        // Skip swagger/documentation routes
        if (request.url.startsWith('/documentation') || request.url.startsWith('/json')) {
            return payload;
        }

        // Skip error responses (statusCode >= 400)
        if (reply.statusCode >= 400) {
            return payload;
        }

        return formatResponse(payload);
    });

    app.setErrorHandler((error: any, request, reply) => {
        const statusCode = error.statusCode || 500;

        // Handle Fastify validation errors
        if (error.validation) {
            const errors = error.validation.map((err: any) => ({
                field: err.instancePath?.replace(/^\//, '') || err.params?.missingProperty || 'unknown',
                message: err.message || 'Validation failed',
                value: err.params?.value,
                constraint: err.keyword || err.params?.type,
            }));

            const response = {
                success: false,
                message: 'Validation failed',
                statusCode: 400,
                errors,
                timestamp: new Date().toISOString(),
            };

            request.log.warn({ validation: errors }, 'Validation error');
            return reply.status(400).send(response);
        }

        const response = formatError(error, statusCode);
        request.log.error(error);
        reply.status(statusCode).send(response);
    });

    app.setNotFoundHandler((request, reply) => {
        const response = formatError('Resource not found', 404);
        reply.status(404).send(response);
    });
};

export default fp(requestResponsePlugin, {
    name: 'request-response-plugin'
});
