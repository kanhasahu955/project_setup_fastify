# Live Bhoomi Backend API

A modern, high-performance **RESTful API** and **GraphQL API** built with **Fastify**, **TypeScript**, **Prisma**, and optional **Redis** caching.

## 🚀 Features

- 🚀 **High-performance** Fastify framework
- 📝 **Dual API** – REST and GraphQL (Mercurius)
- 📚 **API docs** – Swagger UI and Scalar Reference (server URL follows request host in production)
- 🔒 **Type-safe** TypeScript
- 💾 **Multi-database** – MongoDB, MySQL, or PostgreSQL via Prisma
- 📦 **Redis caching** – optional; in-memory fallback when `REDIS_URL` is not set
- 🔌 **Socket.IO** – same HTTP server; rooms for chat, `live:update` for real-time DB updates (aligned with `live_bhoomi_ui` hooks)
- 🔐 **OTP-based auth** with email verification
- 🆔 **KYC** (Aadhar & PAN)
- 📊 **Pino** logging, **Helmet**, **CORS**, rate limiting
- 🔑 **JWT** with cookie support
- 📸 **ImageKit** image uploads
- 📧 **Email** (Resend/Nodemailer)
- 🔐 **SSL/HTTPS** (self-signed certs for dev)
- 📋 **HTTP client** files for testing

---

## 📋 Table of Contents

- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [API Documentation](#-api-documentation)
- [REST API Endpoints](#-rest-api-endpoints)
- [GraphQL API](#-graphql-api)
- [Authentication](#-authentication)
- [KYC Verification](#-kyc-verification)
- [Image Upload](#-image-upload)
- [Scripts](#-scripts)
- [Redis caching](#-redis-caching)
- [Socket.IO](#-socketio)
- [Deployment](#-deployment)
- [Releases & versioning](#-releases--versioning)

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| [Fastify](https://www.fastify.io/) | Web framework |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Prisma](https://www.prisma.io/) | Database ORM |
| [MongoDB](https://www.mongodb.com/) | Database |
| [GraphQL](https://graphql.org/) | GraphQL API |
| [Mercurius](https://mercurius.dev/) | Fastify GraphQL adapter |
| [Zod](https://zod.dev/) | Schema validation |
| [Pino](https://getpino.io/) | Logging |
| [Swagger](https://swagger.io/) | API documentation |
| [Scalar](https://github.com/scalar/scalar) | Modern API reference UI |
| [Redis](https://redis.io/) / [ioredis](https://github.com/redis/ioredis) | Caching (optional) |
| [ImageKit](https://imagekit.io/) | Image hosting |
| [Resend](https://resend.com/) | Email service |
| [JWT](https://jwt.io/) | Authentication |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18
- **npm**
- **Database**: MongoDB, MySQL, or PostgreSQL (see [Database Setup](#-database-setup))
- **Redis** (optional; for caching; omit `REDIS_URL` to use in-memory cache)

### Installation

```bash
# From repo root
cd fastify_backend

# Install dependencies
npm install

# Environment
cp .env.example .env
# Edit .env: DATABASE_TYPE, DATABASE_URL (or DATABASE_URL_MONGODB / _MYSQL / _POSTGRES), etc.

# Generate Prisma client for your DB (one of)
npm run prisma:generate:mongodb
npm run prisma:generate:mysql
npm run prisma:generate:postgresql

# Push schema
npm run prisma:push:postgresql   # or :mongodb / :mysql

# Start dev server
npm run dev:postgresql           # or dev, dev:mongodb, dev:mysql
```

### Quick start

```bash
# HTTP (default) – uses DATABASE_TYPE from .env
npm run dev

# Specific DB
npm run dev:postgresql
npm run dev:mongodb
npm run dev:mysql

# HTTPS (generate certs first)
npm run generate:cert
npm run dev:https
```

---

## 📁 Project structure

```
fastify_backend/
├── certificates/           # SSL certs (git-ignored)
├── http/                   # HTTP client test files
├── prisma/
│   ├── schema.mongodb.prisma
│   ├── schema.mysql.prisma
│   └── schema.postgres.prisma
├── scripts/
│   ├── generate-cert.ts
│   └── setup-database.ts
├── src/
│   ├── @types/
│   ├── config/             # env, prisma, firebase, imagekit, certificate
│   ├── controllers/
│   ├── graphql/            # schema, resolvers
│   ├── plugins/            # cors, logger, swagger, graphql, multipart, redis
│   ├── routes/              # health, user, imagekit, storage
│   ├── schemas/
│   ├── services/
│   ├── types/
│   └── validations/
├── main.ts
├── render.yaml             # Render Blueprint
├── render-start.sh         # Start script for Render (monorepo)
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── .env.example
├── README.md
├── RENDER.md               # Deploy on Render
└── DATABASE_SETUP.md
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=8000
HOST=0.0.0.0
NODE_ENV=development

# Database (MongoDB with Replica Set)
DATABASE_URL=mongodb://127.0.0.1:27017/livebhoomi?replicaSet=rs0&directConnection=true

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

# API URL (production; Render uses RENDER_EXTERNAL_URL if unset)
# API_URL=https://live-bhoomi.onrender.com

# Redis (optional – leave empty for in-memory cache)
# REDIS_URL=redis://localhost:6379

# Email (SMTP – e.g. Gmail)
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM_NAME=Live Bhoomi
# Optional: SMTP_HOST=smtp.gmail.com SMTP_PORT=587 MAIL_FROM_EMAIL=your-email@gmail.com

# ImageKit
IMAGEKIT_PRIVATE_KEY=private_your_key
IMAGEKIT_PUBLIC_KEY=public_your_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id/
```

---

## 🗄️ Database setup

The API supports **MongoDB**, **MySQL**, or **PostgreSQL**. Set `DATABASE_TYPE` and the matching URL in `.env`.

| DB | Env vars | Generate & push |
|----|----------|------------------|
| PostgreSQL | `DATABASE_TYPE=postgresql`, `DATABASE_URL` or `DATABASE_URL_POSTGRES` | `prisma:generate:postgresql`, `prisma:push:postgresql` |
| MySQL | `DATABASE_TYPE=mysql`, `DATABASE_URL_MYSQL` | `prisma:generate:mysql`, `prisma:push:mysql` |
| MongoDB | `DATABASE_TYPE=mongodb`, `DATABASE_URL_MONGODB` | `prisma:generate:mongodb`, `prisma:push:mongodb` |

**MongoDB:** Prisma needs a replica set for transactions. Use MongoDB Atlas (replica set by default) or run local MongoDB with `--replSet rs0` and `rs.initiate()` in mongosh.

Full steps: **[DATABASE_SETUP.md](DATABASE_SETUP.md)**.

```bash
# Example: PostgreSQL
npm run prisma:generate:postgresql
npm run prisma:push:postgresql
npx prisma studio --schema=prisma/schema.postgres.prisma
```

---

## 📚 API documentation

### REST

- **Swagger UI**: http://localhost:8000/documentation  
- **Scalar API Reference**: http://localhost:8000/reference  
- **OpenAPI JSON**: http://localhost:8000/documentation/json  

In production (e.g. https://live-bhoomi.onrender.com), the server URL in Swagger/Scalar is set from the request host, so "Try it out" uses the correct base URL.

### GraphQL

- **Endpoint**: http://localhost:8000/graphql  
- **GraphiQL**: http://localhost:8000/graphiql

---

## 🔌 REST API Endpoints

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/register` | POST | Register new user (sends OTP) |
| `/api/v1/auth/verify-otp` | POST | Verify OTP and complete registration |
| `/api/v1/auth/resend-otp` | POST | Resend OTP to email |
| `/api/v1/auth/login` | POST | Login with email/phone & password |

### Users

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/users/me` | GET | Get current user |
| `/api/v1/users` | GET | List users (with filters) |
| `/api/v1/users/:id` | GET | Get user by ID |
| `/api/v1/users/:id` | PATCH | Update user |
| `/api/v1/users/:id` | DELETE | Delete user |
| `/api/v1/users/:id/password` | PATCH | Update password |
| `/api/v1/users/:id/block` | PATCH | Block user (admin) |
| `/api/v1/users/:id/unblock` | PATCH | Unblock user (admin) |
| `/api/v1/users/:id/verify` | PATCH | Verify user email (admin) |
| `/api/v1/users/:id/role` | PATCH | Update user role (admin) |
| `/api/v1/users/stats` | GET | Get user statistics |

### Profile

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/users/:id/profile` | GET | Get user profile |
| `/api/v1/users/:id/profile` | PUT | Create/update profile |

### KYC

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/users/:id/kyc/aadhar` | POST | Submit Aadhar card details |
| `/api/v1/users/:id/kyc/pan` | POST | Submit PAN card details |
| `/api/v1/users/:id/kyc` | GET | Get KYC status |
| `/api/v1/users/:id/kyc/verify` | PATCH | Verify KYC (admin) |

### Image Upload (ImageKit)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/images/upload` | POST | Upload single image |
| `/api/v1/images/upload/multiple` | POST | Upload multiple images |
| `/api/v1/images/upload/url` | POST | Upload from URL |
| `/api/v1/images/delete` | DELETE | Delete image |
| `/api/v1/images/list` | GET | List images |
| `/api/v1/images/auth` | GET | Get auth params for client upload |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/health` | GET | Quick health check |
| `/api/v1/health?detailed=true` | GET | Health check with DB status |
| `/api/v1/health/detailed` | GET | Detailed system health |

---

## 🔷 GraphQL API

### Queries

#### User Queries
```graphql
query {
  me {
    id
    name
    email
    role
    kyc {
      kycStatus
      isAadharVerified
      isPanVerified
    }
  }
  
  users(input: { page: 1, limit: 10 }) {
    data {
      id
      name
      email
    }
    pagination {
      total
      totalPages
    }
  }
  
  userStats {
    total
    verified
    byRole {
      BUYER
      SELLER
      AGENT
    }
  }
}
```

#### Listing Queries
```graphql
query {
  listings(input: {
    city: "Mumbai"
    listingType: SALE
    propertyType: APARTMENT
    limit: 10
  }) {
    data {
      id
      title
      price
      propertyType
      owner { name }
      images { url }
    }
    pagination { total }
  }
  
  listing(id: "listing-id") {
    id
    title
    description
    price
    amenities {
      amenity { name }
    }
  }
  
  featuredListings(limit: 5) {
    id
    title
    price
  }
}
```

#### Project Queries
```graphql
query {
  projects(input: { city: "Mumbai", limit: 10 }) {
    data {
      id
      name
      city
      builder { name }
    }
  }
}
```

### Mutations

#### Authentication
```graphql
mutation {
  register(input: {
    name: "John Doe"
    email: "john@example.com"
    phone: "9876543210"
    password: "Password123!"
  }) {
    message
    email
  }
  
  verifyOtp(input: {
    email: "john@example.com"
    otp: "123456"
  }) {
    user { id name }
    token
  }
  
  login(input: {
    identifier: "john@example.com"
    password: "Password123!"
  }) {
    user { id name }
    token
  }
}
```

#### Create Listing
```graphql
mutation {
  createListing(input: {
    title: "3BHK Apartment in Mumbai"
    description: "Beautiful apartment..."
    price: 15000000
    listingType: SALE
    propertyType: APARTMENT
    city: "Mumbai"
    locality: "Andheri"
    state: "Maharashtra"
    latitude: 19.1136
    longitude: 72.8697
    amenityIds: ["amenity-id-1", "amenity-id-2"]
    images: [
      { url: "https://...", isPrimary: true }
    ]
  }) {
    id
    slug
    status
  }
}
```

#### KYC Submission
```graphql
mutation {
  submitAadharKyc(userId: "user-id", input: {
    aadharNumber: "123456789012"
    aadharName: "John Doe"
    aadharDob: "01-01-1990"
    aadharDocUrl: "https://..."
  }) {
    kycStatus
    isAadharVerified
  }
  
  submitPanKyc(userId: "user-id", input: {
    panNumber: "ABCDE1234F"
    panName: "John Doe"
    panDocUrl: "https://..."
  }) {
    kycStatus
    isPanVerified
  }
}
```

### Using GraphQL with Authentication

1. **Login to get token:**
```graphql
mutation {
  login(input: {
    identifier: "your@email.com"
    password: "YourPassword123!"
  }) {
    token
  }
}
```

2. **Add Authorization header:**
   - Header: `Authorization: Bearer <your-token>`

3. **Run authenticated mutations:**
```graphql
mutation {
  createListing(input: { ... }) {
    id
  }
}
```

---

## 🔐 Authentication

### Registration Flow

1. **Register** - User provides name, email, phone, password
2. **OTP Sent** - System generates 6-digit OTP and sends to email
3. **Verify OTP** - User verifies OTP to complete registration
4. **JWT Token** - System returns JWT token for authenticated requests

### Login Flow

1. **Login** - User provides email/phone and password
2. **Validation** - System validates credentials
3. **JWT Token** - System returns JWT token

### Using JWT Token

Add to request headers:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🆔 KYC Verification

### Supported Documents

- **Aadhar Card** - 12-digit Aadhar number
- **PAN Card** - 10-character PAN number

### KYC Status Flow

1. **PENDING** - User hasn't submitted any documents
2. **SUBMITTED** - User submitted documents, awaiting verification
3. **UNDER_REVIEW** - Admin is reviewing documents
4. **VERIFIED** - Documents verified and approved
5. **REJECTED** - Documents rejected (with remarks)

### Submit KYC (REST)

```bash
POST /api/v1/users/:id/kyc/aadhar
Content-Type: application/json

{
  "aadharNumber": "123456789012",
  "aadharName": "John Doe",
  "aadharDob": "01-01-1990",
  "aadharDocUrl": "https://..."
}
```

### Submit KYC (GraphQL)

```graphql
mutation {
  submitAadharKyc(userId: "user-id", input: {
    aadharNumber: "123456789012"
    aadharName: "John Doe"
    aadharDob: "01-01-1990"
  }) {
    kycStatus
  }
}
```

---

## 📸 Image Upload

### Using ImageKit

#### Upload Single Image (REST)

```bash
POST /api/v1/images/upload
Content-Type: multipart/form-data

file: <image-file>
folder: /listings (optional)
```

#### Upload Multiple Images (REST)

```bash
POST /api/v1/images/upload/multiple
Content-Type: multipart/form-data

files: <image-file-1>
files: <image-file-2>
folder: /listings (optional)
```

#### Get Auth Params for Client Upload

```bash
GET /api/v1/images/auth
```

Returns authentication parameters for direct client-side uploads to ImageKit.

---

## 📦 Redis caching

When `REDIS_URL` is set, the app uses Redis for caching; otherwise it uses an in-memory store (fine for local dev).

**Usage in routes:** `app.cache` (decorated by the Redis plugin).

```ts
// String
await this.cache.set('key', 'value', 300);  // optional TTL seconds
const val = await this.cache.get('key');

// JSON
await this.cache.setJson('user:1', { name: 'Jane' }, 300);
const user = await this.cache.getJson<{ name: string }>('user:1');

await this.cache.del('key');
await this.cache.delByPattern('user:*');
```

**Raw client (when Redis connected):** `app.redis` (null when using in-memory).

See `src/plugins/redis.plugin.ts` and `.env.example` for `REDIS_URL`.

---

## 🔌 Socket.IO

Socket.IO is attached to the same HTTP server (no extra port). It is used by **live_bhoomi_ui** for live DB updates and chat.

**Events (aligned with `live_bhoomi_ui/src/socket/events.ts`):**

| Event        | Direction   | Description                                      |
|-------------|-------------|--------------------------------------------------|
| `joinRoom`  | client → server | Join a room (e.g. chat or entity room)       |
| `leaveRoom` | client → server | Leave a room                                |
| `message`   | client ↔ server | Chat message (server broadcasts to room)     |
| `typing`    | client ↔ server | Typing indicator (server broadcasts to room) |
| `live:update` | server → client | Broadcast DB/entity updates (emit from routes) |

**Emitting live updates from a route or service:**

```ts
// In any route or service where you have the Fastify instance (e.g. request.server in a route, or this.app in a controller)
import { SOCKET_LIVE_UPDATE } from '@/socket/events'

// To all connected clients
this.app.io.emit(SOCKET_LIVE_UPDATE, { type: 'user', id: '123', payload: user })

// To a specific room (e.g. after client joined via joinRoom)
this.app.io.to(roomId).emit(SOCKET_LIVE_UPDATE, { type: 'order', id: orderId, payload: order })
```

CORS for Socket.IO uses `FRONTEND_URL` (and in production `API_URL` / Render URL). No extra env is required; the UI connects to the same host as the API.

---

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server (HTTP; uses DATABASE_TYPE from .env) |
| `npm run dev:postgresql` / `dev:mongodb` / `dev:mysql` | Dev with specific DB |
| `npm run dev:https` | Dev with HTTPS (run `generate:cert` first) |
| `npm run build` | Build for production (tsup) |
| `npm run start` | Run production build |
| `npm run start:prod` | Start with NODE_ENV=production |
| `npm run build:check` | TypeScript check only |
| `npm run clean` | Remove dist |
| `npm run generate:cert` | Generate SSL certificates |
| `npm run prisma:generate:all` | Generate Prisma clients (all DBs) |
| `npm run prisma:generate:postgresql` | Generate client for PostgreSQL |
| `npm run prisma:push:postgresql` | Push schema (use :mongodb / :mysql for others) |
| `npm run prisma:studio` | Open Prisma Studio |
| `npm run test` | Run tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run http` | Run HTTP client tests |
| `npm run lint` | TypeScript check |

---

## 🚀 Deployment

### Build for production

```bash
cd fastify_backend
npm ci
npm run prisma:generate:postgresql   # or :mongodb / :mysql
npm run build
npm run start:prod
```

### Deploy on Render

The backend is set up to deploy on **Render** from the `fastify_backend` folder (monorepo). Use the Blueprint or manual settings as described in **[RENDER.md](RENDER.md)**.

**Important:** Build and start commands must run from `fastify_backend`. From repo root use:

- **Build:** `cd fastify_backend && npm ci && npm run build`
- **Start:** `bash fastify_backend/render-start.sh`

Set **Root Directory** to `fastify_backend` in Render if you prefer; then use `npm ci && npm run build` and `node dist/main.js`.

### Production env (summary)

See `.env.example` and [RENDER.md](RENDER.md). Required: `DATABASE_URL` (or `DATABASE_URL_POSTGRES` etc.), `DATABASE_TYPE`, `FRONTEND_URL`, `JWT_SECRET`, `COOKIE_SECRET`. Optional: `REDIS_URL`, `API_URL`, ImageKit, Resend, Firebase.

---

## 🏷️ Releases & versioning

Releases are driven by **Git tags** and created as **GitHub Releases** with the built `dist/` artifact. Use the **api-v*** tag prefix (e.g. `api-v1.0.0`) so backend releases stay separate from the frontend.

1. Bump version: `npm run version:patch` (or `version:minor` / `version:major`) in `fastify_backend`.
2. Commit `package.json`, then create and push the tag: `git tag api-v1.0.1 && git push origin api-v1.0.1`.

Pushing an `api-v*` tag runs the [Deploy Backend](.github/workflows/deploy-backend.yml) workflow (lint, test, build, GitHub Release). The workflow lives in this folder; see [RELEASE.md](RELEASE.md) for steps and how to run it from GitHub (copy to repo root if needed).

---

## 🛡️ Security Features

- **Helmet** - Security headers
- **CORS** - Cross-Origin Resource Sharing
- **Rate Limiting** - 100 requests per minute
- **JWT Authentication** - With cookie support
- **HTTPS/SSL** - Self-signed certificates for development
- **Input Validation** - Zod schema validation
- **Password Hashing** - bcrypt with salt rounds
- **OTP Security** - Time-limited, single-use OTPs
- **KYC Data Masking** - Aadhar numbers masked in storage

---

## 📊 Database Models

### Core Models

- **User** - User accounts with authentication
- **Profile** - User profile information
- **Otp** - OTP records for email verification
- **Subscription** - User subscription plans
- **KycDetails** - KYC verification data (embedded in User)

### Property Models

- **Project** - Real estate projects
- **Listing** - Property listings
- **ListingImage** - Listing images
- **Amenity** - Property amenities
- **AmenityOnListing** - Listing-amenity relationships

### Business Models

- **Lead** - Property inquiry leads
- **Review** - User reviews and ratings

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

ISC

---

## 📞 Support

For support, email support@livebhoomi.com or create an issue in the repository.

---

## 🙏 Acknowledgments

- [Fastify](https://www.fastify.io/) – Web framework
- [Prisma](https://www.prisma.io/) – ORM (MongoDB, MySQL, PostgreSQL)
- [Mercurius](https://mercurius.dev/) – GraphQL for Fastify
- [ioredis](https://github.com/redis/ioredis) – Redis client
- [ImageKit](https://imagekit.io/) – Image CDN
- [Resend](https://resend.com/) – Email API

---

**Live Bhoomi Backend** – [RENDER.md](RENDER.md) for production deploy.
