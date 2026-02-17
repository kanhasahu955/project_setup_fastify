import { FastifyInstance } from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyHelmet from '@fastify/helmet'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt from '@fastify/jwt'
import fastifyRateLimit from '@fastify/rate-limit'
import { env } from '@/config/env.config'

export async function registerSecurity(app: FastifyInstance) {
    const isProd = env.NODE_ENV === 'production'

    const allowedOrigins = [
        ...(Array.isArray(env.FRONTEND_URL) ? env.FRONTEND_URL : [env.FRONTEND_URL]),
        `http://localhost:${env.PORT}`,
        `http://127.0.0.1:${env.PORT}`,
        `https://localhost:${env.PORT}`,
        `https://127.0.0.1:${env.PORT}`
    ];

    await app.register(fastifyHelmet, {
        contentSecurityPolicy: isProd
            ? {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", 'data:'],
                    connectSrc: ["'self'", ...allowedOrigins],
                },
            }
            : false,
        hsts: isProd
            ? {
                maxAge: 31536000,
                includeSubDomains: true,
                preload: true,
            }
            : false,
        // Disable these in development for Swagger UI to work
        crossOriginEmbedderPolicy: isProd,
        crossOriginOpenerPolicy: isProd,
        crossOriginResourcePolicy: isProd ? { policy: 'same-origin' } : false,
    })

    await app.register(fastifyCors, {
        origin: (origin, cb) => {
            if (!origin) return cb(null, true)
            if (!isProd) return cb(null, true)

            if (allowedOrigins.includes(origin)) {
                return cb(null, true)
            }

            cb(new Error('Not allowed by CORS'), false)
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-API-Key'],
        exposedHeaders: ['Content-Range', 'X-Content-Range'],
    })


    await app.register(fastifyCookie, {
        secret: env.COOKIE_SECRET,
    })


    await app.register(fastifyJwt, {
        secret: env.JWT_SECRET,
        cookie: {
            cookieName: 'accessToken',
            signed: false,
        },
    })

    await app.register(fastifyRateLimit, {
        max: 100,
        timeWindow: '1 minute',
    })

    app.log.info('🔐 Security configured (JWT + SPA mode)')
}
