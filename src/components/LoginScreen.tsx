import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { Lock, Eye, EyeOff } from 'lucide-react'

export function LoginScreen() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    if (!login(password)) {
      setError('Invalid password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-dork-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-white">D</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dork Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Editorial Workflow Management</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-dork-100 dark:bg-dork-900/30 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-dork-600 dark:text-dork-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Enter Password</h2>
              <p className="text-sm text-gray-500">Stephen's Dashboard</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-dork-500"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-dork-600 hover:bg-dork-700 text-white font-medium rounded-lg transition-colors"
            >
              Access Dashboard
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Dan Harrison - Dork Magazine Editorial System
        </p>
      </div>
    </div>
  )
}
