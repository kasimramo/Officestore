import { z } from 'zod';
import { RequestStatus, RequestPriority } from '../types/database.js';

export const createRequestSchema = z.object({
  site_id: z.string().uuid('Invalid site ID'),
  area_id: z.string().uuid('Invalid area ID'),
  priority: z.nativeEnum(RequestPriority).default(RequestPriority.NORMAL),
  notes: z.string().max(1000, 'Notes too long').optional(),
  requested_by_date: z.string().datetime().optional(),
  items: z.array(z.object({
    catalogue_item_id: z.string().uuid('Invalid catalogue item ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    notes: z.string().max(500, 'Item notes too long').optional()
  })).min(1, 'At least one item is required')
});

export const updateRequestSchema = z.object({
  priority: z.nativeEnum(RequestPriority).optional(),
  notes: z.string().max(1000, 'Notes too long').optional().nullable(),
  requested_by_date: z.string().datetime().optional().nullable(),
  items: z.array(z.object({
    id: z.string().uuid('Invalid item ID').optional(),
    catalogue_item_id: z.string().uuid('Invalid catalogue item ID'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    notes: z.string().max(500, 'Item notes too long').optional()
  })).min(1, 'At least one item is required').optional()
});

export const approveRequestSchema = z.object({
  action: z.literal('approve'),
  notes: z.string().max(500, 'Notes too long').optional()
});

export const rejectRequestSchema = z.object({
  action: z.literal('reject'),
  notes: z.string().max(500, 'Notes too long').min(1, 'Rejection reason is required')
});

export const fulfillRequestSchema = z.object({
  action: z.literal('fulfill'),
  notes: z.string().max(500, 'Notes too long').optional()
});

export const requestActionSchema = z.discriminatedUnion('action', [
  approveRequestSchema,
  rejectRequestSchema,
  fulfillRequestSchema
]);

export const requestQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.nativeEnum(RequestStatus).optional(),
  priority: z.nativeEnum(RequestPriority).optional(),
  site_id: z.string().uuid().optional(),
  area_id: z.string().uuid().optional(),
  requester_id: z.string().uuid().optional(),
  from_date: z.string().datetime().optional(),
  to_date: z.string().datetime().optional()
});

export type CreateRequestInput = z.infer<typeof createRequestSchema>;
export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;
export type RequestActionInput = z.infer<typeof requestActionSchema>;
export type RequestQueryInput = z.infer<typeof requestQuerySchema>;