import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import EnrollmentModal from '../components/EnrollmentModal'
import { API_BASE } from '../config'

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
      alert(e.message)
    }
  }

  async function addCallLog() {
    if (!note.trim()) return
    try {
      await addActivity('CALL_LOG', note.trim())
      setNote('')
      fetchLead()
    } catch (e) {
      alert(e.message)
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

  if (loading) return <p>Loading lead...</p>
  if (error) {
    return (
      <div className="page">
        <p className="error">{error} <button type="button" onClick={fetchLead} className="retry-btn">Retry</button></p>
      </div>
    )
  }
  if (!lead) return <p>Lead not found.</p>

  const phoneFull = [lead.phone_country_code, lead.phone_number].filter(Boolean).join('').replace(/\s/g, '')
  const phoneDigits = phoneFull.replace(/\D/g, '')
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : null
  const telUrl = phoneFull ? `tel:${phoneFull}` : null
  const mailtoUrl = lead.email ? `mailto:${lead.email}` : null

  return (
    <div className="page">
      <button type="button" onClick={() => navigate('/leads')} className="btn-back">
        ← Back to Leads
      </button>

      <h2>Lead Detail</h2>

      <section className="card">
        <h3>Profile</h3>
        {(telUrl || mailtoUrl || whatsappUrl) && (
          <div className="action-bar">
            {telUrl && <a href={telUrl} className="action-link" target="_blank" rel="noopener noreferrer">Call</a>}
            {mailtoUrl && <a href={mailtoUrl} className="action-link" target="_blank" rel="noopener noreferrer">Email</a>}
            {whatsappUrl && <a href={whatsappUrl} className="action-link" target="_blank" rel="noopener noreferrer">WhatsApp</a>}
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
            <option value="CONVERTED">CONVERTED</option>
          </select>
          <button type="button" onClick={updateStatus} className="btn-primary">Update</button>
        </p>
        {statusError && <p className="error">{statusError}</p>}
        {lead.status !== 'CONVERTED' && (
          <p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setEnrollmentModalOpen(true)}
            >
              Convert to Student
            </button>
          </p>
        )}
      </section>

      {enrollmentModalOpen && (
        <EnrollmentModal
          leadId={id}
          onClose={() => setEnrollmentModalOpen(false)}
          onSuccess={(data) => {
            fetchLead()
            if (data.enrollmentNumber) {
              alert(`Enrolled successfully. Enrollment number: ${data.enrollmentNumber}`)
            }
            if (data.studentId) {
              navigate(`/students/${data.studentId}`)
            }
          }}
        />
      )}

      <section className="card">
        <h3>Activities</h3>
        <div className="note-input">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note or call summary..."
          />
          <div className="note-actions">
            <button type="button" onClick={addNote} disabled={!note.trim()} className="btn-primary">Add note</button>
            <button type="button" onClick={addCallLog} disabled={!note.trim()} className="btn-secondary">Log call</button>
          </div>
        </div>
        {activities.length === 0 && <p>No activities yet.</p>}
        {activities.length > 0 && (
          <ul className="timeline">
            {activities.map((act) => (
              <li key={act.id}>
                <div>
                  <strong>{act.activity_type}</strong>{' '}
                  <span>{new Date(act.created_at).toLocaleString()}</span>
                </div>
                {act.description && <p>{act.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default LeadDetail

