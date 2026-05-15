import { PrismaClient, Prisma } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function buildConnectionString() {
  const url = process.env.DATABASE_URL!;
  if (process.env.NODE_ENV !== "production") return url;
  const sep = url.includes("?") ? "&" : "?";
  return url.includes("sslmode") ? url : `${url}${sep}sslmode=require&uselibpqcompat=true`;
}

const adapter = new PrismaPg({ connectionString: buildConnectionString() });

export const prisma = new PrismaClient({ adapter });
export { Prisma };
