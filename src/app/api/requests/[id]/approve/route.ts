import { NextRequest, NextResponse } from "next/server";
import { getDbContextFromRequest } from "@/lib/context";
import { withDbContext, query } from "@/lib/db";
import { approvalDecisionSchema, createSuccessResponse, createErrorResponse } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const ctx = await getDbContextFromRequest();
    const body = await request.json();
    const validatedData = approvalDecisionSchema.parse(body);

    // Check if user has approval permissions
    if (!["ADMIN", "APPROVER_L1", "APPROVER_L2", "PROCUREMENT"].includes(ctx.role)) {
      return NextResponse.json(
        createErrorResponse("Insufficient permissions"),
        { status: 403 }
      );
    }

    const result = await withDbContext(ctx, async (client) => {
      // Get the request and verify it exists and belongs to the org
      const requestResult = await query(client, `
        SELECT r.id, r.status, r.created_by, s.name as site_name, a.name as area_name
        FROM "Request" r
        JOIN "Site" s ON r.site_id = s.id
        JOIN "Area" a ON r.area_id = a.id
        WHERE r.id = $1 AND r.org_id = $2
      `, [params.id, ctx.orgId]);

      if (requestResult.rows.length === 0) {
        throw new Error("Request not found");
      }

      const requestData = requestResult.rows[0];

      if (requestData.status !== "PENDING") {
        throw new Error("Request is not pending approval");
      }

      // Check if user is trying to approve their own request
      if (requestData.created_by === ctx.userId) {
        throw new Error("Cannot approve your own request");
      }

      // Check if this user has already made a decision on this request
      const existingDecisionResult = await query(client, `
        SELECT id FROM "ApprovalDecision"
        WHERE request_id = $1 AND approver_id = $2
      `, [params.id, ctx.userId]);

      if (existingDecisionResult.rows.length > 0) {
        throw new Error("You have already made a decision on this request");
      }

      // Create approval decision
      const decisionResult = await query(client, `
        INSERT INTO "ApprovalDecision" (request_id, org_id, approver_id, decision, comment)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        params.id,
        ctx.orgId,
        ctx.userId,
        validatedData.decision,
        validatedData.comment || null,
      ]);

      // Update request status based on decision
      const newStatus = validatedData.decision === "APPROVE" ? "APPROVED" : "REJECTED";

      await query(client, `
        UPDATE "Request"
        SET status = $1
        WHERE id = $2 AND org_id = $3
      `, [newStatus, params.id, ctx.orgId]);

      // Audit log
      await query(client, `
        INSERT INTO "AuditLog" (actor_id, action, target_type, target_id, meta)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        ctx.userId,
        validatedData.decision === "APPROVE" ? "REQUEST_APPROVED" : "REQUEST_REJECTED",
        "Request",
        params.id,
        JSON.stringify({
          decision: validatedData.decision,
          comment: validatedData.comment,
          approverRole: ctx.role,
          siteName: requestData.site_name,
          areaName: requestData.area_name,
        }),
      ]);

      // TODO: Send notification to request creator
      // TODO: If approved, potentially trigger procurement workflow

      return {
        decision: decisionResult.rows[0],
        request: {
          id: params.id,
          status: newStatus,
        },
      };
    });

    return NextResponse.json(createSuccessResponse(result));
  } catch (error) {
    console.error("Approve request error:", error);

    if (error instanceof Error) {
      if (error.name === "ZodError") {
        return NextResponse.json(
          createErrorResponse("Invalid input data"),
          { status: 400 }
        );
      }
      if (error.message.includes("not found") ||
          error.message.includes("not pending") ||
          error.message.includes("your own request") ||
          error.message.includes("already made a decision")) {
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