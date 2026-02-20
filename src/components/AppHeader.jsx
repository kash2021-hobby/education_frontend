import { useState, useRef, useEffect } from 'react'
import { Search, User, LogOut, ChevronDown, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clearAuthToken } from '../auth'
import clsx from 'clsx'

export default function AppHeader({ onMenuClick, searchValue, onSearchChange }) {
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  function handleLogout() {
    clearAuthToken()
    navigate('/login')
  }

  return (
    <header
      className={clsx(
        'sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-slate-200/80 bg-white/80 px-4 shadow-sm backdrop-blur-md md:px-6',
        'bg-white/70 supports-[backdrop-filter]:bg-white/60'
      )}
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="hidden h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:flex lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          placeholder="Search students, leads..."
          value={searchValue}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="min-h-[44px] w-full rounded-lg border border-slate-200 bg-slate-50/80 py-2 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:border-green-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
        />
      </div>

      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setProfileOpen((o) => !o)}
          className="flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            <User className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline">Profile</span>
          <ChevronDown className={clsx('h-4 w-4 transition', profileOpen && 'rotate-180')} />
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-[44px] w-full items-center gap-2 px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
