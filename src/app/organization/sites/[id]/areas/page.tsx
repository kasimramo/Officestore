import { requireOrgMembership } from "@/lib/context";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

interface SiteAreasPageProps {
  params: { id: string };
}

export default async function SiteAreasPage({ params }: SiteAreasPageProps) {
  const { ctx } = await requireOrgMembership();

  // Get the site with its areas
  const site = await prisma.site.findUnique({
    where: {
      id: params.id,
      orgId: ctx.orgId,
    },
    include: {
      areas: {
        include: {
          inChargeUser: true,
        },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!site) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <nav className="text-sm text-gray-500 mb-2">
                <Link href="/organization/setup" className="hover:text-gray-700">
                  Organization Setup
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900">{site.name} Areas</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900">{site.name} Areas</h1>
              <p className="text-gray-600">Manage areas for this site</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/organization/areas/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Area
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Areas ({site.areas.length})
            </h3>
          </div>

          {site.areas.length === 0 ? (
            <div className="p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H7m-2 0h2m0-16v16"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No areas found</h3>
              <p className="mt-2 text-gray-500">
                Get started by adding your first area to this site.
              </p>
              <div className="mt-6">
                <Link
                  href="/organization/areas/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Area
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Area Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Person in Charge
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {site.areas.map((area) => (
                    <tr key={area.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {area.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {area.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {area.inChargeUser ? area.inChargeUser.name || area.inChargeUser.email : "Not assigned"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/organization/areas/${area.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/organization/setup"
            className="text-blue-600 hover:text-blue-900"
          >
            ← Back to Organization Setup
          </Link>
        </div>
      </div>
    </div>
  );
}