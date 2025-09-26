import { requireOrgMembership } from "@/lib/context";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

interface EditAreaPageProps {
  params: { id: string };
}

export default async function EditAreaPage({ params }: EditAreaPageProps) {
  const { ctx } = await requireOrgMembership();

  // Get the area with related site and user data
  const [area, sites, users] = await Promise.all([
    prisma.area.findUnique({
      where: {
        id: params.id,
        orgId: ctx.orgId,
      },
      include: {
        site: true,
        inChargeUser: true,
      },
    }),
    prisma.site.findMany({
      where: { orgId: ctx.orgId },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: {
        memberships: {
          some: { orgId: ctx.orgId },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!area) {
    notFound();
  }

  async function updateArea(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const siteId = formData.get("siteId") as string;
    const inChargeUserId = formData.get("inChargeUserId") as string;

    if (!name || !type || !siteId) {
      throw new Error("Name, type, and site are required");
    }

    await prisma.area.update({
      where: { id: params.id },
      data: {
        name,
        type: type as any,
        siteId,
        inChargeUserId: inChargeUserId || null,
      },
    });

    redirect("/organization/setup");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Area</h1>
              <p className="text-gray-600">Update area information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Area Details</h3>
          </div>

          <form action={updateArea} className="px-6 py-4 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Area Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={area.name}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                  Area Type *
                </label>
                <select
                  id="type"
                  name="type"
                  defaultValue={area.type}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PANTRY">Pantry</option>
                  <option value="HOUSEKEEPING">Housekeeping</option>
                  <option value="STATIONERY">Stationery</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="siteId" className="block text-sm font-medium text-gray-700">
                  Site *
                </label>
                <select
                  id="siteId"
                  name="siteId"
                  defaultValue={area.siteId}
                  required
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="inChargeUserId" className="block text-sm font-medium text-gray-700">
                Person in Charge (Optional)
              </label>
              <select
                id="inChargeUserId"
                name="inChargeUserId"
                defaultValue={area.inChargeUserId || ""}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">No one assigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-4">
              <a
                href="/organization/setup"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </a>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update Area
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}