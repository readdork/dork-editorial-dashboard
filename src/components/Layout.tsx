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
  LogOut,
  Mail
} from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

type UserRole = 'dan' | 'stephen'

interface LayoutProps {
  children: ReactNode
  userRole: UserRole
  onRoleSwitch?: () => void
}

const navItems = [
  { path: '/', label: 'Feed Inbox', icon: Inbox, description: 'Review and approve stories' },
  { path: '/press', label: 'Press Inbox', icon: Mail, description: 'Press releases from Gmail' },
  { path: '/drafts', label: 'Drafts', icon: FileText, description: 'Write and edit articles' },
  { path: '/wordpress', label: 'WordPress', icon: Globe, description: 'Manage published content' },
  { path: '/barry', label: 'Barry Import', icon: Database, description: 'Sync to Barry system' },
]

export function Layout({ children, userRole: _userRole, onRoleSwitch }: LayoutProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleTheme = () => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }

  const userName = 'Stephen Ackroyd'
  const userTitle = 'Editor'

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="editor-container">
          <div className="h-14 flex items-center justify-between gap-4">
            {/* Left side */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <Link to="/" className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-dork-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">D</span>
                </div>
                <div className="hidden sm:block">
                  <span className="font-bold text-lg text-dork-600 dark:text-dork-400">DORK</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Editorial</span>
                </div>
              </Link>
            </div>

            {/* Center - Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`nav-link ${isActive ? 'nav-link-active' : 'nav-link-inactive'}`}
                    title={item.description}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {resolvedTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

              <button
                onClick={onRoleSwitch}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dork-50 dark:bg-dork-900/30 text-dork-700 dark:text-dork-300 text-sm font-medium hover:bg-dork-100 dark:hover:bg-dork-900/50 transition-colors"
                title="Logout"
              >
                <span className="hidden sm:inline">Stephen</span>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-14 z-40 bg-white dark:bg-gray-900">
          <div className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    isActive 
                      ? 'bg-dork-50 text-dork-700 dark:bg-dork-900/30 dark:text-dork-300' 
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div>
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
                  </div>
                </Link>
              )
            })}

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="px-4 py-3">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{userTitle}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 py-6">
        <div className="editor-container animate-in">
          {children}
        </div>
      </main>
    </div>
  )
}
