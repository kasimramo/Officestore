import { db } from '../db/index.js';
import { organizations } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Auto-create organization if it doesn't exist
export async function ensureOrganizationExists(): Promise<string> {
  const orgSlug = 'd365-boq';

  try {
    // Check if organization already exists
    const existingOrg = await db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, orgSlug))
      .limit(1);

    if (existingOrg.length > 0) {
      console.log(`Organization found: ${existingOrg[0].name} (${existingOrg[0].id})`);
      return existingOrg[0].id;
    }

    // Create new organization with proper UUID
    console.log('Creating new organization...');
    const organizationId = randomUUID();
    const newOrg = await db
      .insert(organizations)
      .values({
        id: organizationId,
        name: 'D365 BOQ',
        slug: orgSlug,
        description: 'D365 Business Operations & Quality Management',
        settings: {
          features: {
            inventory_management: true,
            request_approvals: true,
            multi_site_support: true
          },
          approval_workflow: {
            l1_required: true,
            l2_required: false,
            auto_approve_threshold: 1000
          }
        }
      })
      .returning();

    console.log(`Created organization: ${newOrg[0].name} (${newOrg[0].id})`);
    return newOrg[0].id;

  } catch (error) {
    console.error('Error ensuring organization exists:', error);
    throw error;
  }
}