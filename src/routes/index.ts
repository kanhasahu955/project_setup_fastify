import { FastifyInstance } from 'fastify';
import { healthRoutes } from '@/routes/health.route';
import { userRoutes } from '@/routes/user.route';
import { storageRoutes } from '@/routes/storage.route';
import { imagekitRoutes } from '@/routes/imagekit.route';
import { listingRoutes } from '@/routes/listing.route';
import { mapsRoutes } from '@/routes/maps.route';

export async function registerRoutes(app: FastifyInstance) {
    await healthRoutes(app);
    await userRoutes(app);
    await storageRoutes(app);
    await imagekitRoutes(app);
    await listingRoutes(app);
    await mapsRoutes(app);
}
