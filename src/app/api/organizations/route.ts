import { NextRequest, NextResponse } from "next/server";
import { getDbContextFromRequest } from "@/lib/context";
import { withDbContext, query } from "@/lib/db";
import { createOrgSchema, createSuccessResponse, createErrorResponse } from "@/lib/validation";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse("Unauthorized"),
        { status: 401 }
      );
    }

    // Get user's organizations
    const memberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
      include: {
        organization: true,
      },
    });

    const organizations = memberships.map(m => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
      createdAt: m.organization.createdAt,
    }));

    return NextResponse.json(createSuccessResponse(organizations));
  } catch (error) {
    console.error("Get organizations error:", error);
    return NextResponse.json(
      createErrorResponse("Internal server error"),
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        createErrorResponse("Unauthorized"),
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = createOrgSchema.parse(body);

    // Auto-generate slug from organization name
    function generateSlug(name: string): string {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim()
        .substring(0, 50); // Limit length
    }

    let slug = generateSlug(validatedData.name);
    let slugCounter = 1;

    // Ensure slug is unique
    while (true) {
      const existingOrg = await prisma.organization.findUnique({
        where: { slug: slug },
      });

      if (!existingOrg) {
        break;
      }

      slug = `${generateSlug(validatedData.name)}-${slugCounter}`;
      slugCounter++;
    }

    // Create organization and assign user as admin
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: validatedData.name,
          slug: slug,
        },
      });

      const membership = await tx.membership.create({
        data: {
          orgId: organization.id,
          userId: session.user.id,
          role: "ADMIN",
        },
      });

      // Create default site
      const site = await tx.site.create({
        data: {
          orgId: organization.id,
          name: "Main Site",
          timezone: "UTC",
          locale: "en",
        },
      });

      // Create default pantry area
      const area = await tx.area.create({
        data: {
          siteId: site.id,
          orgId: organization.id,
          name: "Main Pantry",
          type: "PANTRY",
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          action: "ORG_CREATED",
          targetType: "Organization",
          targetId: organization.id,
          meta: {
            orgName: organization.name,
            orgSlug: organization.slug,
          },
        },
      });

      return {
        organization,
        membership,
        site,
        area,
      };
    });

    return NextResponse.json(
      createSuccessResponse({
        organization: result.organization,
        membership: result.membership,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error("Create organization error:", error);

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