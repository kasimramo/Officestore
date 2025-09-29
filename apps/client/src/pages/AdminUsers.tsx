import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

type EndUser = {
  id: string
  username: string
  email?: string
  firstName: string
  lastName: string
  role: 'STAFF' | 'PROCUREMENT' | 'APPROVER_L1' | 'APPROVER_L2'
  sites: string[]
  areas: string[]
  categories: string[]
  isActive: boolean
  createdAt: string
  lastLogin?: string
}

export default function AdminUsers() {
  const { user, org } = useAuth()
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [users, setUsers] = useState<EndUser[]>([
    {
      id: '1',
      username: 'john.staff',
      email: 'john@company.com',
      firstName: 'John',
      lastName: 'Smith',
      role: 'STAFF',
      sites: ['Site A'],
      areas: ['Kitchen', 'Office Supplies'],
      categories: ['Office Supplies', 'Pantry'],
      isActive: true,
      createdAt: '2024-01-15',
      lastLogin: '2024-01-28'
    },
    {
      id: '2',
      username: 'sarah.procurement',
      email: 'sarah@company.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'PROCUREMENT',
      sites: ['Site A', 'Site B'],
      areas: ['All Areas'],
      categories: ['All Categories'],
      isActive: true,
      createdAt: '2024-01-10',
      lastLogin: '2024-01-28'
    }
  ])

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
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Create User
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
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
            <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role === 'STAFF').length}</div>
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
                        <div>Sites: {user.sites.join(', ')}</div>
                        <div>Areas: {user.areas.slice(0, 2).join(', ')}{user.areas.length > 2 ? '...' : ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button className="text-red-600 hover:text-red-900">Reset Password</button>
                      <button className={user.isActive ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}>
                        {user.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onCreateUser={(newUser) => {
            setUsers([...users, { ...newUser, id: Math.random().toString(36).substr(2, 9) }])
            setShowCreateUser(false)
          }}
        />
      )}
    </div>
  )
}

function getRoleBadgeColor(role: string): string {
  switch (role) {
    case 'STAFF':
      return 'bg-blue-100 text-blue-800'
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

function CreateUserModal({ onClose, onCreateUser }: {
  onClose: () => void
  onCreateUser: (user: Omit<EndUser, 'id'>) => void
}) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    role: 'STAFF' as EndUser['role'],
    sites: [] as string[],
    areas: [] as string[],
    categories: [] as string[],
    tempPassword: ''
  })

  const availableSites = ['Site A', 'Site B', 'Site C']
  const availableAreas = ['Kitchen', 'Office Supplies', 'Reception', 'Meeting Rooms', 'Storage']
  const availableCategories = ['Office Supplies', 'Pantry', 'Cleaning', 'IT Equipment', 'Furniture']

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreateUser({
      username: formData.username,
      email: formData.email || undefined,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      sites: formData.sites,
      areas: formData.areas,
      categories: formData.categories,
      isActive: true,
      createdAt: new Date().toISOString().split('T')[0]
    })
  }

  const handleCheckboxChange = (field: 'sites' | 'areas' | 'categories', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Create New User</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@company.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as EndUser['role'] })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="STAFF">Staff (Submit requests, update stock)</option>
                <option value="PROCUREMENT">Procurement (Manage supplies)</option>
                <option value="APPROVER_L1">Approver Level 1</option>
                <option value="APPROVER_L2">Approver Level 2</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Temporary Password *</label>
              <input
                type="password"
                value={formData.tempPassword}
                onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                placeholder="User will be required to change on first login"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">User will be forced to change password on first login</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Accessible Sites *</label>
              <div className="space-y-2">
                {availableSites.map(site => (
                  <label key={site} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.sites.includes(site)}
                      onChange={() => handleCheckboxChange('sites', site)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">{site}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Accessible Areas *</label>
              <div className="grid grid-cols-2 gap-2">
                {availableAreas.map(area => (
                  <label key={area} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.areas.includes(area)}
                      onChange={() => handleCheckboxChange('areas', area)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">{area}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category Access *</label>
              <div className="grid grid-cols-2 gap-2">
                {availableCategories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.categories.includes(category)}
                      onChange={() => handleCheckboxChange('categories', category)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-slate-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!formData.firstName || !formData.lastName || !formData.username || !formData.tempPassword || formData.sites.length === 0 || formData.areas.length === 0 || formData.categories.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}