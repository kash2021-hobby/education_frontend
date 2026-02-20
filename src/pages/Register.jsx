import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../api'
import { Loader2 } from 'lucide-react'

function Register() {
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await apiFetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          password,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed')
      }
      setSuccess('Registration successful. You can now log in.')
      setFullName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setTimeout(() => {
        navigate('/login')
      }, 800)
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
        <h3 className="mb-6 text-xl font-semibold text-slate-900">Create account</h3>
        {error && (
          <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        )}
        {success && (
          <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {success}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>
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
          <div className="form-group">
            <label>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering…
                </>
              ) : (
                'Register'
              )}
            </button>
          </div>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-green-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
