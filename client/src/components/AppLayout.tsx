import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, Search, LayoutDashboard, Users, MapPin, Package,
  FileText, BarChart3, Settings, Plus, ChevronDown, LogOut, Shield
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, org, signOut, getDashboardRoute } = useAuth()
  const { hasPermission, hasAnyPermission } = usePermissions()
  const location = useLocation()
  const navigate = useNavigate()
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Dynamic navigation based on user role and permissions
  const getNavigation = () => {
    const navItems = []

    // Dashboard - always visible
    navItems.push({
      name: 'Dashboard',
      href: user?.role === 'ADMIN' ? '/admin-dashboard' : '/user-dashboard',
      icon: LayoutDashboard
    })

    // Users - only for those with user management permissions
    if (hasPermission('users_roles.view_users')) {
      navItems.push({ name: 'Users', href: '/admin/users', icon: Users })
    }

    // Roles - only for those with role management permissions
    if (hasPermission('users_roles.view_roles')) {
      navItems.push({ name: 'Roles', href: '/admin/roles', icon: Shield })
    }

    // Sites & Areas - for those with site/area view permissions
    if (hasAnyPermission(['sites_areas.view_sites', 'sites_areas.view_areas'])) {
      navItems.push({ name: 'Sites & Areas', href: '/admin/sites', icon: MapPin })
    }

    // Catalog - for those with catalog view permission
    if (hasPermission('catalogue.view_catalogue')) {
      navItems.push({ name: 'Catalog', href: '/catalog', icon: Package })
    }

    // Requests - for those with request permissions
    if (hasAnyPermission(['requests.submit_requests', 'requests.view_requests'])) {
      navItems.push({ name: 'Requests', href: '/requests', icon: FileText })
    }

    // Reports - for those with reporting permissions
    if (hasPermission('reports.view_reports')) {
      navItems.push({ name: 'Reports', href: '/reports', icon: BarChart3 })
    }

    return navItems
  }

  const navigation = getNavigation()

  const initials = (user?.firstName || user?.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Left Sidebar - Dark */}
      <aside className="hidden lg:flex lg:flex-col w-16 bg-slate-800 border-r border-slate-700">
        {/* Logo */}
        <div className="flex items-center justify-center h-14 border-b border-slate-700">
          <Link to={getDashboardRoute()} className="flex items-center justify-center">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
              OS
            </div>
          </Link>
        </div>

        {/* Vertical Navigation Icons */}
        <nav className="flex-1 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center justify-center h-12 mx-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
                title={item.name}
              >
                <Icon className="w-5 h-5" />
              </Link>
            )
          })}
        </nav>

        {/* Bottom Icons */}
        <div className="py-4 space-y-1 border-t border-slate-700">
          <button
            className="flex items-center justify-center h-12 mx-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar - Light */}
        <header className="bg-white border-b border-slate-200 shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
            {/* Left: Mobile Logo + Horizontal Tabs */}
            <div className="flex items-center gap-6 min-w-0 flex-1">
              {/* Mobile Logo */}
              <Link to={getDashboardRoute()} className="lg:hidden flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  OS
                </div>
                <span className="font-semibold text-slate-900 hidden sm:inline">OfficeStore</span>
              </Link>

              {/* Horizontal Tab Navigation */}
              <nav className="hidden md:flex items-center space-x-1 overflow-x-auto">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                        isActive
                          ? 'border-emerald-500 text-emerald-600'
                          : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                      }`}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Right: Search + Actions + Org + User */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="hidden xl:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    placeholder="Search..."
                    className="w-64 pl-10 pr-3 py-1.5 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>

              {/* Quick Action Button */}
              {hasPermission('requests.submit_requests') && (
                <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm">
                  <Plus className="w-4 h-4" />
                  <span>New Request</span>
                </button>
              )}

              {/* Notifications */}
              <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 inline-flex h-2 w-2 rounded-full bg-orange-500"></span>
              </button>

              {/* Org Selector */}
              <button className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 transition-colors">
                <span className="text-sm text-slate-700 truncate max-w-[120px]">
                  {org?.name || 'Organization'}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-semibold">
                    {initials}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-slate-900 max-w-[100px] truncate">
                      {user?.firstName || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-slate-500 capitalize">
                      {user?.role?.toLowerCase().replace('_', ' ') || 'Staff'}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    {/* Backdrop to close dropdown */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                      <button
                        onClick={() => {
                          signOut()
                          navigate('/')
                          setUserMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  )
}
