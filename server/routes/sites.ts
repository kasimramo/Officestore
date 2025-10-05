import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { sites, areas } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Get all sites for authenticated user's organization
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_ORGANIZATION',
          message: 'User must be associated with an organization'
        }
      });
    }

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
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId;
    const { name, description, address } = req.body;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_ORGANIZATION',
          message: 'User must be associated with an organization'
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

    const [newSite] = await db
      .insert(sites)
      .values({
        organization_id: organizationId,
        name,
        description,
        address,
        is_active: true
      })
      .returning();

    const siteData = {
      id: newSite.id,
      name: newSite.name,
      description: newSite.description,
      address: newSite.address,
      isActive: newSite.is_active,
      createdAt: newSite.created_at.toISOString(),
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
router.patch('/:id/toggle-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId;
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

    // Get current site status
    const [currentSite] = await db
      .select({ is_active: sites.is_active })
      .from(sites)
      .where(and(eq(sites.id, id), eq(sites.organization_id, organizationId)))
      .limit(1);

    if (!currentSite) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SITE_NOT_FOUND',
          message: 'Site not found'
        }
      });
    }

    // Toggle the active status
    const newStatus = !currentSite.is_active;

    const [updatedSite] = await db
      .update(sites)
      .set({ is_active: newStatus, updated_at: new Date() })
      .where(and(eq(sites.id, id), eq(sites.organization_id, organizationId)))
      .returning();

    res.json({
      success: true,
      data: {
        id: updatedSite.id,
        isActive: updatedSite.is_active
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
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const organizationId = user.organizationId;
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

    const [updatedSite] = await db
      .update(sites)
      .set({
        name,
        description,
        address,
        updated_at: new Date()
      })
      .where(and(eq(sites.id, id), eq(sites.organization_id, organizationId)))
      .returning();

    if (!updatedSite) {
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
      id: updatedSite.id,
      name: updatedSite.name,
      description: updatedSite.description,
      address: updatedSite.address,
      isActive: updatedSite.is_active,
      createdAt: updatedSite.created_at.toISOString(),
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
