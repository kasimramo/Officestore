import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type Org = { id: string; name: string; slug?: string }
type User = { id: string; email: string; firstName?: string; lastName?: string; role?: 'ADMIN' | 'STAFF' | 'PROCUREMENT' | 'APPROVER_L1' | 'APPROVER_L2'; organizationId?: string }

type AuthContextType = {
  user: User | null
  org: Org | null
  isLoading: boolean
  setOrg: (org: Org | null) => void
  signIn: (email: string, password: string) => Promise<User>
  signUp: (userData: { firstName: string; lastName: string; email: string; password: string; organizationName: string }) => Promise<void>
  signOut: () => void
  getDashboardRoute: (userOverride?: User) => string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [org, setOrg] = useState<Org | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Setup session expired callback for idle timeout
    import('../lib/api').then(({ apiClient }) => {
      apiClient.setSessionExpiredCallback(() => {
        console.log('[Auth] Session expired, logging out user')
        setUser(null)
        setOrg(null)
        localStorage.removeItem('user')
        localStorage.removeItem('current_org')
        localStorage.removeItem('pending_org_setup')
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')

        // Redirect to login with session timeout message
        navigate('/login', {
          replace: true,
          state: { message: 'Your session has expired. Please sign in again.' }
        })
      })
    })
  }, [navigate])

  useEffect(() => {
    // Check for existing auth on mount
    const storedUser = localStorage.getItem('user')
    const storedOrg = localStorage.getItem('current_org')

    // Clear old organization data that might have incorrect name
    if (storedOrg) {
      const orgData = JSON.parse(storedOrg)
      if (orgData.name === 'Acme Corporation') {
        localStorage.removeItem('current_org')
        setOrg(null)
      } else {
        setOrg(orgData)
      }
    }

    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }

    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: email,
          password: password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Login failed')
      }

      if (data.success && data.data) {
        const { user, tokens, organization } = data.data

        const authUser: User = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          organizationId: user.organization_id
        }

        // DEBUG: Log user role for dashboard routing
        console.log('[AUTH] User signed in:', {
          email: authUser.email,
          role: authUser.role,
          backendRole: user.role
        });

        setUser(authUser)

        // Store tokens in localStorage
        localStorage.setItem('auth_token', tokens.accessToken)
        localStorage.setItem('refresh_token', tokens.refreshToken)
        localStorage.setItem('user', JSON.stringify(authUser))

        // CRITICAL: Update apiClient with the new token immediately
        // Import apiClient dynamically to avoid circular dependencies
        import('../lib/api').then(({ apiClient }) => {
          apiClient.setToken(tokens.accessToken)
        })

        // If user has organization, fetch it separately or handle org setup
        if (user.organization_id) {
          let resolvedOrg: Org | null = null

          if (organization && organization.id === user.organization_id) {
            resolvedOrg = {
              id: organization.id,
              name: organization.name,
              slug: organization.slug
            }
          } else {
            const existingOrgRaw = localStorage.getItem('current_org')
            if (existingOrgRaw) {
              try {
                const parsedOrg = JSON.parse(existingOrgRaw) as Org
                if (parsedOrg.id === user.organization_id) {
                  resolvedOrg = parsedOrg
                }
              } catch {
                // Ignore parse errors and fall back to defaults
              }
            }
          }

          if (!resolvedOrg) {
            resolvedOrg = {
              id: user.organization_id,
              name: organization?.name || 'Organization',
              slug: organization?.slug
            }
          }

          setOrg(resolvedOrg)
          localStorage.setItem('current_org', JSON.stringify(resolvedOrg))
          localStorage.removeItem('pending_org_setup')
        }

        // Return the user object so caller can use it immediately
        return authUser
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const signUp = async (userData: { firstName: string; lastName: string; email: string; password: string; organizationName: string }) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.email,
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          organizationName: userData.organizationName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Registration failed')
      }

      if (data.success && data.data) {
        const { user, tokens, organization } = data.data

        const authUser: User = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          organizationId: user.organization_id
        }

        setUser(authUser)

        // Store tokens in localStorage
        localStorage.setItem('auth_token', tokens.accessToken)
        localStorage.setItem('refresh_token', tokens.refreshToken)
        localStorage.setItem('user', JSON.stringify(authUser))

        // CRITICAL: Update apiClient with the new token immediately
        import('../lib/api').then(({ apiClient }) => {
          apiClient.setToken(tokens.accessToken)
        })

        // If organization was created, store it
        if (organization) {
          const org: Org = {
            id: organization.id,
            name: organization.name,
            slug: organization.slug
          }
          setOrg(org)
          localStorage.setItem('current_org', JSON.stringify(org))
        } else {
          // Mark that organization setup is needed
          localStorage.setItem('pending_org_setup', 'true')
        }
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed')
    }
  }

  const getDashboardRoute = (userOverride?: User) => {
    const targetUser = userOverride || user
    if (!targetUser) return '/login'

    // Check if org setup is pending (new admin user)
    if (localStorage.getItem('pending_org_setup')) {
      return '/organization-setup'
    }

    // Route based on user role
    console.log('[AUTH] getDashboardRoute called with role:', targetUser.role);

    switch (targetUser.role) {
      case 'ADMIN':
        return '/admin-dashboard'
      case 'STAFF':
      case 'PROCUREMENT':
      case 'APPROVER_L1':
      case 'APPROVER_L2':
        return '/user-dashboard'
      default:
        console.warn('[AUTH] Unknown role, using fallback /dashboard:', targetUser.role);
        return '/dashboard' // fallback
    }
  }

  const value = useMemo(() => ({
    user,
    org,
    isLoading,
    setOrg: (o: Org | null) => {
      setOrg(o)
      if (o) localStorage.setItem('current_org', JSON.stringify(o))
      else localStorage.removeItem('current_org')
    },
    signIn,
    signUp,
    signOut: () => {
      setUser(null)
      setOrg(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('current_org')
      localStorage.removeItem('pending_org_setup')

      // Clear apiClient token as well
      import('../lib/api').then(({ apiClient }) => {
        apiClient.clearToken()
      })
    },
    getDashboardRoute
  }), [user, org, isLoading])

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
