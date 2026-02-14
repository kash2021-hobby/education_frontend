import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { getAuthToken, clearAuthToken } from '../auth'

function ProtectedLayout() {
  const token = getAuthToken()
  const navigate = useNavigate()

  function handleLogout() {
    clearAuthToken()
    navigate('/login')
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Education CRM</h1>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/leads">Leads</NavLink>
          <NavLink to="/students">Students</NavLink>
          <NavLink to="/batches">Batches</NavLink>
          <NavLink to="/courses">Courses</NavLink>
          <button type="button" onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

export default ProtectedLayout
