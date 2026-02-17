import { FastifyInstance } from 'fastify';
import { formatDate } from '@/utils/date.util';
import { FastifyResponseHelper } from '@/helpers/httpStatus';
import prisma from '@/config/prisma.config';

// Cache for database status (avoids pinging DB on every request)
let dbStatusCache = {
    status: 'unknown',
    lastCheck: 0,
    ttl: 10000 // 10 seconds cache
};

async function checkDatabaseStatus(app: FastifyInstance): Promise<string> {
    const now = Date.now();
    
    // Return cached status if still valid
    if (now - dbStatusCache.lastCheck < dbStatusCache.ttl) {
        return dbStatusCache.status;
    }

    try {
        await prisma.$runCommandRaw({ ping: 1 });
        dbStatusCache.status = 'connected';
    } catch (error) {
        dbStatusCache.status = 'disconnected';
        app.log.error(`Health check failed: ${error}`);
    }
    
    dbStatusCache.lastCheck = now;
    return dbStatusCache.status;
}

export async function healthRoutes(app: FastifyInstance) {
    // Quick health check - no DB ping (~1-5ms)
    app.get('/health', {
        schema: {
            description: 'Quick health check (use ?detailed=true for DB status)',
            tags: ['Health'],
            querystring: {
                type: 'object',
                properties: {
                    detailed: { type: 'boolean', default: false }
                }
            }
        }
    }, async (request, reply) => {
        const { detailed } = request.query as { detailed?: boolean };

        const response: any = {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: formatDate()
        };

        // Only check DB if detailed=true (adds ~200ms)
        if (detailed) {
            response.services = {
                database: await checkDatabaseStatus(app)
            };
        }

        FastifyResponseHelper.ok(reply, response, 'Health check successful', request);
    });

    // Detailed health check endpoint - always includes DB status
    app.get('/health/detailed', {
        schema: {
            description: 'Detailed health check with all service statuses',
            tags: ['Health']
        }
    }, async (request, reply) => {
        const dbStatus = await checkDatabaseStatus(app);

        FastifyResponseHelper.ok(reply, {
            status: dbStatus === 'connected' ? 'ok' : 'degraded',
            uptime: process.uptime(),
            services: {
                database: dbStatus
            },
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            },
            timestamp: formatDate()
        }, 'Detailed health check', request);
    });
}
