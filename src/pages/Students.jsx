import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_BASE } from '../config'
import AddStudentModal from '../components/AddStudentModal'
import { TableSkeleton } from '../components/Skeleton'
import { useSearch } from '../contexts/SearchContext'
import { formatDate } from '../utils/date'
import { studentStatusBadge } from '../utils/badges'
import { UserPlus, RefreshCw, ChevronDown, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

function Students() {
  const { searchValue } = useSearch()
  const [searchParams, setSearchParams] = useSearchParams()
  const batchIdFromUrl = searchParams.get('batchId') || ''
  const statusFromUrl = searchParams.get('status') || ''

  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [batches, setBatches] = useState([])
  const [batchFilter, setBatchFilter] = useState(batchIdFromUrl)
  const [statusFilter, setStatusFilter] = useState(statusFromUrl)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [paymentSort, setPaymentSort] = useState('')
  const [actionMenuId, setActionMenuId] = useState(null)

  async function fetchBatches() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/batches`)
      if (!res.ok) return
      const json = await res.json()
      setBatches(json.data || [])
    } catch (_) {}
  }

  async function fetchStudents() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (batchFilter) params.append('batchId', batchFilter)
      if (statusFilter) params.append('status', statusFilter)
      params.append('page', String(page))
      params.append('pageSize', String(pageSize))
      const res = await fetch(`${API_BASE}/api/v1/students?${params.toString()}`)
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = json.detail || json.error || json.message || 'Failed to fetch students'
        throw new Error(msg)
      }
      const list = Array.isArray(json.data) ? json.data : (json.students || [])
      setStudents(list)
      setTotal(Number(json.total) ?? list.length)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  useEffect(() => {
    setBatchFilter(batchIdFromUrl)
    setStatusFilter(statusFromUrl)
  }, [batchIdFromUrl, statusFromUrl])

  useEffect(() => {
    fetchStudents()
  }, [batchFilter, statusFilter, page, pageSize])

  function updateUrlFilters(batchId, status) {
    const next = new URLSearchParams(searchParams)
    if (batchId) next.set('batchId', batchId)
    else next.delete('batchId')
    if (status) next.set('status', status)
    else next.delete('status')
    next.delete('page')
    setSearchParams(next)
  }

  const sortedStudents = useMemo(() => {
    const list = [...students].sort((a, b) => {
      if (!paymentSort) return 0
      const da = a.next_fee_payment_date ? new Date(a.next_fee_payment_date).getTime() : null
      const db = b.next_fee_payment_date ? new Date(b.next_fee_payment_date).getTime() : null
      if (da == null && db == null) return 0
      if (da == null) return 1
      if (db == null) return -1
      if (paymentSort === 'ASC') return da - db
      if (paymentSort === 'DESC') return db - da
      return 0
    })
    const q = (searchValue || '').trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (s) =>
        (s.lead_name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q) ||
        (s.enrollment_number || '').toLowerCase().includes(q)
    )
  }, [students, paymentSort, searchValue])

  return (
    <div className="space-y-6 px-0 md:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Students</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="btn-primary flex min-h-[44px] items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add student
          </button>
          <select
            value={batchFilter}
            onChange={(e) => {
              const v = e.target.value
              setBatchFilter(v)
              setPage(1)
              updateUrlFilters(v, statusFilter)
            }}
            className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="">All batches</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              const v = e.target.value
              setStatusFilter(v)
              setPage(1)
              updateUrlFilters(batchFilter, v)
            }}
            className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DROPPED">DROPPED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <select
            value={paymentSort}
            onChange={(e) => setPaymentSort(e.target.value)}
            className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="">Next payment: default</option>
            <option value="ASC">Next payment: earliest first</option>
            <option value="DESC">Next payment: latest first</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPage(1)
            }}
            className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <button type="button" onClick={fetchStudents} className="btn-secondary flex min-h-[44px] items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {addModalOpen && (
        <AddStudentModal
          onClose={() => setAddModalOpen(false)}
          onSuccess={() => {
            setAddModalOpen(false)
            fetchStudents()
          }}
        />
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
          <button type="button" onClick={fetchStudents} className="btn-link ml-2">
            Retry
          </button>
        </div>
      )}

      {loading && <TableSkeleton rows={10} cols={9} />}

      {!loading && !error && (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {sortedStudents.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-500">
                {searchValue?.trim() ? `No students match "${searchValue.trim()}".` : 'No students found.'}
              </p>
            )}
            {sortedStudents.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{s.lead_name}</p>
                  <span className={clsx('mt-1 inline-block', 'badge', studentStatusBadge(s.status))}>
                    {s.status}
                  </span>
                </div>
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setActionMenuId(actionMenuId === s.id ? null : s.id)}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                    aria-label="Actions"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {actionMenuId === s.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActionMenuId(null)}
                        aria-hidden
                      />
                      <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                        <Link
                          to={`/students/${s.id}`}
                          onClick={() => setActionMenuId(null)}
                          className="flex min-h-[44px] items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Enrollment #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Batch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Enrolled
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Next payment
                  </th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {sortedStudents.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-sm text-slate-500">
                      {searchValue?.trim() ? `No students match "${searchValue.trim()}".` : 'No students found.'}
                    </td>
                  </tr>
                )}
                {sortedStudents.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={clsx(
                      'group border-b border-slate-100 last:border-0',
                      idx % 2 === 1 && 'bg-slate-50/50'
                    )}
                  >
                    <td className="px-4 py-3 text-sm text-slate-900">{s.enrollment_number}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{s.lead_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{s.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{s.course_name || s.course_code || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{s.batch_name}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge', studentStatusBadge(s.status))}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(s.enrollment_date)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {s.next_fee_payment_date || s.next_fee_payment_amount != null ? (
                        <span>
                          {formatDate(s.next_fee_payment_date)}
                          {s.next_fee_payment_amount != null && (
                            <span className="block text-xs text-slate-500">
                              ₹{Number(s.next_fee_payment_amount).toLocaleString()}
                            </span>
                          )}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="relative px-4 py-3">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActionMenuId(actionMenuId === s.id ? null : s.id)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Actions"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                        {actionMenuId === s.id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActionMenuId(null)}
                              aria-hidden
                            />
                            <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                              <Link
                                to={`/students/${s.id}`}
                                onClick={() => setActionMenuId(null)}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex min-h-[44px] items-center gap-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="btn-secondary min-h-[44px] disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {page} of {total === 0 ? 1 : Math.ceil(total / pageSize)}
            </span>
            <button
              type="button"
              disabled={total > 0 && page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
              className="btn-secondary min-h-[44px] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Students
