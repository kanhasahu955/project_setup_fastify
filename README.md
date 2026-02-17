# Live Bhoomi Backend API

A modern, high-performance RESTful API built with **Fastify**, **TypeScript**, **Prisma**, and **MongoDB**.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [SSL/HTTPS Configuration](#sslhttps-configuration)
- [API Documentation](#api-documentation)
- [HTTP Client Testing](#http-client-testing)
- [HTTP Status Codes](#http-status-codes)
- [Response Helpers](#response-helpers)
- [Health Check Endpoints](#health-check-endpoints)
- [Scripts](#scripts)

---

## Features

- 🚀 **High-performance** Fastify framework
- 📝 **Automatic API documentation** with Swagger/OpenAPI
- 🔒 **Type-safe** with TypeScript
- 💾 **MongoDB database** with Prisma ORM
- 📊 **Colorized logging** with Pino
- 🔄 **Hot reload** in development
- 🔐 **SSL/HTTPS support** with self-signed certificates
- 🛡️ **Security** with Helmet, CORS, Rate Limiting
- 🔑 **JWT Authentication** with cookie support
- 📋 **HTTP Client files** for API testing

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Fastify](https://www.fastify.io/) | Web framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Prisma](https://www.prisma.io/) | Database ORM |
| [MongoDB](https://www.mongodb.com/) | Database |
| [Zod](https://zod.dev/) | Schema validation |
| [Pino](https://getpino.io/) | Logging |
| [Swagger](https://swagger.io/) | API documentation |

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm or yarn
- MongoDB database

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

### Quick Start

```bash
# Start with HTTP (default)
npm run dev

# Start with HTTPS (requires certificates)
npm run generate:cert  # First time only
npm run dev:https
```

---

## Project Structure

```
backend/
├── certificates/          # SSL certificates (git-ignored)
│   ├── server.key
│   └── server.crt
├── http/                   # HTTP client test files
│   ├── globals.http        # Global variables
│   ├── health.http         # Health check requests
│   ├── api.http            # API request templates
│   └── http-client.env.json # Environment configs
├── scripts/
│   └── generate-cert.ts    # SSL certificate generator
├── src/
│   ├── @types/             # TypeScript type definitions
│   ├── config/
│   │   ├── env.config.ts           # Environment configuration
│   │   ├── prisma.config.ts        # Prisma client setup
│   │   └── certificate.config.ts   # SSL certificate utilities
│   ├── helpers/
│   │   └── httpStatus.ts           # Response helper utilities
│   ├── hooks/              # Fastify hooks
│   ├── plugins/
│   │   ├── cors.plugin.ts          # CORS & security setup
│   │   ├── logger.plugin.ts        # Pino logger config
│   │   ├── swagger.plugin.ts       # Swagger documentation
│   │   └── request-response.plugin.ts
│   ├── routes/
│   │   ├── index.ts                # Route registration
│   │   └── health.route.ts         # Health check endpoints
│   └── utils/
│       ├── httpStatusCodes.util.ts # HTTP status code constants
│       ├── date.util.ts            # Date utilities
│       └── lodash.util.ts          # Lodash utilities
├── tests/                  # Test files
├── main.ts                 # Application entry point
├── package.json
├── tsconfig.json
└── .env
```

---

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/database"

# Logging
LOG_LEVEL=info

# CORS
FRONTEND_URL=http://localhost:3000,http://localhost:5173

# Security
COOKIE_SECRET=your-cookie-secret
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1d

# SSL/HTTPS (optional)
USE_HTTPS=false
```

---

## SSL/HTTPS Configuration

### Generate Self-Signed Certificates

```bash
npm run generate:cert
```

This creates:
- `certificates/server.key` - Private key
- `certificates/server.crt` - Certificate

### Enable HTTPS

1. Set in `.env`:
   ```env
   USE_HTTPS=true
   ```

2. Start the server:
   ```bash
   npm run dev
   # or
   npm run dev:https
   ```

### Certificate Details

- **Valid for:** 365 days
- **Common Name:** localhost
- **Subject Alternative Names:** localhost, *.localhost, 127.0.0.1, 0.0.0.0

> ⚠️ **Note:** Self-signed certificates will show a browser warning. This is normal for development. For production, use certificates from a trusted CA (Let's Encrypt, etc.).

---

## API Documentation

### Swagger UI

Access interactive API documentation at:

- **HTTP:** http://localhost:8000/documentation
- **HTTPS:** https://localhost:8000/documentation

### Available Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/documentation` | GET | Swagger UI |
| `/documentation/json` | GET | OpenAPI JSON schema |
| `/documentation/yaml` | GET | OpenAPI YAML schema |
| `/api/v1/health` | GET | Quick health check |
| `/api/v1/health?detailed=true` | GET | Health check with DB status |
| `/api/v1/health/detailed` | GET | Detailed system health |

---

## HTTP Client Testing

The `http/` folder contains REST Client compatible files for testing APIs.

### Files

| File | Purpose |
|------|---------|
| `globals.http` | Shared variables (baseUrl, auth tokens) |
| `health.http` | Health check endpoint tests |
| `api.http` | CRUD operation templates |
| `http-client.env.json` | Environment configurations |

### Usage with VS Code/Cursor

1. Install the **REST Client** extension
2. Open any `.http` file
3. Click "Send Request" above each request

### Usage with CLI (httpyac)

```bash
# Run all health check requests
npm run http:health

# Run all HTTP files
npm run http

# Run specific file
npx httpyac http/health.http --all
```

### Environment Selection

The `http-client.env.json` supports multiple environments:

```json
{
  "development": {
    "baseUrl": "http://localhost:8000"
  },
  "staging": {
    "baseUrl": "https://staging.example.com"
  },
  "production": {
    "baseUrl": "https://api.example.com"
  }
}
```

---

## HTTP Status Codes

A comprehensive utility for HTTP status codes is available at `src/utils/httpStatusCodes.util.ts`.

### Usage

```typescript
import { 
  HttpStatusCode, 
  HTTP_OK, 
  HTTP_NOT_FOUND,
  getStatusMessage,
  isSuccess,
  isClientError 
} from '@/utils/httpStatusCodes.util';

// Using constants
reply.code(HTTP_OK).send(data);
reply.code(HTTP_NOT_FOUND).send({ error: 'Not found' });

// Using object notation
reply.code(HttpStatusCode.CREATED).send(data);
reply.code(HttpStatusCode.UNAUTHORIZED).send({ error: 'Unauthorized' });

// Helper functions
getStatusMessage(404);     // "Not Found"
isSuccess(200);            // true
isClientError(404);        // true
isServerError(500);        // true
```

### Available Status Codes

| Category | Codes |
|----------|-------|
| **1xx Informational** | 100-103 |
| **2xx Success** | 200-226 |
| **3xx Redirection** | 300-308 |
| **4xx Client Error** | 400-451 |
| **5xx Server Error** | 500-511 |

---

## Response Helpers

Use `FastifyResponseHelper` for consistent API responses.

### Import

```typescript
import { FastifyResponseHelper } from '@/helpers/httpStatus';
```

### Available Methods

#### Success Responses (2xx)

```typescript
// 200 OK
FastifyResponseHelper.ok(reply, data, 'Success message', request);

// 201 Created
FastifyResponseHelper.created(reply, data, 'Created successfully', request);

// 202 Accepted
FastifyResponseHelper.accepted(reply, data, 'Accepted', request);

// 204 No Content
FastifyResponseHelper.noContent(reply);
```

#### Client Error Responses (4xx)

```typescript
// 400 Bad Request
FastifyResponseHelper.badRequest(reply, 'Invalid input', request);

// 401 Unauthorized
FastifyResponseHelper.unauthorized(reply, 'Please login', request);

// 403 Forbidden
FastifyResponseHelper.forbidden(reply, 'Access denied', request);

// 404 Not Found
FastifyResponseHelper.notFound(reply, 'Resource not found', request);

// 409 Conflict
FastifyResponseHelper.conflict(reply, 'Already exists', request);

// 422 Unprocessable Entity
FastifyResponseHelper.unprocessableEntity(reply, 'Validation failed', request);

// 429 Too Many Requests
FastifyResponseHelper.tooManyRequests(reply, 'Rate limit exceeded', request);
```

#### Server Error Responses (5xx)

```typescript
// 500 Internal Server Error
FastifyResponseHelper.internalServerError(reply, 'Something went wrong', request);

// 503 Service Unavailable
FastifyResponseHelper.serviceUnavailable(reply, 'Service down', request);
```

#### Generic Response

```typescript
// Any status code
FastifyResponseHelper.send(reply, 418, data, "I'm a teapot", request);
```

### Response Format

All responses follow this structure:

```json
{
  "success": true,
  "message": "Success",
  "statusCode": 200,
  "requestId": "req-1",
  "data": { ... }
}
```

---

## Health Check Endpoints

### Quick Health Check

**Endpoint:** `GET /api/v1/health`

**Response Time:** ~1-5ms

```json
{
  "success": true,
  "message": "Health check successful",
  "statusCode": 200,
  "data": {
    "status": "ok",
    "uptime": 123.45,
    "timestamp": "2026-02-18"
  }
}
```

### Health Check with Database Status

**Endpoint:** `GET /api/v1/health?detailed=true`

**Response Time:** ~50-200ms (cached for 10 seconds)

```json
{
  "success": true,
  "message": "Health check successful",
  "statusCode": 200,
  "data": {
    "status": "ok",
    "uptime": 123.45,
    "services": {
      "database": "connected"
    },
    "timestamp": "2026-02-18"
  }
}
```

### Detailed System Health

**Endpoint:** `GET /api/v1/health/detailed`

```json
{
  "success": true,
  "message": "Detailed health check",
  "statusCode": 200,
  "data": {
    "status": "ok",
    "uptime": 123.45,
    "services": {
      "database": "connected"
    },
    "memory": {
      "used": "45 MB",
      "total": "128 MB"
    },
    "timestamp": "2026-02-18"
  }
}
```

---

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (HTTP) |
| `npm run dev:https` | Start development server (HTTPS) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run start:prod` | Start production server with NODE_ENV=production |
| `npm run build:check` | Type check without building |
| `npm run clean` | Remove dist folder |
| `npm run generate:cert` | Generate SSL certificates |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:push` | Push schema to database |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage |
| `npm run http` | Run all HTTP client tests |
| `npm run http:health` | Run health check HTTP tests |
| `npm run http:api` | Run API HTTP tests |

---

## Deployment

### Build for Production

```bash
# Install dependencies
npm ci

# Generate Prisma client
npm run prisma:generate

# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t livebhoomi-api .

# Run container
docker run -d \
  --name livebhoomi-api \
  -p 8000:8000 \
  -e DATABASE_URL="your-mongodb-url" \
  -e JWT_SECRET="your-jwt-secret" \
  -e COOKIE_SECRET="your-cookie-secret" \
  livebhoomi-api
```

### Docker Compose

```bash
# Create .env file with your configuration
cp .env.example .env

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Deployment Platforms

The application can be deployed to:

| Platform | Method |
|----------|--------|
| **Railway** | Connect GitHub repo, set env vars |
| **Render** | Docker or Node.js runtime |
| **Fly.io** | `fly launch` with Dockerfile |
| **DigitalOcean App Platform** | Connect GitHub repo |
| **AWS ECS/Fargate** | Use Dockerfile |
| **Google Cloud Run** | Use Dockerfile |
| **Azure Container Apps** | Use Dockerfile |
| **Heroku** | Add Procfile: `web: npm run start:prod` |

### Production Environment Variables

```env
NODE_ENV=production
PORT=8000
HOST=0.0.0.0
DATABASE_URL=mongodb+srv://...
LOG_LEVEL=info
FRONTEND_URL=https://your-frontend.com
COOKIE_SECRET=<generate-secure-random-string>
JWT_SECRET=<generate-secure-random-string>
JWT_EXPIRES_IN=1d
USE_HTTPS=false  # Set true if handling HTTPS at app level
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong secrets for `JWT_SECRET` and `COOKIE_SECRET`
- [ ] Configure proper `FRONTEND_URL` for CORS
- [ ] Set up database connection with proper credentials
- [ ] Configure SSL/TLS (via reverse proxy or `USE_HTTPS=true`)
- [ ] Set up logging and monitoring
- [ ] Configure rate limiting for your needs
- [ ] Set up health check monitoring

---

## Security Features

- **Helmet** - Security headers
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - 100 requests per minute
- **JWT Authentication** - With cookie support
- **HTTPS/SSL** - Self-signed certificates for development

---

## License

ISC

---

## Support

For support, email support@livebhoomi.com or create an issue in the repository.
