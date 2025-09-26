import { z } from "zod";

// Auth schemas
export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  hcaptchaToken: z.string().optional(),
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Organization schemas
export const createOrgSchema = z.object({
  name: z.string().min(1, "Organization name is required").max(100, "Organization name is too long"),
});

export const inviteUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["ADMIN", "PROCUREMENT", "APPROVER_L1", "APPROVER_L2", "STAFF"]),
});

// Site and area schemas
export const createSiteSchema = z.object({
  name: z.string().min(1, "Site name is required"),
  timezone: z.string().default("UTC"),
  locale: z.string().default("en"),
  isActive: z.boolean().default(true),
});

export const createAreaSchema = z.object({
  name: z.string().min(1, "Area name is required"),
  type: z.enum(["PANTRY", "HOUSEKEEPING", "STATIONERY", "OTHER"]).default("PANTRY"),
  siteId: z.string().uuid("Invalid site ID"),
  inChargeUserId: z.string().uuid("Invalid user ID").optional(),
  isActive: z.boolean().default(true),
});

// Catalogue schemas
export const createCatalogueItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  unit: z.string().min(1, "Unit is required"),
  packSize: z.string().optional(),
  imageUrl: z.string().optional(),
  vendorSku: z.preprocess((value) => {
    if (typeof value === "string" && value.trim().length === 0) {
      return undefined;
    }
    return value;
  }, z.string().max(64, "Vendor SKU is too long").optional()),
  // Price fields for SMB budgeting
  unitPrice: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    if (typeof value === "number" && Number.isNaN(value)) {
      return undefined;
    }
    if (typeof value === "string") {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return value;
  }, z.number().positive("Price must be positive").optional()),
  currency: z.string().min(1, "Currency is required").default("USD"),
  showPriceToUsers: z.boolean().default(false),
});

export const updateCatalogueItemSchema = createCatalogueItemSchema.partial();

export const catalogueOverrideSchema = z.object({
  minStock: z.number().int().min(0).optional(),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQty: z.number().int().min(1).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
});

// Request schemas
export const createRequestSchema = z.object({
  siteId: z.string().uuid("Invalid site ID"),
  areaId: z.string().uuid("Invalid area ID"),
  type: z.enum(["REGULAR", "URGENT", "RECURRING"]).default("REGULAR"),
  items: z.array(
    z.object({
      catalogueItemId: z.string().uuid("Invalid catalogue item ID"),
      quantity: z.number().int().min(1, "Quantity must be at least 1"),
      notes: z.string().optional(),
    })
  ).min(1, "At least one item is required"),
});

export const updateRequestSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "ORDERED", "DELIVERED"]),
});

export const approvalDecisionSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  comment: z.string().optional(),
});

// File upload schemas
export const fileUploadSchema = z.object({
  file: z.any(),
  kind: z.enum(["PHOTO", "RECEIPT", "OTHER"]),
});

// Receiving schemas
export const createReceivingLogSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  requestItemId: z.string().uuid("Invalid request item ID"),
  receivedQty: z.number().int().min(0, "Received quantity cannot be negative"),
  notes: z.string().optional(),
});

// CSV import schemas
export const csvImportSchema = z.object({
  file: z.any(),
  mapping: z.record(z.string()),
});

// Search and filter schemas
export const searchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// API response helpers
export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
};

export function createSuccessResponse<T>(data: T, meta?: ApiResponse["meta"]): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

export function createErrorResponse(error: string): ApiResponse {
  return {
    success: false,
    error,
  };
}



