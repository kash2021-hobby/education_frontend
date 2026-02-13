import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import HomeDashboard from './pages/HomeDashboard.jsx'
import LeadDashboard from './pages/LeadDashboard.jsx'
import LeadDetail from './pages/LeadDetail.jsx'
import LeadBoard from './pages/LeadBoard.jsx'
import Students from './pages/Students.jsx'
import StudentDetail from './pages/StudentDetail.jsx'
import Batches from './pages/Batches.jsx'
import BatchDetail from './pages/BatchDetail.jsx'
import Courses from './pages/Courses.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <h1>Education CRM</h1>
          <nav>
            <Link to="/">Dashboard</Link>
            <Link to="/leads">Leads</Link>
            <Link to="/students">Students</Link>
            <Link to="/batches">Batches</Link>
            <Link to="/courses">Courses</Link>
          </nav>
        </header>
        <main className="app-main">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<HomeDashboard />} />
            <Route path="/leads" element={<LeadDashboard />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/leads/board" element={<LeadBoard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/batches" element={<Batches />} />
            <Route path="/batches/:id" element={<BatchDetail />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="*" element={<HomeDashboard />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
