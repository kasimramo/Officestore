import { requireOrgMembership } from "@/lib/context";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const { session, ctx } = await requireOrgMembership();

  // Get dashboard data using Prisma
  const [recentRequests, pendingApprovals, stats] = await Promise.all([
    // Get recent requests
    prisma.request.findMany({
      where: { orgId: ctx.orgId },
      include: {
        area: { select: { name: true } },
        site: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),

    // Get pending approvals (if user is an approver)
    ["ADMIN", "APPROVER_L1", "APPROVER_L2", "PROCUREMENT"].includes(ctx.role)
      ? prisma.request.findMany({
          where: {
            orgId: ctx.orgId,
            status: 'PENDING',
          },
          include: {
            area: { select: { name: true } },
            site: { select: { name: true } },
            creator: { select: { name: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: 10,
        })
      : Promise.resolve([]),

    // Get stats for the last 30 days
    prisma.request.aggregate({
      where: {
        orgId: ctx.orgId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      },
      _count: {
        _all: true,
      },
    }).then(async (totalCount) => {
      const [pending, approved, delivered] = await Promise.all([
        prisma.request.count({
          where: { orgId: ctx.orgId, status: 'PENDING' },
        }),
        prisma.request.count({
          where: { orgId: ctx.orgId, status: 'APPROVED' },
        }),
        prisma.request.count({
          where: { orgId: ctx.orgId, status: 'DELIVERED' },
        }),
      ]);

      return {
        pending_requests: pending,
        approved_requests: approved,
        delivered_requests: delivered,
        total_requests: totalCount._count._all || 0,
      };
    }),
  ]);

  const dashboardData = {
    recentRequests: recentRequests.map(req => ({
      id: req.id,
      type: req.type,
      status: req.status,
      created_at: req.createdAt,
      area_name: req.area.name,
      site_name: req.site.name,
    })),
    pendingApprovals: pendingApprovals.map(req => ({
      id: req.id,
      type: req.type,
      created_at: req.createdAt,
      area_name: req.area.name,
      site_name: req.site.name,
      creator_name: req.creator.name,
    })),
    stats,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {session.user.name}</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/requests/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                New Request
              </Link>
              <Link
                href="/catalogue"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Catalogue
              </Link>
              {["ADMIN", "PROCUREMENT"].includes(ctx.role) && (
                <Link
                  href="/organization/setup"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  Organization Setup
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Pending Requests
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.stats.pending_requests}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Approved
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.stats.approved_requests}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Delivered
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.stats.delivered_requests}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total (30d)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dashboardData.stats.total_requests}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Requests */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Requests</h3>
            </div>
            <div className="p-6">
              {dashboardData.recentRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent requests</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recentRequests.map((request: any) => (
                    <div key={request.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {request.area_name} - {request.site_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.type} • {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        request.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6">
                <Link
                  href="/requests"
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  View all requests →
                </Link>
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          {["ADMIN", "APPROVER_L1", "APPROVER_L2", "PROCUREMENT"].includes(ctx.role) && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Pending Approvals</h3>
              </div>
              <div className="p-6">
                {dashboardData.pendingApprovals.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No pending approvals</p>
                ) : (
                  <div className="space-y-4">
                    {dashboardData.pendingApprovals.map((request: any) => (
                      <div key={request.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {request.area_name} - {request.site_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            by {request.creator_name} • {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Link
                          href={`/requests/${request.id}`}
                          className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                        >
                          Review
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-6">
                  <Link
                    href="/approvals"
                    className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                  >
                    View all approvals →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}