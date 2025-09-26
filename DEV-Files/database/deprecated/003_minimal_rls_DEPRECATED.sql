-- Minimal RLS setup for Railway PostgreSQL

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Simple helper function to get organization context
CREATE OR REPLACE FUNCTION get_current_org_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT '00000000-0000-0000-0000-000000000000'::uuid;
$$;

-- Enable RLS on key tables only
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY org_access ON "Organization"
  FOR ALL USING (true);

CREATE POLICY membership_access ON "Membership"
  FOR ALL USING (true);

-- Create basic indexes
CREATE INDEX IF NOT EXISTS idx_membership_org_user ON "Membership"("orgId", "userId");
CREATE INDEX IF NOT EXISTS idx_organization_id ON "Organization"("id");