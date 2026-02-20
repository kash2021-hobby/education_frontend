import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
} from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'

const navItems = [
  { to: '/', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/leads', end: false, label: 'Leads', icon: Users },
  { to: '/students', end: false, label: 'Students', icon: GraduationCap },
  { to: '/batches', end: false, label: 'Batches', icon: FolderOpen },
  { to: '/attendance', end: false, label: 'Attendance', icon: CalendarCheck },
  { to: '/courses', end: false, label: 'Courses', icon: BookOpen },
]

export default function Sidebar({ isMobileOpen, onCloseMobile, collapsed, onCollapsedChange }) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = collapsed !== undefined ? collapsed : internalCollapsed
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed

  const linkClass = ({ isActive }) =>
    clsx(
      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
      isActive
        ? 'bg-green-50 text-green-700'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
    )

  return (
    <>
      {/* Mobile overlay - only when sidebar drawer is open (md and up use bottom nav, sidebar hidden on mobile) */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm md:hidden',
          isMobileOpen ? 'block' : 'hidden'
        )}
        onClick={onCloseMobile}
        aria-hidden
      />
      <aside
        className={clsx(
          'fixed left-0 top-0 z-50 hidden h-full flex-col border-r border-slate-200 bg-white shadow-sm transition-all duration-300 md:flex',
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-64',
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64 lg:translate-x-0 lg:w-64'
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-200 px-4">
          {!isCollapsed && (
            <NavLink to="/" className="flex items-center gap-2 font-semibold text-slate-900">
              <LayoutGrid className="h-6 w-6 text-green-600" />
              <span className="hidden lg:inline">Education CRM</span>
            </NavLink>
          )}
          <button
            type="button"
            onClick={() => setCollapsed?.(!isCollapsed)}
            className="hidden lg:flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={linkClass}
              onClick={() => onCloseMobile?.()}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {(!isCollapsed || !isMobileOpen) && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
