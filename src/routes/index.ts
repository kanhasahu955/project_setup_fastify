import { FastifyInstance } from 'fastify';
import { healthRoutes } from '@/routes/health.route';

export async function registerRoutes(app: FastifyInstance) {
    await healthRoutes(app);
}
