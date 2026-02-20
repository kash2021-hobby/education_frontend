import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiFetch } from '../api'
import { DashboardSkeleton } from '../components/Skeleton'
import {
  LayoutDashboard,
  Users,
  UserCheck,
  BookOpen,
  RefreshCw,
  Sparkles,
  Lightbulb,
  CheckCircle,
  GraduationCap,
  Loader2,
} from 'lucide-react'

const statCards = [
  { key: 'totalLeads', label: 'Total leads', link: '/leads', icon: Users, color: 'text-green-600' },
  { key: 'newLeads', label: 'New leads', link: '/leads?status=NEW', icon: Sparkles, color: 'text-blue-600' },
  { key: 'interestedLeads', label: 'Interested', link: '/leads?status=INTERESTED', icon: Lightbulb, color: 'text-violet-600' },
  { key: 'convertedLeads', label: 'Converted', link: '/leads?status=CONVERTED', icon: CheckCircle, color: 'text-emerald-600' },
  { key: 'totalStudents', label: 'Total students', link: '/students', icon: Users, color: 'text-slate-600' },
  { key: 'activeStudents', label: 'Active students', link: '/students?status=ACTIVE', icon: UserCheck, color: 'text-emerald-600' },
  { key: 'totalBatches', label: 'Total batches', link: '/batches', icon: BookOpen, color: 'text-slate-600' },
  { key: 'runningBatches', label: 'Running batches', link: '/batches', icon: GraduationCap, color: 'text-green-600' },
]

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
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <button
          type="button"
          onClick={fetchStats}
          disabled={loading}
          className="btn-secondary flex items-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}{' '}
          <button type="button" onClick={fetchStats} className="btn-link ml-2">
            Retry
          </button>
        </div>
      )}

      {loading && !error && <DashboardSkeleton />}

      {!loading && !error && (
        <>
          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Leads
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.slice(0, 4).map(({ key, label, link, icon: Icon, color }) => (
                <Link
                  key={key}
                  to={link}
                  className="card-hover flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <Icon className={`mb-2 h-6 w-6 ${color}`} aria-hidden />
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className="text-2xl font-bold text-slate-900">{stats[key]}</div>
                  <span className="mt-2 text-sm font-medium text-green-600 hover:underline">
                    View leads →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Students & Batches
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.slice(4, 8).map(({ key, label, link, icon: Icon, color }) => (
                <Link
                  key={key}
                  to={link}
                  className="card-hover flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <Icon className={`mb-2 h-6 w-6 ${color}`} aria-hidden />
                  <div className="text-sm text-slate-500">{label}</div>
                  <div className="text-2xl font-bold text-slate-900">{stats[key]}</div>
                  <span className="mt-2 text-sm font-medium text-green-600 hover:underline">
                    View →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default HomeDashboard
