import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import "dotenv/config";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

// Create postgres client
const client = postgres(process.env.DATABASE_URL);

// Create drizzle instance
export const db = drizzle(client, { schema });
