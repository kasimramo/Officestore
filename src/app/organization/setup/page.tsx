"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function OrganizationSetupPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sites, setSites] = useState([]);
  const [areas, setAreas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sites');
  const [selectedSite, setSelectedSite] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('orgSetupViewMode') || 'card';
    }
    return 'card';
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    fetchOrganizationData();
  }, [session, status, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orgSetupViewMode', viewMode);
    }
  }, [viewMode]);

  const fetchOrganizationData = async () => {
    try {
      setIsLoading(true);

      const [sitesResponse, areasResponse] = await Promise.all([
        fetch("/api/sites?includeInactive=true"),
        fetch("/api/areas?includeInactive=true"),
      ]);

      const sitesResult = await sitesResponse.json();
      const areasResult = await areasResponse.json();

      if (sitesResult.success) {
        setSites(sitesResult.data);
      }

      if (areasResult.success) {
        setAreas(areasResult.data);
      }
    } catch (error) {
      console.error("Failed to fetch organization data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleItemStatus = async (type, id, currentStatus) => {
    try {
      const response = await fetch(`/api/${type}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [type === 'catalogue' ? 'active' : 'isActive']: !currentStatus
        }),
      });

      if (response.ok) {
        await fetchOrganizationData();
      } else {
        console.error('Failed to toggle status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
    }
  };

  const filteredAreas = selectedSite
    ? areas.filter(area => area.siteId === selectedSite.id)
    : areas;

  const ViewToggle = () => (
    <div className="flex items-center bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setViewMode('card')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'card'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Cards
        </div>
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'list'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          List
        </div>
      </button>
    </div>
  );

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const renderSitesContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Sites Management</h2>
        <div className="flex items-center gap-4">
          <ViewToggle />
          <Link
            href="/organization/sites/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add Site
          </Link>
        </div>
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="mt-4 text-gray-500 text-lg">No sites configured yet</p>
          <p className="text-gray-400">Create your first site to get started</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div key={site.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    site.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {site.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p><span className="font-medium">Timezone:</span> {site.timezone}</p>
                  <p><span className="font-medium">Locale:</span> {site.locale}</p>
                  <p><span className="font-medium">Areas:</span> {site.areas?.length || 0}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/organization/sites/${site.id}/edit`}
                    className="text-blue-600 hover:text-blue-500 p-1 rounded"
                    title="Edit Site"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => toggleItemStatus('sites', site.id, site.isActive)}
                    className="p-1 rounded hover:bg-gray-100"
                    title={site.isActive ? 'Deactivate Site' : 'Activate Site'}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="6" width="18" height="12" rx="6" stroke="currentColor" strokeWidth="2" fill={site.isActive ? '#10b981' : '#ef4444'} />
                      <circle cx={site.isActive ? '15' : '9'} cy="12" r="4" fill="white" />
                    </svg>
                  </button>
                  <Link
                    href={`/organization/sites/${site.id}/areas`}
                    className="text-purple-600 hover:text-purple-500 p-1 rounded"
                    title="Manage Areas"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timezone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Locale</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Areas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sites.map((site) => (
                <tr key={site.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{site.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{site.timezone}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{site.locale}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{site.areas?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      site.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {site.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-3">
                      <Link href={`/organization/sites/${site.id}/edit`} className="text-blue-600 hover:text-blue-500" title="Edit Site">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => toggleItemStatus('sites', site.id, site.isActive)}
                        className="hover:bg-gray-100 p-1 rounded"
                        title={site.isActive ? 'Deactivate Site' : 'Activate Site'}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="6" width="18" height="12" rx="6" stroke="currentColor" strokeWidth="2" fill={site.isActive ? '#10b981' : '#ef4444'} />
                          <circle cx={site.isActive ? '15' : '9'} cy="12" r="4" fill="white" />
                        </svg>
                      </button>
                      <Link href={`/organization/sites/${site.id}/areas`} className="text-purple-600 hover:text-purple-500" title="Manage Areas">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderAreasContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {selectedSite ? `Areas in ${selectedSite.name}` : 'Areas Management'}
        </h2>
        <div className="flex items-center gap-4">
          <ViewToggle />
          <Link
            href="/organization/areas/new"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
          >
            Add Area
          </Link>
        </div>
      </div>

      {filteredAreas.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p className="mt-4 text-gray-500 text-lg">No areas found</p>
          <p className="text-gray-400">
            {selectedSite ? `No areas in ${selectedSite.name}` : 'Create areas within your sites'}
          </p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAreas.map((area) => (
            <div key={area.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{area.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    area.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {area.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="text-sm space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      area.type === 'PANTRY' ? 'bg-blue-100 text-blue-800' :
                      area.type === 'HOUSEKEEPING' ? 'bg-green-100 text-green-800' :
                      area.type === 'STATIONERY' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {area.type}
                    </span>
                  </div>
                  {area.site && (
                    <p className="text-gray-600">
                      <span className="font-medium">Site:</span> {area.site.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    href={`/organization/areas/${area.id}/edit`}
                    className="text-blue-600 hover:text-blue-500 p-1 rounded"
                    title="Edit Area"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => toggleItemStatus('areas', area.id, area.isActive)}
                    className="p-1 rounded hover:bg-gray-100"
                    title={area.isActive ? 'Deactivate Area' : 'Activate Area'}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="6" width="18" height="12" rx="6" stroke="currentColor" strokeWidth="2" fill={area.isActive ? '#10b981' : '#ef4444'} />
                      <circle cx={area.isActive ? '15' : '9'} cy="12" r="4" fill="white" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Site</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAreas.map((area) => (
                <tr key={area.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{area.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      area.type === 'PANTRY' ? 'bg-blue-100 text-blue-800' :
                      area.type === 'HOUSEKEEPING' ? 'bg-green-100 text-green-800' :
                      area.type === 'STATIONERY' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {area.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{area.site?.name || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      area.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {area.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center space-x-3">
                      <Link href={`/organization/areas/${area.id}/edit`} className="text-blue-600 hover:text-blue-500" title="Edit Area">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => toggleItemStatus('areas', area.id, area.isActive)}
                        className="hover:bg-gray-100 p-1 rounded"
                        title={area.isActive ? 'Deactivate Area' : 'Activate Area'}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="6" width="18" height="12" rx="6" stroke="currentColor" strokeWidth="2" fill={area.isActive ? '#10b981' : '#ef4444'} />
                          <circle cx={area.isActive ? '15' : '9'} cy="12" r="4" fill="white" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Organization Setup</h1>
          <p className="text-sm text-gray-600 mt-1">Manage your organization structure</p>
        </div>

        <nav className="p-4">
          <div className="space-y-2">
            <button
              onClick={() => {
                setActiveTab('sites');
                setSelectedSite(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'sites' && !selectedSite
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Sites ({sites.length})
              </div>
            </button>

            {sites.length > 0 && (
              <div className="ml-4 space-y-1">
                {sites.map((site) => (
                  <button
                    key={site.id}
                    onClick={() => {
                      setActiveTab('areas');
                      setSelectedSite(site);
                    }}
                    className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                      selectedSite?.id === site.id
                        ? 'bg-green-100 text-green-800'
                        : 'text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{site.name}</span>
                      <span className="text-xs">{site.areas?.length || 0} areas</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => {
                setActiveTab('areas');
                setSelectedSite(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'areas' && !selectedSite
                  ? 'bg-green-100 text-green-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                All Areas ({areas.length})
              </div>
            </button>

          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 mt-8">
          <Link
            href="/dashboard"
            className="w-full block text-center px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      <div className="flex-1 p-8">
        {activeTab === 'sites' && !selectedSite && renderSitesContent()}
        {activeTab === 'areas' && renderAreasContent()}
      </div>
    </div>
  );
}