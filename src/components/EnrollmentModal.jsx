import { useEffect, useState } from 'react'
import { API_BASE } from '../config'

function EnrollmentModal({ leadId, onClose, onSuccess }) {
  const [courses, setCourses] = useState([])
  const [batches, setBatches] = useState([])
  const [batchId, setBatchId] = useState('')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [transactionRef, setTransactionRef] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      fetch(`${API_BASE}/api/v1/courses`).then((r) => r.json()),
      fetch(`${API_BASE}/api/v1/batches`).then((r) => r.json()),
    ])
      .then(([coursesRes, batchesRes]) => {
        if (cancelled) return
        setCourses(coursesRes.data || [])
        setBatches(batchesRes.data || [])
        if ((batchesRes.data || []).length > 0 && !batchId) {
          setBatchId(batchesRes.data[0].id)
        }
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load courses/batches')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!batchId || !amount || !transactionRef) {
      setError('Batch, amount and transaction ref are required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/api/v1/enrollment/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          batchId,
          payment: {
            amount: parseFloat(amount),
            method,
            transactionRef: transactionRef.trim(),
          },
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Enrollment failed')
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
          <h3>Convert to Student</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          {loading && <p>Loading courses and batches...</p>}
          {error && <p className="error">{error}</p>}

          {!loading && (
            <>
              <div className="form-group">
                <label>Batch</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  required
                >
                  <option value="">Select batch</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.course_name}) — {b.current_enrollment}/{b.max_seats}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 100000"
                  required
                />
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
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. MANUAL-001"
                  required
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading || submitting} className="btn-primary">
              {submitting ? 'Converting…' : 'Convert'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EnrollmentModal
