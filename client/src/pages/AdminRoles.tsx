// Roles Management - RBAC System
import { useState, useEffect } from 'react'
import {
  Search, Shield, Edit, X, Plus, Copy, Trash2, Lock, Users2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'

type Role = {
  id: string
  name: string
  description?: string
  scope: 'organization' | 'site' | 'area'
  color: string
  isSystem: boolean
  permissionCount: number
  userCount: number
  createdAt: string
  updatedAt: string
}

export default function AdminRoles() {
  const navigate = useNavigate()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roles, setRoles] = useState<Role[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // API functions
  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response: any = await api.get('/api/roles')

      if (response.success) {
        setRoles(response.data)
      } else {
        console.error('Failed to fetch roles:', response.error)
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

  const deleteRole = async (id: string) => {
    try {
      const response: any = await api.delete(`/api/roles/${id}`)

      if (response.success) {
        setRoles(prev => prev.filter(r => r.id !== id))
        return true
      } else {
        throw new Error(response.error?.message || 'Failed to delete role')
      }
    } catch (err: any) {
      console.error('Error deleting role:', err)
      alert(err.response?.data?.error?.message || 'Failed to delete role')
      return false
    }
  }

  const cloneRole = async (id: string, newName: string) => {
    try {
      const response: any = await api.post(`/api/roles/${id}/clone`, { name: newName })

      if (response.success) {
        setRoles(prev => [...prev, response.data])
        return response.data
      } else {
        throw new Error(response.error?.message || 'Failed to clone role')
      }
    } catch (err: any) {
      console.error('Error cloning role:', err)
      alert(err.response?.data?.error?.message || 'Failed to clone role')
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleCloneRole = async (role: Role) => {
    const newName = prompt(`Clone "${role.name}" as:`, `${role.name} (Copy)`)
    if (newName && newName.trim()) {
      await cloneRole(role.id, newName.trim())
    }
  }

  const handleDeleteRole = async () => {
    if (!deletingRole) return

    const success = await deleteRole(deletingRole.id)
    if (success) {
      setShowDeleteConfirm(false)
      setDeletingRole(null)
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
              <h1 className="text-2xl font-semibold text-slate-900">Roles & Permissions</h1>
              <p className="text-sm text-slate-600">Manage user roles and granular permissions</p>
            </div>
            <button
              onClick={() => navigate('/admin/roles/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Role
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
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-slate-200">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/admin/roles/${role.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${role.color}20` }}
                      >
                        <Shield className="w-5 h-5" style={{ color: role.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-slate-900">{role.name}</h3>
                          {role.isSystem && (
                            <Lock className="w-3.5 h-3.5 text-slate-400" title="System role (cannot be deleted)" />
                          )}
                          <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 capitalize">
                            {role.scope}
                          </span>
                        </div>
                        {role.description && (
                          <p className="text-xs text-slate-500 truncate">{role.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" />
                            {role.permissionCount} permissions
                          </span>
                          <span className="flex items-center gap-1">
                            <Users2 className="w-3.5 h-3.5" />
                            {role.userCount} users
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/admin/roles/${role.id}`)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit role"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCloneRole(role)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Clone role"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={() => {
                            setDeletingRole(role)
                            setShowDeleteConfirm(true)
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete role"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && deletingRole && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 text-center mb-2">Delete Role</h2>
              <p className="text-sm text-slate-600 text-center mb-6">
                Are you sure you want to delete "<span className="font-semibold">{deletingRole.name}</span>"?
                {deletingRole.userCount > 0 && (
                  <span className="text-red-600"> This role is assigned to {deletingRole.userCount} user{deletingRole.userCount > 1 ? 's' : ''} and cannot be deleted.</span>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeletingRole(null)
                  }}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRole}
                  disabled={deletingRole.userCount > 0}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
