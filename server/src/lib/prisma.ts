import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
  ...(process.env.NODE_ENV === "production" && { ssl: { rejectUnauthorized: false } }),
});

export const prisma = new PrismaClient({ adapter });
export { Prisma };
