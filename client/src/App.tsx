import { useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import AppLayout from './components/AppLayout'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { PermissionsProvider } from './contexts/PermissionsContext'
import Catalog from './pages/Catalog.tsx'
import Requests from './pages/Requests'
import NewRequest from './pages/NewRequest'
import Reports from './pages/Reports'
import Organization from './pages/Organization'
import Landing from './pages/Landing'
import Register from './pages/Register'
import OrganizationSetup from './pages/OrganizationSetup'
import AdminDashboard from './pages/AdminDashboard'
import AdminUsers from './pages/AdminUsers'
import AdminSites from './pages/AdminSites'
import AdminRoles from './pages/AdminRoles'
import AdminRoleBuilder from './pages/AdminRoleBuilder'
import AdminWorkflows from './pages/AdminWorkflows'
import WorkflowBuilder from './pages/WorkflowBuilder'
import ApprovalWorkflows from './pages/ApprovalWorkflows'
import UserDashboard from './pages/UserDashboard'

function Dashboard() {
  return (
    <div className="mx-auto container-max px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome back! Here's what's happening in your organization.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Items"
          value="1,247"
          change="+12%"
          trend="up"
          color="blue"
        />
        <StatsCard
          title="Pending Requests"
          value="23"
          change="-8%"
          trend="down"
          color="orange"
        />
        <StatsCard
          title="Active Sites"
          value="8"
          change="+2"
          trend="up"
          color="green"
        />
        <StatsCard
          title="Low Stock Items"
          value="15"
          change="+3"
          trend="up"
          color="red"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            <ActivityItem
              action="New request submitted"
              details="Office supplies for Marketing team"
              time="2 hours ago"
              user="Sarah Chen"
            />
            <ActivityItem
              action="Item approved"
              details="Standing desk request by John Doe"
              time="4 hours ago"
              user="Mike Johnson"
            />
            <ActivityItem
              action="Stock updated"
              details="Printer paper inventory refreshed"
              time="1 day ago"
              user="System"
            />
            <ActivityItem
              action="New site added"
              details="Downtown Office location"
              time="2 days ago"
              user="Admin"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionButton
              title="Submit Request"
              description="Request new items"
              color="blue"
            />
            <QuickActionButton
              title="Manage Catalog"
              description="Add or edit items"
              color="green"
            />
            <QuickActionButton
              title="View Reports"
              description="Analytics & insights"
              color="purple"
            />
            <QuickActionButton
              title="Settings"
              description="Organization setup"
              color="gray"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsCard({ title, value, change, trend, color }: {
  title: string
  value: string
  change: string
  trend: 'up' | 'down'
  color: 'blue' | 'green' | 'orange' | 'red'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    orange: 'bg-orange-50 border-orange-200',
    red: 'bg-red-50 border-red-200'
  }

  const changeColor = trend === 'up' ? 'text-green-600' : 'text-red-600'

  return (
    <div className={`bg-white rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`text-sm font-medium ${changeColor}`}>
          {change}
        </div>
      </div>
    </div>
  )
}

function ActivityItem({ action, details, time, user }: {
  action: string
  details: string
  time: string
  user: string
}) {
  return (
    <div className="flex items-start space-x-3">
      <div className="flex-shrink-0 w-2 h-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mt-2"></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900">{action}</p>
        <p className="text-sm text-slate-600">{details}</p>
        <p className="text-xs text-slate-500 mt-1">
          {time} • by {user}
        </p>
      </div>
    </div>
  )
}

function QuickActionButton({ title, description, color }: {
  title: string
  description: string
  color: 'blue' | 'green' | 'purple' | 'gray'
}) {
  const colorClasses = {
    blue: 'hover:bg-blue-50 border-blue-200',
    green: 'hover:bg-green-50 border-green-200',
    purple: 'hover:bg-purple-50 border-purple-200',
    gray: 'hover:bg-gray-50 border-gray-200'
  }

  return (
    <button className={`text-left p-4 rounded-lg border-2 border-dashed transition-colors ${colorClasses[color]}`}>
      <h4 className="font-medium text-slate-900 text-sm">{title}</h4>
      <p className="text-xs text-slate-600 mt-1">{description}</p>
    </button>
  )
}

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, getDashboardRoute } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Check for session timeout message from navigation state
  const sessionMessage = (location.state as any)?.message

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await signIn(email, password)
      // Let the routing system handle the redirect based on auth state
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 p-8 shadow-lg">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-10 h-10 font-bold text-lg">OS</span>
            <span className="font-bold text-xl text-slate-900">OfficeStore</span>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-600 mt-2">Sign in to your account to continue</p>
          </div>

          {sessionMessage && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md text-sm">
              {sessionMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500" />
                <span className="ml-2 text-sm text-slate-600">Remember me</span>
              </label>
              <button type="button" className="text-sm text-emerald-600 hover:text-emerald-700">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <button className="text-emerald-600 hover:text-emerald-700 font-medium">
                Contact your administrator
              </button>
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Demo: Use any email and password to sign in
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}


function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, getDashboardRoute } = useAuth()

  if (!user) {
    return <Navigate to="/login" />
  }

  // If user role is not in allowed roles, redirect to their appropriate dashboard
  if (allowedRoles && user.role && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardRoute()} />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { user, isLoading, getDashboardRoute } = useAuth()
  const isAuthed = !!user

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-12 h-12 font-bold text-xl mb-4">OS</div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={!isAuthed ? <Landing /> : <Navigate to={getDashboardRoute()} />} />
      <Route path="/login" element={!isAuthed ? <Login /> : <Navigate to={getDashboardRoute()} />} />
      <Route path="/register" element={!isAuthed ? <Register /> : <Navigate to={getDashboardRoute()} />} />
      <Route path="/organization-setup" element={<ProtectedRoute><OrganizationSetup /></ProtectedRoute>} />

      {/* Admin-only routes */}
      <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><AdminUsers /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/roles" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><AdminRoles /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/roles/new" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><AdminRoleBuilder /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/roles/:id" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><AdminRoleBuilder /></AppLayout></ProtectedRoute>} />
      <Route path="/admin/workflows" element={<ProtectedRoute allowedRoles={['ADMIN']}><AppLayout><ApprovalWorkflows /></AppLayout></ProtectedRoute>} />

      {/* Sites & Areas - accessible to all authenticated users */}
      <Route path="/admin/sites" element={<ProtectedRoute><AppLayout><AdminSites /></AppLayout></ProtectedRoute>} />

      {/* End-user routes */}
      <Route path="/user-dashboard" element={<ProtectedRoute allowedRoles={['STAFF', 'PROCUREMENT', 'APPROVER_L1', 'APPROVER_L2']}><AppLayout><UserDashboard /></AppLayout></ProtectedRoute>} />

      {/* Legacy/fallback routes */}
      <Route path="/dashboard" element={isAuthed ? <Navigate to={getDashboardRoute()} /> : <Navigate to="/login" />} />
      <Route path="/catalog" element={isAuthed ? <AppLayout><Catalog /></AppLayout> : <Navigate to="/login" />} />
      <Route path="/requests" element={isAuthed ? <AppLayout><Requests /></AppLayout> : <Navigate to="/login" />} />
      <Route path="/requests/new" element={isAuthed ? <AppLayout><NewRequest /></AppLayout> : <Navigate to="/login" />} />
      <Route path="/reports" element={isAuthed ? <AppLayout><Reports /></AppLayout> : <Navigate to="/login" />} />
      <Route path="/organization" element={isAuthed ? <AppLayout><Organization /></AppLayout> : <Navigate to="/login" />} />

      {/* Fallback */}
      <Route path="*" element={isAuthed ? <Navigate to={getDashboardRoute()} /> : <Navigate to="/" />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <AppRoutes />
      </PermissionsProvider>
    </AuthProvider>
  )
}

