import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSuccessResponse, createErrorResponse } from "@/lib/validation";
import { z } from "zod";

const updateSiteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
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

    // Get site
    const site = await prisma.site.findFirst({
      where: {
        id: params.id,
        orgId: membership.orgId
      },
      include: {
        areas: {
          select: { id: true, name: true, type: true, isActive: true },
        },
      },
    });

    if (!site) {
      return NextResponse.json(
        createErrorResponse("Site not found"),
        { status: 404 }
      );
    }

    return NextResponse.json(createSuccessResponse(site));
  } catch (error) {
    console.error("Get site error:", error);
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

    // Check if user has permission to update sites
    if (!["ADMIN", "PROCUREMENT"].includes(membership.role)) {
      return NextResponse.json(
        createErrorResponse("Insufficient permissions"),
        { status: 403 }
      );
    }

    // Verify site belongs to organization
    const existingSite = await prisma.site.findFirst({
      where: {
        id: params.id,
        orgId: membership.orgId
      },
    });

    if (!existingSite) {
      return NextResponse.json(
        createErrorResponse("Site not found"),
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateSiteSchema.parse(body);

    // Update site
    const site = await prisma.site.update({
      where: { id: params.id },
      data: validatedData,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.user.id,
        action: "SITE_UPDATED",
        targetType: "Site",
        targetId: site.id,
        meta: {
          siteName: site.name,
          changes: validatedData,
        },
      },
    });

    return NextResponse.json(createSuccessResponse(site));
  } catch (error) {
    console.error("Update site error:", error);

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