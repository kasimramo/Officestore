// Role Builder - Create/Edit Roles with Permission Selection
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, Save, Shield, Check, ChevronDown, ChevronRight
} from 'lucide-react'
import { api } from '../lib/api'

interface Permission {
  id: string
  category: string
  action: string
  description: string
  isSystem: boolean
}

interface Role {
  id: string
  name: string
  description?: string
  scope: 'organization' | 'site' | 'area'
  color: string
  isSystem: boolean
  permissions: Array<{
    id: string
    category: string
    action: string
    description: string
    fullName: string
  }>
}

// Predefined color palette
const COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
]

export default function AdminRoleBuilder() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scope, setScope] = useState<'organization' | 'site' | 'area'>('organization')
  const [color, setColor] = useState(COLORS[0])
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  // Permissions data
  const [allPermissions, setAllPermissions] = useState<Permission[]>([])
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; scope: string; color: string }>>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  // Load permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response: any = await api.get('/api/permissions')
        if (response.success) {
          // Convert grouped format to flat array
          const permissions: Permission[] = []
          const grouped = response.data

          Object.entries(grouped).forEach(([category, perms]: [string, any]) => {
            perms.forEach((perm: any) => {
              permissions.push({
                id: perm.id,
                category,
                action: perm.action,
                description: perm.description,
                isSystem: perm.isSystem,
              })
            })
          })

          setAllPermissions(permissions)
          // Expand all categories by default
          setExpandedCategories(Object.keys(grouped))
        }
      } catch (err) {
        console.error('Error fetching permissions:', err)
      }
    }

    fetchPermissions()
    // Load templates for convenience
    const fetchTemplates = async () => {
      try {
        const resp: any = await api.get('/api/roles/templates')
        if (resp.success && Array.isArray(resp.data)) {
          setTemplates(resp.data.map((t: any) => ({ id: t.id, name: t.name, scope: t.scope, color: t.color })))
        }
      } catch (e) {
        // non-blocking
      }
    }
    fetchTemplates()
  }, [])

  // Load role if editing
  useEffect(() => {
    if (!isEditMode) return

    const fetchRole = async () => {
      try {
        setLoading(true)
        const response: any = await api.get(`/api/roles/${id}`)

        if (response.success) {
          const role: Role = response.data
          setName(role.name)
          setDescription(role.description || '')
          setScope(role.scope)
          setColor(role.color)
          setSelectedPermissions(role.permissions.map(p => `${p.category}.${p.action}`))
        } else {
          setError('Failed to load role')
        }
      } catch (err) {
        console.error('Error fetching role:', err)
        setError('Failed to load role')
      } finally {
        setLoading(false)
      }
    }

    fetchRole()
  }, [id, isEditMode])

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Role name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const roleData = {
        name: name.trim(),
        description: description.trim(),
        scope,
        color,
        permissions: selectedPermissions,
      }

      let response: any
      if (isEditMode) {
        response = await api.put(`/api/roles/${id}`, roleData)
      } else {
        response = await api.post('/api/roles', roleData)
      }

      if (response.success) {
        navigate('/admin/roles')
      } else {
        throw new Error(response.error?.message || 'Failed to save role')
      }
    } catch (err: any) {
      console.error('Error saving role:', err)
      setError(err.response?.data?.error?.message || 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  const togglePermission = (category: string, action: string) => {
    const permKey = `${category}.${action}`
    setSelectedPermissions(prev =>
      prev.includes(permKey)
        ? prev.filter(p => p !== permKey)
        : [...prev, permKey]
    )
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const selectAllInCategory = (category: string) => {
    const categoryPerms = allPermissions
      .filter(p => p.category === category)
      .map(p => `${p.category}.${p.action}`)

    const allSelected = categoryPerms.every(p => selectedPermissions.includes(p))

    if (allSelected) {
      // Deselect all in category
      setSelectedPermissions(prev => prev.filter(p => !categoryPerms.includes(p)))
    } else {
      // Select all in category
      setSelectedPermissions(prev => {
        const newPerms = [...prev]
        categoryPerms.forEach(p => {
          if (!newPerms.includes(p)) newPerms.push(p)
        })
        return newPerms
      })
    }
  }

  const applyTemplate = async (templateId: string) => {
    setSelectedTemplateId(templateId)
    if (!templateId) return
    try {
      const resp: any = await api.get(`/api/roles/${templateId}`)
      if (resp.success && resp.data && Array.isArray(resp.data.permissions)) {
        const perms = resp.data.permissions.map((p: any) => `${p.category}.${p.action}`)
        setSelectedPermissions(perms)
        // Set scope/color from template
        if (resp.data.scope) setScope(resp.data.scope)
        if (resp.data.color) setColor(resp.data.color)
      }
    } catch (e) {
      // ignore
    }
  }

  // Group permissions by category
  const permissionsByCategory = allPermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = []
    }
    acc[perm.category].push(perm)
    return acc
  }, {} as Record<string, Permission[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
          <p className="mt-2 text-slate-600">Loading role...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin/roles')}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-slate-900">
                  {isEditMode ? 'Edit Role' : 'Create Role'}
                </h1>
                <p className="text-sm text-slate-600">
                  {isEditMode ? 'Update role details and permissions' : 'Define a new role with specific permissions'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin/roles')}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Role'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Role Details */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-lg p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Role Details</h2>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Site Manager"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Role description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                {/* Scope */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Scope
                  </label>
                  <select
                    value={scope}
                    onChange={(e) => setScope(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="organization">Organization-wide</option>
                    <option value="site">Site-specific</option>
                    <option value="area">Area-specific</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    {scope === 'organization' && 'Applies across the entire organization'}
                    {scope === 'site' && 'Can be assigned to specific sites'}
                    {scope === 'area' && 'Can be assigned to specific areas'}
                  </p>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          color === c ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : ''
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Preview
                  </label>
                  <div className="border border-slate-200 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Shield className="w-5 h-5" style={{ color }} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{name || 'Role Name'}</div>
                        <div className="text-xs text-slate-500">{selectedPermissions.length} permissions</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Permissions</h2>
              <p className="text-sm text-slate-600 mt-1">
                Select the permissions this role should have ({selectedPermissions.length} selected)
              </p>
              {templates.length > 0 && (
                <div className="mt-4 flex items-center gap-3">
                  <label className="text-sm text-slate-700">Start from template:</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select a template --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

              <div className="divide-y divide-slate-200">
                {Object.entries(permissionsByCategory).map(([category, permissions]) => {
                  const isExpanded = expandedCategories.includes(category)
                  const categoryPerms = permissions.map(p => `${p.category}.${p.action}`)
                  const selectedCount = categoryPerms.filter(p => selectedPermissions.includes(p)).length
                  const allSelected = selectedCount === categoryPerms.length

                  return (
                    <div key={category}>
                      {/* Category Header */}
                      <div className="px-6 py-3 bg-slate-50 hover:bg-slate-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleCategory(category)}
                            className="flex items-center gap-2 flex-1 text-left"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="font-medium text-slate-900 capitalize">
                              {category.replace('_', ' & ')}
                            </span>
                            <span className="text-sm text-slate-500">
                              ({selectedCount}/{permissions.length})
                            </span>
                          </button>
                          <button
                            onClick={() => selectAllInCategory(category)}
                            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                          >
                            {allSelected ? 'Deselect All' : 'Select All'}
                          </button>
                        </div>
                      </div>

                      {/* Category Permissions */}
                      {isExpanded && (
                        <div className="px-6 py-4 space-y-3">
                          {permissions.map((perm) => {
                            const permKey = `${perm.category}.${perm.action}`
                            const isSelected = selectedPermissions.includes(permKey)

                            return (
                              <label
                                key={perm.id}
                                className="flex items-start gap-3 cursor-pointer group"
                              >
                                <div className="flex items-center h-5">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => togglePermission(perm.category, perm.action)}
                                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-900 group-hover:text-emerald-600">
                                      {perm.action.replace(/_/g, ' ')}
                                    </span>
                                    <code className="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                      {permKey}
                                    </code>
                                  </div>
                                  <p className="text-sm text-slate-500 mt-0.5">
                                    {perm.description}
                                  </p>
                                </div>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
