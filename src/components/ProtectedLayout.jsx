import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getAuthToken } from '../auth'
import { SearchProvider, useSearch } from '../contexts/SearchContext.jsx'
import Sidebar from './Sidebar.jsx'
import AppHeader from './AppHeader.jsx'
import PageTransition from './PageTransition.jsx'
import BottomNav from './BottomNav.jsx'
import clsx from 'clsx'

function ProtectedLayoutInner() {
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { searchValue, setSearchValue } = useSearch()

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        isMobileOpen={sidebarMobileOpen}
        onCloseMobile={() => setSidebarMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />
      <div className={clsx('transition-[padding] duration-300', 'pl-0', sidebarCollapsed ? 'md:pl-[72px] lg:pl-[72px]' : 'md:pl-64')}>
        <AppHeader
          onMenuClick={() => setSidebarMobileOpen(true)}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />
        <main className="px-4 pb-24 pt-4 md:px-6 md:pb-6 md:pt-6">
          <PageTransition className="mx-auto max-w-7xl">
            <Outlet />
          </PageTransition>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}

export default function ProtectedLayout() {
  const token = getAuthToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return (
    <SearchProvider>
      <ProtectedLayoutInner />
    </SearchProvider>
  )
}
