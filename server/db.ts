// Blueprint: javascript_database
// Timestamps are stored as `timestamp without time zone` with UTC wall-clock values.
// Force UTC so Node/pg never shift scheduled_at by the process timezone (e.g. Asia/Riyadh = 3h early).
process.env.TZ = "UTC";

import { Pool, neonConfig, types } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// OID 1114 = timestamp without time zone — always interpret as UTC
types.setTypeParser(types.builtins.TIMESTAMP, (value: string) => {
  if (!value) return null as unknown as Date;
  const normalized = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`;
  return new Date(normalized.replace(' ', 'T'));
});

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
    );
}

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('PG Pool error:', err);
});

export const db = drizzle({ client: pool, schema });
