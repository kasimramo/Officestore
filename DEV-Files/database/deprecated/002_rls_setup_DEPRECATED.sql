-- Create application roles for Railway PostgreSQL
-- Note: These will be managed by Railway, but we set up the structure

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Helper functions for RLS context
CREATE OR REPLACE FUNCTION app_ctx_org() RETURNS uuid
LANGUAGE plpgsql STABLE AS $$
BEGIN
  BEGIN
    RETURN current_setting('app.current_org', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN '00000000-0000-0000-0000-000000000000'::uuid;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION app_ctx_role() RETURNS text
LANGUAGE plpgsql STABLE AS $$
BEGIN
  BEGIN
    RETURN current_setting('app.current_role', true);
  EXCEPTION WHEN OTHERS THEN
    RETURN 'GUEST';
  END;
END;
$$;

CREATE OR REPLACE FUNCTION app_ctx_user() RETURNS uuid
LANGUAGE plpgsql STABLE AS $$
BEGIN
  BEGIN
    RETURN current_setting('app.current_user', true)::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN '00000000-0000-0000-0000-000000000000'::uuid;
  END;
END;
$$;

-- Enable RLS on all tenant-scoped tables
ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Site" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Area" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CatalogueItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CatalogueSiteOverride" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CatalogueVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Request" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RequestItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApprovalDecision" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attachment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReceivingLog" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS membership_org_access ON "Membership";
DROP POLICY IF EXISTS membership_write ON "Membership";
DROP POLICY IF EXISTS site_org_access ON "Site";
DROP POLICY IF EXISTS site_write ON "Site";
DROP POLICY IF EXISTS area_org_access ON "Area";
DROP POLICY IF EXISTS area_write ON "Area";
DROP POLICY IF EXISTS catalogue_item_org_access ON "CatalogueItem";
DROP POLICY IF EXISTS catalogue_item_write ON "CatalogueItem";
DROP POLICY IF EXISTS catalogue_override_org_access ON "CatalogueSiteOverride";
DROP POLICY IF EXISTS catalogue_override_write ON "CatalogueSiteOverride";
DROP POLICY IF EXISTS catalogue_version_org_access ON "CatalogueVersion";
DROP POLICY IF EXISTS catalogue_version_write ON "CatalogueVersion";
DROP POLICY IF EXISTS request_org_access ON "Request";
DROP POLICY IF EXISTS request_write ON "Request";
DROP POLICY IF EXISTS request_status_update ON "Request";
DROP POLICY IF EXISTS request_item_org_access ON "RequestItem";
DROP POLICY IF EXISTS request_item_write ON "RequestItem";
DROP POLICY IF EXISTS approval_decision_org_access ON "ApprovalDecision";
DROP POLICY IF EXISTS approval_decision_write ON "ApprovalDecision";
DROP POLICY IF EXISTS attachment_org_access ON "Attachment";
DROP POLICY IF EXISTS attachment_write ON "Attachment";
DROP POLICY IF EXISTS receiving_log_org_access ON "ReceivingLog";
DROP POLICY IF EXISTS receiving_log_write ON "ReceivingLog";

-- RLS Policies for Membership
CREATE POLICY membership_org_access ON "Membership"
  FOR SELECT USING (
    "orgId" = app_ctx_org()
  );

CREATE POLICY membership_write ON "Membership"
  FOR ALL
  USING ("orgId" = app_ctx_org())
  WITH CHECK ("orgId" = app_ctx_org());

-- RLS Policies for Site
CREATE POLICY site_org_access ON "Site"
  FOR SELECT USING (
    "orgId" = app_ctx_org()
  );

CREATE POLICY site_write ON "Site"
  FOR ALL
  USING ("orgId" = app_ctx_org())
  WITH CHECK ("orgId" = app_ctx_org());

-- RLS Policies for Area
CREATE POLICY area_org_access ON "Area"
  FOR SELECT USING (
    "orgId" = app_ctx_org()
  );

CREATE POLICY area_write ON "Area"
  FOR ALL
  USING ("orgId" = app_ctx_org())
  WITH CHECK ("orgId" = app_ctx_org());

-- RLS Policies for CatalogueItem
CREATE POLICY catalogue_item_org_access ON "CatalogueItem"
  FOR SELECT USING (
    "orgId" = app_ctx_org()
  );

CREATE POLICY catalogue_item_write ON "CatalogueItem"
  FOR ALL
  USING ("orgId" = app_ctx_org())
  WITH CHECK ("orgId" = app_ctx_org());

-- RLS Policies for CatalogueSiteOverride
CREATE POLICY catalogue_override_org_access ON "CatalogueSiteOverride"
  FOR SELECT USING (
    "orgId" = app_ctx_org()
  );

CREATE POLICY catalogue_override_write ON "CatalogueSiteOverride"
  FOR ALL
  USING ("orgId" = app_ctx_org())
  WITH CHECK ("orgId" = app_ctx_org());

-- RLS Policies for CatalogueVersion
CREATE POLICY catalogue_version_org_access ON "CatalogueVersion"
  FOR SELECT USING (
    "orgId" = app_ctx_org()
  );

CREATE POLICY catalogue_version_write ON "CatalogueVersion"
  FOR ALL
  USING ("orgId" = app_ctx_org())
  WITH CHECK ("orgId" = app_ctx_org());

-- RLS Policies for Request
CREATE POLICY request_org_access ON "Request"
  FOR SELECT USING (
    "orgId" = app_ctx_org()
  );

CREATE POLICY request_write ON "Request"
  FOR ALL
  USING ("orgId" = app_ctx_org())
  WITH CHECK ("orgId" = app_ctx_org());

-- RLS Policies for RequestItem
CREATE POLICY request_item_org_access ON "RequestItem"
  FOR SELECT USING (
    "orgId" = app_ctx_org()
  );

CREATE POLICY request_item_write ON "RequestItem"
  FOR ALL
  USING ("orgId" = app_ctx_org())
  WITH CHECK ("orgId" = app_ctx_org());

-- RLS Policies for ApprovalDecision
CREATE POLICY approval_decision_org_access ON "ApprovalDecision"
  FOR SELECT USING (
    "orgId" = app_ctx_org()
  );

CREATE POLICY approval_decision_write ON "ApprovalDecision"
  FOR ALL
  USING ("orgId" = app_ctx_org())
  WITH CHECK ("orgId" = app_ctx_org());

-- RLS Policies for Attachment
CREATE POLICY attachment_org_access ON "Attachment"
  FOR SELECT USING (
    "orgId" = app_ctx_org()
  );

CREATE POLICY attachment_write ON "Attachment"
  FOR ALL
  USING ("orgId" = app_ctx_org())
  WITH CHECK ("orgId" = app_ctx_org());

-- RLS Policies for ReceivingLog
CREATE POLICY receiving_log_org_access ON "ReceivingLog"
  FOR SELECT USING (
    "orgId" = app_ctx_org()
  );

CREATE POLICY receiving_log_write ON "ReceivingLog"
  FOR ALL
  USING ("orgId" = app_ctx_org())
  WITH CHECK ("orgId" = app_ctx_org());

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_membership_org_user ON "Membership"("orgId", "userId");
CREATE INDEX IF NOT EXISTS idx_site_org ON "Site"("orgId");
CREATE INDEX IF NOT EXISTS idx_area_org_site ON "Area"("orgId", "siteId");
CREATE INDEX IF NOT EXISTS idx_catalogue_item_org ON "CatalogueItem"("orgId");
CREATE INDEX IF NOT EXISTS idx_catalogue_item_org_sku ON "CatalogueItem"("orgId", "sku");
CREATE INDEX IF NOT EXISTS idx_request_org_status ON "Request"("orgId", "status");
CREATE INDEX IF NOT EXISTS idx_request_org_created ON "Request"("orgId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_request_item_org_request ON "RequestItem"("orgId", "requestId");
CREATE INDEX IF NOT EXISTS idx_approval_decision_org_request ON "ApprovalDecision"("orgId", "requestId");
CREATE INDEX IF NOT EXISTS idx_attachment_org_request ON "Attachment"("orgId", "requestId");
CREATE INDEX IF NOT EXISTS idx_receiving_log_org_request ON "ReceivingLog"("orgId", "requestId");