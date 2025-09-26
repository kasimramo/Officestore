import { requireOrgMembership } from "@/lib/context";
import { prisma } from "@/lib/db";
import Link from "next/link";

interface CatalogueItem {
  id: string;
  sku: string;
  vendorSku?: string | null;
  name: string;
  category: string;
  unit: string;
  packSize?: string;
  imageUrl?: string;
  active: boolean;
  unitPrice?: number;
  currency: string;
  showPriceToUsers: boolean;
  createdAt: string;
  creator?: { name: string } | null;
}

export default async function CataloguePage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string };
}) {
  const { ctx } = await requireOrgMembership();

  const page = parseInt(searchParams.page || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  // Build where clause for Prisma
  const whereClause: any = {
    orgId: ctx.orgId,
    active: true,
  };

  if (searchParams.q) {
    const searchTerm = `%${searchParams.q}%`;
    whereClause.OR = [
      { name: { contains: searchParams.q, mode: 'insensitive' } },
      { sku: { contains: searchParams.q, mode: 'insensitive' } },
      { vendorSku: { contains: searchParams.q, mode: 'insensitive' } },
      { category: { contains: searchParams.q, mode: 'insensitive' } },
    ];
  }

  if (searchParams.category) {
    whereClause.category = searchParams.category;
  }

  const [items, totalCount, categories] = await Promise.all([
    // Get paginated results
    prisma.catalogueItem.findMany({
      where: whereClause,
      include: {
        creator: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip,
    }),

    // Get total count
    prisma.catalogueItem.count({ where: whereClause }),

    // Get categories for filtering
    prisma.catalogueItem.findMany({
      where: { orgId: ctx.orgId, active: true },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    }).then(cats => cats.map(c => c.category)),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  const catalogueData = {
    items: items.map(item => ({
      id: item.id,
      sku: item.sku,
      vendorSku: item.vendorSku,
      name: item.name,
      category: item.category,
      unit: item.unit,
      pack_size: item.packSize,
      image_url: item.imageUrl,
      unit_price: item.unitPrice,
      currency: item.currency,
      show_price_to_users: item.showPriceToUsers,
      active: item.active,
      created_at: item.createdAt.toISOString(),
      creator_name: item.creator?.name,
    })),
    categories,
    meta: {
      page,
      limit,
      total: totalCount,
      totalPages,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Catalogue</h1>
              <p className="text-gray-600">Manage your office supplies catalog</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/catalogue/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Add Item
              </Link>
              <Link
                href="/catalogue/import"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Import CSV
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <form method="GET" className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                name="q"
                defaultValue={searchParams.q || ""}
                placeholder="Search items by name, SKU, or category..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="sm:w-48">
              <select
                name="category"
                defaultValue={searchParams.category || ""}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {catalogueData.categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Items ({catalogueData.meta.total})
            </h3>
          </div>

          {catalogueData.items.length === 0 ? (
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-4h-2M6 9h2"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">No items found</h3>
              <p className="mt-2 text-gray-500">
                {searchParams.q || searchParams.category
                  ? "Try adjusting your search criteria."
                  : "Get started by adding your first catalogue item."}
              </p>
              <div className="mt-6">
                <Link
                  href="/catalogue/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Item
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU / Vendor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pack Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {catalogueData.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {item.image_url ? (
                                <img
                                  className="h-10 w-10 rounded-lg object-cover"
                                  src={item.image_url}
                                  alt={item.name}
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {item.name}
                              </div>
                              {item.creator_name && (
                                <div className="text-sm text-gray-500">
                                  by {item.creator_name}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            <span className="font-medium">{item.sku}</span>
                            {item.vendorSku && (
                              <span className="text-xs text-gray-500">Vendor: {item.vendorSku}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.unit}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.pack_size || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex flex-col">
                            {item.unit_price ? (
                              <div className="font-medium">
                                {item.currency} {Number(item.unit_price).toFixed(2)}
                              </div>
                            ) : (
                              <div className="text-gray-400">-</div>
                            )}
                            {item.unit_price && (
                              <div className="text-xs text-gray-500">
                                {item.show_price_to_users ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    Visible to users
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    Admin only
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(item.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            href={`/catalogue/${item.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {catalogueData.meta.totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    {page > 1 && (
                      <Link
                        href={`?page=${page - 1}&q=${searchParams.q || ""}&category=${searchParams.category || ""}`}
                        className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Previous
                      </Link>
                    )}
                    {page < catalogueData.meta.totalPages && (
                      <Link
                        href={`?page=${page + 1}&q=${searchParams.q || ""}&category=${searchParams.category || ""}`}
                        className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Next
                      </Link>
                    )}
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing{" "}
                        <span className="font-medium">
                          {(page - 1) * limit + 1}
                        </span>{" "}
                        to{" "}
                        <span className="font-medium">
                          {Math.min(page * limit, catalogueData.meta.total)}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium">
                          {catalogueData.meta.total}
                        </span>{" "}
                        results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        {Array.from({ length: catalogueData.meta.totalPages }).map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <Link
                              key={pageNum}
                              href={`?page=${pageNum}&q=${searchParams.q || ""}&category=${searchParams.category || ""}`}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNum === page
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </Link>
                          );
                        })}
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


