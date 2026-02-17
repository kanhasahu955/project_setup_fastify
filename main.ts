import Fastify, { FastifyInstance } from 'fastify';
import { registerLogger, loggerConfig } from '@/plugins/logger.plugin';
import { registerSwagger } from '@/plugins/swagger.plugin';
import { connectPrisma, disconnectPrisma } from '@/config/prisma.config';
import { registerRoutes } from '@/routes';
import { env } from "@/config/env.config";
import { registerSecurity } from '@/plugins/cors.plugin';
import { certificatesExist, loadCertificates, getCertificatePaths } from '@/config/certificate.config';
import requestResponsePlugin from '@/plugins/request-response.plugin';


class Application {
    private app: FastifyInstance;
    private port: number;
    private host: string;
    private useHttps: boolean;

    constructor(port: number = 3000, host: string = '0.0.0.0', useHttps: boolean = false) {
        this.port = port;
        this.host = host;
        this.useHttps = useHttps;
        
        // Check certificates if HTTPS is enabled
        if (this.useHttps) {
            this.validateCertificates();
        }
        
        this.app = this.initializeFastify();
        this.setupSignalHandlers();
    }

    private validateCertificates(): void {
        if (!certificatesExist()) {
            const paths = getCertificatePaths();
            console.error(`
    ❌ SSL Certificates not found!
    
    HTTPS is enabled but certificates are missing.
    
    Please generate certificates first by running:
        npm run generate:cert
    
    Expected location: ${paths.certDir}
    - server.key
    - server.crt
    
    Or disable HTTPS by setting USE_HTTPS=false in .env
            `);
            process.exit(1);
        }
    }

    private initializeFastify(): FastifyInstance {
        const options: any = {
            logger: loggerConfig,
            disableRequestLogging: true,
            ajv: {
                customOptions: {
                    removeAdditional: 'all',
                    coerceTypes: true,
                    useDefaults: true,
                    keywords: ['example']
                }
            }
        };

        // Add HTTPS configuration if enabled
        if (this.useHttps) {
            const certs = loadCertificates();
            options.https = {
                key: certs.key,
                cert: certs.cert
            };
        }

        const app = Fastify(options) as unknown as FastifyInstance;
        app.register(registerLogger);
        return app;
    }

    private setupSignalHandlers(): void {
        process.on('SIGINT', () => this.closeGracefully('SIGINT'));
        process.on('SIGTERM', () => this.closeGracefully('SIGTERM'));
    }

    private async closeGracefully(signal: string): Promise<void> {
        this.app.log.info(`Received signal to terminate: ${signal}`);
        await this.app.close();
        await disconnectPrisma(this.app.log);
        process.exit(0);
    }

    private async registerAppPlugins(): Promise<void> {
        this.app.log.info('Registering security...');
        await registerSecurity(this.app);

        this.app.log.info('Connecting Prisma...');
        await connectPrisma(this.app.log);

        this.app.log.info('Registering Swagger...');
        await registerSwagger(this.app);

        this.app.log.info('Registering Request/Response Plugin...');
        await this.app.register(requestResponsePlugin);

        this.app.log.info('Registering routes...');
        await this.app.register(registerRoutes, { prefix: '/api/v1' });
    }

    private async startServer(): Promise<void> {
        await this.app.listen({ port: this.port, host: this.host });

        const protocol = this.useHttps ? 'https' : 'http';
        this.app.log.info(`
            🚀 Server is running!
            🔒 HTTPS: ${this.useHttps ? 'Enabled' : 'Disabled'}
            📝 API Documentation: ${protocol}://localhost:${this.port}/documentation
            🏥 Health Check: ${protocol}://localhost:${this.port}/api/v1/health
            🌍 Environment: ${env.NODE_ENV}
        `);
    }

    public async start(): Promise<void> {
        try {
            await this.registerAppPlugins();
            await this.startServer();
        } catch (error) {
            this.app.log.error(error);
            await disconnectPrisma(this.app.log);
            process.exit(1);
        }
    }
}


const PORT = env.PORT;
const HOST = env.HOST;
const USE_HTTPS = env.USE_HTTPS;

const application = new Application(PORT, HOST, USE_HTTPS);
application.start();
