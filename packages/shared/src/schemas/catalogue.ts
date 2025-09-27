import { z } from 'zod';

export const createCatalogueItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  category: z.string().max(50, 'Category too long').optional(),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long'),
  cost_per_unit: z.number().min(0, 'Cost must be positive').optional(),
  supplier: z.string().max(100, 'Supplier name too long').optional(),
  minimum_stock: z.number().min(0, 'Minimum stock must be positive').optional()
});

export const updateCatalogueItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional().nullable(),
  category: z.string().max(50, 'Category too long').optional().nullable(),
  unit: z.string().min(1, 'Unit is required').max(20, 'Unit too long').optional(),
  cost_per_unit: z.number().min(0, 'Cost must be positive').optional().nullable(),
  supplier: z.string().max(100, 'Supplier name too long').optional().nullable(),
  minimum_stock: z.number().min(0, 'Minimum stock must be positive').optional().nullable()
});

export const catalogueQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  category: z.string().optional(),
  active: z.coerce.boolean().optional()
});

export type CreateCatalogueItemInput = z.infer<typeof createCatalogueItemSchema>;
export type UpdateCatalogueItemInput = z.infer<typeof updateCatalogueItemSchema>;
export type CatalogueQueryInput = z.infer<typeof catalogueQuerySchema>;