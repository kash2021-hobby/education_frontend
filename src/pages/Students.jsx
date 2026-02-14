import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API_BASE } from '../config'
import { studentStatusBadge } from '../utils/badges'

function Students() {
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
      if (!res.ok) throw new Error('Failed to fetch students')
      const json = await res.json()
      setStudents(json.data || [])
      setTotal(Number(json.total) ?? 0)
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

  return (
    <div className="page">
      <div className="page-header">
        <h2>Students</h2>
        <div className="toolbar">
          <select
            value={batchFilter}
            onChange={(e) => {
              const v = e.target.value
              setBatchFilter(v)
              setPage(1)
              updateUrlFilters(v, statusFilter)
            }}
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
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DROPPED">DROPPED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
          </select>
          <button type="button" onClick={fetchStudents} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {error && (
        <p className="error">
          {error}
          <button type="button" onClick={fetchStudents} className="retry-btn">Retry</button>
        </p>
      )}
      {loading && <p className="small">Loading students…</p>}

      {!loading && !error && (
        <>
          <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Enrollment #</th>
                <th>Name</th>
                <th>Email</th>
                <th>Batch</th>
                <th>Status</th>
                <th>Enrolled</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state">No students found.</td>
                </tr>
              )}
              {students.map((s) => (
                <tr key={s.id}>
                  <td>{s.enrollment_number}</td>
                  <td>{s.lead_name}</td>
                  <td>{s.email}</td>
                  <td>{s.batch_name}</td>
                  <td><span className={`badge ${studentStatusBadge(s.status)}`}>{s.status}</span></td>
                  <td>{s.enrollment_date ? new Date(s.enrollment_date).toLocaleDateString() : '—'}</td>
                  <td><Link to={`/students/${s.id}`}>View</Link></td>
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
    </div>
  )
}

export default Students
