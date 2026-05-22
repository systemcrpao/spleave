/**
 * Navigation.jsx
 *
 * Renders a role-aware navigation.
 * On mobile (≤ md): a sticky bottom tab bar (max 5 tabs; shows the most-used for each role).
 * On desktop (≥ md): a left sidebar drawer with full menu labels.
 *
 * Menu sections:
 *  - Common   → All roles
 *  - Officer  → Officer only
 *  - Executive→ Executive only
 */
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  IconHome, IconCalendarPlus, IconHistory,
  IconUserCheck, IconClipboardList, IconChartBar,
  IconBriefcase, IconCheckCircle, IconLogout, IconX,
} from './icons'

// ---------------------------------------------------------------------------
// Menu config
// ---------------------------------------------------------------------------
const COMMON_MENUS = [
  { path: '/dashboard',     label: 'แดชบอร์ด',        icon: IconHome         },
  { path: '/leave-request', label: 'ยื่นคำขอลา',       icon: IconCalendarPlus },
  { path: '/leave-history', label: 'ประวัติการลา',      icon: IconHistory      },
]

const OFFICER_MENUS = [
  { path: '/officer/registrations', label: 'อนุมัติผู้ใช้งานใหม่',   icon: IconUserCheck    },
  { path: '/officer/leave-manage',  label: 'ตรวจสอบใบลา',            icon: IconClipboardList},
  { path: '/officer/org-report',    label: 'รายงานภาพรวมองค์กร',     icon: IconChartBar     },
]

const EXECUTIVE_MENUS = [
  { path: '/executive/dashboard',  label: 'กระดานผู้บริหาร',          icon: IconBriefcase    },
  { path: '/executive/approvals',  label: 'อนุมัติการลา',              icon: IconCheckCircle  },
]

// ---------------------------------------------------------------------------
// Sidebar (desktop drawer or mobile overlay)
// ---------------------------------------------------------------------------
export function Sidebar({ open, onClose }) {
  const { user, isOfficer, isExecutive, logout } = useAuth()

  const roleLabel = { User: 'ผู้ใช้งานทั่วไป', Officer: 'เจ้าหน้าที่', Executive: 'ผู้บริหาร' }

  return (
    <>
      {/* Overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <aside
        className={[
          'fixed top-0 left-0 z-30 h-full w-72 bg-white shadow-xl flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'md:translate-x-0 md:static md:shadow-none md:border-r md:border-gray-100',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            {user?.pictureUrl ? (
              <img src={user.pictureUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                {user?.name?.[0] ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.department}</p>
              <span className="badge badge-pending mt-0.5">{roleLabel[user?.role] ?? user?.role}</span>
            </div>
          </div>
          {/* Close button (mobile) */}
          <button onClick={onClose} className="md:hidden p-1 rounded-lg hover:bg-gray-100">
            <IconX />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <MenuSection label="ทั่วไป" items={COMMON_MENUS} onNav={onClose} />
          {isOfficer   && <MenuSection label="เจ้าหน้าที่" items={OFFICER_MENUS}    onNav={onClose} />}
          {isExecutive && <MenuSection label="ผู้บริหาร"   items={EXECUTIVE_MENUS} onNav={onClose} />}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-6 pt-2 border-t border-gray-100">
          <button
            onClick={logout}
            className="btn-secondary w-full gap-2 text-red-500 hover:bg-red-50"
          >
            <IconLogout />
            ออกจากระบบ
          </button>
        </div>
      </aside>
    </>
  )
}

// ---------------------------------------------------------------------------
// Bottom Tab Bar (mobile, max 4 tabs)
// ---------------------------------------------------------------------------
export function BottomNav() {
  const { isOfficer, isExecutive } = useAuth()
  const location = useLocation()

  // Build condensed tab list per role
  let tabs = [...COMMON_MENUS]
  if (isOfficer)   tabs = [...COMMON_MENUS.slice(0, 2), ...OFFICER_MENUS.slice(0, 2)]
  if (isExecutive) tabs = [...COMMON_MENUS.slice(0, 2), ...EXECUTIVE_MENUS]

  // Cap at 5 tabs
  tabs = tabs.slice(0, 5)

  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 bg-white border-t border-gray-200 flex md:hidden"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ path, label, icon: Icon }) => {
        const active = location.pathname === path ||
          (path !== '/dashboard' && location.pathname.startsWith(path))
        return (
          <NavLink
            key={path}
            to={path}
            className={`bottom-nav-item flex-1 ${active ? 'active' : ''}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] leading-tight text-center">{label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function MenuSection({ label, items, onNav }) {
  return (
    <div>
      <p className="px-2 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
        {label}
      </p>
      {items.map(({ path, label: itemLabel, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          onClick={onNav}
          className={({ isActive }) =>
            [
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
            ].join(' ')
          }
        >
          <Icon />
          {itemLabel}
        </NavLink>
      ))}
    </div>
  )
}
