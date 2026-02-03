// src/lib/prisma.ts
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Función para reconectar automáticamente
export async function connectWithRetry(maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await prisma.$connect();
      console.log("Conectado a la base de datos");
      return;
    } catch (error) {
      console.log(`Intento ${i + 1} fallido, reintentando...`);
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}
