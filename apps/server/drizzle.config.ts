import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

// Load root .env for DATABASE_URL
dotenv.config({ path: '../../.env' });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || ''
  },
  strict: true,
  verbose: true,
});
