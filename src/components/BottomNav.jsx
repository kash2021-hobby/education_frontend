import { NavLink } from 'react-router-dom'
import { LayoutDashboard, GraduationCap, Users, MoreHorizontal, FolderOpen, CalendarCheck, BookOpen } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const mainNavItems = [
  { to: '/', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/students', end: false, label: 'Students', icon: GraduationCap },
  { to: '/leads', end: false, label: 'Leads', icon: Users },
]

const moreNavItems = [
  { to: '/batches', end: false, label: 'Batches', icon: FolderOpen },
  { to: '/attendance', end: false, label: 'Attendance', icon: CalendarCheck },
  { to: '/courses', end: false, label: 'Courses', icon: BookOpen },
]

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)

  const linkClass = ({ isActive }) =>
    clsx(
      'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
      isActive ? 'text-green-600' : 'text-slate-500'
    )

  return (
    <>
      {/* Slide-up More menu overlay */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden',
          moreOpen ? 'block' : 'hidden'
        )}
        onClick={() => setMoreOpen(false)}
        aria-hidden
      />
      <div
        className={clsx(
          'fixed bottom-[72px] left-0 right-0 z-50 mx-4 rounded-t-2xl border border-b-0 border-slate-200 bg-white shadow-xl transition-transform duration-300 ease-out md:hidden',
          moreOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="border-b border-slate-200 px-4 py-3">
          <p className="text-sm font-semibold text-slate-900">More</p>
        </div>
        <nav className="max-h-[60vh] overflow-y-auto p-2">
          {moreNavItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-slate-700',
                  isActive ? 'bg-green-50 text-green-700 font-medium' : 'hover:bg-slate-50'
                )
              }
              onClick={() => setMoreOpen(false)}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom nav: only visible below md (768px). Log in first to see it. */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[60] flex min-h-[56px] items-center justify-around border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:hidden"
        style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
      >
        {mainNavItems.map(({ to, end, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={end} className={linkClass}>
            <Icon className="h-5 w-5 shrink-0" />
            <span>{label}</span>
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className={clsx(
            'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-2 py-2 text-xs font-medium transition-colors',
            moreOpen ? 'text-green-600' : 'text-slate-500'
          )}
          aria-label="More menu"
        >
          <MoreHorizontal className="h-5 w-5 shrink-0" />
          <span>More</span>
        </button>
      </nav>
    </>
  )
}
