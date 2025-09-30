import { Router } from 'express';
import { db } from '../db/index.js';
import { sites, areas } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { ensureOrganizationExists } from '../helpers/organizationHelper.js';

const router = Router();

// Get all sites for organization
router.get('/', async (req, res) => {
  console.log('🚀 GET /api/sites called')
  try {
    // Ensure organization exists and get its ID
    const organizationId = await ensureOrganizationExists();

    // Fetch all sites and all areas in just 2 queries (much faster!)
    const [allSites, allAreas] = await Promise.all([
      db.select().from(sites).where(eq(sites.organization_id, organizationId)),
      db.select().from(areas).where(eq(areas.organization_id, organizationId))
    ]);

    // Group areas by site_id in memory (O(n) - very fast)
    const areasBySiteId = allAreas.reduce((acc, area) => {
      if (!acc[area.site_id]) acc[area.site_id] = [];
      acc[area.site_id].push({
        id: area.id,
        siteId: area.site_id,
        name: area.name,
        description: area.description,
        isActive: area.is_active,
        createdAt: area.created_at.toISOString()
      });
      return acc;
    }, {} as Record<string, any[]>);

    // Map sites with their areas (O(n) - very fast)
    const sitesWithAreas = allSites.map(site => ({
      id: site.id,
      name: site.name,
      description: site.description,
      address: site.address,
      isActive: site.is_active,
      createdAt: site.created_at.toISOString(),
      areas: areasBySiteId[site.id] || []
    }));

    res.json({
      success: true,
      data: sitesWithAreas
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_SITES_ERROR',
        message: 'Failed to fetch sites'
      }
    });
  }
});

// Create new site
router.post('/', async (req, res) => {
  console.log('🚀 POST /api/sites called with body:', req.body)
  try {
    const { name, description, address } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Site name is required'
        }
      });
    }

    // Ensure organization exists and get its ID
    const organizationId = await ensureOrganizationExists();

    const newSite = await db
      .insert(sites)
      .values({
        id: randomUUID(),
        organization_id: organizationId,
        name,
        description,
        address,
        is_active: true
      })
      .returning();

    const siteData = {
      id: newSite[0].id,
      name: newSite[0].name,
      description: newSite[0].description,
      address: newSite[0].address,
      isActive: newSite[0].is_active,
      createdAt: newSite[0].created_at.toISOString(),
      areas: []
    };

    res.status(201).json({
      success: true,
      data: siteData
    });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CREATE_SITE_ERROR',
        message: 'Failed to create site'
      }
    });
  }
});

// Toggle site active status (disable/enable)
router.patch('/:id/toggle-status', async (req, res) => {
  console.log('🚀 PATCH /api/sites/:id/toggle-status called with id:', req.params.id)
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Site ID is required'
        }
      });
    }

    // Ensure organization exists and get its ID
    const organizationId = await ensureOrganizationExists();

    // Get current site status
    const currentSite = await db
      .select({ is_active: sites.is_active })
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.organization_id, organizationId)))
      .limit(1);

    if (currentSite.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SITE_NOT_FOUND',
          message: 'Site not found'
        }
      });
    }

    // Toggle the active status
    const newStatus = !currentSite[0].is_active;

    const updatedSite = await db
      .update(sites)
      .set({ is_active: newStatus, updated_at: new Date() })
      .where(and(eq(sites.id, id), eq(sites.organization_id, organizationId)))
      .returning();

    res.json({
      success: true,
      data: {
        id: updatedSite[0].id,
        isActive: updatedSite[0].is_active
      },
      message: `Site ${newStatus ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    console.error('Error toggling site status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'TOGGLE_SITE_ERROR',
        message: 'Failed to toggle site status'
      }
    });
  }
});

// Update site details
router.put('/:id', async (req, res) => {
  console.log('🚀 PUT /api/sites/:id called with id:', req.params.id, 'body:', req.body)
  try {
    const { id } = req.params;
    const { name, description, address } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Site ID is required'
        }
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Site name is required'
        }
      });
    }

    // Ensure organization exists and get its ID
    const organizationId = await ensureOrganizationExists();

    const updatedSite = await db
      .update(sites)
      .set({
        name,
        description,
        address,
        updated_at: new Date()
      })
      .where(and(eq(sites.id, id), eq(sites.organization_id, organizationId)))
      .returning();

    if (updatedSite.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SITE_NOT_FOUND',
          message: 'Site not found'
        }
      });
    }

    // Get areas for the updated site
    const siteAreas = await db
      .select()
      .from(areas)
      .where(eq(areas.site_id, id));

    const siteData = {
      id: updatedSite[0].id,
      name: updatedSite[0].name,
      description: updatedSite[0].description,
      address: updatedSite[0].address,
      isActive: updatedSite[0].is_active,
      createdAt: updatedSite[0].created_at.toISOString(),
      areas: siteAreas.map(area => ({
        id: area.id,
        siteId: area.site_id,
        name: area.name,
        description: area.description,
        isActive: area.is_active,
        createdAt: area.created_at.toISOString()
      }))
    };

    res.json({
      success: true,
      data: siteData
    });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_SITE_ERROR',
        message: 'Failed to update site'
      }
    });
  }
});

export { router as sitesRouter };