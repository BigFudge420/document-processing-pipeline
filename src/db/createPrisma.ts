// src/db/createPrisma.ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import dotenv from 'dotenv'

dotenv.config()

export function createPrisma() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL missing at runtime");
  }

  const pool = new Pool({
    connectionString: url,
  });

  return new PrismaClient({
    adapter: new PrismaPg(pool),
  });
}
