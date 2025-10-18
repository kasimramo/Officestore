import React, { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'

type EndUser = {
  id: string
  username: string
  email?: string
  firstName: string
  lastName: string
  role: string
  sites: Array<{ id: string; name: string }>
  areas: Array<{ id: string; name: string }>
  categories: Array<{ id: string; name: string }>
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

type Site = {
  id: string
  name: string
}

type Area = {
  id: string
  name: string
  siteId: string
}

type Category = {
  id: string
  name: string
}

type Role = {
  id: string
  name: string
  description: string
}

export function AccessAndRoleModal({ user, sites, areas, categories, initialTab = 'access', onClose, onUpdate }: {
  user: EndUser
  sites: Site[]
  areas: Area[]
  categories: Category[]
  initialTab?: 'access' | 'roles'
  onClose: () => void
  onUpdate: (user: EndUser) => void
}) {
  const [activeTab, setActiveTab] = useState<'access' | 'roles'>(initialTab)
  const [selectedSites, setSelectedSites] = useState<string[]>(user.sites.map(s => s.id))
  const [selectedAreas, setSelectedAreas] = useState<string[]>(user.areas.map(a => a.id))
  const [selectedCategories, setSelectedCategories] = useState<string[]>(user.categories.map(c => c.id))

  // Filter authorized sites and areas based on access
  const authorizedSites = sites.filter(s => selectedSites.includes(s.id))
  const authorizedAreas = areas.filter(a => selectedAreas.includes(a.id))

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                User Access & Roles - {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Step 1: Assign access to sites/areas. Step 2: Assign roles at specific locations.
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-4 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('access')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'access'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              1. Access (Sites & Areas)
            </button>
            <button
              onClick={() => setActiveTab('roles')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === 'roles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              2. Roles / Sites / Areas Matrix
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'access' ? (
            <AccessTab
              user={user}
              sites={sites}
              areas={areas}
              categories={categories}
              selectedSites={selectedSites}
              selectedAreas={selectedAreas}
              selectedCategories={selectedCategories}
              setSelectedSites={setSelectedSites}
              setSelectedAreas={setSelectedAreas}
              setSelectedCategories={setSelectedCategories}
              onSaveAndContinue={() => setActiveTab('roles')}
              onUpdate={onUpdate}
            />
          ) : (
            <RolesTab
              user={user}
              authorizedSites={authorizedSites}
              authorizedAreas={authorizedAreas}
              onUpdate={onUpdate}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// Access Tab Component
function AccessTab({ user, sites, areas, categories, selectedSites, selectedAreas, selectedCategories, setSelectedSites, setSelectedAreas, setSelectedCategories, onSaveAndContinue, onUpdate }: {
  user: EndUser
  sites: Site[]
  areas: Area[]
  categories: Category[]
  selectedSites: string[]
  selectedAreas: string[]
  selectedCategories: string[]
  setSelectedSites: (ids: string[]) => void
  setSelectedAreas: (ids: string[]) => void
  setSelectedCategories: (ids: string[]) => void
  onSaveAndContinue: () => void
  onUpdate: (user: EndUser) => void
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.put(`/api/end-users/${user.id}/access`, {
        siteIds: selectedSites,
        areaIds: selectedAreas,
        categoryIds: selectedCategories
      })

      console.log('Access API response:', response)

      // Backend returns { endUser: {...} } and apiClient.put already unwraps response.json()
      const updatedUser = response.endUser || response

      if (!updatedUser || !updatedUser.id) {
        console.error('Invalid response from access API:', response)
        throw new Error('Invalid response from server')
      }

      onUpdate(updatedUser)
      onSaveAndContinue()
    } catch (err: any) {
      console.error('Error assigning access:', err)
      setError(err.response?.data?.error || err.message || 'Failed to assign access')
      setLoading(false)
    }
  }

  const toggleSelection = (id: string, list: string[], setList: (list: string[]) => void) => {
    if (list.includes(id)) {
      setList(list.filter(item => item !== id))
    } else {
      setList([...list, id])
    }
  }

  // Group areas by site
  const areasBySite: Record<string, Area[]> = {}
  areas.forEach(area => {
    if (!areasBySite[area.siteId]) {
      areasBySite[area.siteId] = []
    }
    areasBySite[area.siteId].push(area)
  })

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          <strong>Important:</strong> Select which sites and areas this user can access. Only the authorized sites/areas will be available in the Roles matrix.
        </p>
      </div>

      <div className="space-y-6">
        {/* Sites & Areas - Combined */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">Sites & Areas Access</label>
          <div className="space-y-4">
            {sites.map(site => {
              const siteAreas = areasBySite[site.id] || []
              const isSiteSelected = selectedSites.includes(site.id)

              return (
                <div key={site.id} className="border border-slate-200 rounded-lg p-4">
                  {/* Site Checkbox */}
                  <label className="flex items-center gap-2 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={isSiteSelected}
                      onChange={() => {
                        toggleSelection(site.id, selectedSites, setSelectedSites)
                        // If unselecting site, also unselect all its areas
                        if (isSiteSelected) {
                          const siteAreaIds = siteAreas.map(a => a.id)
                          setSelectedAreas(selectedAreas.filter(id => !siteAreaIds.includes(id)))
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-slate-900">{site.name}</span>
                  </label>

                  {/* Areas under this site */}
                  {siteAreas.length > 0 && (
                    <div className="ml-6 space-y-2">
                      {siteAreas.map(area => (
                        <label key={area.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAreas.includes(area.id)}
                            onChange={() => {
                              toggleSelection(area.id, selectedAreas, setSelectedAreas)
                              // If selecting an area, auto-select its parent site
                              if (!selectedAreas.includes(area.id) && !selectedSites.includes(site.id)) {
                                setSelectedSites([...selectedSites, site.id])
                              }
                            }}
                            disabled={!isSiteSelected}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-30"
                          />
                          <span className="text-sm text-slate-700">{area.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {sites.length === 0 && (
            <p className="text-sm text-slate-500 italic">No sites available</p>
          )}
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Categories Access (Optional)</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map(category => (
              <label key={category.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-slate-50 rounded">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => toggleSelection(category.id, selectedCategories, setSelectedCategories)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700">{category.name}</span>
              </label>
            ))}
          </div>
          {categories.length === 0 && (
            <p className="text-sm text-slate-500 italic">No categories available</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save & Continue to Roles'}
        </button>
      </div>
    </form>
  )
}

// Roles Tab Component
function RolesTab({ user, authorizedSites, authorizedAreas, onUpdate, onClose }: {
  user: EndUser
  authorizedSites: Site[]
  authorizedAreas: Area[]
  onUpdate: (user: EndUser) => void
  onClose: () => void
}) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Matrix state: roleId -> locationKey -> boolean
  // locationKey can be: "org-wide", "site-{siteId}", "area-{areaId}"
  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        setFetchingData(true)
        const [rolesRes, userRolesRes] = await Promise.all([
          apiClient.get('/api/roles'),
          apiClient.get(`/api/end-users/${user.id}/roles`)
        ])

        const rolesData = rolesRes.data || []
        const userRolesData = userRolesRes.data || []

        setRoles(rolesData)

        // Build initial matrix from current assignments
        const initialMatrix: Record<string, Record<string, boolean>> = {}
        rolesData.forEach((role: Role) => {
          initialMatrix[role.id] = {}

          // Organization-wide role
          initialMatrix[role.id]['org-wide'] = userRolesData.some((ur: any) =>
            ur.id === role.id && !ur.siteId && !ur.areaId
          )

          // Site-specific roles
          authorizedSites.forEach(site => {
            initialMatrix[role.id][`site-${site.id}`] = userRolesData.some((ur: any) =>
              ur.id === role.id && ur.siteId === site.id && !ur.areaId
            )
          })

          // Area-specific roles
          authorizedAreas.forEach(area => {
            initialMatrix[role.id][`area-${area.id}`] = userRolesData.some((ur: any) =>
              ur.id === role.id && ur.areaId === area.id
            )
          })
        })
        setMatrix(initialMatrix)
      } catch (err: any) {
        console.error('Error fetching data:', err)
        setError(err.message || 'Failed to fetch data')
      } finally {
        setFetchingData(false)
      }
    }
    fetchData()
  }, [user.id, authorizedSites, authorizedAreas])

  const toggleMatrixCell = (roleId: string, locationKey: string) => {
    setMatrix(prev => {
      const newMatrix = { ...prev }
      const currentValue = newMatrix[roleId]?.[locationKey] || false

      // Toggle the clicked cell
      newMatrix[roleId] = {
        ...newMatrix[roleId],
        [locationKey]: !currentValue
      }

      // If toggling a site, cascade to its areas
      if (locationKey.startsWith('site-')) {
        const siteId = locationKey.replace('site-', '')
        const siteAreas = areasBySite[siteId] || []

        // When checking a site, also check all its areas
        // When unchecking a site, also uncheck all its areas
        siteAreas.forEach(area => {
          newMatrix[roleId][`area-${area.id}`] = !currentValue
        })
      }

      // If unchecking an area, also uncheck its parent site
      if (locationKey.startsWith('area-') && currentValue) {
        // Find which site this area belongs to
        const areaId = locationKey.replace('area-', '')
        const area = authorizedAreas.find(a => a.id === areaId)
        if (area) {
          newMatrix[roleId][`site-${area.siteId}`] = false
        }
      }

      // If checking an area, check if all areas of parent site are now checked
      // If so, also check the parent site
      if (locationKey.startsWith('area-') && !currentValue) {
        const areaId = locationKey.replace('area-', '')
        const area = authorizedAreas.find(a => a.id === areaId)
        if (area) {
          const siteAreas = areasBySite[area.siteId] || []
          const allAreasChecked = siteAreas.every(a => newMatrix[roleId][`area-${a.id}`])
          if (allAreasChecked) {
            newMatrix[roleId][`site-${area.siteId}`] = true
          }
        }
      }

      return newMatrix
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Build role assignments array from matrix
      const roleAssignments: Array<{ roleId: string; siteId?: string; areaId?: string }> = []

      Object.keys(matrix).forEach(roleId => {
        Object.keys(matrix[roleId]).forEach(locationKey => {
          if (matrix[roleId][locationKey]) {
            if (locationKey === 'org-wide') {
              roleAssignments.push({ roleId })
            } else if (locationKey.startsWith('site-')) {
              roleAssignments.push({
                roleId,
                siteId: locationKey.replace('site-', '')
              })
            } else if (locationKey.startsWith('area-')) {
              roleAssignments.push({
                roleId,
                areaId: locationKey.replace('area-', '')
              })
            }
          }
        })
      })

      // Update user roles
      await apiClient.post(`/api/end-users/${user.id}/roles`, {
        roles: roleAssignments
      })

      // Refresh user data
      const updatedUserRes = await apiClient.get(`/api/end-users`)
      const updatedUser = updatedUserRes.data?.find((u: EndUser) => u.id === user.id)

      if (updatedUser) {
        onUpdate(updatedUser)
      }
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to assign roles')
      setLoading(false)
    }
  }

  // Group areas by site for display
  const areasBySite: Record<string, Area[]> = {}
  authorizedAreas.forEach(area => {
    if (!areasBySite[area.siteId]) {
      areasBySite[area.siteId] = []
    }
    areasBySite[area.siteId].push(area)
  })

  if (fetchingData) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-slate-500">Loading roles matrix...</div>
      </div>
    )
  }

  if (authorizedSites.length === 0 && authorizedAreas.length === 0) {
    return (
      <div className="p-6">
        <div className="p-8 bg-amber-50 border border-amber-200 rounded-lg text-center">
          <svg className="w-12 h-12 text-amber-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h4 className="text-lg font-semibold text-amber-900 mb-2">No sites authorised</h4>
          <p className="text-sm text-amber-800">
            Please go back to the "Access" tab and assign at least one site or area before configuring roles.
          </p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          Assign roles to specific sites or areas. Check the boxes to grant that role at that location.
        </p>
      </div>

      {/* Role-Site-Area Matrix Table */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 sticky left-0 bg-slate-100 border-r border-slate-200 min-w-[150px]">
                  Role
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[120px]">
                  Organization-wide
                </th>
                {authorizedSites.map(site => {
                  const siteAreas = areasBySite[site.id] || []
                  return (
                    <React.Fragment key={site.id}>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[120px]">
                        {site.name}
                        <div className="text-[10px] font-normal text-slate-500">(Site)</div>
                      </th>
                      {siteAreas.map(area => (
                        <th key={`area-${area.id}`} className="px-4 py-3 text-center text-xs font-semibold text-slate-700 border-r border-slate-200 min-w-[120px]">
                          {area.name}
                          <div className="text-[10px] font-normal text-slate-500">(Area)</div>
                        </th>
                      ))}
                    </React.Fragment>
                  )
                })}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {roles.map((role, idx) => (
                <tr key={role.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-3 text-sm font-medium text-slate-900 sticky left-0 bg-inherit border-r border-slate-200">
                    {role.name}
                  </td>
                  <td className="px-4 py-3 text-center border-r border-slate-200">
                    <input
                      type="checkbox"
                      checked={matrix[role.id]?.['org-wide'] || false}
                      onChange={() => toggleMatrixCell(role.id, 'org-wide')}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  {authorizedSites.map(site => {
                    const siteAreas = areasBySite[site.id] || []
                    return (
                      <React.Fragment key={site.id}>
                        <td className="px-4 py-3 text-center border-r border-slate-200">
                          <input
                            type="checkbox"
                            checked={matrix[role.id]?.[`site-${site.id}`] || false}
                            onChange={() => toggleMatrixCell(role.id, `site-${site.id}`)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        {siteAreas.map(area => (
                          <td key={`area-${area.id}`} className="px-4 py-3 text-center border-r border-slate-200">
                            <input
                              type="checkbox"
                              checked={matrix[role.id]?.[`area-${area.id}`] || false}
                              onChange={() => toggleMatrixCell(role.id, `area-${area.id}`)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                        ))}
                      </React.Fragment>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Roles'}
        </button>
      </div>
    </form>
  )
}
