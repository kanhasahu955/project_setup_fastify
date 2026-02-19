import { FastifyInstance } from 'fastify';
import { healthRoutes } from '@/routes/health.route';
import { userRoutes } from '@/routes/user.route';

export async function registerRoutes(app: FastifyInstance) {
    await healthRoutes(app);
    await userRoutes(app);
}
