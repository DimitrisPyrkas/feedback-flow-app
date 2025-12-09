import { PrismaClient } from '@/app/generated/prisma';

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export const prismaClient = prisma;   
export const prismaRef = prisma;      
export const prismaInstance = prisma; 
export { prisma };                    
export default prisma;                

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

