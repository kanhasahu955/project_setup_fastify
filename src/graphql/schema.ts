import { readFileSync } from "fs";
import { join } from "path";

const schemaDir =
    process.env.NODE_ENV === "production"
        ? join(process.cwd(), "dist", "graphql", "schema")
        : join(process.cwd(), "src", "graphql", "schema");

const typesSchema = readFileSync(join(schemaDir, "types.graphql"), "utf-8");
const queriesSchema = readFileSync(join(schemaDir, "queries.graphql"), "utf-8");
const mutationsSchema = readFileSync(join(schemaDir, "mutations.graphql"), "utf-8");

export const typeDefs = [typesSchema, queriesSchema, mutationsSchema].join("\n\n");

