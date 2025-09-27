import { z } from 'zod';

export const createOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  settings: z.object({
    require_approval: z.boolean().default(true),
    approval_levels: z.number().min(1).max(3).default(1),
    allow_staff_requests: z.boolean().default(true),
    email_notifications: z.boolean().default(true)
  }).optional()
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional().nullable(),
  settings: z.object({
    require_approval: z.boolean().optional(),
    approval_levels: z.number().min(1).max(3).optional(),
    allow_staff_requests: z.boolean().optional(),
    email_notifications: z.boolean().optional()
  }).optional()
});

export const createSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  address: z.string().max(200, 'Address too long').optional()
});

export const updateSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional().nullable(),
  address: z.string().max(200, 'Address too long').optional().nullable()
});

export const createAreaSchema = z.object({
  name: z.string().min(1, 'Area name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional()
});

export const updateAreaSchema = z.object({
  name: z.string().min(1, 'Area name is required').max(100, 'Name too long').optional(),
  description: z.string().max(500, 'Description too long').optional().nullable()
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type CreateSiteInput = z.infer<typeof createSiteSchema>;
export type UpdateSiteInput = z.infer<typeof updateSiteSchema>;
export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;