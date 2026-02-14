import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_BASE } from '../config'
import { batchStatusBadge } from '../utils/badges'

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
        <div className="toolbar">
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
            <option value="OPEN">OPEN</option>
            <option value="FULL">FULL</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <button type="button" onClick={fetchBatches} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {error && (
        <p className="error">{error} <button type="button" onClick={fetchBatches} className="retry-btn">Retry</button></p>
      )}
      {loading && <p className="small">Loading batches…</p>}

      {!loading && (
        <div className="table-wrapper">
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
              <tr><td colSpan={6} className="empty-state">No batches found.</td></tr>
            )}
            {batches.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>{b.course_name}</td>
                <td><span className={`badge ${batchStatusBadge(b.status)}`}>{b.status}</span></td>
                <td>{b.current_enrollment} / {b.max_seats}</td>
                <td>{b.start_date ? new Date(b.start_date).toLocaleDateString() : '—'}</td>
                <td><Link to={`/batches/${b.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

export default Batches
