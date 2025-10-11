/**
 * Seed default resources for a new organization
 *
 * This function creates all default resources defined in:
 * DEV-Files/documentation/organization-defaults.md
 *
 * Called automatically when a new organization is created.
 */

import { db } from '../db/index.js';
import { approvalWorkflows, approvalLevels, roles } from '../db/schema.js';
import { eq, and, or, ilike } from 'drizzle-orm';

export async function seedOrganizationDefaults(organizationId: string): Promise<void> {
  try {
    console.log(`[seed] Seeding defaults for organization: ${organizationId}`);

    // 1. Seed default approval workflow
    await seedDefaultApprovalWorkflow(organizationId);

    // Future: Add more default resources here
    // await seedDefaultSites(organizationId);
    // await seedDefaultCategories(organizationId);
    // await seedDefaultCatalogueItems(organizationId);

    console.log(`[seed] ✅ Successfully seeded defaults for organization: ${organizationId}`);
  } catch (error) {
    console.error(`[seed] ❌ Error seeding defaults for organization ${organizationId}:`, error);
    // Don't throw - we don't want to fail organization creation if defaults fail
  }
}

async function seedDefaultApprovalWorkflow(organizationId: string): Promise<void> {
  try {
    console.log('[seed] Creating default approval workflow...');

    // Check if workflow already exists
    const existing = await db
      .select()
      .from(approvalWorkflows)
      .where(and(
        eq(approvalWorkflows.organization_id, organizationId),
        eq(approvalWorkflows.is_default, true)
      ))
      .limit(1);

    if (existing.length > 0) {
      console.log('[seed] Default workflow already exists, skipping');
      return;
    }

    // Find Site Manager role
    const siteManagerRoles = await db
      .select()
      .from(roles)
      .where(and(
        eq(roles.organization_id, organizationId),
        ilike(roles.name, '%site%manager%')
      ))
      .limit(1);

    // Find Procurement role (try multiple variations)
    const procurementRoles = await db
      .select()
      .from(roles)
      .where(and(
        eq(roles.organization_id, organizationId),
        or(
          ilike(roles.name, '%procurement%'),
          ilike(roles.name, '%admin%')
        )
      ))
      .limit(1);

    if (siteManagerRoles.length === 0 || procurementRoles.length === 0) {
      console.log('[seed] ⚠️  Required roles not found, skipping workflow creation');
      console.log(`[seed]    Site Manager: ${siteManagerRoles.length > 0 ? '✅' : '❌'}`);
      console.log(`[seed]    Procurement: ${procurementRoles.length > 0 ? '✅' : '❌'}`);
      return;
    }

    const siteManagerRole = siteManagerRoles[0];
    const procurementRole = procurementRoles[0];

    console.log(`[seed] Found Site Manager role: ${siteManagerRole.name}`);
    console.log(`[seed] Found Procurement role: ${procurementRole.name}`);

    // Create workflow
    const [workflow] = await db
      .insert(approvalWorkflows)
      .values({
        organization_id: organizationId,
        name: 'Standard Request Approval',
        description: 'Default two-level approval workflow for all requests. Level 1: Site Manager reviews and approves requests from their site. Level 2: Procurement Manager handles final approval and procurement.',
        trigger_type: 'request',
        trigger_conditions: {},
        is_default: true,
        is_active: true
      })
      .returning();

    console.log(`[seed] Created workflow: ${workflow.name} (${workflow.id})`);

    // Create approval levels
    await db.insert(approvalLevels).values([
      {
        workflow_id: workflow.id,
        level_order: 1,
        role_id: siteManagerRole.id
      },
      {
        workflow_id: workflow.id,
        level_order: 2,
        role_id: procurementRole.id
      }
    ]);

    console.log(`[seed] ✅ Added approval levels: ${siteManagerRole.name} → ${procurementRole.name}`);
  } catch (error) {
    console.error('[seed] Error creating default approval workflow:', error);
    throw error;
  }
}

// Future default seeding functions
/*
async function seedDefaultSites(organizationId: string): Promise<void> {
  // TODO: Implement default sites creation
}

async function seedDefaultCategories(organizationId: string): Promise<void> {
  // TODO: Implement default categories creation
}

async function seedDefaultCatalogueItems(organizationId: string): Promise<void> {
  // TODO: Implement default catalogue items creation
}
*/
