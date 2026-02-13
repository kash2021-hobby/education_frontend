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
        <button type="button" onClick={fetchCourses}>Refresh</button>
      </div>

      {error && (
        <p className="error">{error} <button type="button" onClick={fetchCourses} className="retry-btn">Retry</button></p>
      )}
      {loading && <p>Loading courses...</p>}

      {!loading && courses.length === 0 && <p>No courses found.</p>}

      {!loading && courses.length > 0 && (
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
                <td>{c.is_active ? 'Yes' : 'No'}</td>
                <td>
                  <Link to={`/batches?courseId=${c.id}`}>View batches</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default Courses
