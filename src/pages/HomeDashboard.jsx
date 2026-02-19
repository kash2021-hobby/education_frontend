import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'

function HomeDashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    newLeads: 0,
    interestedLeads: 0,
    convertedLeads: 0,
    totalStudents: 0,
    activeStudents: 0,
    totalBatches: 0,
    runningBatches: 0,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function fetchStats() {
    setLoading(true)
    setError('')
    try {
      const queries = [
        '/api/v1/leads?page=1&pageSize=1',
        '/api/v1/leads?status=NEW&page=1&pageSize=1',
        '/api/v1/leads?status=INTERESTED&page=1&pageSize=1',
        '/api/v1/leads?status=CONVERTED&page=1&pageSize=1',
        '/api/v1/students?page=1&pageSize=1',
        '/api/v1/students?status=ACTIVE&page=1&pageSize=1',
        '/api/v1/batches',
      ]

      const [
        leadsAllRes,
        leadsNewRes,
        leadsInterestedRes,
        leadsConvertedRes,
        studentsAllRes,
        studentsActiveRes,
        batchesRes,
      ] = await Promise.all(queries.map((url) => apiFetch(url)))

      if (
        !leadsAllRes.ok ||
        !leadsNewRes.ok ||
        !leadsInterestedRes.ok ||
        !leadsConvertedRes.ok ||
        !studentsAllRes.ok ||
        !studentsActiveRes.ok ||
        !batchesRes.ok
      ) {
        throw new Error('Failed to load dashboard stats')
      }

      const [
        leadsAll,
        leadsNew,
        leadsInterested,
        leadsConverted,
        studentsAll,
        studentsActive,
        batchesJson,
      ] = await Promise.all([
        leadsAllRes.json(),
        leadsNewRes.json(),
        leadsInterestedRes.json(),
        leadsConvertedRes.json(),
        studentsAllRes.json(),
        studentsActiveRes.json(),
        batchesRes.json(),
      ])

      const batches = batchesJson.data || []
      const running = batches.filter((b) => b.status !== 'COMPLETED').length

      setStats({
        totalLeads: Number(leadsAll.total) || 0,
        newLeads: Number(leadsNew.total) || 0,
        interestedLeads: Number(leadsInterested.total) || 0,
        convertedLeads: Number(leadsConverted.total) || 0,
        totalStudents: Number(studentsAll.total) || 0,
        activeStudents: Number(studentsActive.total) || 0,
        totalBatches: batches.length,
        runningBatches: running,
      })
    } catch (e) {
      setError(e.message || 'Failed to load dashboard stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
        <button type="button" onClick={fetchStats} disabled={loading} className="btn-secondary">
          {loading ? (
            <>
              <span className="loading-pulse" /> Refreshing…
            </>
          ) : (
            'Refresh'
          )}
        </button>
      </div>

      {error && (
        <p className="error">
          {error}{' '}
          <button type="button" onClick={fetchStats} className="retry-btn">
            Retry
          </button>
        </p>
      )}
      {loading && !error && (
        <p className="small">
          <span className="loading-pulse" /> Loading overview…
        </p>
      )}

      {!loading && !error && (
        <>
          <section className="section">
            <h3 className="section-title">Leads</h3>
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-card-icon" aria-hidden>📋</div>
                <div className="stat-card-title">Total leads</div>
                <div className="stat-card-value">{stats.totalLeads}</div>
                <Link to="/leads">View leads →</Link>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" aria-hidden>✨</div>
                <div className="stat-card-title">New leads</div>
                <div className="stat-card-value">{stats.newLeads}</div>
                <Link to="/leads?status=NEW">View leads →</Link>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" aria-hidden>💡</div>
                <div className="stat-card-title">Interested</div>
                <div className="stat-card-value">{stats.interestedLeads}</div>
                <Link to="/leads?status=INTERESTED">View leads →</Link>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" aria-hidden>✅</div>
                <div className="stat-card-title">Converted</div>
                <div className="stat-card-value">{stats.convertedLeads}</div>
                <Link to="/leads?status=CONVERTED">View leads →</Link>
              </div>
            </div>
          </section>

          <section className="section">
            <h3 className="section-title">Students & Batches</h3>
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-card-icon" aria-hidden>👥</div>
                <div className="stat-card-title">Total students</div>
                <div className="stat-card-value">{stats.totalStudents}</div>
                <Link to="/students">View students →</Link>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" aria-hidden>🎓</div>
                <div className="stat-card-title">Active students</div>
                <div className="stat-card-value">{stats.activeStudents}</div>
                <Link to="/students?status=ACTIVE">View students →</Link>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" aria-hidden>📚</div>
                <div className="stat-card-title">Total batches</div>
                <div className="stat-card-value">{stats.totalBatches}</div>
                <Link to="/batches">View batches →</Link>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon" aria-hidden>🔄</div>
                <div className="stat-card-title">Running batches</div>
                <div className="stat-card-value">{stats.runningBatches}</div>
                <Link to="/batches">View batches →</Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default HomeDashboard

