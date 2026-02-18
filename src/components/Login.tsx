import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { Lock } from 'lucide-react'

export function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!login(password)) {
      setError('Wrong password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="p-8 border rounded-lg w-full max-w-sm">
        <div className="flex justify-center mb-4">
          <Lock className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-6">Dork Dashboard</h1>
        
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full border p-3 rounded mb-3"
          autoFocus
        />
        
        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        
        <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded">
          Enter
        </button>
      </form>
    </div>
  )
}
