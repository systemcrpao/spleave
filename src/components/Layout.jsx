/**
 * Layout.jsx
 *
 * Main application shell:
 * - Desktop: fixed left Sidebar + scrollable content area
 * - Mobile:  top AppBar + sticky BottomNav (content scrolls between them)
 *
 * Usage: wrap authenticated pages inside <Layout>
 */
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Sidebar, BottomNav } from './Navigation'
import { useAuth } from '../context/AuthContext'
import { IconMenu, IconBell } from './icons'

// Map paths to page titles (Thai)
const PAGE_TITLES = {
  '/dashboard':              'แดชบอร์ด',
  '/leave-request':          'ยื่นคำขอลา',
  '/leave-history':          'ประวัติการลา',
  '/officer/registrations':  'อนุมัติผู้ใช้งานใหม่',
  '/officer/leave-manage':   'ตรวจสอบใบลา',
  '/officer/org-report':     'รายงานภาพรวม',
  '/executive/dashboard':    'กระดานผู้บริหาร',
  '/executive/approvals':    'อนุมัติการลา',
}

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const location = useLocation()

  const pageTitle = PAGE_TITLES[location.pathname] ?? 'ระบบบริหารจัดการการลา'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* ── Sidebar เดียว: desktop = static in-flow, mobile = overlay ── */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ── Main column ────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top AppBar */}
        <header className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
          {/* Hamburger (mobile only) */}
          <button
            className="md:hidden p-1.5 -ml-1 rounded-xl hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
            aria-label="เปิดเมนู"
          >
            <IconMenu />
          </button>

          {/* Title */}
          <h1 className="flex-1 text-base font-semibold text-gray-900 truncate">{pageTitle}</h1>

          {/* Notification bell (placeholder) */}
          <button className="relative p-1.5 rounded-xl hover:bg-gray-100">
            <IconBell />
          </button>

          {/* Avatar (desktop — sidebar already shows this on mobile) */}
          {user?.pictureUrl ? (
            <img
              src={user.pictureUrl}
              alt={user.name}
              className="hidden md:block w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="hidden md:flex w-8 h-8 rounded-full bg-primary-100 items-center justify-center text-primary-600 font-bold text-sm">
              {user?.name?.[0] ?? '?'}
            </div>
          )}
        </header>

        {/* Scrollable page area */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          <div className="max-w-2xl mx-auto px-4 py-5">
            <Outlet />
          </div>
        </main>

        {/* Mobile bottom tab bar */}
        <BottomNav />
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'font-sans text-sm',
          duration: 3000,
          style: { borderRadius: '12px', maxWidth: '90vw' },
        }}
      />
    </div>
  )
}
