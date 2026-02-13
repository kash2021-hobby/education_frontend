import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { API_BASE } from '../config'

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

  async function fetchBatch() {
    setLoading(true)
    setError('')
    try {
      const [batchRes, studentsRes, usersRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/batches/${id}`).then((r) => (r.ok ? r.json() : null)),
        fetch(`${API_BASE}/api/v1/batches/${id}/students`).then((r) => r.json()),
        fetch(`${API_BASE}/api/v1/users`).then((r) => r.json()),
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
      alert('Please fill all fields')
      return
    }
    setCreatingSession(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/attendance/sessions`, {
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
      alert(err.message)
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
      const res = await fetch(`${API_BASE}/api/v1/attendance/sessions/${pendingSessionId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      if (!res.ok) throw new Error('Failed to save attendance')
      setPendingSessionId(null)
      setAttendanceRecords({})
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmittingAttendance(false)
    }
  }

  async function createExam(e) {
    e.preventDefault()
    if (!examForm.name || !examForm.maxMarks || !examForm.date) {
      alert('Name, max marks and date are required')
      return
    }
    setCreatingExam(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/exams`, {
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
      alert(err.message)
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
      alert('Enter at least one student\'s marks')
      return
    }
    setSubmittingResults(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/exams/${pendingExamId}/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results }),
      })
      if (!res.ok) throw new Error('Failed to save results')
      setPendingExamId(null)
      setExamResults({})
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmittingResults(false)
    }
  }

  if (loading) return <p>Loading batch...</p>
  if (error) {
    return (
      <div className="page">
        <p className="error">{error} <button type="button" onClick={fetchBatch} className="retry-btn">Retry</button></p>
      </div>
    )
  }
  if (!batch) return <p>Batch not found.</p>

  return (
    <div className="page">
      <button type="button" onClick={() => navigate('/batches')}>
        ← Back to Batches
      </button>

      <h2>Batch: {batch.name}</h2>

      <section className="card">
        <h3>Info</h3>
        <p><strong>Course:</strong> {batch.course_name}</p>
        <p><strong>Status:</strong> {batch.status}</p>
        <p><strong>Seats:</strong> {batch.current_enrollment} / {batch.max_seats}</p>
        <p><strong>Start date:</strong> {batch.start_date ? new Date(batch.start_date).toLocaleDateString() : '—'}</p>
      </section>

      <section className="card">
        <h3>Students</h3>
        {students.length === 0 && <p>No students in this batch.</p>}
        {students.length > 0 && (
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
        )}
      </section>

      <section className="card">
        <h3>Attendance</h3>
        <button type="button" className="btn-primary" onClick={() => setSessionModalOpen(true)}>
          New attendance session
        </button>

        {pendingSessionId && (
          <div className="sub-form">
            <h4>Mark attendance for this session</h4>
            <form onSubmit={submitAttendance}>
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
              <div className="modal-actions">
                <button type="button" onClick={() => setPendingSessionId(null)}>Cancel</button>
                <button type="submit" disabled={submittingAttendance}>
                  {submittingAttendance ? 'Saving…' : 'Save attendance'}
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      <section className="card">
        <h3>Exams</h3>
        <button type="button" className="btn-primary" onClick={() => setExamModalOpen(true)}>
          New exam
        </button>

        {pendingExamId && (
          <div className="sub-form">
            <h4>Add results for this exam</h4>
            <form onSubmit={submitExamResults}>
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
              <div className="modal-actions">
                <button type="button" onClick={() => setPendingExamId(null)}>Cancel</button>
                <button type="submit" disabled={submittingResults}>
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
                <button type="button" onClick={() => setSessionModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={creatingSession}>{creatingSession ? 'Creating…' : 'Create session'}</button>
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
                <button type="button" onClick={() => setExamModalOpen(false)}>Cancel</button>
                <button type="submit" disabled={creatingExam}>{creatingExam ? 'Creating…' : 'Create exam'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchDetail
