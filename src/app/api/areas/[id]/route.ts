import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSuccessResponse, createErrorResponse } from "@/lib/validation";
import { z } from "zod";
import { AreaType } from "@prisma/client";

const updateAreaSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.nativeEnum(AreaType).optional(),
  inChargeUserId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse("Unauthorized"),
        { status: 401 }
      );
    }

    // Get user's current organization
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        createErrorResponse("No organization membership found"),
        { status: 404 }
      );
    }

    // Get area
    const area = await prisma.area.findFirst({
      where: {
        id: params.id,
        orgId: membership.orgId
      },
      include: {
        site: { select: { id: true, name: true } },
        inChargeUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!area) {
      return NextResponse.json(
        createErrorResponse("Area not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(area));
  } catch (error) {
    console.error("Get area error:", error);
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse("Unauthorized"),
        { status: 401 }
      );
    }

    // Get user's current organization
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { organization: true },
    });

    if (!membership) {
      return NextResponse.json(
        createErrorResponse("No organization membership found"),
        { status: 404 }
      );
    }

    // Check if user has permission to update areas
    if (!["ADMIN", "PROCUREMENT"].includes(membership.role)) {
      return NextResponse.json(
        createErrorResponse("Insufficient permissions"),
        { status: 403 }
      );
    }

    // Verify area belongs to organization
    const existingArea = await prisma.area.findFirst({
      where: {
        id: params.id,
        orgId: membership.orgId
      },
    });

    if (!existingArea) {
      return NextResponse.json(
        createErrorResponse("Area not found"),
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateAreaSchema.parse(body);

    // Update area
    const area = await prisma.area.update({
      where: { id: params.id },
      data: validatedData,
      include: {
        site: { select: { id: true, name: true } },
        inChargeUser: { select: { id: true, name: true, email: true } },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "AREA_UPDATED",
        targetType: "Area",
        targetId: area.id,
        meta: {
          areaName: area.name,
          siteName: area.site.name,
          changes: validatedData,
        },
      },
    });

    return NextResponse.json(createSuccessResponse(area));
  } catch (error) {
    console.error("Update area error:", error);

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        createErrorResponse("Invalid input data"),
        { status: 400 }
      );
    }

    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}