import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { env } from '@/config/env.config';
import fp from 'fastify-plugin';

export const loggerConfig = {
    level: env.LOG_LEVEL,
    transport: env.NODE_ENV === 'development' ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    } : undefined,
};

const loggerPlugin = async (app: FastifyInstance) => {
    app.addHook('onRequest', async (request: FastifyRequest) => {
        request.log.info({
            msg: 'Incoming Request',
            req: {
                method: request.method,
                url: request.url,
                query: request.query,
                params: request.params,
                ip: request.ip,
                headers: {
                    ...request.headers,
                    authorization: request.headers.authorization ? '[REDACTED]' : undefined
                }
            }
        });
    });

    app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
        request.log.info({
            msg: 'Request Completed',
            res: {
                statusCode: reply.statusCode,
                responseTime: `${reply.elapsedTime.toFixed(2)}ms`,
                config: request.routeOptions.config
            }
        });
    });
};

export const registerLogger = fp(loggerPlugin, {
    name: 'logger-plugin'
});

