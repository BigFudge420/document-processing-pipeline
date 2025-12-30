import { createPrisma } from "./db/createPrisma";

export const prisma = createPrisma()

process.on('SIGTERM', () => {
    prisma.$disconnect()
})

process.on('SIGINT', () => {
    prisma.$disconnect()
})