import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_BASE } from '../config'
import { apiFetch } from '../api'
import { formatDate } from '../utils/date'
import { batchStatusBadge } from '../utils/badges'
import { TableSkeleton } from '../components/Skeleton'
import { toast } from 'sonner'
import { Plus, RefreshCw, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import clsx from 'clsx'

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
        toast.success('Batch updated')
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
        toast.success('Batch created')
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
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
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

  async function handleDelete(b) {
    if (!window.confirm(`Delete batch "${b.name}"? This fails if any students are enrolled.`)) return
    try {
      const res = await apiFetch(`${API_BASE}/api/v1/batches/${b.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || data.message || 'Delete failed')
        return
      }
      toast.success('Batch deleted')
      fetchBatches()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Batches</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="">All statuses</option>
            <option value="OPEN">OPEN</option>
            <option value="FULL">FULL</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <button type="button" onClick={() => setAddModalOpen(true)} className="btn-primary flex min-h-[44px] items-center gap-2">
            <Plus className="h-4 w-4" />
            Add batch
          </button>
          <button type="button" onClick={fetchBatches} className="btn-secondary flex min-h-[44px] items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error} <button type="button" onClick={fetchBatches} className="btn-link ml-2">Retry</button>
        </div>
      )}
      {loading && <TableSkeleton rows={8} cols={6} />}

      {!loading && (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {batches.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">No batches found.</p>
            )}
            {batches.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{b.name}</p>
                  <span className={clsx('mt-1 inline-block', 'badge', batchStatusBadge(b.status))}>
                    {b.status}
                  </span>
                </div>
                <Link
                  to={`/batches/${b.id}`}
                  className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-green-600 hover:bg-green-50"
                >
                  <ExternalLink className="h-5 w-5" />
                </Link>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Batch</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Course</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Seats</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Start</th>
                <th className="w-32 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {batches.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">No batches found.</td>
                </tr>
              )}
              {batches.map((b, idx) => (
                <tr
                  key={b.id}
                  className={clsx('border-b border-slate-100 last:border-0', idx % 2 === 1 && 'bg-slate-50/50')}
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{b.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{b.course_name}</td>
                  <td className="px-4 py-3">
                    <span className={clsx('badge', batchStatusBadge(b.status))}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{b.current_enrollment} / {b.max_seats}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{formatDate(b.start_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/batches/${b.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Link>
                      <button
                        type="button"
                        className="btn-ghost p-1 text-slate-500 hover:text-slate-700"
                        onClick={() => setEditBatch(b)}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="btn-ghost p-1 text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(b)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}

export default Batches
