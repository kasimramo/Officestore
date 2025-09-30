import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function TopNav() {
  const { user, org, signOut, getDashboardRoute } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Dynamic navigation based on user role
  const getNavigation = () => {
    if (user?.role === 'ADMIN') {
      return [
        { name: 'Dashboard', href: '/admin-dashboard' },
        { name: 'Users', href: '/admin/users' },
        { name: 'Sites & Areas', href: '/admin/sites' },
        { name: 'Catalog', href: '/catalog' },
        { name: 'Reports', href: '/reports' },
      ]
    } else {
      return [
        { name: 'Dashboard', href: '/user-dashboard' },
        { name: 'Sites & Areas', href: '/admin/sites' },
        { name: 'Catalog', href: '/catalog' },
        { name: 'Requests', href: '/requests' },
        { name: 'Reports', href: '/reports' },
      ]
    }
  }

  const navigation = getNavigation()

  const initials = (user?.firstName || user?.email || 'U')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-backdrop-blur:bg-white/60 bg-white/80 border-b border-slate-200">
      <div className="mx-auto container-max px-4 sm:px-6 lg:px-8 h-[var(--header-height)] flex items-center justify-between">
        {/* Left: Logo + Navigation */}
        <div className="flex items-center gap-8 min-w-0">
          <Link to={getDashboardRoute()} className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center justify-center rounded-lg bg-blue-600 text-white w-8 h-8 font-semibold">OS</span>
            <span className="font-semibold text-slate-900 hidden sm:inline">OfficeStore</span>
          </Link>

          {/* Navigation Menu */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Center: Search */}
        <div className="hidden md:flex items-center flex-1 justify-center px-6 max-w-md">
          <div className="w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              placeholder="Search items, requests, users..."
              className="w-full pl-10 pr-3 py-2 rounded-md border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        {/* Right: Notifications + Org + User */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 inline-flex h-3 w-3 rounded-full bg-red-500 text-white text-xs items-center justify-center">
              <span className="sr-only">New notifications</span>
            </span>
          </button>

          {/* Org display */}
          <div className="hidden xl:flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700">
            <span className="truncate max-w-[160px]">{org?.name || 'Default Organization'}</span>
          </div>

          {/* User menu */}
          <div className="inline-flex items-center gap-3 rounded-full border border-slate-300 bg-white pl-1 pr-4 py-1 hover:bg-slate-50 transition-colors">
            <div className="inline-flex items-center justify-center align-middle select-none overflow-hidden rounded-full w-8 h-8 border border-slate-200 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <span className="text-xs font-semibold">{initials}</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-medium text-slate-900 max-w-[140px] truncate">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : user?.email || 'User'}
              </div>
              <div className="text-xs text-slate-500 capitalize">
                {user?.role?.toLowerCase().replace('_', ' ') || 'Staff'}
              </div>
            </div>
            <button
              onClick={() => {
                signOut()
                navigate('/')
              }}
              className="text-xs text-red-600 hover:text-red-700 ml-2 px-2 py-1 rounded hover:bg-red-50 transition-colors"
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

