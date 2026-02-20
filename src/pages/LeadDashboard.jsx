import { useEffect, useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../api'
import { formatDateTime } from '../utils/date'
import { TableSkeleton } from '../components/Skeleton'
import { leadStatusBadge } from '../utils/badges'
import { useSearch } from '../contexts/SearchContext'
import { UserPlus, RefreshCw, LayoutGrid, ExternalLink } from 'lucide-react'
import clsx from 'clsx'

function LeadDashboard() {
  const { searchValue } = useSearch()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFromUrl = searchParams.get('status') || ''
  const assignedToFromUrl = searchParams.get('assignedTo') || ''

  const [leads, setLeads] = useState([])
  const [total, setTotal] = useState(0)
  const [users, setUsers] = useState([])
  const [statusFilter, setStatusFilter] = useState(statusFromUrl)
  const [assignedToFilter, setAssignedToFilter] = useState(assignedToFromUrl)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [ingestModalOpen, setIngestModalOpen] = useState(false)
  const [ingestForm, setIngestForm] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    course_interest: '',
    source: 'WEBSITE',
    counselorId: '',
  })
  const [ingestSubmitting, setIngestSubmitting] = useState(false)
  const [ingestMessage, setIngestMessage] = useState('')
  const [ingestError, setIngestError] = useState(false)

  async function fetchUsers() {
    try {
      const res = await apiFetch('/api/v1/users')
      if (!res.ok) return
      const json = await res.json()
      setUsers(json.data || [])
    } catch (_) {}
  }

  async function fetchLeads() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (assignedToFilter) params.append('assignedTo', assignedToFilter)
      params.append('page', String(page))
      params.append('pageSize', String(pageSize))
      const res = await apiFetch(`/api/v1/leads?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch leads')
      const json = await res.json()
      setLeads(json.data || [])
      setTotal(Number(json.total) ?? 0)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    setStatusFilter(statusFromUrl)
    setAssignedToFilter(assignedToFromUrl)
  }, [statusFromUrl, assignedToFromUrl])

  useEffect(() => {
    fetchLeads()
  }, [statusFilter, assignedToFilter, page, pageSize])

  function updateUrlFilters(status, assignedTo) {
    const next = new URLSearchParams(searchParams)
    if (status) next.set('status', status)
    else next.delete('status')
    if (assignedTo) next.set('assignedTo', assignedTo)
    else next.delete('assignedTo')
    next.delete('page')
    setSearchParams(next)
  }

  const filteredLeads = useMemo(() => {
    const q = (searchValue || '').trim().toLowerCase()
    if (!q) return leads
    return leads.filter(
      (l) =>
        (l.full_name || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q) ||
        (l.phone_number || '').toLowerCase().includes(q)
    )
  }, [leads, searchValue])

  async function handleIngest(e) {
    e.preventDefault()
    if (!ingestForm.email?.trim() && !ingestForm.phone_number?.trim()) {
      setIngestMessage('Email or phone is required')
      return
    }
    setIngestSubmitting(true)
    setIngestMessage('')
    setIngestError(false)
    try {
      const res = await apiFetch('/api/v1/leads/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: ingestForm.full_name?.trim() || 'Unknown',
          email: ingestForm.email?.trim() || null,
          phone_number: ingestForm.phone_number?.trim() || null,
          course_interest: ingestForm.course_interest?.trim() || null,
          source: ingestForm.source?.trim() || 'WEBSITE',
          counselorId: ingestForm.counselorId || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ingest failed')
      setIngestError(false)
      setIngestMessage(data.message || 'Lead added.')
      setIngestForm({
        full_name: '',
        email: '',
        phone_number: '',
        course_interest: '',
        source: 'WEBSITE',
        counselorId: '',
      })
      fetchLeads()
    } catch (e) {
      setIngestError(true)
      setIngestMessage(e.message)
    } finally {
      setIngestSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">Leads</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Link to="/leads/board" className="btn-secondary flex min-h-[44px] items-center gap-2 no-underline">
            <LayoutGrid className="h-4 w-4" />
            Board view
          </Link>
          <select
            value={statusFilter}
            onChange={(e) => {
              const v = e.target.value
              setStatusFilter(v)
              setPage(1)
              updateUrlFilters(v, assignedToFilter)
            }}
            className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="">All statuses</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="COLD">COLD</option>
            <option value="REJECTED">REJECTED</option>
            <option value="LOST">LOST</option>
          </select>
          <select
            value={assignedToFilter}
            onChange={(e) => {
              const v = e.target.value
              setAssignedToFilter(v)
              setPage(1)
              updateUrlFilters(statusFilter, v)
            }}
            className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="">All assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="min-h-[44px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <button type="button" onClick={() => setIngestModalOpen(true)} className="btn-primary flex min-h-[44px] items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Add lead
          </button>
          <button type="button" onClick={fetchLeads} className="btn-secondary flex min-h-[44px] items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {loading && <TableSkeleton rows={10} cols={8} />}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error} <button type="button" onClick={fetchLeads} className="btn-link ml-2">Retry</button>
        </div>
      )}

      {!loading && !error && leads.length === 0 && (
        <p className="text-sm text-slate-500">No leads found. Relax or check your filters.</p>
      )}

      {!loading && leads.length > 0 && filteredLeads.length === 0 && searchValue?.trim() && (
        <p className="text-sm text-slate-500">No leads match &quot;{searchValue.trim()}&quot;. Try a different search.</p>
      )}

      {!loading && leads.length > 0 && (filteredLeads.length > 0 || !searchValue?.trim()) && (
        <>
          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{lead.full_name}</p>
                  <span className={clsx('mt-1 inline-block', 'badge', leadStatusBadge(lead.status))}>
                    {lead.status}
                  </span>
                </div>
                <Link
                  to={`/leads/${lead.id}`}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Counselor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Created</th>
                  <th className="w-20 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    className={clsx('border-b border-slate-100 last:border-0', idx % 2 === 1 && 'bg-slate-50/50')}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{lead.full_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{lead.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{lead.phone_number}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('badge', leadStatusBadge(lead.status))}>{lead.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{lead.source}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{lead.counselor_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDateTime(lead.created_at)}</td>
                    <td className="px-4 py-3">
                      <Link to={`/leads/${lead.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-green-600 hover:underline">
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex min-h-[44px] items-center gap-4">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn-secondary min-h-[44px] disabled:opacity-50">
              Previous
            </button>
            <span className="text-sm text-slate-600">Page {page} of {total === 0 ? 1 : Math.ceil(total / pageSize)}</span>
            <button type="button" disabled={total > 0 && page >= Math.ceil(total / pageSize)} onClick={() => setPage((p) => p + 1)} className="btn-secondary min-h-[44px] disabled:opacity-50">
              Next
            </button>
          </div>
        </>
      )}

      {ingestModalOpen && (
        <div className="modal-overlay" onClick={() => setIngestModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add lead</h3>
              <button type="button" className="modal-close" onClick={() => setIngestModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleIngest}>
              <p className="mb-4 text-sm text-slate-500">At least one of email or phone is required.</p>
              {ingestMessage && <p className={ingestError ? 'mb-4 text-sm text-red-600' : 'mb-4 text-sm text-emerald-600'}>{ingestMessage}</p>}
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={ingestForm.full_name}
                  onChange={(e) => setIngestForm((f) => ({ ...f, full_name: e.target.value }))}
                  placeholder="Full name"
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={ingestForm.email}
                  onChange={(e) => setIngestForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={ingestForm.phone_number}
                  onChange={(e) => setIngestForm((f) => ({ ...f, phone_number: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
              <div className="form-group">
                <label>Course interest</label>
                <input
                  type="text"
                  value={ingestForm.course_interest}
                  onChange={(e) => setIngestForm((f) => ({ ...f, course_interest: e.target.value }))}
                  placeholder="e.g. FSD-2024"
                />
              </div>
              <div className="form-group">
                <label>Counselor (optional)</label>
                <select
                  value={ingestForm.counselorId}
                  onChange={(e) => setIngestForm((f) => ({ ...f, counselorId: e.target.value }))}
                >
                  <option value="">Auto-assign counselor</option>
                  {users
                    .filter((u) => u.role === 'COUNSELOR')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name}
                      </option>
                    ))}
                </select>
                <p className="small">
                  If you leave this empty, the system will auto-assign a counselor based on availability.
                </p>
              </div>
              <div className="form-group">
                <label>Source</label>
                <select
                  value={ingestForm.source}
                  onChange={(e) => setIngestForm((f) => ({ ...f, source: e.target.value }))}
                >
                  <option value="WEBSITE">WEBSITE</option>
                  <option value="REFERRAL">REFERRAL</option>
                  <option value="WALK_IN">WALK_IN</option>
                  <option value="SOCIAL">SOCIAL</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setIngestModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={ingestSubmitting} className="btn-primary">
                  {ingestSubmitting ? 'Adding…' : 'Add lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadDashboard
