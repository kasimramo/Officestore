import { useState } from 'react'
import { apiClient, type AuthResponse } from '../lib/api'
import { AlertTriangleIcon } from '../components/icons'

interface LoginPageProps {
  onLogin: () => void
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    organizationName: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      let response: AuthResponse

      if (isSignUp) {
        response = await apiClient.signup({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          organizationName: formData.organizationName
        })
      } else {
        response = await apiClient.signin({
          username: formData.email,
          password: formData.password
        })
      }

      if (response.success) {
        onLogin()
      } else {
        setError(response.error?.message || 'Authentication failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="max-w-md">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <span className="text-white font-bold text-lg">OS</span>
              </div>
              <h1 className="text-3xl font-bold">OfficeStore</h1>
            </div>
            <h2 className="text-4xl font-bold mb-6 leading-tight">
              Modern Supply Chain Management
            </h2>
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              Streamline your office supplies, manage requests efficiently, and maintain perfect inventory control with our enterprise-grade platform.
            </p>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-blue-100">Real-time inventory tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-blue-100">Automated approval workflows</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-blue-100">Advanced analytics & reporting</span>
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-40 translate-x-40"></div>
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full translate-y-40 -translate-x-40"></div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 bg-neutral-50">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">OS</span>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900">OfficeStore</h1>
            </div>
            <p className="text-neutral-600">Pantry & Office Supplies Management</p>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </h2>
                <p className="text-neutral-600">
                  {isSignUp
                    ? 'Set up your organization and start managing supplies'
                    : 'Sign in to access your dashboard'
                  }
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {isSignUp && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-neutral-700 mb-2">
                          First Name
                        </label>
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          required
                          value={formData.firstName}
                          onChange={handleChange}
                          className="input"
                          placeholder="John"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-neutral-700 mb-2">
                          Last Name
                        </label>
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          required
                          value={formData.lastName}
                          onChange={handleChange}
                          className="input"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="organizationName" className="block text-sm font-medium text-neutral-700 mb-2">
                        Organization Name
                      </label>
                      <input
                        id="organizationName"
                        name="organizationName"
                        type="text"
                        required
                        value={formData.organizationName}
                        onChange={handleChange}
                        className="input"
                        placeholder="Acme Corporation"
                      />
                      <p className="mt-2 text-xs text-neutral-500">
                        You will be the admin of this organization
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="input"
                    placeholder="••••••••"
                  />
                  {isSignUp && (
                    <p className="mt-2 text-xs text-neutral-500">
                      Must contain uppercase, lowercase, number, and special character
                    </p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 text-sm">{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full py-3"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="spinner w-4 h-4"></div>
                      <span>Processing...</span>
                    </div>
                  ) : (
                    isSignUp ? 'Create Account' : 'Sign In'
                  )}
                </button>

                <div className="text-center pt-4 border-t border-neutral-200">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp)
                      setError(null)
                      setFormData({
                        email: '',
                        password: '',
                        firstName: '',
                        lastName: '',
                        organizationName: ''
                      })
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Development Info */}
          <div className="mt-8 text-center text-xs text-neutral-400">
            <p>Dev: API :3001 • Client :3002</p>
          </div>
        </div>
      </div>
    </div>
  )
}