export * from './auth.js';
export * from './organization.js';
export * from './catalogue.js';
export * from './requests.js';

// Common validation schemas
import { z } from 'zod';

export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export const idParamSchema = z.object({
  id: z.string().uuid('Invalid ID format')
});

export const searchQuerySchema = z.object({
  search: z.string().min(1, 'Search query is required').optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

export type PaginationInput = z.infer<typeof paginationSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
export type SearchQueryInput = z.infer<typeof searchQuerySchema>;