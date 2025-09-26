-- Migration: Update AreaType enum to include STATIONERY and rename HK to HOUSEKEEPING
-- Date: 2025-09-24
-- Description: Enhance area type options for better categorization

-- Note: This requires manual execution as Prisma enum changes need special handling

-- Step 1: Add new enum values (if not already present)
ALTER TYPE "AreaType" ADD VALUE IF NOT EXISTS 'STATIONERY';
ALTER TYPE "AreaType" ADD VALUE IF NOT EXISTS 'HOUSEKEEPING';

-- Step 2: Update existing HK records to HOUSEKEEPING (if any exist)
UPDATE "Area" SET type = 'HOUSEKEEPING' WHERE type = 'HK';

-- Step 3: The old HK value will be deprecated but remain in enum for backward compatibility
-- In a future migration, we can remove it after ensuring no data uses it

-- Verification queries:
-- SELECT DISTINCT type FROM "Area";
-- SELECT unnest(enum_range(NULL::"AreaType")) AS area_types;