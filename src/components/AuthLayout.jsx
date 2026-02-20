import { Navigate, Link } from 'react-router-dom'
import { getAuthToken } from '../auth'
import { LayoutGrid } from 'lucide-react'

function AuthLayout({ children }) {
  const token = getAuthToken()

  if (token) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-slate-900">
            <LayoutGrid className="h-6 w-6 text-green-600" />
            Education CRM
          </Link>
          <nav className="flex gap-2">
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Login</Link>
            <Link to="/register" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900">Register</Link>
          </nav>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}

export default AuthLayout
