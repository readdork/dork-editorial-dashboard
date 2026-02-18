import { useState, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Inbox, 
  FileText, 
  Globe, 
  Database, 
  Moon, 
  Sun, 
  Menu,
  X,
  LogOut
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

type UserRole = 'dan' | 'stephen'

interface LayoutProps {
  children: ReactNode
  userRole: UserRole
  onRoleSwitch?: () => void
}

const navItems = [
  { path: '/', label: 'Feed Inbox', icon: Inbox },
  { path: '/drafts', label: 'Draft Queue', icon: FileText },
  { path: '/wordpress', label: 'WordPress', icon: Globe },
  { path: '/barry', label: 'Barry Import', icon: Database },
]

export function Layout({ children, userRole, onRoleSwitch }: LayoutProps) {
  const { setTheme, resolvedTheme } = useTheme()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-accent"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            
            <Link to="/" className="flex items-center gap-2">
              <span className="font-bold text-xl text-dork-600 dark:text-dork-400">DORK</span>
              <span className="text-sm text-muted-foreground hidden sm:inline">Editorial Dashboard</span>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-accent"
              title="Toggle theme"
            >
              {resolvedTheme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <button
              onClick={onRoleSwitch}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-dork-100 dark:bg-dork-900 text-dork-700 dark:text-dork-300 text-sm font-medium hover:bg-dork-200 dark:hover:bg-dork-800"
            >
              <span>{userRole === 'dan' ? 'Dan' : 'Stephen'}</span>
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className={`
            fixed lg:static inset-y-0 left-0 z-40 w-64 bg-background border-r border-border lg:border-0
            transform transition-transform duration-200 ease-in-out lg:transform-none
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            pt-20 lg:pt-0 px-4 lg:px-0
          `}>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-dork-100 text-dork-700 dark:bg-dork-900 dark:text-dork-300' 
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div className="mt-8 p-4 rounded-lg bg-muted">
              <p className="text-xs text-muted-foreground mb-2">Logged in as:</p>
              <p className="text-sm font-medium">{userRole === 'dan' ? 'Dan Harrison' : 'Stephen Ackroyd'}</p>
              <p className="text-xs text-muted-foreground">{userRole === 'dan' ? 'AI Deputy Editor' : 'Editor'}</p>
            </div>
          </aside>

          {/* Overlay for mobile */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
