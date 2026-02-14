import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { apiFetch } from '../api'
import { leadStatusBadge } from '../utils/badges'

function LeadDashboard() {
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
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Ingest failed')
      setIngestError(false)
      setIngestMessage(data.message || 'Lead added.')
      setIngestForm({ full_name: '', email: '', phone_number: '', course_interest: '', source: 'WEBSITE' })
      fetchLeads()
    } catch (e) {
      setIngestError(true)
      setIngestMessage(e.message)
    } finally {
      setIngestSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Leads</h2>
        <div className="toolbar">
          <Link to="/leads/board" className="btn-secondary" style={{ textDecoration: 'none' }}>Board view</Link>
          <select
            value={statusFilter}
            onChange={(e) => {
              const v = e.target.value
              setStatusFilter(v)
              setPage(1)
              updateUrlFilters(v, assignedToFilter)
            }}
          >
            <option value="">All statuses</option>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="COLD">COLD</option>
            <option value="REJECTED">REJECTED</option>
            <option value="LOST">LOST</option>
            <option value="CONVERTED">CONVERTED</option>
          </select>
          <select
            value={assignedToFilter}
            onChange={(e) => {
              const v = e.target.value
              setAssignedToFilter(v)
              setPage(1)
              updateUrlFilters(statusFilter, v)
            }}
          >
            <option value="">All assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <button type="button" onClick={() => setIngestModalOpen(true)} className="btn-primary">Add lead</button>
          <button type="button" onClick={fetchLeads} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {loading && <p className="small">Loading leads…</p>}
      {error && (
        <p className="error">
          {error}
          <button type="button" onClick={fetchLeads} className="retry-btn">Retry</button>
        </p>
      )}

      {!loading && !error && leads.length === 0 && (
        <div className="section">
          <p className="empty-state">No leads found. Adjust filters or add a new lead.</p>
        </div>
      )}

      {!loading && leads.length > 0 && (
        <>
          <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Source</th>
                <th>Counselor</th>
                <th>Created</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.full_name}</td>
                  <td>{lead.email}</td>
                  <td>{lead.phone_number}</td>
                  <td><span className={`badge ${leadStatusBadge(lead.status)}`}>{lead.status}</span></td>
                  <td>{lead.source}</td>
                  <td>{lead.counselor_name || '—'}</td>
                  <td>{new Date(lead.created_at).toLocaleString()}</td>
                  <td><Link to={`/leads/${lead.id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="pagination">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </button>
            <span>Page {page} of {total === 0 ? 1 : Math.ceil(total / pageSize)}</span>
            <button
              type="button"
              disabled={total > 0 && page >= Math.ceil(total / pageSize)}
              onClick={() => setPage((p) => p + 1)}
            >
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
              <p className="small">At least one of email or phone is required.</p>
              {ingestMessage && <p className={ingestError ? 'error' : ''}>{ingestMessage}</p>}
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
