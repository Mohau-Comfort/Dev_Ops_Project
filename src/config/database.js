/**
 * @fileoverview Database Configuration
 * @description Establishes connection to Neon PostgreSQL database using Drizzle ORM.
 * Supports both Neon Local (development) and Neon Cloud (production).
 */

import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const isDevelopment = process.env.NODE_ENV === 'development';
const isNeonLocal =
  process.env.DATABASE_URL?.includes('neon-local') ||
  process.env.DATABASE_URL?.includes('localhost:5432');

/**
 * Configure Neon client for local development
 * Neon Local uses HTTP endpoint and self-signed certificates
 */
if (isNeonLocal) {
  // Configure for Neon Local HTTP endpoint
  neonConfig.fetchEndpoint = host => {
    const protocol =
      host === 'localhost' || host === 'neon-local' ? 'http' : 'https';
    const port = host === 'localhost' || host === 'neon-local' ? 5432 : 443;
    return `${protocol}://${host}:${port}/sql`;
  };

  // Disable secure WebSocket for local development
  neonConfig.useSecureWebSocket = false;

  // Use fetch for pooled queries in local development
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
}

/**
 * Neon SQL client
 * @description Raw SQL query executor for direct database operations
 */
const sql = neon(process.env.DATABASE_URL, {
  // For Neon Local: accept self-signed certificates
  ...(isNeonLocal && {
    fetchOptions: {
      // Node.js fetch doesn't support rejectUnauthorized directly
      // The neonConfig settings above handle this
    },
  }),
});

/**
 * Drizzle ORM instance
 * @description Type-safe database client for query building and execution
 */
const db = drizzle(sql);

/**
 * Log database connection mode
 */
if (isDevelopment) {
  console.log(`[Database] Mode: ${isNeonLocal ? 'Neon Local' : 'Neon Cloud'}`);
}

export { db, sql };
