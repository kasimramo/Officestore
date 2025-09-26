-- Secure Row Level Security setup
-- This replaces the insecure migration files

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Application context functions
CREATE OR REPLACE FUNCTION app_ctx_org() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_org_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app_ctx_user() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$;

CREATE OR REPLACE FUNCTION app_ctx_role() RETURNS text
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.current_role', true), '');
$$;

-- Helper function to check if user is admin or procurement
CREATE OR REPLACE FUNCTION is_admin_or_procurement() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_ctx_role() IN ('ADMIN', 'PROCUREMENT');
$$;

-- Helper function to check if user can approve
CREATE OR REPLACE FUNCTION can_approve() RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT app_ctx_role() IN ('ADMIN', 'PROCUREMENT', 'APPROVER_L1', 'APPROVER_L2');
$$;

-- Enable RLS on all tenant-scoped tables
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE "UserCredential" ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS org_access ON "Organization";
DROP POLICY IF EXISTS membership_access ON "Membership";
DROP POLICY IF EXISTS site_access ON "Site";
DROP POLICY IF EXISTS area_access ON "Area";
DROP POLICY IF EXISTS catalogue_item_access ON "CatalogueItem";
DROP POLICY IF EXISTS catalogue_site_override_access ON "CatalogueSiteOverride";
DROP POLICY IF EXISTS catalogue_version_access ON "CatalogueVersion";
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

-- Organization policies (only admins can see/modify their org)
CREATE POLICY org_access ON "Organization"
  FOR SELECT
  USING ("id" = app_ctx_org());

CREATE POLICY org_admin_update ON "Organization"
  FOR UPDATE
  USING ("id" = app_ctx_org() AND app_ctx_role() = 'ADMIN')
  WITH CHECK ("id" = app_ctx_org() AND app_ctx_role() = 'ADMIN');

-- Membership policies
CREATE POLICY membership_read ON "Membership"
  FOR SELECT
  USING ("orgId" = app_ctx_org());

CREATE POLICY membership_admin_manage ON "Membership"
  FOR ALL
  USING ("orgId" = app_ctx_org() AND app_ctx_role() = 'ADMIN')
  WITH CHECK ("orgId" = app_ctx_org() AND app_ctx_role() = 'ADMIN');

-- Site policies
CREATE POLICY site_read ON "Site"
  FOR SELECT
  USING ("orgId" = app_ctx_org());

CREATE POLICY site_admin_manage ON "Site"
  FOR ALL
  USING ("orgId" = app_ctx_org() AND is_admin_or_procurement())
  WITH CHECK ("orgId" = app_ctx_org() AND is_admin_or_procurement());

-- Area policies
CREATE POLICY area_read ON "Area"
  FOR SELECT
  USING ("orgId" = app_ctx_org());

CREATE POLICY area_admin_manage ON "Area"
  FOR ALL
  USING ("orgId" = app_ctx_org() AND is_admin_or_procurement())
  WITH CHECK ("orgId" = app_ctx_org() AND is_admin_or_procurement());

-- Catalogue item policies
CREATE POLICY catalogue_item_read ON "CatalogueItem"
  FOR SELECT
  USING ("orgId" = app_ctx_org());

CREATE POLICY catalogue_item_manage ON "CatalogueItem"
  FOR ALL
  USING ("orgId" = app_ctx_org() AND is_admin_or_procurement())
  WITH CHECK ("orgId" = app_ctx_org() AND is_admin_or_procurement());

-- Catalogue site override policies
CREATE POLICY catalogue_override_read ON "CatalogueSiteOverride"
  FOR SELECT
  USING ("orgId" = app_ctx_org());

CREATE POLICY catalogue_override_manage ON "CatalogueSiteOverride"
  FOR ALL
  USING ("orgId" = app_ctx_org() AND is_admin_or_procurement())
  WITH CHECK ("orgId" = app_ctx_org() AND is_admin_or_procurement());

-- Catalogue version policies
CREATE POLICY catalogue_version_read ON "CatalogueVersion"
  FOR SELECT
  USING ("orgId" = app_ctx_org());

CREATE POLICY catalogue_version_manage ON "CatalogueVersion"
  FOR ALL
  USING ("orgId" = app_ctx_org() AND is_admin_or_procurement())
  WITH CHECK ("orgId" = app_ctx_org() AND is_admin_or_procurement());

-- Request policies (role-based access)
CREATE POLICY request_read ON "Request"
  FOR SELECT
  USING ("orgId" = app_ctx_org());

CREATE POLICY request_create ON "Request"
  FOR INSERT
  WITH CHECK ("orgId" = app_ctx_org() AND "createdBy" = app_ctx_user());

CREATE POLICY request_creator_update ON "Request"
  FOR UPDATE
  USING ("orgId" = app_ctx_org() AND "createdBy" = app_ctx_user() AND "status" = 'PENDING')
  WITH CHECK ("orgId" = app_ctx_org() AND "createdBy" = app_ctx_user());

CREATE POLICY request_approver_manage ON "Request"
  FOR UPDATE
  USING ("orgId" = app_ctx_org() AND can_approve())
  WITH CHECK ("orgId" = app_ctx_org() AND can_approve());

-- Request item policies
CREATE POLICY request_item_read ON "RequestItem"
  FOR SELECT
  USING ("orgId" = app_ctx_org());

CREATE POLICY request_item_create ON "RequestItem"
  FOR INSERT
  WITH CHECK (
    "orgId" = app_ctx_org()
    AND EXISTS (
      SELECT 1 FROM "Request" r
      WHERE r.id = "requestId"
      AND r."createdBy" = app_ctx_user()
      AND r."status" = 'PENDING'
    )
  );

CREATE POLICY request_item_creator_update ON "RequestItem"
  FOR UPDATE
  USING (
    "orgId" = app_ctx_org()
    AND EXISTS (
      SELECT 1 FROM "Request" r
      WHERE r.id = "requestId"
      AND r."createdBy" = app_ctx_user()
      AND r."status" = 'PENDING'
    )
  )
  WITH CHECK (
    "orgId" = app_ctx_org()
    AND EXISTS (
      SELECT 1 FROM "Request" r
      WHERE r.id = "requestId"
      AND r."createdBy" = app_ctx_user()
    )
  );

CREATE POLICY request_item_approver_manage ON "RequestItem"
  FOR UPDATE
  USING ("orgId" = app_ctx_org() AND can_approve())
  WITH CHECK ("orgId" = app_ctx_org() AND can_approve());

-- Approval decision policies (only approvers can create/update)
CREATE POLICY approval_decision_read ON "ApprovalDecision"
  FOR SELECT
  USING ("orgId" = app_ctx_org());

CREATE POLICY approval_decision_create ON "ApprovalDecision"
  FOR INSERT
  WITH CHECK ("orgId" = app_ctx_org() AND can_approve() AND "decidedBy" = app_ctx_user());

CREATE POLICY approval_decision_update ON "ApprovalDecision"
  FOR UPDATE
  USING ("orgId" = app_ctx_org() AND "decidedBy" = app_ctx_user())
  WITH CHECK ("orgId" = app_ctx_org() AND "decidedBy" = app_ctx_user());

-- Attachment policies
CREATE POLICY attachment_read ON "Attachment"
  FOR SELECT
  USING ("orgId" = app_ctx_org());

CREATE POLICY attachment_create ON "Attachment"
  FOR INSERT
  WITH CHECK ("orgId" = app_ctx_org() AND "createdBy" = app_ctx_user());

-- Receiving log policies (procurement only)
CREATE POLICY receiving_log_read ON "ReceivingLog"
  FOR SELECT
  USING ("orgId" = app_ctx_org());

CREATE POLICY receiving_log_manage ON "ReceivingLog"
  FOR ALL
  USING ("orgId" = app_ctx_org() AND is_admin_or_procurement())
  WITH CHECK ("orgId" = app_ctx_org() AND is_admin_or_procurement());

-- User credential policies (users can only access their own credentials)
CREATE POLICY user_credential_own_access ON "UserCredential"
  FOR SELECT
  USING ("userId" = app_ctx_user());

CREATE POLICY user_credential_own_update ON "UserCredential"
  FOR UPDATE
  USING ("userId" = app_ctx_user())
  WITH CHECK ("userId" = app_ctx_user());

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_membership_org_user ON "Membership"("orgId", "userId");
CREATE INDEX IF NOT EXISTS idx_site_org ON "Site"("orgId");
CREATE INDEX IF NOT EXISTS idx_area_org_site ON "Area"("orgId", "siteId");
CREATE INDEX IF NOT EXISTS idx_catalogue_item_org ON "CatalogueItem"("orgId");
CREATE INDEX IF NOT EXISTS idx_catalogue_item_org_sku ON "CatalogueItem"("orgId", "sku");
CREATE INDEX IF NOT EXISTS idx_request_org_status ON "Request"("orgId", "status");
CREATE INDEX IF NOT EXISTS idx_request_org_created ON "Request"("orgId", "createdAt");
CREATE INDEX IF NOT EXISTS idx_request_org_creator ON "Request"("orgId", "createdBy");
CREATE INDEX IF NOT EXISTS idx_request_item_org_request ON "RequestItem"("orgId", "requestId");
CREATE INDEX IF NOT EXISTS idx_approval_decision_org_request ON "ApprovalDecision"("orgId", "requestId");
CREATE INDEX IF NOT EXISTS idx_approval_decision_org_decider ON "ApprovalDecision"("orgId", "decidedBy");
CREATE INDEX IF NOT EXISTS idx_user_credential_user ON "UserCredential"("userId");

-- Set up proper grants (revoke public access first)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;