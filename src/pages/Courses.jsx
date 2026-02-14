import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'

function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchCourses() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/v1/courses`)
      if (!res.ok) throw new Error('Failed to fetch courses')
      const json = await res.json()
      setCourses(json.data || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <h2>Courses</h2>
        <div className="toolbar">
          <button type="button" onClick={fetchCourses} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {error && (
        <p className="error">{error} <button type="button" onClick={fetchCourses} className="retry-btn">Retry</button></p>
      )}
      {loading && <p className="small">Loading courses…</p>}

      {!loading && courses.length === 0 && (
        <div className="section"><p className="empty-state">No courses found.</p></div>
      )}

      {!loading && courses.length > 0 && (
        <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Code</th>
              <th>Base fee</th>
              <th>Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.code}</td>
                <td>{c.base_fee != null ? Number(c.base_fee).toLocaleString() : '—'}</td>
                <td>{c.is_active ? <span className="badge badge-active">Active</span> : <span className="badge badge-dropped">Inactive</span>}</td>
                <td><Link to={`/batches?courseId=${c.id}`}>View batches</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  )
}

export default Courses
