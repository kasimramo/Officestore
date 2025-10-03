// Roles Management - Modern Design
import { useState, useEffect } from 'react'
import {
  Search, Shield, Edit, X, Plus, Power, PowerOff, Users
} from 'lucide-react'

type Role = {
  id: string
  name: string
  description?: string
  permissions: Record<string, any>
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function AdminRoles() {
  const [showAddRole, setShowAddRole] = useState(false)
  const [showEditRole, setShowEditRole] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // API functions
  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()

      if (data.success) {
        setRoles(data.data)
      } else {
        console.error('Failed to fetch roles:', data.error)
        setRoles([])
      }
    } catch (err) {
      console.error('Error fetching roles:', err)
      setError('Failed to load roles')
      setRoles([])
    } finally {
      setIsLoading(false)
    }
  }

  const createRole = async (roleData: { name: string; description: string; permissions: Record<string, any> }) => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      })

      const data = await response.json()

      if (data.success) {
        setRoles(prev => [...prev, data.data])
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to create role')
      }
    } catch (err) {
      console.error('Error creating role:', err)
      throw err
    }
  }

  const updateRole = async (id: string, roleData: { name: string; description: string; permissions: Record<string, any> }) => {
    try {
      const response = await fetch(`/api/roles/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
      })

      const data = await response.json()

      if (data.success) {
        setRoles(prev => prev.map(r => r.id === id ? data.data : r))
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to update role')
      }
    } catch (err) {
      console.error('Error updating role:', err)
      throw err
    }
  }

  const toggleRoleStatus = async (id: string) => {
    try {
      const response = await fetch(`/api/roles/${id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setRoles(prev => prev.map(r => r.id === id ? data.data : r))
        return data.data
      } else {
        throw new Error(data.error?.message || 'Failed to toggle role status')
      }
    } catch (err) {
      console.error('Error toggling role status:', err)
      throw err
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  // Handle form submission for adding role
  const handleAddRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    try {
      await createRole({
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        permissions: {} // Start with empty permissions
      })
      setShowAddRole(false)
      e.currentTarget.reset()
    } catch (err: any) {
      alert(err.message || 'Failed to create role')
    }
  }

  // Handle form submission for editing role
  const handleEditRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!editingRole) return

    const formData = new FormData(e.currentTarget)

    try {
      await updateRole(editingRole.id, {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        permissions: editingRole.permissions // Keep existing permissions
      })
      setShowEditRole(false)
      setEditingRole(null)
    } catch (err: any) {
      alert(err.message || 'Failed to update role')
    }
  }

  // Filter roles based on search term
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Roles</h1>
              <p className="text-sm text-slate-600">Manage user roles and permissions</p>
            </div>
            <button
              onClick={() => setShowAddRole(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Role
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Roles List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent"></div>
            <p className="mt-2 text-slate-600">Loading roles...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No roles found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredRoles.map((role) => (
              <div
                key={role.id}
                className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-lg font-semibold text-slate-900">{role.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        role.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {role.description && (
                      <p className="text-slate-600 mb-3">{role.description}</p>
                    )}
                    <div className="text-sm text-slate-500">
                      Created: {new Date(role.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingRole(role)
                        setShowEditRole(true)
                      }}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit role"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleRoleStatus(role.id)}
                      className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title={role.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {role.isActive ? (
                        <PowerOff className="w-4 h-4" />
                      ) : (
                        <Power className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Role Modal */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Add New Role</h2>
              <button
                onClick={() => setShowAddRole(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddRole} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Manager, Supervisor"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Role description..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddRole(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Create Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditRole && editingRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Edit Role</h2>
              <button
                onClick={() => {
                  setShowEditRole(false)
                  setEditingRole(null)
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditRole} className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-slate-700 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  required
                  defaultValue={editingRole.name}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="e.g., Manager, Supervisor"
                />
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-description"
                  name="description"
                  rows={3}
                  defaultValue={editingRole.description || ''}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Role description..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditRole(false)
                    setEditingRole(null)
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
