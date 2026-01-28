/**
 * @fileoverview Database Configuration
 * @description Establishes connection to Neon PostgreSQL database using Drizzle ORM.
 * Uses serverless-compatible HTTP driver for optimal performance.
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

/**
 * Neon SQL client
 * @description Raw SQL query executor for direct database operations
 */
const sql = neon(process.env.DATABASE_URL);

/**
 * Drizzle ORM instance
 * @description Type-safe database client for query building and execution
 */
const db = drizzle(sql);

export { db, sql };
