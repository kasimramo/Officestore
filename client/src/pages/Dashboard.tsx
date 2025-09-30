import { useState, useEffect } from 'react'
import { apiClient } from '../lib/api'
import {
  DashboardIcon,
  RequestsIcon,
  InventoryIcon,
  SitesIcon,
  UsersIcon,
  ReportsIcon,
  SettingsIcon,
  MenuIcon,
  CloseIcon,
  SearchIcon,
  BellIcon,
  ChevronDownIcon,
  UserCircleIcon,
  PlusIcon,
  TrendingUpIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '../components/icons'

interface DashboardProps {
  onLogout: () => void
}

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  organization_id: string | null
  is_active: boolean
  email_verified: boolean
  created_at: string
  updated_at: string
}

interface DashboardStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  lowStockItems: number
  totalUsers: number
  totalItems: number
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Mock data for now - will be replaced with real API calls
  const stats: DashboardStats = {
    totalRequests: 45,
    pendingRequests: 12,
    approvedRequests: 28,
    lowStockItems: 8,
    totalUsers: 15,
    totalItems: 234
  }

  const recentActivity = [
    { id: 1, type: 'request', description: 'New request for office supplies', user: 'John Doe', time: '2 hours ago' },
    { id: 2, type: 'approval', description: 'Request #1234 approved', user: 'Jane Smith', time: '4 hours ago' },
    { id: 3, type: 'inventory', description: 'Low stock alert: Printer Paper', user: 'System', time: '6 hours ago' },
    { id: 4, type: 'user', description: 'New user added to organization', user: 'Admin', time: '1 day ago' },
  ]

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await apiClient.getMe()
        setUser((userData as any).data?.user)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user data')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const navigation = [
    { name: 'Overview', id: 'overview', icon: DashboardIcon, description: 'Dashboard overview' },
    { name: 'Requests', id: 'requests', icon: RequestsIcon, description: 'Manage supply requests' },
    { name: 'Inventory', id: 'inventory', icon: InventoryIcon, description: 'Catalogue & stock management' },
    { name: 'Sites & Areas', id: 'sites', icon: SitesIcon, description: 'Manage locations' },
    { name: 'Users', id: 'users', icon: UsersIcon, description: 'User management', adminOnly: true },
    { name: 'Reports', id: 'reports', icon: ReportsIcon, description: 'Analytics & reports' },
    { name: 'Settings', id: 'settings', icon: SettingsIcon, description: 'Organization settings', adminOnly: true },
  ]

  const isAdmin = user?.role === 'ADMIN'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="spinner h-12 w-12 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <AlertTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-neutral-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Modern Top Navigation */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          {/* Left side - Logo and primary nav */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OS</span>
              </div>
              <h1 className="text-xl font-bold text-neutral-900 hidden sm:block">OfficeStore</h1>
            </div>

            {/* Main Navigation - Desktop */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navigation.map((item) => {
                if (item.adminOnly && !isAdmin) return null
                const IconComponent = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {item.name}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Right side - Search, notifications, user */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:flex items-center">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="input pl-10 w-64"
                />
              </div>
            </div>

            {/* Search only - no quick actions */}

            {/* Notifications */}
            <button className="relative p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg">
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* User Info and Logout */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 px-3 py-2 bg-neutral-100 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-900">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-neutral-500">{user?.role}</p>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="btn-secondary"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Exit</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:hidden`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">OS</span>
            </div>
            <h1 className="text-xl font-bold text-neutral-900">OfficeStore</h1>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              if (item.adminOnly && !isAdmin) return null
              const IconComponent = item.icon
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full nav-item ${activeTab === item.id ? 'active' : ''}`}
                >
                  <IconComponent className="w-4 h-4 mr-3" />
                  <div className="text-left">
                    <div>{item.name}</div>
                    <div className="text-xs text-neutral-500">{item.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 lg:px-6 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Dashboard Overview</h1>
                <p className="text-neutral-600 mt-1">Welcome back, {user?.first_name}! Here's what's happening today.</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="btn-secondary">
                  <span className="hidden sm:inline">Export Report</span>
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card hover-lift">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Requests</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalRequests}</p>
                      <div className="flex items-center mt-2">
                        <TrendingUpIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">+12% from last week</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <RequestsIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card hover-lift">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Pending Requests</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.pendingRequests}</p>
                      <div className="flex items-center mt-2">
                        <ClockIcon className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-yellow-600">Needs attention</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                      <ClockIcon className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card hover-lift">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Low Stock Items</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.lowStockItems}</p>
                      <div className="flex items-center mt-2">
                        <AlertTriangleIcon className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-sm text-red-600">Requires restocking</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <AlertTriangleIcon className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="card hover-lift">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-neutral-600">Total Items</p>
                      <p className="text-3xl font-bold text-neutral-900 mt-2">{stats.totalItems}</p>
                      <div className="flex items-center mt-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">In inventory</span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <InventoryIcon className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity & Quick Actions Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Recent Activity - spans 2 columns */}
              <div className="xl:col-span-2">
                <div className="card">
                  <div className="card-header">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-neutral-900">Recent Activity</h3>
                      <button className="btn-ghost text-sm">View All</button>
                    </div>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            activity.type === 'request' ? 'bg-blue-500' :
                            activity.type === 'approval' ? 'bg-green-500' :
                            activity.type === 'inventory' ? 'bg-red-500' : 'bg-neutral-500'
                          }`}></div>
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{activity.description}</p>
                            <p className="text-xs text-neutral-500">by {activity.user}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-neutral-400">{activity.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <div className="card">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-neutral-900">Quick Actions</h3>
                  </div>
                  <div className="card-body space-y-3">
                    <button className="w-full flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-blue-300 transition-all group">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                        <RequestsIcon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-neutral-900">New Request</div>
                        <div className="text-sm text-neutral-500">Submit supply request</div>
                      </div>
                    </button>

                    <button className="w-full flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-green-300 transition-all group">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-green-200 transition-colors">
                        <InventoryIcon className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-neutral-900">Add Item</div>
                        <div className="text-sm text-neutral-500">Add to catalogue</div>
                      </div>
                    </button>

                    {isAdmin && (
                      <>
                        <button className="w-full flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-purple-300 transition-all group">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-purple-200 transition-colors">
                            <UsersIcon className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-neutral-900">Invite User</div>
                            <div className="text-sm text-neutral-500">Add team member</div>
                          </div>
                        </button>

                        <button className="w-full flex items-center p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 hover:border-orange-300 transition-all group">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-orange-200 transition-colors">
                            <SitesIcon className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-neutral-900">Add Site</div>
                            <div className="text-sm text-neutral-500">Create new location</div>
                          </div>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Placeholder content for other tabs */}
        {activeTab !== 'overview' && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="card max-w-md w-full">
              <div className="card-body text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {(() => {
                    const currentNav = navigation.find(nav => nav.id === activeTab)
                    if (currentNav) {
                      const IconComponent = currentNav.icon
                      return <IconComponent className="w-8 h-8 text-neutral-500" />
                    }
                    return null
                  })()}
                </div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {navigation.find(nav => nav.id === activeTab)?.name}
                </h3>
                <p className="text-neutral-600 mb-4">
                  This section is under development. Full functionality will be available soon.
                </p>
                <button className="btn-primary">
                  Get Notified When Ready
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}