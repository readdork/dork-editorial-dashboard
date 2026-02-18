import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  userRole: 'stephen' | null
  login: (password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STEPHEN_PASSWORD = 'Sxmvzv126126!'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userRole, setUserRole] = useState<'stephen' | null>(null)

  useEffect(() => {
    // Check if already logged in
    const auth = localStorage.getItem('dork_auth')
    if (auth === 'stephen') {
      setIsAuthenticated(true)
      setUserRole('stephen')
    }
  }, [])

  function login(password: string): boolean {
    if (password === STEPHEN_PASSWORD) {
      setIsAuthenticated(true)
      setUserRole('stephen')
      localStorage.setItem('dork_auth', 'stephen')
      return true
    }
    return false
  }

  function logout() {
    setIsAuthenticated(false)
    setUserRole(null)
    localStorage.removeItem('dork_auth')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
