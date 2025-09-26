import { NextRequest, NextResponse } from "next/server";
import { getDbContextFromRequest } from "@/lib/context";
import { withDbContext, query } from "@/lib/db";
import { createRequestSchema, searchSchema, createSuccessResponse, createErrorResponse } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const ctx = await getDbContextFromRequest();
    const { searchParams } = new URL(request.url);

    const validatedParams = searchSchema.parse({
      q: searchParams.get("q") || undefined,
      status: searchParams.get("status") || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    });

    const offset = (validatedParams.page - 1) * validatedParams.limit;

    const requestsData = await withDbContext(ctx, async (client) => {
      let whereClause = "WHERE r.org_id = $1 AND s.is_active = true AND a.is_active = true";
      let params: any[] = [ctx.orgId];
      let paramIndex = 2;

      if (validatedParams.status) {
        whereClause += ` AND r.status = $${paramIndex}`;
        params.push(validatedParams.status);
        paramIndex++;
      }

      if (validatedParams.q) {
        whereClause += ` AND (s.name ILIKE $${paramIndex} OR a.name ILIKE $${paramIndex} OR u.name ILIKE $${paramIndex})`;
        params.push(`%${validatedParams.q}%`);
        paramIndex++;
      }

      // Get total count
      const countResult = await query(client, `
        SELECT COUNT(*) as total
        FROM "Request" r
        JOIN "Site" s ON r.site_id = s.id
        JOIN "Area" a ON r.area_id = a.id
        JOIN "User" u ON r.created_by = u.id
        ${whereClause}
      `, params);

      // Get paginated results with related data
      const requestsResult = await query(client, `
        SELECT
          r.id, r.type, r.status, r.created_at,
          s.name as site_name, a.name as area_name, a.type as area_type,
          u.name as creator_name, u.email as creator_email,
          COUNT(ri.id) as item_count
        FROM "Request" r
        JOIN "Site" s ON r.site_id = s.id
        JOIN "Area" a ON r.area_id = a.id
        JOIN "User" u ON r.created_by = u.id
        LEFT JOIN "RequestItem" ri ON r.id = ri.request_id
        ${whereClause}
        GROUP BY r.id, s.name, a.name, a.type, u.name, u.email
        ORDER BY r.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, validatedParams.limit, offset]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / validatedParams.limit);

      return {
        requests: requestsResult.rows,
        meta: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total,
          totalPages,
        },
      };
    });

    return NextResponse.json(createSuccessResponse(requestsData.requests, requestsData.meta));
  } catch (error) {
    console.error("Get requests error:", error);
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getDbContextFromRequest();
    const body = await request.json();
    const validatedData = createRequestSchema.parse(body);

    const result = await withDbContext(ctx, async (client) => {
      // Verify site and area belong to the organization
      const siteResult = await query(client, `
        SELECT id FROM "Site" WHERE id = $1 AND org_id = $2
      `, [validatedData.siteId, ctx.orgId]);

      if (siteResult.rows.length === 0) {
        throw new Error("Site not found");
      }

      const areaResult = await query(client, `
        SELECT id FROM "Area" WHERE id = $1 AND org_id = $2 AND site_id = $3
      `, [validatedData.areaId, ctx.orgId, validatedData.siteId]);

      if (areaResult.rows.length === 0) {
        throw new Error("Area not found");
      }

      // Verify all catalogue items exist and belong to the organization
      for (const item of validatedData.items) {
        const itemResult = await query(client, `
          SELECT id FROM "CatalogueItem"
          WHERE id = $1 AND org_id = $2 AND active = true
        `, [item.catalogueItemId, ctx.orgId]);

        if (itemResult.rows.length === 0) {
          throw new Error(`Catalogue item ${item.catalogueItemId} not found`);
        }
      }

      // Create the request
      const requestResult = await query(client, `
        INSERT INTO "Request" (org_id, site_id, area_id, type, status, created_by)
        VALUES ($1, $2, $3, $4, 'PENDING', $5)
        RETURNING *
      `, [
        ctx.orgId,
        validatedData.siteId,
        validatedData.areaId,
        validatedData.type,
        ctx.userId,
      ]);

      const requestId = requestResult.rows[0].id;

      // Create request items
      for (const item of validatedData.items) {
        await query(client, `
          INSERT INTO "RequestItem" (request_id, org_id, catalogue_item_id, quantity, notes)
          VALUES ($1, $2, $3, $4, $5)
        `, [
          requestId,
          ctx.orgId,
          item.catalogueItemId,
          item.quantity,
          item.notes || null,
        ]);
      }

      // Audit log
      await query(client, `
        INSERT INTO "AuditLog" (actor_id, action, target_type, target_id, meta)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        ctx.userId,
        "REQUEST_CREATED",
        "Request",
        requestId,
        JSON.stringify({
          type: validatedData.type,
          itemCount: validatedData.items.length,
          siteId: validatedData.siteId,
          areaId: validatedData.areaId,
        }),
      ]);

      // TODO: Trigger approval workflow based on rules
      // For now, we'll keep it simple and require manual approval

      return requestResult.rows[0];
    });

    return NextResponse.json(
      createSuccessResponse(result),
      { status: 201 }
    );
  } catch (error) {
    console.error("Create request error:", error);

    if (error instanceof Error) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          createErrorResponse("Invalid input data"),
          { status: 400 }
        );
      }
      if (error.message.includes("not found")) {
        return NextResponse.json(
          createErrorResponse(error.message),
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}