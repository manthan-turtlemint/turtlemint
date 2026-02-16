import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = (() => {
    if (process.env.DATABASE_URL) {
        console.log("DB URL Check: Starts with", process.env.DATABASE_URL.substring(0, 15) + "...");
    } else {
        console.warn("DB URL Check: DATABASE_URL is UNDEFINED");
    }

    return globalForPrisma.prisma ||
        new PrismaClient({
            log: ["query"],
        });
})();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
