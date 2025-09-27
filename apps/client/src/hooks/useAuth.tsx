import React, { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type Org = { id: string; name: string; slug?: string }
type User = { id: string; email: string; firstName?: string; lastName?: string; role?: string; organizationId?: string }

type AuthContextType = {
  user: User | null
  org: Org | null
  isLoading: boolean
  setOrg: (org: Org | null) => void
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [org, setOrg] = useState<Org | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing auth on mount
    const storedUser = localStorage.getItem('user')
    const storedOrg = localStorage.getItem('current_org')

    if (storedUser) {
      setUser(JSON.parse(storedUser))
      if (storedOrg) setOrg(JSON.parse(storedOrg))
    }

    setIsLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    // Mock authentication - replace with real API call
    if (email && password) {
      const mockUser: User = {
        id: '1',
        email: email,
        firstName: email.split('@')[0],
        role: 'admin',
        organizationId: 'org-1'
      }

      const mockOrg: Org = {
        id: 'org-1',
        name: 'Acme Corporation',
        slug: 'acme-corp'
      }

      setUser(mockUser)
      setOrg(mockOrg)

      localStorage.setItem('auth_token', 'mock-token-123')
      localStorage.setItem('user', JSON.stringify(mockUser))
      localStorage.setItem('current_org', JSON.stringify(mockOrg))
    } else {
      throw new Error('Please enter valid credentials')
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
    signOut: () => {
      setUser(null)
      setOrg(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      localStorage.removeItem('current_org')
    }
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

