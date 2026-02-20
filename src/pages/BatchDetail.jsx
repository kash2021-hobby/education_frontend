import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { apiFetch } from '../api'
import { formatDate } from '../utils/date'
import { toast } from 'sonner'

function BatchDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [batch, setBatch] = useState(null)
  const [students, setStudents] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Attendance: create session modal + mark records
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [sessionForm, setSessionForm] = useState({ date: '', subject: '', startTime: '09:00', endTime: '10:00', teacherId: '' })
  const [creatingSession, setCreatingSession] = useState(false)
  const [pendingSessionId, setPendingSessionId] = useState(null)
  const [attendanceRecords, setAttendanceRecords] = useState({}) // studentId -> 'PRESENT' | 'ABSENT'
  const [submittingAttendance, setSubmittingAttendance] = useState(false)

  // Exam: create exam modal + add results
  const [examModalOpen, setExamModalOpen] = useState(false)
  const [examForm, setExamForm] = useState({ name: '', maxMarks: '', date: '' })
  const [creatingExam, setCreatingExam] = useState(false)
  const [pendingExamId, setPendingExamId] = useState(null)
  const [examResults, setExamResults] = useState({}) // studentId -> { marksObtained, remarks }
  const [submittingResults, setSubmittingResults] = useState(false)
  const [bulkCsvUploading, setBulkCsvUploading] = useState(false)

  async function fetchBatch() {
    setLoading(true)
    setError('')
    try {
      const [batchRes, studentsRes, usersRes] = await Promise.all([
        apiFetch(`/api/v1/batches/${id}`).then((r) => (r.ok ? r.json() : null)),
        apiFetch(`/api/v1/batches/${id}/students`).then((r) => r.json()),
        apiFetch(`/api/v1/users`).then((r) => r.json()),
      ])
      setBatch(batchRes)
      setStudents(studentsRes.data || [])
      setUsers(usersRes.data || [])
      if (!batchRes) setError('Batch not found')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatch()
  }, [id])

  useEffect(() => {
    if (students.length > 0 && pendingSessionId) {
      const initial = {}
      students.forEach((s) => { initial[s.student_id] = 'PRESENT' })
      setAttendanceRecords(initial)
    }
  }, [students, pendingSessionId])

  useEffect(() => {
    if (students.length > 0 && pendingExamId) {
      const initial = {}
      students.forEach((s) => { initial[s.student_id] = { marksObtained: '', remarks: '' } })
      setExamResults(initial)
    }
  }, [students, pendingExamId])

  async function createSession(e) {
    e.preventDefault()
    if (!sessionForm.teacherId || !sessionForm.date || !sessionForm.subject || !sessionForm.startTime || !sessionForm.endTime) {
      toast.error('Please fill all fields')
      return
    }
    setCreatingSession(true)
    try {
      const res = await apiFetch('/api/v1/attendance/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: id,
          teacherId: sessionForm.teacherId,
          date: sessionForm.date,
          subject: sessionForm.subject,
          startTime: sessionForm.startTime,
          endTime: sessionForm.endTime,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create session')
      setPendingSessionId(data.id)
      setSessionModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreatingSession(false)
    }
  }

  async function submitAttendance(e) {
    e.preventDefault()
    const records = Object.entries(attendanceRecords).map(([studentId, status]) => ({ studentId, status }))
    if (records.length === 0) return
    setSubmittingAttendance(true)
    try {
      const res = await apiFetch(`/api/v1/attendance/sessions/${pendingSessionId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      if (!res.ok) throw new Error('Failed to save attendance')
      setPendingSessionId(null)
      setAttendanceRecords({})
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmittingAttendance(false)
    }
  }

  async function createExam(e) {
    e.preventDefault()
    if (!examForm.name || !examForm.maxMarks || !examForm.date) {
      toast.error('Name, max marks and date are required')
      return
    }
    setCreatingExam(true)
    try {
      const res = await apiFetch('/api/v1/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: id,
          name: examForm.name,
          maxMarks: Number(examForm.maxMarks),
          date: examForm.date,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create exam')
      setPendingExamId(data.id)
      setExamModalOpen(false)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCreatingExam(false)
    }
  }

  async function submitExamResults(e) {
    e.preventDefault()
    const results = Object.entries(examResults)
      .filter(([, v]) => v.marksObtained !== '' && v.marksObtained != null)
      .map(([studentId, v]) => ({
        studentId,
        marksObtained: Number(v.marksObtained),
        remarks: (v.remarks || '').trim() || undefined,
      }))
    if (results.length === 0) {
      toast.error('Enter at least one student\'s marks')
      return
    }
    setSubmittingResults(true)
    try {
      const res = await apiFetch(`/api/v1/exams/${pendingExamId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      if (!res.ok) throw new Error('Failed to save results')
      setPendingExamId(null)
      setExamResults({})
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmittingResults(false)
    }
  }

  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim())
    if (lines.length < 2) return []
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'))
    const results = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim())
      const row = {}
      headers.forEach((h, j) => { row[h] = values[j] ?? '' })
      results.push(row)
    }
    return results
  }

  async function handleBulkCsvUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }
    if (!pendingExamId || students.length === 0) {
      toast.error('Select an exam first and ensure batch has students')
      return
    }
    const enrollmentToStudent = {}
    students.forEach((s) => { enrollmentToStudent[String(s.enrollment_number).toLowerCase().trim()] = s.student_id })
    setBulkCsvUploading(true)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      if (rows.length === 0) {
        toast.error('CSV has no data rows. Expected: enrollment_number, marks, remarks')
        return
      }
      const results = []
      const missing = []
      for (const row of rows) {
        const enrollment = String(row.enrollment_number ?? row.enrollmentnumber ?? row.enrollment ?? '').toLowerCase().trim()
        const marks = row.marks ?? row.marks_obtained ?? row.mark ?? ''
        if (!enrollment || marks === '') continue
        const studentId = enrollmentToStudent[enrollment]
        if (!studentId) {
          missing.push(enrollment)
          continue
        }
        results.push({
          studentId,
          marksObtained: Number(marks),
          remarks: (row.remarks ?? '').trim() || undefined,
        })
      }
      if (missing.length > 0) {
        toast.warning(`Skipped ${missing.length} row(s): enrollment number not found in batch: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`)
      }
      if (results.length === 0) {
        toast.error('No valid rows to upload. CSV must have columns: enrollment_number, marks, remarks')
        return
      }
      const res = await apiFetch(`/api/v1/exams/${pendingExamId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      if (!res.ok) throw new Error('Failed to save results')
      setPendingExamId(null)
      setExamResults({})
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBulkCsvUploading(false)
    }
  }

  if (loading) return <div className="skeleton h-32 w-full rounded-xl" />
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error} <button type="button" onClick={fetchBatch} className="btn-link ml-2">Retry</button>
      </div>
    )
  }
  if (!batch) return <p className="text-slate-600">Batch not found.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={() => navigate('/batches')} className="btn-ghost">
          ← Back to Batches
        </button>
      </div>
      <h2 className="text-2xl font-semibold text-slate-900">Batch: {batch.name}</h2>

      <section className="section">
        <h3 className="section-title">Info</h3>
        <p><strong>Course:</strong> {batch.course_name}</p>
        <p><strong>Status:</strong> {batch.status}</p>
        <p><strong>Seats:</strong> {batch.current_enrollment} / {batch.max_seats}</p>
        <p><strong>Start date:</strong> {formatDate(batch.start_date)}</p>
      </section>

      <section className="section">
        <h3 className="section-title">Students</h3>
        {students.length === 0 && <p>No students in this batch.</p>}
        {students.length > 0 && (
          <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Enrollment #</th>
                <th>Name</th>
                <th>Email</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.student_id}>
                  <td>{s.enrollment_number}</td>
                  <td>{s.full_name}</td>
                  <td>{s.email}</td>
                  <td><Link to={`/students/${s.student_id}`}>View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </section>

      <section className="section">
        <h3 className="section-title">Attendance</h3>
        <button type="button" className="btn-primary" onClick={() => setSessionModalOpen(true)}>
          New attendance session
        </button>

        {pendingSessionId && (
          <div className="sub-form">
            <h4>Mark attendance for this session</h4>
            <form onSubmit={submitAttendance}>
              <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.student_id}>
                      <td>{s.full_name}</td>
                      <td>
                        <select
                          value={attendanceRecords[s.student_id] || 'PRESENT'}
                          onChange={(e) => setAttendanceRecords((prev) => ({ ...prev, [s.student_id]: e.target.value }))}
                        >
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setPendingSessionId(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submittingAttendance} className="btn-primary">
                  {submittingAttendance ? 'Saving…' : 'Save attendance'}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <section className="section">
        <h3 className="section-title">Exams</h3>
        <button type="button" className="btn-primary" onClick={() => setExamModalOpen(true)}>
          New exam
        </button>

        {pendingExamId && (
          <div className="sub-form">
            <h4>Add results for this exam</h4>
            <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <label className="btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleBulkCsvUpload}
                  disabled={bulkCsvUploading}
                  style={{ display: 'none' }}
                />
                {bulkCsvUploading ? 'Uploading…' : 'Bulk upload CSV'}
              </label>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  const sample = students.slice(0, 3).map((s) => `${s.enrollment_number},,`).join('\n')
                  const csv = `enrollment_number,marks,remarks\n${sample}`
                  const blob = new Blob([csv], { type: 'text/csv' })
                  const a = document.createElement('a')
                  a.href = URL.createObjectURL(blob)
                  a.download = 'exam-results-sample.csv'
                  a.click()
                  URL.revokeObjectURL(a.href)
                }}
              >
                Download sample
              </button>
            </div>
            <form onSubmit={submitExamResults}>
              <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Marks</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.student_id}>
                      <td>{s.full_name}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={examResults[s.student_id]?.marksObtained ?? ''}
                          onChange={(e) => setExamResults((prev) => ({
                            ...prev,
                            [s.student_id]: { ...prev[s.student_id], marksObtained: e.target.value },
                          }))}
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={examResults[s.student_id]?.remarks ?? ''}
                          onChange={(e) => setExamResults((prev) => ({
                            ...prev,
                            [s.student_id]: { ...prev[s.student_id], remarks: e.target.value },
                          }))}
                          placeholder="Optional"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setPendingExamId(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submittingResults} className="btn-primary">
                  {submittingResults ? 'Saving…' : 'Save results'}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {sessionModalOpen && (
        <div className="modal-overlay" onClick={() => setSessionModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New attendance session</h3>
              <button type="button" className="modal-close" onClick={() => setSessionModalOpen(false)}>×</button>
            </div>
            <form onSubmit={createSession}>
              <div className="form-group">
                <label>Teacher</label>
                <select
                  value={sessionForm.teacherId}
                  onChange={(e) => setSessionForm((f) => ({ ...f, teacherId: e.target.value }))}
                  required
                >
                  <option value="">Select teacher</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={sessionForm.date}
                  onChange={(e) => setSessionForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={sessionForm.subject}
                  onChange={(e) => setSessionForm((f) => ({ ...f, subject: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start time</label>
                <input
                  type="time"
                  value={sessionForm.startTime}
                  onChange={(e) => setSessionForm((f) => ({ ...f, startTime: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>End time</label>
                <input
                  type="time"
                  value={sessionForm.endTime}
                  onChange={(e) => setSessionForm((f) => ({ ...f, endTime: e.target.value }))}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setSessionModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={creatingSession} className="btn-primary">{creatingSession ? 'Creating…' : 'Create session'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {examModalOpen && (
        <div className="modal-overlay" onClick={() => setExamModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New exam</h3>
              <button type="button" className="modal-close" onClick={() => setExamModalOpen(false)}>×</button>
            </div>
            <form onSubmit={createExam}>
              <div className="form-group">
                <label>Exam name</label>
                <input
                  type="text"
                  value={examForm.name}
                  onChange={(e) => setExamForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Max marks</label>
                <input
                  type="number"
                  min="0"
                  value={examForm.maxMarks}
                  onChange={(e) => setExamForm((f) => ({ ...f, maxMarks: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  value={examForm.date}
                  onChange={(e) => setExamForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setExamModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={creatingExam} className="btn-primary">{creatingExam ? 'Creating…' : 'Create exam'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchDetail
