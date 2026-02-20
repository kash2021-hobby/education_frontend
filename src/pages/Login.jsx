import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { setAuthToken } from '../auth'
import { Loader2 } from 'lucide-react'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }
      if (data.token) {
        setAuthToken(data.token)
        navigate('/')
      } else {
        throw new Error('No token received from server')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="card relative overflow-hidden">
        <div
          className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-green-500 to-green-700"
          aria-hidden
        />
        <h3 className="mb-6 text-xl font-semibold text-slate-900">Welcome back</h3>
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-green-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
