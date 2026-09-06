/**
 * ==============================================================================
 * PRISMA CLIENT SINGLETON INSTANCE (src/config/prisma.js)
 * ==============================================================================
 * This module exports a single instance of PrismaClient.
 * 
 * WHY SINGLETON?
 * Creating multiple instances of `new PrismaClient()` across controllers can
 * exhaust database connection pools. Exporting a single instance ensures
 * that all database queries share the same connection client.
 * ==============================================================================
 */

import { PrismaClient } from '@prisma/client';

// Instantiate the Prisma Client (connects automatically using DATABASE_URL from .env)
const prisma = new PrismaClient();

export default prisma;
