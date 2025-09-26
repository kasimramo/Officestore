import { redirect } from "next/navigation";
import { requireOrgMembership } from "@/lib/context";

export default async function OrganizationIndexPage() {
  await requireOrgMembership();
  redirect("/organization/setup");
}
