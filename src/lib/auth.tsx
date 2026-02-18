import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

const PASSWORD = 'Sxmvzv126126!'

interface AuthContextType {
  isAuthenticated: boolean
  login: (password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('dork_auth') === 'stephen') {
      setIsAuthenticated(true)
    }
  }, [])

  function login(password: string): boolean {
    if (password === PASSWORD) {
      setIsAuthenticated(true)
      localStorage.setItem('dork_auth', 'stephen')
      return true
    }
    return false
  }

  function logout() {
    setIsAuthenticated(false)
    localStorage.removeItem('dork_auth')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
