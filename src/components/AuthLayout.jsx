import { Navigate, Link } from 'react-router-dom'
import { getAuthToken } from '../auth'

function AuthLayout({ children }) {
  const token = getAuthToken()

  if (token) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="app-shell auth-layout">
      <header className="app-header auth-header">
        <h1>Education CRM</h1>
        <nav>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </nav>
      </header>
      <main className="app-main">
        {children}
      </main>
    </div>
  )
}

export default AuthLayout
