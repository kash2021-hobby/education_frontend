import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'
import { leadStatusBadge } from '../utils/badges'

const STATUSES = ['NEW', 'CONTACTED', 'INTERESTED', 'COLD', 'REJECTED', 'LOST', 'CONVERTED']

function LeadBoard() {
  const [leadsByStatus, setLeadsByStatus] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchBoard() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/v1/leads?page=1&pageSize=500`)
      if (!res.ok) throw new Error('Failed to fetch leads')
      const json = await res.json()
      const grouped = {}
      STATUSES.forEach((s) => {
        grouped[s] = []
      })
      ;(json.data || []).forEach((lead) => {
        const key = STATUSES.includes(lead.status) ? lead.status : 'NEW'
        grouped[key].push(lead)
      })
      setLeadsByStatus(grouped)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoard()
  }, [])

  async function changeStatus(leadId, newStatus) {
    try {
      const res = await fetch(`${API_BASE}/api/v1/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || 'Failed to update status')
      }
      fetchBoard()
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert(e.message)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Leads Board</h2>
        <div className="toolbar">
          <Link to="/leads" className="btn-secondary" style={{ textDecoration: 'none' }}>Table view</Link>
          <button type="button" onClick={fetchBoard} className="btn-secondary">Refresh</button>
        </div>
      </div>

      {error && (
        <p className="error">
          {error}{' '}
          <button type="button" onClick={fetchBoard} className="retry-btn">Retry</button>
        </p>
      )}
      {loading && <p className="small">Loading board…</p>}

      {!loading && !error && (
        <div className="lead-board">
          {STATUSES.map((status) => {
            const items = leadsByStatus[status] || []
            return (
              <div key={status} className="lead-column">
                <div className="lead-column-header">
                  <span><span className={`badge ${leadStatusBadge(status)}`}>{status}</span></span>
                  <span className="lead-column-count">{items.length}</span>
                </div>
                <div className="lead-column-body">
                  {items.length === 0 && <p className="small">No leads.</p>}
                  {items.map((lead) => (
                    <div key={lead.id} className="lead-card">
                      <div className="lead-card-title">{lead.full_name}</div>
                      <div className="lead-card-meta small">
                        {lead.course_interest || 'No course'} ·{' '}
                        {lead.counselor_name || 'Unassigned'}
                      </div>
                      <div className="lead-card-meta small">
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString()
                          : ''}
                      </div>
                      <div className="lead-card-actions">
                        <Link to={`/leads/${lead.id}`}>View</Link>
                        <select
                          value={lead.status}
                          onChange={(e) => changeStatus(lead.id, e.target.value)}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default LeadBoard

