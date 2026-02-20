import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE } from '../config'
import { leadStatusBadge } from '../utils/badges'
import { formatDate } from '../utils/date'
import { toast } from 'sonner'
import { LayoutGrid, RefreshCw, ExternalLink } from 'lucide-react'

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
      toast.error(e.message)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-slate-900">Leads Board</h2>
        <div className="flex gap-2">
          <Link to="/leads" className="btn-secondary flex items-center gap-2 no-underline">
            <LayoutGrid className="h-4 w-4" />
            Table view
          </Link>
          <button type="button" onClick={fetchBoard} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error} <button type="button" onClick={fetchBoard} className="btn-link ml-2">Retry</button>
        </div>
      )}
      {loading && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {STATUSES.map((_, i) => (
            <div key={i} className="h-64 w-56 shrink-0 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      )}

      {!loading && !error && (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {STATUSES.map((status) => {
            const items = leadsByStatus[status] || []
            return (
              <div
                key={status}
                className="flex h-[70vh] min-w-[260px] flex-col rounded-xl border border-slate-200 bg-slate-50/80"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                  <span className={`badge ${leadStatusBadge(status)}`}>{status}</span>
                  <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs font-medium text-slate-600">
                    {items.length}
                  </span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto p-2">
                  {items.length === 0 && <p className="px-2 py-4 text-center text-sm text-slate-500">No leads.</p>}
                  {items.map((lead) => (
                    <div
                      key={lead.id}
                      className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow"
                    >
                      <div className="font-semibold text-slate-900">{lead.full_name}</div>
                      <div className="mt-1 text-xs text-slate-500">
                        {lead.course_interest || 'No course'} · {lead.counselor_name || 'Unassigned'}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{formatDate(lead.created_at)}</div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Link
                          to={`/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-green-600 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View
                        </Link>
                        <select
                          value={lead.status}
                          onChange={(e) => changeStatus(lead.id, e.target.value)}
                          className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
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

