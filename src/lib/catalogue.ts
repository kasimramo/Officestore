import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

function getOrgSkuPrefix(input?: { slug?: string | null; name?: string | null }) {
  const source = input?.slug || input?.name || "ORG";
  const sanitized = source.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  return (sanitized || "ORG").slice(0, 4).padEnd(4, "X");
}

function randomSegment(length: number) {
  return randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .toUpperCase()
    .slice(0, length);
}

export async function generateCatalogueSku(orgId: string): Promise<string> {
  const organization = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { slug: true, name: true },
  });

  const prefix = getOrgSkuPrefix(organization);

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const suffix = randomSegment(6 + attempt);
    const candidate = `${prefix}-${suffix}`;

    const existing = await prisma.catalogueItem.findUnique({
      where: {
        orgId_sku: {
          orgId,
          sku: candidate,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique SKU. Please try again.");
}
