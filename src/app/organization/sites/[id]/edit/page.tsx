import { requireOrgMembership } from "@/lib/context";
import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";

interface EditSitePageProps {
  params: { id: string };
}

export default async function EditSitePage({ params }: EditSitePageProps) {
  const { ctx } = await requireOrgMembership();

  // Get the site
  const site = await prisma.site.findUnique({
    where: {
      id: params.id,
      orgId: ctx.orgId,
    },
  });

  if (!site) {
    notFound();
  }

  async function updateSite(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const timezone = formData.get("timezone") as string;
    const locale = formData.get("locale") as string;

    if (!name) {
      throw new Error("Site name is required");
    }

    await prisma.site.update({
      where: { id: params.id },
      data: {
        name,
        timezone,
        locale,
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
              <h1 className="text-3xl font-bold text-gray-900">Edit Site</h1>
              <p className="text-gray-600">Update site information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Site Details</h3>
          </div>

          <form action={updateSite} className="px-6 py-4 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Site Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                defaultValue={site.name}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                  Timezone
                </label>
                <select
                  id="timezone"
                  name="timezone"
                  defaultValue={site.timezone}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                </select>
              </div>

              <div>
                <label htmlFor="locale" className="block text-sm font-medium text-gray-700">
                  Locale
                </label>
                <select
                  id="locale"
                  name="locale"
                  defaultValue={site.locale}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="ja">Japanese</option>
                  <option value="zh">Chinese</option>
                </select>
              </div>
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
                Update Site
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}