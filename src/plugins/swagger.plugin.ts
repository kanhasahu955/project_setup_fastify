import { FastifyInstance } from 'fastify';
import { env } from '@/config/env.config';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import scalarFastify from '@scalar/fastify-api-reference';


export async function registerSwagger(app: FastifyInstance) {
    await app.register(fastifySwagger, {
        openapi: {
            openapi: '3.0.0',
            info: {
                title: 'Live Bhoomi API',
                description: `
                    # Live Bhoomi API Documentation

                    A modern RESTful API built with Fastify, TypeScript, and Prisma.

                    ## Features
                    - 🚀 High-performance Fastify framework
                    - 📝 Automatic API documentation with Swagger
                    - 🔒 Type-safe with TypeScript
                    - 💾 MongoDB database with Prisma ORM
                    - 📊 Colorized logging with Pino
                    - 🔄 Hot reload in development

                    ## Getting Started
                    Visit the health check endpoint at \`/api/v1/health\` to verify the API is running.

                    ## Authentication (JWT)
                    Endpoints that require auth (e.g. **POST /api/v1/listings**) expect a JWT in the \`Authorization\` header.

                    1. **Get a token:** Call \`POST /api/v1/auth/login\` with body:
                    \`\`\`json
                    { "identifier": "your@email.com", "password": "yourpassword" }
                    \`\`\`
                    2. Use the \`data.token\` from the response.
                    3. In Swagger: click **Authorize**, enter \`Bearer <paste-token-here>\` (or just the token if the UI adds "Bearer").
                    4. Any role (BUYER, OWNER, AGENT, etc.) can create listings; the listing \`ownerId\` is set from the authenticated user.
                `,
                version: '1.0.0',
                contact: {
                    name: 'API Support',
                    email: 'support@livebhoomi.com'
                },
                license: {
                    name: 'ISC',
                    url: 'https://opensource.org/licenses/ISC'
                }
            },
            externalDocs: {
                url: 'https://github.com/yourusername/live_bhoomi',
                description: 'Find more information here'
            },
            // IMPORTANT: Do NOT append `/api/v1` here.
            // All routes are already defined with `/api/v1` in their path,
            // so the server URL must be just the origin (host + protocol).
            servers: (() => {
                const productionUrl = env.API_URL || process.env.RENDER_EXTERNAL_URL || 'https://live-bhoomi.onrender.com';
                return [
                    { url: productionUrl, description: 'Production' },
                    { url: `http://localhost:${env.PORT}`, description: 'Local' }
                ];
            })(),
            tags: [
                {
                    name: 'health',
                    description: 'Health check and system status endpoints'
                },
                {
                    name: 'Auth',
                    description: 'Login, register, OTP verification'
                },
                {
                    name: 'Users',
                    description: 'User management, profile, and live location'
                },
                {
                    name: 'Listings',
                    description: 'Property listings (create requires JWT, includes nearby search)'
                },
                {
                    name: 'Maps',
                    description: 'Google Maps integration: address autocomplete, place details, reverse geocoding'
                }
            ],
            components: {
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                        description: 'Enter your JWT token'
                    },
                    apiKey: {
                        type: 'apiKey',
                        name: 'X-API-Key',
                        in: 'header',
                        description: 'API key for authentication'
                    }
                },
                schemas: {
                    // Base API Response
                    ApiResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            message: { type: 'string', example: 'Success' },
                            statusCode: { type: 'integer', example: 200 },
                            requestId: { type: 'string', example: 'req-1' },
                            data: { type: 'object' }
                        }
                    },
                    // Success Response (200)
                    SuccessResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            message: { type: 'string', example: 'Success' },
                            statusCode: { type: 'integer', example: 200 },
                            requestId: { type: 'string' },
                            data: { type: 'object' }
                        }
                    },
                    // Created Response (201)
                    CreatedResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            message: { type: 'string', example: 'Created successfully' },
                            statusCode: { type: 'integer', example: 201 },
                            requestId: { type: 'string' },
                            data: { type: 'object' }
                        }
                    },
                    // Bad Request Response (400)
                    BadRequestResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            message: { type: 'string', example: 'Bad Request' },
                            statusCode: { type: 'integer', example: 400 },
                            requestId: { type: 'string' }
                        }
                    },
                    // Unauthorized Response (401)
                    UnauthorizedResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            message: { type: 'string', example: 'Unauthorized' },
                            statusCode: { type: 'integer', example: 401 },
                            requestId: { type: 'string' }
                        }
                    },
                    // Forbidden Response (403)
                    ForbiddenResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            message: { type: 'string', example: 'Forbidden' },
                            statusCode: { type: 'integer', example: 403 },
                            requestId: { type: 'string' }
                        }
                    },
                    // Not Found Response (404)
                    NotFoundResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            message: { type: 'string', example: 'Not Found' },
                            statusCode: { type: 'integer', example: 404 },
                            requestId: { type: 'string' }
                        }
                    },
                    // Conflict Response (409)
                    ConflictResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            message: { type: 'string', example: 'Conflict' },
                            statusCode: { type: 'integer', example: 409 },
                            requestId: { type: 'string' }
                        }
                    },
                    // Unprocessable Entity Response (422)
                    UnprocessableEntityResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            message: { type: 'string', example: 'Unprocessable Entity' },
                            statusCode: { type: 'integer', example: 422 },
                            requestId: { type: 'string' },
                            errors: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        field: { type: 'string' },
                                        message: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    // Too Many Requests Response (429)
                    TooManyRequestsResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            message: { type: 'string', example: 'Too Many Requests' },
                            statusCode: { type: 'integer', example: 429 },
                            requestId: { type: 'string' }
                        }
                    },
                    // Internal Server Error Response (500)
                    InternalServerErrorResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            message: { type: 'string', example: 'Internal Server Error' },
                            statusCode: { type: 'integer', example: 500 },
                            requestId: { type: 'string' }
                        }
                    },
                    // Service Unavailable Response (503)
                    ServiceUnavailableResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: false },
                            message: { type: 'string', example: 'Service Unavailable' },
                            statusCode: { type: 'integer', example: 503 },
                            requestId: { type: 'string' }
                        }
                    },
                    // Health Check Response
                    HealthCheckResponse: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            message: { type: 'string', example: 'Health check successful' },
                            statusCode: { type: 'integer', example: 200 },
                            requestId: { type: 'string' },
                            data: {
                                type: 'object',
                                properties: {
                                    status: { type: 'string', example: 'ok' },
                                    uptime: { type: 'number', example: 123.45 },
                                    services: {
                                        type: 'object',
                                        properties: {
                                            database: { type: 'string', example: 'connected' }
                                        }
                                    },
                                    timestamp: { type: 'string', example: '2026-02-18' }
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    // Register Swagger UI with enhanced configuration
    await app.register(fastifySwaggerUi, {
        routePrefix: '/documentation',
        uiConfig: {
            docExpansion: 'list', // 'list', 'full', or 'none'
            deepLinking: true,
            displayRequestDuration: true,
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
            syntaxHighlight: {
                activate: true,
                theme: 'monokai'
            },
            tryItOutEnabled: true,
            persistAuthorization: true,
            displayOperationId: false,
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            validatorUrl: null
        },
        uiHooks: {
            onRequest: function (_request: any, _reply: any, next: () => void) {
                next();
            },
            preHandler: function (_request: any, _reply: any, next: () => void) {
                next();
            }
        },
        staticCSP: false,
        transformSpecification: (swaggerObject: any, request: any, _reply: any) => {
            // Use request origin only; paths already include `/api/v1`
            const host = request?.headers?.host;
            const proto = request?.headers?.['x-forwarded-proto'] || (request?.protocol === 'https' ? 'https' : 'http');
            if (host) {
                const baseUrl = `${proto}://${host}`;
                swaggerObject.servers = [{ url: baseUrl, description: 'This server' }];
            }
            // Transform isFile properties to proper OpenAPI 3.0 binary format
            if (swaggerObject.paths) {
                for (const path of Object.values(swaggerObject.paths) as any[]) {
                    for (const method of Object.values(path) as any[]) {
                        if (method.requestBody?.content?.['application/json']?.schema?.properties) {
                            const props = method.requestBody.content['application/json'].schema.properties;
                            let hasFile = false;
                            for (const [key, value] of Object.entries(props) as [string, any][]) {
                                if (value.isFile) {
                                    props[key] = { type: 'string', format: 'binary' };
                                    hasFile = true;
                                }
                            }
                            if (hasFile) {
                                method.requestBody.content['multipart/form-data'] = method.requestBody.content['application/json'];
                                delete method.requestBody.content['application/json'];
                            }
                        }
                    }
                }
            }
            return swaggerObject;
        },
        transformSpecificationClone: true
    });

    // Register Scalar API Reference (Modern UI with form inputs like Postman)
    await app.register(scalarFastify, {
        routePrefix: '/reference',
        configuration: {
            title: 'Live Bhoomi API',
            theme: 'purple',
            layout: 'modern',
            defaultHttpClient: {
                targetKey: 'node',
                clientKey: 'fetch',
            },
            hideModels: false,
            hideDownloadButton: false,
            darkMode: true,
            forceDarkModeState: 'dark',
            showSidebar: true,
            searchHotKey: 'k',
        },
    });

    app.log.info('📝 Swagger UI available at /documentation');
    app.log.info('🎨 Scalar API Reference available at /reference');
    app.log.info('📋 JSON schema available at /documentation/json');
}
