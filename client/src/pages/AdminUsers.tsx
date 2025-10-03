import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { apiClient } from '../lib/api'

type EndUser = {
  id: string
  username: string
  email?: string
  firstName: string
  lastName: string
  role: 'STAFF' | 'PROCUREMENT' | 'APPROVER_L1' | 'APPROVER_L2'
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

export default function AdminUsers() {
  const { user, org } = useAuth()
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [editingUser, setEditingUser] = useState<EndUser | null>(null)
  const [resettingPassword, setResettingPassword] = useState<EndUser | null>(null)
  const [assigningAccess, setAssigningAccess] = useState<EndUser | null>(null)
  const [assigningRole, setAssigningRole] = useState<EndUser | null>(null)
  const [users, setUsers] = useState<EndUser[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get('/api/end-users')
      setUsers(response.data || [])
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  // Fetch sites, areas, categories for assignment
  const fetchAccessData = async () => {
    try {
      const [sitesRes, areasRes, categoriesRes] = await Promise.all([
        apiClient.get('/api/sites'),
        apiClient.get('/api/areas'),
        apiClient.get('/api/categories')
      ])
      setSites(sitesRes.data || [])
      setAreas(areasRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (err) {
      console.error('Error fetching access data:', err)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchAccessData()
  }, [])

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/api/end-users/${userId}/toggle-status`)
      setUsers(users.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u))
    } catch (err: any) {
      console.error('Error toggling user status:', err)
      alert(err.response?.data?.error || 'Failed to toggle user status')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Link to="/admin-dashboard" className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-slate-900">User Management</h1>
                <p className="text-sm text-slate-600">{org?.name}</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateUser(true)}
              className="bg-emerald-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-emerald-600 transition-colors"
            >
              Create User
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="text-2xl font-bold text-slate-900">{users.length}</div>
            <div className="text-sm text-slate-600">Total Users</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="text-2xl font-bold text-green-600">{users.filter(u => u.isActive).length}</div>
            <div className="text-sm text-slate-600">Active Users</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="text-2xl font-bold text-emerald-600">{users.filter(u => u.role === 'STAFF').length}</div>
            <div className="text-sm text-slate-600">Staff Users</div>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role.includes('APPROVER')).length}</div>
            <div className="text-sm text-slate-600">Approvers</div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">End Users</h3>
            <p className="text-sm text-slate-600">Users who can submit requests and update stock</p>
          </div>

          {loading ? (
            <div className="px-6 py-12 text-center text-slate-500">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">No users yet. Create your first user to get started.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Access</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Login</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-slate-500">@{user.username}</div>
                          {user.email && <div className="text-sm text-slate-500">{user.email}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-900">
                          <div>Sites: {user.sites.length > 0 ? user.sites.map(s => s.name).join(', ') : 'None'}</div>
                          <div>Areas: {user.areas.length > 0 ? user.areas.slice(0, 2).map(a => a.name).join(', ') : 'None'}{user.areas.length > 2 ? '...' : ''}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setAssigningRole(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Assign Role
                        </button>
                        <button
                          onClick={() => setAssigningAccess(user)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          Assign Sites/Areas
                        </button>
                        <button
                          onClick={() => setResettingPassword(user)}
                          className="text-orange-600 hover:text-orange-900"
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.isActive)}
                          className={user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                        >
                          {user.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onCreateUser={(newUser) => {
            setUsers([...users, newUser])
            setShowCreateUser(false)
          }}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdateUser={(updatedUser) => {
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
            setEditingUser(null)
          }}
        />
      )}

      {/* Reset Password Modal */}
      {resettingPassword && (
        <ResetPasswordModal
          user={resettingPassword}
          onClose={() => setResettingPassword(null)}
          onResetPassword={() => {
            setResettingPassword(null)
          }}
        />
      )}

      {/* Assign Access Modal */}
      {assigningAccess && (
        <AssignAccessModal
          user={assigningAccess}
          sites={sites}
          areas={areas}
          categories={categories}
          onClose={() => setAssigningAccess(null)}
          onAssignAccess={(updatedUser) => {
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
            setAssigningAccess(null)
          }}
        />
      )}

      {/* Assign Role Modal */}
      {assigningRole && (
        <AssignRoleModal
          user={assigningRole}
          onClose={() => setAssigningRole(null)}
          onAssignRole={(updatedUser) => {
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
            setAssigningRole(null)
          }}
        />
      )}
    </div>
  )
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'STAFF':
      return 'bg-emerald-100 text-emerald-800'
    case 'PROCUREMENT':
      return 'bg-green-100 text-green-800'
    case 'APPROVER_L1':
      return 'bg-purple-100 text-purple-800'
    case 'APPROVER_L2':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// Create User Modal - Simple user creation only
function CreateUserModal({ onClose, onCreateUser }: {
  onClose: () => void
  onCreateUser: (user: EndUser) => void
}) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post('/api/end-users', formData)
      onCreateUser(response.data.endUser)
    } catch (err: any) {
      console.error('Error creating user:', err)
      setError(err.response?.data?.error || 'Failed to create user')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Create New User</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="john.smith"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password *</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="User will be required to change on first login"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">User will be forced to change password on first login</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> After creating the user, you can assign roles and sites using the action buttons.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.firstName || !formData.lastName || !formData.username || !formData.password}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Edit User Modal (Edit basic info and role)
function EditUserModal({ user, onClose, onUpdateUser }: {
  user: EndUser
  onClose: () => void
  onUpdateUser: (user: EndUser) => void
}) {
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email || '',
    role: user.role
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.put(`/api/end-users/${user.id}`, formData)
      onUpdateUser(response.data.endUser)
    } catch (err: any) {
      console.error('Error updating user:', err)
      setError(err.response?.data?.error || 'Failed to update user')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Edit User</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as EndUser['role'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="STAFF">Staff</option>
                <option value="PROCUREMENT">Procurement</option>
                <option value="APPROVER_L1">Approver Level 1</option>
                <option value="APPROVER_L2">Approver Level 2</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-500 rounded-md hover:bg-emerald-600 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Reset Password Modal
function ResetPasswordModal({ user, onClose, onResetPassword }: {
  user: EndUser
  onClose: () => void
  onResetPassword: () => void
}) {
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await apiClient.post(`/api/end-users/${user.id}/reset-password`, { newPassword })
      alert('Password reset successfully. User will be required to change it on next login.')
      onResetPassword()
    } catch (err: any) {
      console.error('Error resetting password:', err)
      setError(err.response?.data?.error || 'Failed to reset password')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Reset Password</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-slate-600">
              Resetting password for: <strong>{user.firstName} {user.lastName}</strong> (@{user.username})
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">New Temporary Password *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new temporary password"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-500 mt-1">User will be forced to change this password on next login</p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !newPassword}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Assign Access Modal (Sites, Areas, Categories)
function AssignAccessModal({ user, sites, areas, categories, onClose, onAssignAccess }: {
  user: EndUser
  sites: Site[]
  areas: Area[]
  categories: Category[]
  onClose: () => void
  onAssignAccess: (user: EndUser) => void
}) {
  const [selectedSites, setSelectedSites] = useState<string[]>(user.sites.map(s => s.id))
  const [selectedAreas, setSelectedAreas] = useState<string[]>(user.areas.map(a => a.id))
  const [selectedCategories, setSelectedCategories] = useState<string[]>(user.categories.map(c => c.id))
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
      onAssignAccess(response.data.endUser)
    } catch (err: any) {
      console.error('Error assigning access:', err)
      setError(err.response?.data?.error || 'Failed to assign access')
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Assign Sites & Areas</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-slate-600">
              Assigning access for: <strong>{user.firstName} {user.lastName}</strong> (@{user.username})
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sites */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Accessible Sites</label>
              {sites.length === 0 ? (
                <p className="text-sm text-slate-500">No sites available</p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-md p-3">
                  {sites.map(site => (
                    <label key={site.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedSites.includes(site.id)}
                        onChange={() => toggleSelection(site.id, selectedSites, setSelectedSites)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">{site.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Areas */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Accessible Areas</label>
              {areas.length === 0 ? (
                <p className="text-sm text-slate-500">No areas available</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-slate-200 rounded-md p-3">
                  {areas.map(area => (
                    <label key={area.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedAreas.includes(area.id)}
                        onChange={() => toggleSelection(area.id, selectedAreas, setSelectedAreas)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">{area.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category Access</label>
              {categories.length === 0 ? (
                <p className="text-sm text-slate-500">No categories available</p>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-slate-200 rounded-md p-3">
                  {categories.map(category => (
                    <label key={category.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => toggleSelection(category.id, selectedCategories, setSelectedCategories)}
                        className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm text-slate-700">{category.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Access'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Assign Role Modal
function AssignRoleModal({ user, onClose, onAssignRole }: {
  user: EndUser
  onClose: () => void
  onAssignRole: (user: EndUser) => void
}) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingRoles, setFetchingRoles] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setFetchingRoles(true)
        const response = await apiClient.get('/api/roles')
        setRoles(response.data || [])
      } catch (err: any) {
        console.error('Error fetching roles:', err)
        setError(err.message || 'Failed to fetch roles')
      } finally {
        setFetchingRoles(false)
      }
    }
    fetchRoles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!selectedRoleId) {
        throw new Error('Please select a role')
      }

      const selectedRole = roles.find(r => r.id === selectedRoleId)
      if (!selectedRole) {
        throw new Error('Invalid role selected')
      }

      const response = await apiClient.put(`/api/end-users/${user.id}`, {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: selectedRole.name // Update with the role name
      })

      if (response.endUser) {
        onAssignRole(response.endUser)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign role')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">
            Assign Role - {user.firstName} {user.lastName}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="mb-4">
            <p className="text-sm text-slate-600 mb-3">
              Current Role: <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                {user.role}
              </span>
            </p>
          </div>

          {fetchingRoles ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-slate-500">Loading roles...</div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select New Role
              </label>
              {roles.map((role) => (
                <label
                  key={role.id}
                  className="flex items-start p-3 border border-slate-200 rounded-md hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role.id}
                    checked={selectedRoleId === role.id}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-slate-900">{role.name}</div>
                    <div className="text-sm text-slate-500">{role.description}</div>
                  </div>
                </label>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || fetchingRoles || !selectedRoleId}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Assigning...' : 'Assign Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
