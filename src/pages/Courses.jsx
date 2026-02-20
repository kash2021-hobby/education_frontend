import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'
import { apiFetch } from '../api'
import { TableSkeleton } from '../components/Skeleton'
import { toast } from 'sonner'
import { Plus, RefreshCw, ExternalLink, Pencil, Trash2 } from 'lucide-react'
import clsx from 'clsx'

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
        toast.success('Course updated')
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
        toast.success('Course created')
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
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Full Stack Dev" required />
          </div>
          <div className="form-group">
            <label>Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. FSD01" required disabled={isEdit} />
            {isEdit && <p className="mt-1 text-xs text-slate-500">Code cannot be changed.</p>}
          </div>
          <div className="form-group">
            <label>Base fee</label>
            <input type="number" step="0.01" min={0} value={baseFee} onChange={(e) => setBaseFee(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
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

  async function handleDelete(c) {
    if (!window.confirm(`Delete course "${c.name}"? This fails if it has batches.`)) return
    try {
      const res = await apiFetch(`${API_BASE}/api/v1/courses/${c.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || data.message || 'Delete failed')
        return
      }
      toast.success('Course deleted')
      fetchCourses()
    } catch (e) {
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Courses</h2>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAddModalOpen(true)} className="btn-primary flex min-h-[44px] items-center gap-2">
            <Plus className="h-4 w-4" />
            Add course
          </button>
          <button type="button" onClick={fetchCourses} className="btn-secondary flex min-h-[44px] items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
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
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error} <button type="button" onClick={fetchCourses} className="btn-link ml-2">Retry</button>
        </div>
      )}
      {loading && <TableSkeleton rows={6} cols={5} />}

      {!loading && courses.length === 0 && !error && (
        <p className="text-sm text-slate-500">No courses found.</p>
      )}

      {!loading && courses.length > 0 && (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {courses.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-500">{c.code}</p>
                </div>
                <Link
                  to={`/batches?courseId=${c.id}`}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Base fee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Active</th>
                <th className="w-40 px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {courses.map((c, idx) => (
                <tr
                  key={c.id}
                  className={clsx('border-b border-slate-100 last:border-0', idx % 2 === 1 && 'bg-slate-50/50')}
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.code}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {c.base_fee != null ? Number(c.base_fee).toLocaleString() : (c.baseFee != null ? Number(c.baseFee).toLocaleString() : '—')}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{c.is_active !== false && c.isActive !== false ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/batches?courseId=${c.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View batches
                      </Link>
                      <button type="button" className="btn-ghost p-1 text-slate-500 hover:text-slate-700" onClick={() => setEditCourse(c)}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" className="btn-ghost p-1 text-red-500 hover:text-red-700" onClick={() => handleDelete(c)}>
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

export default Courses
