import { Router, Request, Response } from 'express';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { db } from '../db/index.js';
import { requests, requestItems, catalogueItems, users, sites, areas, categories } from '../db/schema.js';
import { requireAuth } from '../middleware/auth.js';
import { checkPermission } from '../middleware/permissions.js';

const router = Router();

// Get all requests for user's organization
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { status, site_id, area_id } = req.query;

    // Build WHERE conditions
    const conditions: any[] = [eq(requests.organization_id, user.organizationId!)];

    // Filter by status
    if (status && typeof status === 'string') {
      conditions.push(eq(requests.status, status));
    }

    // Filter by site
    if (site_id && typeof site_id === 'string') {
      conditions.push(eq(requests.site_id, site_id));
    }

    // Filter by area
    if (area_id && typeof area_id === 'string') {
      conditions.push(eq(requests.area_id, area_id));
    }

    // Fetch requests with related data
    const requestList = await db
      .select({
        id: requests.id,
        status: requests.status,
        priority: requests.priority,
        notes: requests.notes,
        requested_by_date: requests.requested_by_date,
        approved_at: requests.approved_at,
        fulfilled_at: requests.fulfilled_at,
        created_at: requests.created_at,
        updated_at: requests.updated_at,
        requester_id: requests.requester_id,
        site_id: requests.site_id,
        area_id: requests.area_id,
        approved_by: requests.approved_by,
        fulfilled_by: requests.fulfilled_by,
      })
      .from(requests)
      .where(and(...conditions))
      .orderBy(desc(requests.created_at));

    // Fetch related data for each request
    const enrichedRequests = await Promise.all(
      requestList.map(async (request) => {
        // Fetch requester
        const requester = await db
          .select({
            id: users.id,
            username: users.username,
            firstName: users.first_name,
            lastName: users.last_name,
          })
          .from(users)
          .where(eq(users.id, request.requester_id))
          .limit(1);

        // Fetch site
        const site = await db
          .select({ id: sites.id, name: sites.name })
          .from(sites)
          .where(eq(sites.id, request.site_id))
          .limit(1);

        // Fetch area
        const area = await db
          .select({ id: areas.id, name: areas.name })
          .from(areas)
          .where(eq(areas.id, request.area_id))
          .limit(1);

        // Fetch request items with catalogue item details
        const items = await db
          .select({
            id: requestItems.id,
            quantity: requestItems.quantity,
            notes: requestItems.notes,
            catalogue_item_id: requestItems.catalogue_item_id,
            item_name: catalogueItems.name,
            item_description: catalogueItems.description,
            item_unit: catalogueItems.unit,
            item_cost: catalogueItems.cost_per_unit,
            category_id: catalogueItems.category_id,
          })
          .from(requestItems)
          .leftJoin(catalogueItems, eq(requestItems.catalogue_item_id, catalogueItems.id))
          .where(eq(requestItems.request_id, request.id));

        // Calculate total value
        const totalValue = items.reduce((sum, item) => {
          const cost = parseFloat(item.item_cost || '0');
          return sum + cost * item.quantity;
        }, 0);

        return {
          ...request,
          requester: requester[0] || null,
          site: site[0] || null,
          area: area[0] || null,
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            notes: item.notes,
            catalogueItem: {
              id: item.catalogue_item_id,
              name: item.item_name,
              description: item.item_description,
              unit: item.item_unit,
              costPerUnit: item.item_cost,
              categoryId: item.category_id,
            },
          })),
          totalValue: totalValue.toFixed(2),
        };
      })
    );

    res.json({
      success: true,
      data: enrichedRequests,
    });
  } catch (error: any) {
    console.error('Error fetching requests:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch requests', details: error.message },
    });
  }
});

// Get single request by ID
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Fetch request
    const requestData = await db
      .select()
      .from(requests)
      .where(and(eq(requests.id, id), eq(requests.organization_id, user.organizationId!)))
      .limit(1);

    if (requestData.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Request not found' },
      });
    }

    const request = requestData[0];

    // Fetch requester
    const requester = await db
      .select({
        id: users.id,
        username: users.username,
        firstName: users.first_name,
        lastName: users.last_name,
      })
      .from(users)
      .where(eq(users.id, request.requester_id))
      .limit(1);

    // Fetch site
    const site = await db
      .select({ id: sites.id, name: sites.name })
      .from(sites)
      .where(eq(sites.id, request.site_id))
      .limit(1);

    // Fetch area
    const area = await db
      .select({ id: areas.id, name: areas.name })
      .from(areas)
      .where(eq(areas.id, request.area_id))
      .limit(1);

    // Fetch request items with catalogue item details and category
    const items = await db
      .select({
        id: requestItems.id,
        quantity: requestItems.quantity,
        notes: requestItems.notes,
        catalogue_item_id: requestItems.catalogue_item_id,
        item_name: catalogueItems.name,
        item_description: catalogueItems.description,
        item_unit: catalogueItems.unit,
        item_cost: catalogueItems.cost_per_unit,
        category_id: catalogueItems.category_id,
        category_name: categories.name,
      })
      .from(requestItems)
      .leftJoin(catalogueItems, eq(requestItems.catalogue_item_id, catalogueItems.id))
      .leftJoin(categories, eq(catalogueItems.category_id, categories.id))
      .where(eq(requestItems.request_id, request.id));

    // Calculate total value
    const totalValue = items.reduce((sum, item) => {
      const cost = parseFloat(item.item_cost || '0');
      return sum + cost * item.quantity;
    }, 0);

    // Group items by category
    const itemsByCategory = items.reduce((acc: any, item) => {
      const categoryName = item.category_name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push({
        id: item.id,
        quantity: item.quantity,
        notes: item.notes,
        catalogueItem: {
          id: item.catalogue_item_id,
          name: item.item_name,
          description: item.item_description,
          unit: item.item_unit,
          costPerUnit: item.item_cost,
          categoryId: item.category_id,
        },
      });
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        ...request,
        requester: requester[0] || null,
        site: site[0] || null,
        area: area[0] || null,
        items: items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          notes: item.notes,
          catalogueItem: {
            id: item.catalogue_item_id,
            name: item.item_name,
            description: item.item_description,
            unit: item.item_unit,
            costPerUnit: item.item_cost,
            categoryId: item.category_id,
          },
        })),
        itemsByCategory,
        totalValue: totalValue.toFixed(2),
      },
    });
  } catch (error: any) {
    console.error('Error fetching request:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch request', details: error.message },
    });
  }
});

// Create new request
router.post('/', requireAuth, checkPermission('requests.submit_requests'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { site_id, area_id, items, notes, priority, requested_by_date } = req.body;

    // Validation
    if (!site_id || !area_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Site and area are required' },
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'At least one item is required' },
      });
    }

    // Validate all items belong to the same category
    const catalogueItemIds = items.map((item) => item.catalogue_item_id);
    const catalogueItemsData = await db
      .select({
        id: catalogueItems.id,
        category_id: catalogueItems.category_id,
      })
      .from(catalogueItems)
      .where(
        and(
          eq(catalogueItems.organization_id, user.organizationId!),
          inArray(catalogueItems.id, catalogueItemIds)
        )
      );

    if (catalogueItemsData.length !== catalogueItemIds.length) {
      return res.status(400).json({
        success: false,
        error: { message: 'Some catalogue items not found' },
      });
    }

    // Check all items have the same category
    const categories = [...new Set(catalogueItemsData.map((item) => item.category_id))];
    if (categories.length > 1) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'All items in a request must belong to the same category. Please create separate requests for different categories.',
        },
      });
    }

    // Create request
    const newRequest = await db
      .insert(requests)
      .values({
        organization_id: user.organizationId!,
        requester_id: user.userId,
        site_id,
        area_id,
        status: 'pending',
        priority: priority || 'medium',
        notes,
        requested_by_date: requested_by_date ? new Date(requested_by_date) : null,
      })
      .returning();

    // Create request items
    const requestItemsData = items.map((item: any) => ({
      request_id: newRequest[0].id,
      catalogue_item_id: item.catalogue_item_id,
      quantity: item.quantity,
      notes: item.notes || null,
    }));

    await db.insert(requestItems).values(requestItemsData);

    res.status(201).json({
      success: true,
      data: newRequest[0],
      message: 'Request created successfully',
    });
  } catch (error: any) {
    console.error('Error creating request:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create request', details: error.message },
    });
  }
});

// Approve request
router.post('/:id/approve', requireAuth, checkPermission('requests.approve_requests'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Update request status
    const updated = await db
      .update(requests)
      .set({
        status: 'approved',
        approved_at: new Date(),
        approved_by: user.userId,
        updated_at: new Date(),
      })
      .where(and(eq(requests.id, id), eq(requests.organization_id, user.organizationId!)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Request not found' },
      });
    }

    res.json({
      success: true,
      data: updated[0],
      message: 'Request approved successfully',
    });
  } catch (error: any) {
    console.error('Error approving request:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to approve request', details: error.message },
    });
  }
});

// Reject request
router.post('/:id/reject', requireAuth, checkPermission('requests.reject_requests'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { notes } = req.body;

    // Update request status
    const updated = await db
      .update(requests)
      .set({
        status: 'rejected',
        notes: notes || null,
        updated_at: new Date(),
      })
      .where(and(eq(requests.id, id), eq(requests.organization_id, user.organizationId!)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Request not found' },
      });
    }

    res.json({
      success: true,
      data: updated[0],
      message: 'Request rejected',
    });
  } catch (error: any) {
    console.error('Error rejecting request:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reject request', details: error.message },
    });
  }
});

// Fulfill request
router.post('/:id/fulfill', requireAuth, checkPermission('requests.fulfill_requests'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Update request status
    const updated = await db
      .update(requests)
      .set({
        status: 'fulfilled',
        fulfilled_at: new Date(),
        fulfilled_by: user.userId,
        updated_at: new Date(),
      })
      .where(and(eq(requests.id, id), eq(requests.organization_id, user.organizationId!)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'Request not found' },
      });
    }

    res.json({
      success: true,
      data: updated[0],
      message: 'Request fulfilled successfully',
    });
  } catch (error: any) {
    console.error('Error fulfilling request:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fulfill request', details: error.message },
    });
  }
});

export default router;
