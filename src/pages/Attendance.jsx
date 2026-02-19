import { useEffect, useState } from 'react'
import { API_BASE } from '../config'
import { apiFetch } from '../api'

function Attendance() {
  const [batches, setBatches] = useState([])
  const [selectedBatchId, setSelectedBatchId] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [attendance, setAttendance] = useState({})
  const [sessionId, setSessionId] = useState(null)
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [subject, setSubject] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [creatingSession, setCreatingSession] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')

  useEffect(() => {
    apiFetch(`${API_BASE}/api/v1/batches`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((json) => setBatches(json.data || []))
      .catch(() => setBatches([]))
  }, [])

  useEffect(() => {
    if (!selectedBatchId) {
      setStudents([])
      setSessionId(null)
      return
    }
    setLoading(true)
    setError('')
    setSessionId(null)
    apiFetch(`${API_BASE}/api/v1/batches/${selectedBatchId}/students`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load students for batch'))))
      .then((json) => {
        const list = json.data || []
        setStudents(list)
        const initial = {}
        list.forEach((s) => {
          initial[s.student_id] = 'PRESENT'
        })
        setAttendance(initial)
      })
      .catch((e) => setError(e.message || 'Failed to load students for batch'))
      .finally(() => setLoading(false))
  }, [selectedBatchId])

  function setStatus(studentId, status) {
    setAttendance((prev) => ({ ...prev, [studentId]: status }))
  }

  async function handleCreateSession(e) {
    e.preventDefault()
    if (!selectedBatchId) {
      setSessionError('Select a batch first.')
      return
    }
    if (!sessionDate || !subject.trim() || !startTime || !endTime) {
      setSessionError('Date, subject, start time and end time are required.')
      return
    }
    setCreatingSession(true)
    setSessionError('')
    try {
      const sessionRes = await apiFetch(`${API_BASE}/api/v1/attendance/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: selectedBatchId,
          date: sessionDate,
          subject: subject.trim(),
          startTime,
          endTime,
        }),
      })
      const sessionJson = await sessionRes.json().catch(() => ({}))
      if (!sessionRes.ok) {
        throw new Error(sessionJson.error || sessionJson.message || 'Failed to create attendance session')
      }
      setSessionId(sessionJson.id)
    } catch (e) {
      setSessionError(e.message)
    } finally {
      setCreatingSession(false)
    }
  }

  async function handleMarkAttendance(e) {
    e.preventDefault()
    if (!sessionId || !students.length) {
      setSaveError('Create a session first and ensure the batch has students.')
      return
    }
    setSaving(true)
    setSaveError('')
    setSaveSuccess('')
    try {
      const records = students.map((s) => ({
        studentId: s.student_id,
        status: attendance[s.student_id] || 'PRESENT',
      }))
      const recRes = await apiFetch(`${API_BASE}/api/v1/attendance/sessions/${sessionId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      })
      const recJson = await recRes.json().catch(() => ({}))
      if (!recRes.ok) {
        throw new Error(recJson.error || recJson.message || 'Failed to mark attendance')
      }
      setSaveSuccess('Attendance marked for this session.')
      // Refresh the page so the form and list reset cleanly
      window.setTimeout(() => {
        window.location.reload()
      }, 800)
    } catch (e) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Attendance</h2>
        <div className="toolbar">
          <select
            value={selectedBatchId}
            onChange={(e) => setSelectedBatchId(e.target.value)}
          >
            <option value="">Select batch</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="small">Loading students…</p>}

      {!error && (
        <>
          <section className="card">
            <h3>New attendance session</h3>
            <p className="small">
              Select a batch above, set the session details, then create the session and mark attendance for each student.
            </p>
            {sessionError && <p className="error">{sessionError}</p>}
            <form onSubmit={handleCreateSession}>
              <div className="form-row">
                <div className="form-group" style={{ minWidth: '160px' }}>
                  <label>Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Math"
                  />
                </div>
                <div className="form-group" style={{ minWidth: '120px' }}>
                  <label>Start time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ minWidth: '120px' }}>
                  <label>End time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
              <div
                className="modal-actions"
                style={{ justifyContent: 'space-between', marginTop: '0.75rem' }}
              >
                <div>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={
                      creatingSession || !!sessionId || !selectedBatchId || !students.length
                    }
                  >
                    {creatingSession
                      ? 'Creating…'
                      : sessionId
                      ? 'Session created'
                      : 'Create session'}
                  </button>
                  {!selectedBatchId && (
                    <span className="small" style={{ marginLeft: '0.5rem' }}>
                      Select a batch to create a session.
                    </span>
                  )}
                  {selectedBatchId && !students.length && (
                    <span className="small" style={{ marginLeft: '0.5rem' }}>
                      No students in this batch.
                    </span>
                  )}
                </div>
                {sessionId && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setSessionId(null)
                      setSessionError('')
                      setSaveSuccess('')
                    }}
                  >
                    New session
                  </button>
                )}
              </div>
            </form>
          </section>

          {selectedBatchId && (
            <>
              {sessionId && (
                <div
                  className="card"
                  style={{
                    marginTop: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{ marginBottom: '0.25rem' }}>Mark attendance</h3>
                    <p className="small">
                      Session on {sessionDate} for {subject || '—'} ({startTime}–{endTime})
                    </p>
                    {saveError && <p className="error" style={{ marginTop: '0.25rem' }}>{saveError}</p>}
                    {saveSuccess && (
                      <p className="small" style={{ color: '#166534', marginTop: '0.25rem' }}>
                        {saveSuccess}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleMarkAttendance}
                    disabled={saving || !students.length}
                  >
                    {saving ? 'Saving…' : 'Mark attendance'}
                  </button>
                </div>
              )}

              <div className="table-wrapper" style={{ marginTop: '1rem' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Enrollment #</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          No students in this batch.
                        </td>
                      </tr>
                    )}
                    {students.map((s) => (
                      <tr key={s.student_id}>
                        <td>{s.enrollment_number}</td>
                        <td>{s.full_name}</td>
                        <td>{s.email}</td>
                        <td>{s.phone_number}</td>
                        <td>
                          {sessionId ? (
                            <select
                              value={attendance[s.student_id] || 'PRESENT'}
                              onChange={(e) => setStatus(s.student_id, e.target.value)}
                            >
                              <option value="PRESENT">PRESENT</option>
                              <option value="ABSENT">ABSENT</option>
                            </select>
                          ) : (
                            <span className="small" style={{ color: '#6b7280' }}>
                              Create a session first
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export default Attendance

