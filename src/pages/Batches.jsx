import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_BASE } from '../config'
import { apiFetch } from '../api'
import { formatDate } from '../utils/date'

function BatchFormModal({ batch, courses, onClose, onSuccess }) {
  const isEdit = !!batch
  const [courseId, setCourseId] = useState(batch?.course_id ?? (courses[0]?.id ?? ''))
  const [name, setName] = useState(batch?.name ?? '')
  const [startDate, setStartDate] = useState(batch?.start_date ? batch.start_date.slice(0, 10) : '')
  const [maxSeats, setMaxSeats] = useState(batch?.max_seats ?? 30)
  const [status, setStatus] = useState(batch?.status ?? 'OPEN')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    if (!isEdit && (!courseId || !startDate || maxSeats == null)) {
      setError('Course, start date and max seats are required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (isEdit) {
        const res = await apiFetch(`${API_BASE}/api/v1/batches/${batch.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name.trim(), startDate: startDate || undefined, maxSeats: Number(maxSeats), status }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || data.message || 'Failed to update batch')
        }
      } else {
        const res = await apiFetch(`${API_BASE}/api/v1/batches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, name: name.trim(), startDate, maxSeats: Number(maxSeats), status }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || data.message || data.detail || 'Failed to create batch')
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
          <h3>{isEdit ? 'Edit batch' : 'Add batch'}</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <p className="error">{error}</p>}
          {!isEdit && (
            <div className="form-group">
              <label>Course</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group">
            <label>Batch name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Batch 1" required />
          </div>
          <div className="form-group">
            <label>Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required={!isEdit} />
          </div>
          <div className="form-group">
            <label>Max seats</label>
            <input type="number" min={1} value={maxSeats} onChange={(e) => setMaxSeats(Number(e.target.value))} required />
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="OPEN">OPEN</option>
              <option value="FULL">FULL</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="COMPLETED">COMPLETED</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Saving…' : (isEdit ? 'Save' : 'Add batch')}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Batches() {
  const [searchParams] = useSearchParams()
  const courseIdFromUrl = searchParams.get('courseId') || ''

  const [batches, setBatches] = useState([])
  const [courses, setCourses] = useState([])
  const [courseFilter, setCourseFilter] = useState(courseIdFromUrl)
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [editBatch, setEditBatch] = useState(null)

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
            <option value="OPEN">OPEN</option>
            <option value="FULL">FULL</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <button type="button" onClick={() => setAddModalOpen(true)} className="btn-primary">Add batch</button>
          <button type="button" onClick={fetchBatches} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {addModalOpen && (
        <BatchFormModal
          courses={courses}
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => { setAddModalOpen(false); fetchBatches() }}
        />
      )}
      {editBatch && (
        <BatchFormModal
          batch={editBatch}
          courses={courses}
          onClose={() => setEditBatch(null)}
          onSuccess={() => { setEditBatch(null); fetchBatches() }}
        />
      )}

      {error && (
        <p className="error">{error} <button type="button" onClick={fetchBatches} className="retry-btn">Retry</button></p>
      )}
      {loading && <p>Loading batches...</p>}

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
                <td>{b.status}</td>
                <td>{b.current_enrollment} / {b.max_seats}</td>
                <td>{formatDate(b.start_date)}</td>
                <td>
                  <Link to={`/batches/${b.id}`}>Open</Link>
                  {' '}
                  <button type="button" className="btn-link" onClick={() => setEditBatch(b)}>Edit</button>
                  {' '}
                  <button
                    type="button"
                    className="btn-link danger"
                    onClick={async () => {
                      if (!window.confirm(`Delete batch "${b.name}"? This fails if any students are enrolled.`)) return
                      try {
                        const res = await apiFetch(`${API_BASE}/api/v1/batches/${b.id}`, { method: 'DELETE' })
                        if (!res.ok) {
                          const data = await res.json().catch(() => ({}))
                          alert(data.error || data.message || 'Delete failed')
                          return
                        }
                        fetchBatches()
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

export default Batches
