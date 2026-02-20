import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import EnrollmentModal from '../components/EnrollmentModal'
import { API_BASE } from '../config'
import { formatDateTime } from '../utils/date'
import { toast } from 'sonner'
import { ArrowLeft, Phone, Mail, MessageCircle } from 'lucide-react'
import { CardSkeleton } from '../components/Skeleton'

function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [activities, setActivities] = useState([])
  const [note, setNote] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusError, setStatusError] = useState('')
  const [enrollmentModalOpen, setEnrollmentModalOpen] = useState(false)

  async function fetchLead() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/v1/leads/${id}`)
      if (!res.ok) throw new Error('Failed to fetch lead')
      const json = await res.json()
      setLead(json.lead)
      setActivities(json.activities || [])
      setStatus(json.lead.status)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLead()
  }, [id])

  async function addActivity(type, description) {
    const res = await fetch(`${API_BASE}/api/v1/leads/${id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, description }),
    })
    if (!res.ok) throw new Error('Failed to add activity')
  }

  async function addNote() {
    if (!note.trim()) return
    try {
      await addActivity('NOTE', note.trim())
      setNote('')
      fetchLead()
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function addCallLog() {
    if (!note.trim()) return
    try {
      await addActivity('CALL_LOG', note.trim())
      setNote('')
      fetchLead()
    } catch (e) {
      toast.error(e.message)
    }
  }

  async function updateStatus() {
    setStatusError('')
    try {
      if (status === 'REJECTED') {
        const reason = window.prompt('Reason for rejection? (optional)')
        if (reason === null) return
        if (reason.trim()) {
          await addActivity('NOTE', `Rejection reason: ${reason.trim()}`)
        }
      }
      const res = await fetch(`${API_BASE}/api/v1/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to update status')
      }
      fetchLead()
    } catch (e) {
      setStatusError(e.message)
    }
  }

  if (loading) return <CardSkeleton lines={6} />
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error} <button type="button" onClick={fetchLead} className="btn-link ml-2">Retry</button>
      </div>
    )
  }
  if (!lead) return <p className="text-slate-600">Lead not found.</p>

  const phoneFull = [lead.phone_country_code, lead.phone_number].filter(Boolean).join('').replace(/\s/g, '')
  const phoneDigits = phoneFull.replace(/\D/g, '')
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : null
  const telUrl = phoneFull ? `tel:${phoneFull}` : null
  const mailtoUrl = lead.email ? `mailto:${lead.email}` : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate('/leads')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Leads
        </button>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">Lead Detail</h2>

      <section className="card">
        <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
        {(telUrl || mailtoUrl || whatsappUrl) && (
          <div className="mb-4 flex gap-3">
            {telUrl && (
              <a href={telUrl} className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">
                <Phone className="h-4 w-4" /> Call
              </a>
            )}
            {mailtoUrl && (
              <a href={mailtoUrl} className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">
                <Mail className="h-4 w-4" /> Email
              </a>
            )}
            {whatsappUrl && (
              <a href={whatsappUrl} className="inline-flex items-center gap-2 text-sm font-medium text-green-600 hover:underline" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>
        )}
        <p>
          <strong>Name:</strong> {lead.full_name}
        </p>
        <p>
          <strong>Email:</strong> {lead.email}
        </p>
        <p>
          <strong>Phone:</strong> {lead.phone_number}
        </p>
        <p>
          <strong>Course interest:</strong> {lead.course_interest}
        </p>
        <p>
          <strong>Source:</strong> {lead.source}
        </p>
        <p>
          <strong>Status:</strong>{' '}
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="NEW">NEW</option>
            <option value="CONTACTED">CONTACTED</option>
            <option value="INTERESTED">INTERESTED</option>
            <option value="COLD">COLD</option>
            <option value="REJECTED">REJECTED</option>
            <option value="LOST">LOST</option>
          </select>
          <button type="button" onClick={updateStatus}>
            Update
          </button>
        </p>
        {statusError && <p className="error">{statusError}</p>}
        {lead.status !== 'CONVERTED' && (
          <div className="mt-4">
            <button type="button" className="btn-primary" onClick={() => setEnrollmentModalOpen(true)}>
              Convert to Student
            </button>
          </div>
        )}
      </section>

      {enrollmentModalOpen && (
        <EnrollmentModal
          leadId={id}
          onClose={() => setEnrollmentModalOpen(false)}
          onSuccess={(data) => {
            fetchLead()
            if (data.enrollmentNumber) {
              toast.success(`Enrolled. Enrollment number: ${data.enrollmentNumber}`)
            }
            if (data.studentId) {
              navigate(`/students/${data.studentId}`)
            }
          }}
        />
      )}

      <section className="card">
        <h3 className="text-lg font-semibold text-slate-900">Activities</h3>
        <div className="mb-4 flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note or call summary..."
            className="min-h-[80px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={addNote} disabled={!note.trim()}>
              Add Note
            </button>
            <button type="button" className="btn-secondary" onClick={addCallLog} disabled={!note.trim()}>
              Log call
            </button>
          </div>
        </div>
        {activities.length === 0 && <p className="text-sm text-slate-500">No activities yet.</p>}
        {activities.length > 0 && (
          <ul className="list-none border-l-2 border-green-200 pl-4 space-y-3">
            {activities.map((act) => (
              <li key={act.id} className="text-sm">
                <div className="text-slate-500">
                  <strong className="text-slate-700">{act.activity_type}</strong>{' '}
                  {formatDateTime(act.created_at)}
                </div>
                {act.description && <p className="mt-1 text-slate-900">{act.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default LeadDetail

