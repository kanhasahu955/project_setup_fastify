# Database Setup Guide

This project supports both **MongoDB** and **MySQL** databases. MongoDB is the default database.

## Quick Start

### Using MongoDB (Default)

```bash
# Generate Prisma client
npm run prisma:generate:mongodb

# Push schema to database
npm run prisma:push:mongodb

# Run development server
npm run dev
# or explicitly
npm run dev:mongodb
```

### Using MySQL

```bash
# Generate Prisma client
npm run prisma:generate:mysql

# Push schema to database
npm run prisma:push:mysql

# Run development server
npm run dev:mysql
```

## Environment Variables

Add these to your `.env` file:

```env
# Database Type (mongodb or mysql) - Default: mongodb
DATABASE_TYPE=mongodb

# MongoDB Connection String
DATABASE_URL_MONGODB=mongodb://127.0.0.1:27017/livebhoomi?replicaSet=rs0&directConnection=true

# MySQL Connection String
DATABASE_URL_MYSQL=mysql://root:password@localhost:3306/livebhoomi
```

## Command Line Override

You can override the database type via command line:

```bash
# Run with MongoDB
npm run dev --db=mongodb

# Run with MySQL
npm run dev --db=mysql

# Production
npm run start --db=mysql
```

## MongoDB Setup

### 1. Start MongoDB with Replica Set

```bash
# Terminal 1: Start MongoDB
mkdir -p ~/data/mongodb
mongod --replSet rs0 --dbpath ~/data/mongodb --port 27017

# Terminal 2: Initialize replica set (first time only)
mongosh
rs.initiate()
rs.status()  # Verify
```

### 2. Configure Environment

```env
DATABASE_TYPE=mongodb
DATABASE_URL_MONGODB=mongodb://127.0.0.1:27017/livebhoomi?replicaSet=rs0&directConnection=true
```

### 3. Generate and Push Schema

```bash
npm run prisma:generate:mongodb
npm run prisma:push:mongodb
```

## MySQL Setup

### 1. Install and Start MySQL

```bash
# macOS
brew install mysql
brew services start mysql

# Linux
sudo apt-get install mysql-server
sudo systemctl start mysql

# Windows
# Download MySQL installer from mysql.com
```

### 2. Create Database

```bash
mysql -u root -p

CREATE DATABASE livebhoomi;
CREATE USER 'livebhoomi_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON livebhoomi.* TO 'livebhoomi_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure Environment

```env
DATABASE_TYPE=mysql
DATABASE_URL_MYSQL=mysql://livebhoomi_user:your_password@localhost:3306/livebhoomi
```

### 4. Generate and Push Schema

```bash
npm run prisma:generate:mysql
npm run prisma:push:mysql
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run prisma:generate:mongodb` | Generate MongoDB Prisma client |
| `npm run prisma:generate:mysql` | Generate MySQL Prisma client |
| `npm run prisma:generate:all` | Generate both clients |
| `npm run prisma:push:mongodb` | Push MongoDB schema |
| `npm run prisma:push:mysql` | Push MySQL schema |
| `npm run prisma:studio:mongodb` | Open Prisma Studio (MongoDB) |
| `npm run prisma:studio:mysql` | Open Prisma Studio (MySQL) |
| `npm run dev:mongodb` | Run dev server with MongoDB |
| `npm run dev:mysql` | Run dev server with MySQL |
| `npm run setup:db mongodb` | Show MongoDB setup instructions |
| `npm run setup:db mysql` | Show MySQL setup instructions |

## Schema Files

- `prisma/schema.mongodb.prisma` - MongoDB schema
- `prisma/schema.mysql.prisma` - MySQL schema
- `prisma/schema.prisma` - Default (MongoDB) schema

## Differences Between Schemas

### MongoDB
- Uses `@db.ObjectId` for IDs
- Supports embedded types (KycDetails)
- Uses `@default(auto())` for ID generation
- No foreign key constraints

### MySQL
- Uses `@id @default(uuid())` for IDs
- KYC fields stored as separate columns
- Uses `@db.VarChar`, `@db.Text`, `@db.Decimal` for types
- Foreign key constraints with `onDelete: Cascade`

## Switching Databases

To switch between databases:

1. **Update `.env`**:
   ```env
   DATABASE_TYPE=mysql  # or mongodb
   ```

2. **Generate the correct client**:
   ```bash
   npm run prisma:generate:mysql  # or mongodb
   ```

3. **Push schema**:
   ```bash
   npm run prisma:push:mysql  # or mongodb
   ```

4. **Restart the server**:
   ```bash
   npm run dev:mysql  # or mongodb
   ```

## Troubleshooting

### MongoDB Replica Set Error

If you see: `Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set`

**Solution**: Make sure MongoDB is running with `--replSet rs0` and initialized with `rs.initiate()`

### MySQL Connection Error

If you see connection errors:

1. Check MySQL is running: `mysql -u root -p`
2. Verify database exists: `SHOW DATABASES;`
3. Check connection string format: `mysql://user:password@host:port/database`

### Prisma Client Not Found

If you see: `Cannot find module '../../generated/prisma/client-mongodb'`

**Solution**: Run `npm run prisma:generate:all` to generate both clients

## Production

For production, set the database type in your environment:

```bash
# Environment variable
export DATABASE_TYPE=mysql

# Or in .env
DATABASE_TYPE=mysql
DATABASE_URL_MYSQL=mysql://user:pass@host:3306/db
```

Then build and run:

```bash
npm run build
npm run start:prod
```
