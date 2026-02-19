import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'
import { apiFetch } from '../api'

function CourseFormModal({ course, onClose, onSuccess }) {
  const isEdit = !!course
  const [name, setName] = useState(course?.name ?? '')
  const [code, setCode] = useState(course?.code ?? '')
  const [baseFee, setBaseFee] = useState(course?.base_fee != null ? course.base_fee : course?.baseFee ?? 0)
  const [isActive, setIsActive] = useState(course?.is_active !== false && course?.isActive !== false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !code.trim()) {
      setError('Name and code are required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (isEdit) {
        const res = await apiFetch(`${API_BASE}/api/v1/courses/${course.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), code: code.trim().toUpperCase(), baseFee: Number(baseFee), isActive }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || data.message || 'Failed to update course')
        }
      } else {
        const res = await apiFetch(`${API_BASE}/api/v1/courses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), code: code.trim().toUpperCase(), baseFee: Number(baseFee), isActive }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || data.detail || data.message || 'Failed to create course')
        }
      }
      onSuccess()
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit course' : 'Add course'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p className="error">{error}</p>}
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Full Stack Dev" required />
          </div>
          <div className="form-group">
            <label>Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. FSD01" required disabled={isEdit} />
            {isEdit && <p className="small">Code cannot be changed.</p>}
          </div>
          <div className="form-group">
            <label>Base fee</label>
            <input type="number" step="0.01" min={0} value={baseFee} onChange={(e) => setBaseFee(e.target.value)} />
          </div>
          <div className="form-group">
            <label>
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Active
            </label>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving…' : (isEdit ? 'Save' : 'Add course')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Courses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editCourse, setEditCourse] = useState(null)

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
        <div className="filters">
          <button type="button" onClick={() => setAddModalOpen(true)} className="btn-primary">Add course</button>
          <button type="button" onClick={fetchCourses} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {addModalOpen && (
        <CourseFormModal
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => { setAddModalOpen(false); fetchCourses() }}
        />
      )}
      {editCourse && (
        <CourseFormModal
          course={editCourse}
          onClose={() => setEditCourse(null)}
          onSuccess={() => { setEditCourse(null); fetchCourses() }}
        />
      )}

      {error && (
        <p className="error">{error} <button type="button" onClick={fetchCourses} className="retry-btn">Retry</button></p>
      )}
      {loading && <p>Loading courses...</p>}

      {!loading && courses.length === 0 && <p className="empty-state">No courses found.</p>}

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
                  <td>{c.base_fee != null ? Number(c.base_fee).toLocaleString() : (c.baseFee != null ? Number(c.baseFee).toLocaleString() : '—')}</td>
                  <td>{c.is_active !== false && c.isActive !== false ? 'Yes' : 'No'}</td>
                  <td>
                    <Link to={`/batches?courseId=${c.id}`}>View batches</Link>
                    {' '}
                    <button type="button" className="btn-link" onClick={() => setEditCourse(c)}>Edit</button>
                    {' '}
                    <button
                      type="button"
                      className="btn-link danger"
                      onClick={async () => {
                        if (!window.confirm(`Delete course "${c.name}"? This fails if it has batches.`)) return
                        try {
                          const res = await apiFetch(`${API_BASE}/api/v1/courses/${c.id}`, { method: 'DELETE' })
                          if (!res.ok) {
                            const data = await res.json().catch(() => ({}))
                            alert(data.error || data.message || 'Delete failed')
                            return
                          }
                          fetchCourses()
                        } catch (e) {
                          alert(e.message)
                        }
                      }}
                    >
                      Delete
                    </button>
                  </td>
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
