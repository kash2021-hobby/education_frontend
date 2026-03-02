import { useEffect, useState } from 'react'
import { API_BASE } from '../config'
import { apiFetch } from '../api'

function AddStudentModal({ onClose, onSuccess }) {
  const [leads, setLeads] = useState([])
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [leadId, setLeadId] = useState('')
  const [selectedCourseIds, setSelectedCourseIds] = useState([])
  const [batchForCourse, setBatchForCourse] = useState({})
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [transactionRef, setTransactionRef] = useState('')
  const [feePlanType, setFeePlanType] = useState('INSTALLMENT_6')
  const [totalFee, setTotalFee] = useState('')
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      apiFetch(`${API_BASE}/api/v1/leads?page=1&pageSize=500`).then((r) => r.json()),
      apiFetch(`${API_BASE}/api/v1/courses`).then((r) => r.json()),
      apiFetch(`${API_BASE}/api/v1/batches`).then((r) => r.json()),
    ])
      .then(([leadsRes, coursesRes, batchesRes]) => {
        if (cancelled) return
        const leadList = leadsRes.data || []
        setLeads(leadList.filter((l) => l.status !== 'CONVERTED'))
        setCourses(coursesRes.data || [])
        setBatches(batchesRes.data || [])
        if (leadList.filter((l) => l.status !== 'CONVERTED').length > 0 && !leadId) {
          setLeadId(leadList.filter((l) => l.status !== 'CONVERTED')[0].id)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load leads/courses/batches')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  function toggleCourse(courseId) {
    setSelectedCourseIds((prev) => {
      const next = prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
      if (!next.includes(courseId)) {
        setBatchForCourse((b) => {
          const u = { ...b }
          delete u[courseId]
          return u
        })
      }
      return next
    })
  }

  function setBatchForCourseId(courseId, batchId) {
    setBatchForCourse((prev) => (batchId ? { ...prev, [courseId]: batchId } : (() => { const u = { ...prev }; delete u[courseId]; return u })()))
  }

  function batchesForCourse(courseId) {
    return batches.filter((b) => String(b.course_id) === String(courseId))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!leadId || selectedCourseIds.length === 0 || !amount || !transactionRef) {
      setError('Select a lead, at least one course, and fill payment amount and transaction ref')
      return
    }
    if (!totalFee || Number(totalFee) <= 0) {
      setError('Total fee (for payment timeline) is required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await apiFetch(`${API_BASE}/api/v1/enrollment/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          courseIds: selectedCourseIds,
          batchForCourse: Object.keys(batchForCourse).length ? batchForCourse : undefined,
          payment: {
            amount: parseFloat(amount),
            method,
            transactionRef: transactionRef.trim(),
          },
          feePlanType: feePlanType || 'FULL',
          totalFee: parseFloat(totalFee),
          emergencyContactNumber: emergencyContactNumber.trim() || undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || data.error || 'Enrollment failed')
      onSuccess(data)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add student</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          {loading && <p>Loading leads, courses and batches…</p>}
          {error && <p className="error">{error}</p>}

          {!loading && (
            <>
              <div className="form-group">
                <label>Lead</label>
                <select value={leadId} onChange={(e) => setLeadId(e.target.value)} required>
                  <option value="">Select lead</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>{l.full_name} — {l.email || l.phone_number || l.id}</option>
                  ))}
                </select>
                {leads.length === 0 && <p className="small">No unconverted leads. Add a lead first from Leads.</p>}
              </div>
              <div className="form-group">
                <label>Courses and batches</label>
                <p className="small mb-2">
                  Select one or more courses, then choose a batch for each. Leave batch as Auto to use first with
                  seats.
                </p>
                <div className="flex flex-col gap-2">
                  {courses
                    .filter((c) => c.is_active !== false)
                    .map((c) => {
                      const checked = selectedCourseIds.includes(c.id)
                      return (
                        <div
                          key={c.id}
                          className={`rounded-xl border px-3 py-2 text-sm shadow-sm transition-colors ${
                            checked
                              ? 'border-green-500 bg-green-50'
                              : 'border-slate-200 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                              checked={checked}
                              onChange={() => toggleCourse(c.id)}
                            />
                            <span className="font-medium text-slate-900">{c.name}</span>
                            <span className="text-xs text-slate-500">({c.code})</span>
                          </label>
                          {checked && (
                            <div className="mt-2 pl-6">
                              <label className="small">Batch</label>
                              <select
                                value={batchForCourse[c.id] || ''}
                                onChange={(e) => setBatchForCourseId(c.id, e.target.value || null)}
                                className="mt-1 min-h-[44px] min-w-[200px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                              >
                                <option value="">Auto (first with seats)</option>
                                {batchesForCourse(c.id).map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name} (seats: {b.current_enrollment ?? 0}/{b.max_seats ?? 0})
                                  </option>
                                ))}
                                {batchesForCourse(c.id).length === 0 && <option value="" disabled>No batches</option>}
                              </select>
                            </div>
                          )}
                        </div>
                      )
                    })}
                </div>
              </div>
              <div className="form-group">
                <label>Payment (amount paid now)</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 20000" required />
              </div>
              <div className="form-group">
                <label>Payment timeline</label>
                <select value={feePlanType} onChange={(e) => setFeePlanType(e.target.value)}>
                  <option value="FULL">Full payment (1 installment)</option>
                  <option value="MONTHLY">Monthly (12 installments)</option>
                  <option value="INSTALLMENT_6">6 installments</option>
                </select>
              </div>
              <div className="form-group">
                <label>Total fee (for payment timeline)</label>
                <input type="number" step="0.01" value={totalFee} onChange={(e) => setTotalFee(e.target.value)} placeholder="e.g. 120000" required />
              </div>
              <div className="form-group">
                <label>Payment method</label>
                <select value={method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="CASH">CASH</option>
                  <option value="STRIPE">STRIPE</option>
                  <option value="RAZORPAY">RAZORPAY</option>
                  <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                </select>
              </div>
              <div className="form-group">
                <label>Transaction reference</label>
                <input type="text" value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} placeholder="e.g. MANUAL-001" required />
              </div>
              <div className="form-group">
                <label>Emergency contact number</label>
                <input
                  type="text"
                  value={emergencyContactNumber}
                  onChange={(e) => setEmergencyContactNumber(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading || submitting || leads.length === 0} className="btn-primary">
              {submitting ? 'Adding…' : 'Add student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddStudentModal
