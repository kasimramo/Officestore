// Updated Sites & Areas Management - Modern Design
import { useState, useEffect } from 'react'
import {
  Search, Upload, Download, Building2, MapPin,
  Edit, X, Plus, Power, PowerOff, UserCheck, ChevronDown, ChevronRight
} from 'lucide-react'
import { apiClient } from '../lib/api'
import { usePermissions, RequirePermission } from '../hooks/usePermissions'

type Site = {
  id: string
  name: string
  description?: string
  address?: string
  areas: Area[]
  isActive: boolean
  createdAt: string
}

type Area = {
  id: string
  siteId: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
}

export default function AdminSites() {
  const { hasPermission } = usePermissions()
  const [showAddSite, setShowAddSite] = useState(false)
  const [showAddArea, setShowAddArea] = useState(false)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showEditSite, setShowEditSite] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [showEditArea, setShowEditArea] = useState(false)
  const [editingArea, setEditingArea] = useState<Area | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedSites, setExpandedSites] = useState<Set<string>>(new Set())

  // API functions
  const fetchSites = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Use apiClient which handles authentication automatically
      const response = await fetch('/api/sites', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (data.success) {
        setSites(data.data)
      } else {
        console.error('Failed to fetch sites:', data.error)
        setSites([]) // Start with empty array if API fails
      }
    } catch (err) {
      console.error('Error fetching sites:', err)
      setError('Failed to load sites')
      setSites([]) // Start with empty array if API fails
    } finally {
      setIsLoading(false)
    }
  }

  const createSite = async (siteData: { name: string; description: string; address: string }) => {
    try {
      const response = await fetch('/api/sites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteData),
      })

      const data = await response.json()

      if (data.success) {
        setSites(prev => [...prev, data.data])
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to create site')
      }
    } catch (err) {
      console.error('Error creating site:', err)
      throw err
    }
  }

  const createArea = async (areaData: { siteId: string; name: string; description: string }) => {
    try {
      const response = await fetch('/api/areas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(areaData),
      })

      const data = await response.json()

      if (data.success) {
        // Update the sites array to include the new area
        setSites(prev => prev.map(site =>
          site.id === areaData.siteId
            ? { ...site, areas: [...site.areas, {
                id: data.data.id,
                siteId: data.data.siteId,
                name: data.data.name,
                description: data.data.description,
                isActive: data.data.isActive,
                createdAt: data.data.createdAt
              }] }
            : site
        ))
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to create area')
      }
    } catch (err) {
      console.error('Error creating area:', err)
      throw err
    }
  }

  const updateSite = async (id: string, siteData: { name: string; description: string; address: string }) => {
    try {
      const response = await fetch(`/api/sites/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(siteData),
      })

      const data = await response.json()

      if (data.success) {
        setSites(prev => prev.map(site =>
          site.id === id ? data.data : site
        ))
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to update site')
      }
    } catch (err) {
      console.error('Error updating site:', err)
      throw err
    }
  }

  const toggleSiteStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/sites/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setSites(prev => prev.map(site =>
          site.id === id ? { ...site, isActive: data.data.isActive } : site
        ))
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to toggle site status')
      }
    } catch (err) {
      console.error('Error toggling site status:', err)
      throw err
    }
  }

  const updateArea = async (areaId: string, areaData: { name: string; description: string }) => {
    try {
      const response = await fetch(`/api/areas/${areaId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(areaData),
      })

      const data = await response.json()

      if (data.success) {
        setSites(prev => prev.map(site => ({
          ...site,
          areas: site.areas.map(area =>
            area.id === areaId ? data.data : area
          )
        })))
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to update area')
      }
    } catch (err) {
      console.error('Error updating area:', err)
      throw err
    }
  }

  const toggleAreaStatus = async (areaId: string) => {
    try {
      const response = await fetch(`/api/areas/${areaId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setSites(prev => prev.map(site => ({
          ...site,
          areas: site.areas.map(area =>
            area.id === areaId ? { ...area, isActive: data.data.isActive } : area
          )
        })))
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to toggle area status')
      }
    } catch (err) {
      console.error('Error toggling area status:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchSites()
  }, [])

  const toggleSiteExpansion = (siteId: string) => {
    setExpandedSites(prev => {
      const newSet = new Set(prev)
      if (newSet.has(siteId)) {
        newSet.delete(siteId)
      } else {
        newSet.add(siteId)
      }
      return newSet
    })
  }

  const allAreas = sites.flatMap(site => site.areas)

  return (
    <div className="bg-slate-50">
      {/* Page Header with Actions */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="md:flex md:items-center md:justify-between mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-900">Sites & Areas Management</h1>
            <p className="mt-1 text-sm text-slate-600">Manage your organization's sites and their areas</p>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0 gap-3">
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
              <Upload className="w-4 h-4" />
              Import CSV
            </button>
            <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
              <Download className="w-4 h-4" />
              Export
            </button>
            <RequirePermission permission="sites_areas.create_sites">
              <button
                onClick={() => setShowAddSite(true)}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-white hover:bg-emerald-600 text-sm font-medium"
              >
                <Building2 className="w-4 h-4" />
                Add Site
              </button>
            </RequirePermission>
            <RequirePermission permission="sites_areas.create_areas">
              <button
                onClick={() => setShowAddArea(true)}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-white hover:bg-emerald-600 text-sm font-medium"
              >
                <MapPin className="w-4 h-4" />
                Add Area
              </button>
            </RequirePermission>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 bg-white max-w-md">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            placeholder="Search sites, areas..."
            className="border-0 focus:ring-0 flex-1 text-sm outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Total Sites</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600">{sites.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Total Areas</div>
          <div className="mt-1 text-2xl font-semibold text-emerald-600">{allAreas.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Low Stock Areas</div>
          <div className="mt-1 text-2xl font-semibold text-amber-600">4</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm text-slate-600">Inactive Locations</div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">{sites.filter(s => !s.isActive).length}</div>
        </div>
      </section>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-900">Sites & Areas Management</h2>
            <p className="text-sm text-slate-600 mt-1">Manage your organization's sites and their areas</p>
          </div>

          {/* Content */}
          <div className="p-6">
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center rounded-lg bg-emerald-500 text-white w-12 h-12 font-bold text-xl mb-4">OS</div>
                  <p className="text-slate-600">Loading sites...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {!isLoading && !error && sites.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No sites yet</h3>
                <p className="text-slate-600 mb-6">
                  Create your first site to start organizing your office locations.
                </p>
                <button
                  onClick={() => setShowAddSite(true)}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
                >
                  <Building2 className="w-4 h-4" />
                  Create First Site
                </button>
              </div>
            )}

            {!isLoading && !error && sites.length > 0 && (
              <div className="space-y-4">
                {sites.map((site) => (
                  <div key={site.id} className="border border-slate-200 rounded-lg overflow-hidden">
                    {/* Site Header */}
                    <div className="bg-slate-50 px-6 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => toggleSiteExpansion(site.id)}
                            className="p-1 hover:bg-slate-200 rounded"
                            title={expandedSites.has(site.id) ? 'Collapse' : 'Expand'}
                          >
                            {expandedSites.has(site.id) ? (
                              <ChevronDown className="w-4 h-4 text-slate-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-600" />
                            )}
                          </button>
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-sm text-slate-900">{site.name}</h3>
                              {site.name === 'Headquarters' && (
                                <span className="text-xs rounded bg-slate-200 px-1.5 py-0.5 text-slate-700">HQ</span>
                              )}
                              <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                site.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {site.isActive ? 'Active' : 'Disabled'}
                              </span>
                              <span className="text-xs text-slate-500">
                                {site.areas.length} area{site.areas.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            {(site.description || site.address) && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                {site.description && <span>{site.description}</span>}
                                {site.description && site.address && <span> • </span>}
                                {site.address && <span>{site.address}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {hasPermission('sites_areas.edit_sites') && (
                            <button
                              onClick={() => {
                                setEditingSite(site)
                                setShowEditSite(true)
                              }}
                              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition-colors"
                              title="Edit Site"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              // TODO: Implement user management for sites
                              alert(`User management for "${site.name}" site will be implemented soon. This will allow you to assign users to specific sites.`)
                            }}
                            className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
                            title="Manage Users"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                          {hasPermission('sites_areas.edit_sites') && (
                            <button
                              onClick={async () => {
                                try {
                                  await toggleSiteStatus(site.id)
                                } catch (err) {
                                  alert('Failed to toggle site status: ' + (err instanceof Error ? err.message : 'Unknown error'))
                                }
                              }}
                              className={`p-2 rounded-md transition-colors ${
                                site.isActive
                                  ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                                  : 'text-green-600 hover:text-green-800 hover:bg-green-100'
                              }`}
                              title={site.isActive ? 'Disable Site' : 'Enable Site'}
                            >
                              {site.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                            </button>
                          )}
                          {hasPermission('sites_areas.create_areas') && (
                            <button
                              onClick={() => {
                                setSelectedSite(site.id)
                                setShowAddArea(true)
                              }}
                              className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded-md transition-colors"
                              title="Add Area"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Areas (shown when expanded) */}
                    {expandedSites.has(site.id) && (
                      <div className="bg-white">
                        {site.areas.length === 0 ? (
                          <div className="px-6 py-8 text-center">
                            <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                            <p className="text-slate-600 text-sm">No areas created yet</p>
                            <button
                              onClick={() => {
                                setSelectedSite(site.id)
                                setShowAddArea(true)
                              }}
                              className="mt-3 inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              <Plus className="w-4 h-4" />
                              Add first area
                            </button>
                          </div>
                        ) : (
                          <div className="divide-y divide-slate-100">
                            {site.areas.map((area) => (
                              <div key={area.id} className="px-6 py-2.5 hover:bg-slate-50">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-slate-300 rounded-full"></div>
                                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-slate-900">{area.name}</span>
                                        <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                                          area.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {area.isActive ? 'Active' : 'Disabled'}
                                        </span>
                                        {area.description && (
                                          <span className="text-xs text-slate-500">{area.description}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {hasPermission('sites_areas.edit_areas') && (
                                      <button
                                        onClick={() => {
                                          setEditingArea(area)
                                          setShowEditArea(true)
                                        }}
                                        className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-colors"
                                        title="Edit Area"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        // TODO: Implement user management for areas
                                        alert(`User management for "${area.name}" area will be implemented soon. This will allow you to assign users to specific areas.`)
                                      }}
                                      className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                      title="Manage Users"
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                    </button>
                                    {hasPermission('sites_areas.edit_areas') && (
                                      <button
                                        onClick={async () => {
                                          try {
                                            await toggleAreaStatus(area.id)
                                          } catch (err) {
                                          alert('Failed to toggle area status: ' + (err instanceof Error ? err.message : 'Unknown error'))
                                        }
                                      }}
                                      className={`p-1 rounded transition-colors ${
                                        area.isActive
                                          ? 'text-red-600 hover:text-red-800 hover:bg-red-100'
                                          : 'text-green-600 hover:text-green-800 hover:bg-green-100'
                                      }`}
                                      title={area.isActive ? 'Disable Area' : 'Enable Area'}
                                    >
                                      {area.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                                    </button>
                                  )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showAddSite && (
        <AddSiteModal
          onClose={() => setShowAddSite(false)}
          onSave={async (siteData) => {
            try {
              await createSite(siteData)
              setShowAddSite(false)
            } catch (err) {
              alert('Failed to create site: ' + (err instanceof Error ? err.message : 'Unknown error'))
            }
          }}
        />
      )}

      {showAddArea && (
        <AddAreaModal
          sites={sites}
          selectedSiteId={selectedSite}
          onClose={() => {
            setShowAddArea(false)
            setSelectedSite(null)
          }}
          onSave={async (areaData) => {
            try {
              await createArea(areaData)
              setShowAddArea(false)
              setSelectedSite(null)
            } catch (err) {
              alert('Failed to create area: ' + (err instanceof Error ? err.message : 'Unknown error'))
            }
          }}
        />
      )}

      {showEditSite && editingSite && (
        <EditSiteModal
          site={editingSite}
          onClose={() => {
            setShowEditSite(false)
            setEditingSite(null)
          }}
          onSave={async (siteData) => {
            try {
              await updateSite(editingSite.id, siteData)
              setShowEditSite(false)
              setEditingSite(null)
            } catch (err) {
              alert('Failed to update site: ' + (err instanceof Error ? err.message : 'Unknown error'))
            }
          }}
        />
      )}

      {showEditArea && editingArea && (
        <EditAreaModal
          area={editingArea}
          onClose={() => {
            setShowEditArea(false)
            setEditingArea(null)
          }}
          onSave={async (areaData) => {
            try {
              await updateArea(editingArea.id, areaData)
              setShowEditArea(false)
              setEditingArea(null)
            } catch (err) {
              alert('Failed to update area: ' + (err instanceof Error ? err.message : 'Unknown error'))
            }
          }}
        />
      )}
    </div>
  )
}

function AddSiteModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (data: { name: string; description: string; address: string }) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSave(formData)
    } catch (err) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Add New Site</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Site Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter site name"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter site description"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter site address"
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Site'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function AddAreaModal({ sites, selectedSiteId, onClose, onSave }: {
  sites: Site[]
  selectedSiteId: string | null
  onClose: () => void
  onSave: (data: { siteId: string; name: string; description: string }) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    siteId: selectedSiteId || '',
    name: '',
    description: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSave(formData)
    } catch (err) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Add New Area</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Site *</label>
              <select
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a site</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Area Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Kitchen, Office Supplies, Reception"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter area description"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.siteId || !formData.name || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create Area'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function EditSiteModal({ site, onClose, onSave }: {
  site: Site
  onClose: () => void
  onSave: (data: { name: string; description: string; address: string }) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    name: site.name,
    description: site.description || '',
    address: site.address || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSave(formData)
    } catch (err) {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Edit Site</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Site Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter site name"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter site description"
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter site address"
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.name || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Updating...' : 'Update Site'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function EditAreaModal({ area, onClose, onSave }: {
  area: Area
  onClose: () => void
  onSave: (data: { name: string; description: string }) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    name: area.name,
    description: area.description || ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      setIsSubmitting(true)
      await onSave(formData)
    } catch (err) {
      console.error('Failed to update area:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Edit Area</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="area-name" className="block text-sm font-medium text-slate-700 mb-1">
              Area Name *
            </label>
            <input
              id="area-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="e.g., Conference Room A"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="area-description" className="block text-sm font-medium text-slate-700 mb-1">
              Description
            </label>
            <textarea
              id="area-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              placeholder="Optional description"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.name.trim() || isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 border border-transparent rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Updating...' : 'Update Area'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}