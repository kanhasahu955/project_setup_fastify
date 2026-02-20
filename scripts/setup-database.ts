#!/usr/bin/env tsx

/**
 * Database Setup Script
 * 
 * This script helps set up the database configuration.
 * Usage:
 *   npm run setup:db mongodb
 *   npm run setup:db mysql
 */

const dbType = process.argv[2] as "mongodb" | "mysql";

if (!dbType || (dbType !== "mongodb" && dbType !== "mysql")) {
	console.error("❌ Invalid database type. Use 'mongodb' or 'mysql'");
	console.log("\nUsage:");
	console.log("  npm run setup:db mongodb");
	console.log("  npm run setup:db mysql");
	process.exit(1);
}

console.log(`\n🗄️  Setting up ${dbType.toUpperCase()} database...\n`);

if (dbType === "mongodb") {
	console.log("📝 MongoDB Setup:");
	console.log("1. Make sure MongoDB is running with replica set:");
	console.log("   mongod --replSet rs0 --dbpath ~/data/mongodb");
	console.log("2. Initialize replica set (first time only):");
	console.log("   mongosh");
	console.log("   rs.initiate()");
	console.log("\n3. Set DATABASE_URL_MONGODB in .env:");
	console.log("   DATABASE_URL_MONGODB=mongodb://127.0.0.1:27017/livebhoomi?replicaSet=rs0&directConnection=true");
	console.log("\n4. Generate Prisma client:");
	console.log("   npm run prisma:generate:mongodb");
	console.log("\n5. Push schema:");
	console.log("   npm run prisma:push:mongodb");
} else {
	console.log("📝 MySQL Setup:");
	console.log("1. Make sure MySQL is running");
	console.log("2. Create database:");
	console.log("   mysql -u root -p");
	console.log("   CREATE DATABASE livebhoomi;");
	console.log("\n3. Set DATABASE_URL_MYSQL in .env:");
	console.log("   DATABASE_URL_MYSQL=mysql://root:password@localhost:3306/livebhoomi");
	console.log("\n4. Generate Prisma client:");
	console.log("   npm run prisma:generate:mysql");
	console.log("\n5. Push schema:");
	console.log("   npm run prisma:push:mysql");
}

console.log(`\n✅ To run the app with ${dbType}:`);
console.log(`   npm run dev:${dbType}`);
console.log(`   or`);
console.log(`   npm run dev --db=${dbType}\n`);
