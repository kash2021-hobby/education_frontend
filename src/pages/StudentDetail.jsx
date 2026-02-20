import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE } from '../config'
import { formatDate, formatDateTime } from '../utils/date'
import { toast } from 'sonner'
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'
import { CardSkeleton } from '../components/Skeleton'
import { studentStatusBadge } from '../utils/badges'

function StudentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [batches, setBatches] = useState([])
  const [attendance, setAttendance] = useState(null)
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    emergencyContactNumber: '',
    status: '',
    batchId: '',
  })
  const [feeSchedule, setFeeSchedule] = useState(null)
  const [installments, setInstallments] = useState([])
  const [feeError, setFeeError] = useState('')
  const [payingInstallmentId, setPayingInstallmentId] = useState(null)
  const [payTxRef, setPayTxRef] = useState('')
  const [payMethod, setPayMethod] = useState('CASH')
  const [paySaving, setPaySaving] = useState(false)

  async function fetchStudent() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/v1/students/${id}`)
      if (!res.ok) throw new Error('Failed to fetch student')
      const json = await res.json()
      setStudent(json)
      const s = json.student || json
      setForm({
        fullName: s.lead_name || '',
        email: s.lead_email || '',
        phoneNumber: s.lead_phone || '',
        emergencyContactNumber: s.lead_emergency_contact_number || '',
        status: s.status || '',
        batchId: s.batch_id || '',
      })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchBatches() {
    try {
      const res = await fetch(`${API_BASE}/api/v1/batches`)
      if (!res.ok) return
      const json = await res.json().catch(() => ({}))
      setBatches(json.data || [])
    } catch (_) {
      setBatches([])
    }
  }

  useEffect(() => {
    fetchStudent()
    fetchBatches()
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
    fetch(`${API_BASE}/api/v1/students/${id}/fee-schedule`)
      .then((r) => (r.ok ? r.json() : r.json().then((d) => Promise.reject(new Error(d.error || 'Failed to load fee schedule')))))
      .then((data) => {
        setFeeError('')
        setFeeSchedule(data.schedule || null)
        setInstallments(data.installments || [])
      })
      .catch((e) => {
        setFeeError(e.message)
        setFeeSchedule(null)
        setInstallments([])
      })
  }, [id])

  useEffect(() => {
    if (!id) return
    fetch(`${API_BASE}/api/v1/students/${id}/exams`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setExams(data?.data || []))
      .catch(() => {})
  }, [id])

  async function handlePayInstallmentSubmit(inst) {
    if (!id || !inst) return

    const amount = Number(inst.amount_due || 0)
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      toast.error('Installment amount is invalid, cannot mark as paid.')
      return
    }
    if (!payTxRef || !payTxRef.trim()) {
      toast.error('Transaction reference is required.')
      return
    }

    setPaySaving(true)
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/students/${id}/fee-installments/${inst.id}/pay`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            transactionRef: payTxRef.trim(),
            method: payMethod || 'CASH',
          }),
        },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to record payment')
      }
      await fetchStudent()
      fetch(`${API_BASE}/api/v1/students/${id}/fee-schedule`)
        .then((r) => (r.ok ? r.json() : null))
        .then((fs) => {
          if (!fs) return
          setFeeSchedule(fs.schedule || null)
          setInstallments(fs.installments || [])
        })
        .catch(() => {})
      setPayingInstallmentId(null)
      setPayTxRef('')
      toast.success('Payment recorded and installment marked as PAID.')
    } catch (e) {
      toast.error(e.message)
    } finally {
      setPaySaving(false)
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault()
    setSavingEdit(true)
    setEditError('')
    try {
      const res = await fetch(`${API_BASE}/api/v1/students/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          emergencyContactNumber: form.emergencyContactNumber,
          status: form.status,
          batchId: form.batchId || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to update student')
      }
      await fetchStudent()
      setEditMode(false)
    } catch (e) {
      setEditError(e.message)
    } finally {
      setSavingEdit(false)
    }
  }

  if (loading) return <CardSkeleton lines={8} />
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error} <button type="button" onClick={fetchStudent} className="btn-link ml-2">Retry</button>
      </div>
    )
  }
  if (!student) return <p className="text-slate-600">Student not found.</p>

  const s = student.student || student
  const payments = student.payments || []

  const phoneDigits = (s.lead_phone || '').replace(/\D/g, '')
  const whatsappUrl = phoneDigits ? `https://wa.me/${phoneDigits}` : null
  const mailtoUrl = s.lead_email ? `mailto:${s.lead_email}` : null

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate('/students')}
          className="btn-ghost flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </button>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">Student Detail</h2>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-slate-900">Profile</h3>
          <div className="flex items-center gap-2">
            {(whatsappUrl || mailtoUrl) && !editMode && (
              <>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                )}
                {mailtoUrl && (
                  <a
                    href={mailtoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}
              </>
            )}
            <button
              type="button"
              className="btn-link"
              onClick={() => {
                setEditError('')
                setEditMode((v) => !v)
              }}
            >
              {editMode ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>

        {!editMode && (
          <>
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
              <strong>Emergency contact:</strong> {s.lead_emergency_contact_number || '—'}
            </p>
            <p>
              <strong>Batch:</strong> {s.batch_name}
            </p>
            <p>
              <strong>Course:</strong> {s.course_name} ({s.course_code})
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span className={`badge ${studentStatusBadge(s.status)}`}>{s.status}</span>
            </p>
            <p>
              <strong>Enrollment date:</strong> {formatDate(s.enrollment_date)}
            </p>
          </>
        )}

        {editMode && (
          <form onSubmit={handleSaveEdit} className="sub-form" style={{ marginTop: '0.5rem' }}>
            {editError && <p className="error">{editError}</p>}
            <div className="form-row">
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={form.phoneNumber}
                  onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Emergency contact</label>
                <input
                  type="text"
                  value={form.emergencyContactNumber}
                  onChange={(e) => setForm((f) => ({ ...f, emergencyContactNumber: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="">Select status</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DROPPED">DROPPED</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>
              <div className="form-group">
                <label>Batch</label>
                <select
                  value={form.batchId}
                  onChange={(e) => setForm((f) => ({ ...f, batchId: e.target.value }))}
                >
                  <option value="">Current: {s.batch_name}</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
              <button type="submit" className="btn-primary" disabled={savingEdit}>
                {savingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="card">
        <h3>Payment timeline</h3>
        <div className="sub-form">
          <h4>Fee schedule</h4>
          {feeError && <p className="error">{feeError}</p>}
          {!feeSchedule && installments.length === 0 && (
            <p>No fee schedule created for this student.</p>
          )}
          {feeSchedule && (
            <p className="small">
              Plan: <strong>{feeSchedule.plan_type}</strong>, Total: ₹
              {feeSchedule.total_amount}
            </p>
          )}
          {installments.length > 0 && (
            <table className="data-table" style={{ marginTop: '0.5rem' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Due date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {installments.map((inst) => (
                  <tr key={inst.id}>
                    <td>{inst.installment_no}</td>
                    <td>{formatDate(inst.due_date)}</td>
                    <td>₹{inst.amount_due}</td>
                    <td>{inst.status}</td>
                    <td>
                      {inst.status !== 'PAID' && (
                        <>
                          {payingInstallmentId === inst.id ? (
                            <div className="form-inline" style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <div className="form-row" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                <span className="small">Amount: <strong>₹{inst.amount_due}</strong></span>
                              </div>
                              <div className="form-row" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                <select
                                  value={payMethod}
                                  onChange={(e) => setPayMethod(e.target.value)}
                                  style={{ maxWidth: '150px' }}
                                >
                                  <option value="CASH">Cash</option>
                                  <option value="BANK_TRANSFER">Bank transfer</option>
                                  <option value="RAZORPAY">Razorpay</option>
                                  <option value="STRIPE">Stripe</option>
                                </select>
                                <input
                                  type="text"
                                  placeholder="Transaction id / ref"
                                  value={payTxRef}
                                  onChange={(e) => setPayTxRef(e.target.value)}
                                  style={{ maxWidth: '180px' }}
                                />
                              </div>
                              <div className="form-row" style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => handlePayInstallmentSubmit(inst)}
                                  disabled={paySaving}
                                >
                                  {paySaving ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  className="btn-link"
                                  onClick={() => {
                                    setPayingInstallmentId(null)
                                    setPayTxRef('')
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="btn-link"
                              onClick={() => {
                                setPayingInstallmentId(inst.id)
                                setPayTxRef('')
                                setPayMethod('CASH')
                              }}
                            >
                              Mark as paid
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="sub-form" style={{ marginTop: '1rem' }}>
          <h4>Recorded payments</h4>
          {payments.length === 0 && <p>No payments recorded yet.</p>}
          {payments.length > 0 && (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Transaction ref</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{formatDateTime(p.created_at)}</td>
                    <td>{p.amount}</td>
                    <td>{p.payment_method}</td>
                    <td>{p.transaction_ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
                      <td>{formatDate(r.date)}</td>
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
                  <td>{formatDate(e.date)}</td>
                  <td>{e.marks_obtained} / {e.max_marks}</td>
                  <td>{e.remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      </div>
  )
}

export default StudentDetail
