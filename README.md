# Live Bhoomi Backend API

A modern, high-performance **RESTful API** and **GraphQL API** built with **Fastify**, **TypeScript**, **Prisma**, and **MongoDB**.

## 🚀 Features

- 🚀 **High-performance** Fastify framework
- 📝 **Dual API Support** - REST API and GraphQL API
- 🔷 **GraphQL** with Mercurius (Fastify GraphQL adapter)
- 📚 **Automatic API documentation** with Swagger/OpenAPI
- 🔒 **Type-safe** with TypeScript
- 💾 **MongoDB database** with Prisma ORM
- 🔐 **OTP-based Authentication** with email verification
- 🆔 **KYC Verification** (Aadhar & PAN card)
- 📊 **Colorized logging** with Pino
- 🔄 **Hot reload** in development
- 🔐 **SSL/HTTPS support** with self-signed certificates
- 🛡️ **Security** with Helmet, CORS, Rate Limiting
- 🔑 **JWT Authentication** with cookie support
- 📸 **ImageKit Integration** for image uploads
- 📧 **Email Service** with Resend/Nodemailer
- 📋 **HTTP Client files** for API testing

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
- [Deployment](#-deployment)

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
| [ImageKit](https://imagekit.io/) | Image hosting |
| [Resend](https://resend.com/) | Email service |
| [JWT](https://jwt.io/) | Authentication |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn**
- **MongoDB** (local or cloud instance)
- **MongoDB Replica Set** (required for Prisma transactions)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd project_setup_fastify

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Set up MongoDB Replica Set (see Database Setup section)

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

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

## 📁 Project Structure

```
project_setup_fastify/
├── certificates/              # SSL certificates (git-ignored)
│   ├── server.key
│   └── server.crt
├── http/                      # HTTP client test files
│   ├── globals.http
│   ├── health.http
│   └── api.http
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   └── generate-cert.ts       # SSL certificate generator
├── src/
│   ├── @types/                # TypeScript type definitions
│   ├── config/
│   │   ├── env.config.ts      # Environment configuration
│   │   ├── prisma.config.ts   # Prisma client setup
│   │   ├── imagekit.config.ts # ImageKit configuration
│   │   └── certificate.config.ts
│   ├── controllers/           # Route controllers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   └── imagekit.controller.ts
│   ├── graphql/               # GraphQL schema & resolvers
│   │   ├── schema.ts          # GraphQL type definitions
│   │   ├── resolvers.ts       # GraphQL resolvers
│   │   └── index.ts
│   ├── helpers/
│   │   └── httpStatus.ts     # Response helper utilities
│   ├── plugins/
│   │   ├── cors.plugin.ts    # CORS & security setup
│   │   ├── logger.plugin.ts  # Pino logger config
│   │   ├── swagger.plugin.ts # Swagger documentation
│   │   ├── graphql.plugin.ts # GraphQL setup
│   │   └── multipart.plugin.ts
│   ├── routes/
│   │   ├── index.ts          # Route registration
│   │   ├── user.route.ts     # User & auth routes
│   │   ├── imagekit.route.ts # Image upload routes
│   │   └── health.route.ts
│   ├── schemas/              # OpenAPI/Swagger schemas
│   │   ├── user.schema.ts
│   │   └── imagekit.schema.ts
│   ├── services/             # Business logic
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── imagekit.service.ts
│   │   └── mail.service.ts
│   ├── types/               # TypeScript types
│   └── validations/         # Zod validation schemas
│       └── auth.validation.ts
├── main.ts                 # Application entry point
├── package.json
├── tsconfig.json
└── .env
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

# Email Service (Resend)
RESEND_API_KEY=re_your_api_key_here
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
MAIL_FROM_NAME=Live Bhoomi

# ImageKit
IMAGEKIT_PRIVATE_KEY=private_your_key
IMAGEKIT_PUBLIC_KEY=public_your_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id/
```

---

## 🗄️ Database Setup

### MongoDB Replica Set (Required)

Prisma requires MongoDB to run as a replica set for transactions. Here's how to set it up:

#### Option 1: Local MongoDB

```bash
# Terminal 1: Start MongoDB with replica set
mkdir -p ~/data/mongodb
mongod --replSet rs0 --dbpath ~/data/mongodb --port 27017

# Terminal 2: Initialize replica set (first time only)
mongosh
rs.initiate()

# Verify
rs.status()
```

#### Option 2: MongoDB Atlas

MongoDB Atlas automatically provides replica sets. Just use your connection string:

```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

### Push Schema

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Open Prisma Studio (optional)
npx prisma studio
```

---

## 📚 API Documentation

### REST API Documentation

- **Swagger UI**: http://localhost:8000/documentation
- **Scalar API Reference**: http://localhost:8000/reference
- **OpenAPI JSON**: http://localhost:8000/documentation/json

### GraphQL API

- **GraphQL Endpoint**: http://localhost:8000/graphql
- **GraphiQL IDE**: http://localhost:8000/graphiql

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

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server (HTTP) |
| `npm run dev:https` | Start development server (HTTPS) |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run start:prod` | Start with NODE_ENV=production |
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
| `npm run lint` | Type check with TypeScript |

---

## 🚀 Deployment

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

### Environment Variables for Production

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
USE_HTTPS=false
RESEND_API_KEY=re_...
IMAGEKIT_PRIVATE_KEY=private_...
IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong secrets for `JWT_SECRET` and `COOKIE_SECRET`
- [ ] Configure proper `FRONTEND_URL` for CORS
- [ ] Set up MongoDB connection with replica set
- [ ] Configure SSL/TLS (via reverse proxy or `USE_HTTPS=true`)
- [ ] Set up logging and monitoring
- [ ] Configure rate limiting
- [ ] Set up health check monitoring
- [ ] Configure email service (Resend API key)
- [ ] Configure ImageKit credentials

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

- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Mercurius](https://mercurius.dev/) - GraphQL adapter for Fastify
- [ImageKit](https://imagekit.io/) - Image optimization and CDN
- [Resend](https://resend.com/) - Email API

---

**Made with ❤️ for Live Bhoomi**
