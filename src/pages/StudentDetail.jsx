import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE } from '../config'

function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [exams, setExams] = useState([])
  const [telegramLink, setTelegramLink] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchStudent() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/v1/students/${id}`)
      if (!res.ok) throw new Error('Failed to fetch student')
      const json = await res.json()
      setStudent(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudent()
  }, [id])

  useEffect(() => {
    if (!id) return
    fetch(`${API_BASE}/api/v1/students/${id}/attendance`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => data && setAttendance(data))
      .catch(() => {})
  }, [id])

  useEffect(() => {
    if (!id) return
    fetch(`${API_BASE}/api/v1/students/${id}/exams`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setExams(data?.data || []))
      .catch(() => {})
  }, [id])

  async function handleConnectTelegram() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/telegram/connect-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate link')
      if (data.url) {
        setTelegramLink(data.url)
        await navigator.clipboard.writeText(data.url)
        alert('Link copied to clipboard. Send it to the student so they can connect their Telegram.')
      }
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <p>Loading student...</p>
  if (error) {
    return (
      <div className="page">
        <p className="error">{error} <button type="button" onClick={fetchStudent} className="retry-btn">Retry</button></p>
      </div>
    )
  }
  if (!student) return <p>Student not found.</p>

  const s = student.student || student
  const payments = student.payments || []

  return (
    <div className="page">
      <button type="button" onClick={() => navigate('/students')}>
        ← Back to Students
      </button>

      <h2>Student Detail</h2>

      <section className="card">
        <h3>Profile</h3>
        <p>
          <strong>Enrollment number:</strong> {s.enrollment_number}
        </p>
        <p>
          <strong>Name:</strong> {s.lead_name}
        </p>
        <p>
          <strong>Email:</strong> {s.lead_email}
        </p>
        <p>
          <strong>Phone:</strong> {s.lead_phone}
        </p>
        <p>
          <strong>Batch:</strong> {s.batch_name}
        </p>
        <p>
          <strong>Course:</strong> {s.course_name} ({s.course_code})
        </p>
        <p>
          <strong>Status:</strong> {s.status}
        </p>
        <p>
          <strong>Enrollment date:</strong>{' '}
          {s.enrollment_date
            ? new Date(s.enrollment_date).toLocaleDateString()
            : '—'}
        </p>
      </section>

      <section className="card">
        <h3>Payments</h3>
        {payments.length === 0 && <p>No payments recorded.</p>}
        {payments.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction ref</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.amount}</td>
                  <td>{p.payment_method}</td>
                  <td>{p.transaction_ref}</td>
                  <td>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h3>Attendance</h3>
        {attendance == null && <p>Loading…</p>}
        {attendance != null && (
          <>
            <p>
              <strong>{attendance.percentage}%</strong> ({attendance.present_sessions} / {attendance.total_sessions} sessions)
            </p>
            {attendance.records && attendance.records.length > 0 && (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Subject</th>
                    <th>Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.records.map((r) => (
                    <tr key={r.id}>
                      <td>{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                      <td>{r.subject}</td>
                      <td>{r.start_time} – {r.end_time}</td>
                      <td>{r.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {attendance.records && attendance.records.length === 0 && <p>No attendance records yet.</p>}
          </>
        )}
      </section>

      <section className="card">
        <h3>Exams</h3>
        {exams.length === 0 && <p>No exam results yet.</p>}
        {exams.length > 0 && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Exam</th>
                <th>Date</th>
                <th>Marks</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td>{e.date ? new Date(e.date).toLocaleDateString() : '—'}</td>
                  <td>{e.marks_obtained} / {e.max_marks}</td>
                  <td>{e.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h3>Telegram</h3>
        <p>
          <button type="button" className="btn-primary" onClick={handleConnectTelegram}>
            Generate connect link
          </button>
          {' '}
          Send the link to the student so they can link their Telegram account.
        </p>
        {telegramLink && (
          <p className="small">
            Link: <a href={telegramLink} target="_blank" rel="noopener noreferrer">{telegramLink}</a>
          </p>
        )}
      </section>
    </div>
  )
}

export default StudentDetail
