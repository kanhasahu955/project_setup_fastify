import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';

export function registerRequestIdHook(app: FastifyInstance) {
  app.addHook('onRequest', (request, _reply, done) => {
    (request as any).requestId = randomUUID();
    done();
  });
}
