import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Le pasamos la URL de tu .env al adaptador
const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL as string,
});

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Inicializamos el cliente inyectando el adaptador de Postgres
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;