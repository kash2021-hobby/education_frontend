import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import ProtectedLayout from './components/ProtectedLayout.jsx'
import AuthLayout from './components/AuthLayout.jsx'
import HomeDashboard from './pages/HomeDashboard.jsx'
import LeadDashboard from './pages/LeadDashboard.jsx'
import LeadDetail from './pages/LeadDetail.jsx'
import LeadBoard from './pages/LeadBoard.jsx'
import Students from './pages/Students.jsx'
import StudentDetail from './pages/StudentDetail.jsx'
import Batches from './pages/Batches.jsx'
import BatchDetail from './pages/BatchDetail.jsx'
import Courses from './pages/Courses.jsx'
import Attendance from './pages/Attendance.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          }
        />
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomeDashboard />} />
          <Route path="/leads" element={<LeadDashboard />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/leads/board" element={<LeadBoard />} />
          <Route path="/students" element={<Students />} />
          <Route path="/students/:id" element={<StudentDetail />} />
          <Route path="/batches" element={<Batches />} />
          <Route path="/batches/:id" element={<BatchDetail />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/attendance" element={<Attendance />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
