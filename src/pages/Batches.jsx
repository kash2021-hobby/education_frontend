import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_BASE } from '../config'

function Batches() {
  const [searchParams] = useSearchParams()
  const courseIdFromUrl = searchParams.get('courseId') || ''

  const [batches, setBatches] = useState([])
  const [courses, setCourses] = useState([])
  const [courseFilter, setCourseFilter] = useState(courseIdFromUrl)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchCourses() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/courses`)
      if (!res.ok) return
      const json = await res.json()
      setCourses(json.data || [])
    } catch (_) {}
  }

  async function fetchBatches() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (courseFilter) params.append('courseId', courseFilter)
      if (statusFilter) params.append('status', statusFilter)
      const res = await fetch(`${API_BASE}/api/v1/batches?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch batches')
      const json = await res.json()
      setBatches(json.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  useEffect(() => {
    setCourseFilter(courseIdFromUrl)
  }, [courseIdFromUrl])

  useEffect(() => {
    fetchBatches()
  }, [courseFilter, statusFilter])

  return (
    <div className="page">
      <div className="page-header">
        <h2>Batches</h2>
        <div className="filters">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="UPCOMING">UPCOMING</option>
            <option value="ONGOING">ONGOING</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <button type="button" onClick={fetchBatches}>Refresh</button>
        </div>
      </div>

      {error && (
        <p className="error">{error} <button type="button" onClick={fetchBatches} className="retry-btn">Retry</button></p>
      )}
      {loading && <p>Loading batches...</p>}

      {!loading && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Course</th>
              <th>Status</th>
              <th>Seats</th>
              <th>Start</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {batches.length === 0 && (
              <tr><td colSpan={6}>No batches found.</td></tr>
            )}
            {batches.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.course_name}</td>
                <td>{b.status}</td>
                <td>{b.current_enrollment} / {b.max_seats}</td>
                <td>{b.start_date ? new Date(b.start_date).toLocaleDateString() : '—'}</td>
                <td>
                  <Link to={`/batches/${b.id}`}>Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Batches
