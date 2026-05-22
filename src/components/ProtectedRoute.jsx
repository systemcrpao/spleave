/**
 * ProtectedRoute.jsx
 *
 * A declarative role-based route guard.
 *
 * Usage:
 *   <ProtectedRoute />                    ← any authenticated user
 *   <ProtectedRoute roles={['Officer']} /> ← Officer only
 *   <ProtectedRoute roles={['Officer','Executive']} /> ← either role
 *
 * States:
 *  - 'loading'  → show full-screen spinner while LIFF initialises
 *  - 'error'    → show error screen with retry button
 *  - unauthenticated (no user) → redirect to /login
 *  - inactive account  → show "Pending Approval" screen
 *  - wrong role → show "Forbidden" screen
 *  - ok         → render <Outlet />
 */
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ---------------------------------------------------------------------------
// Full-screen loading / error helpers
// ---------------------------------------------------------------------------
function FullScreenSpinner() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <div className="w-12 h-12 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
      <p className="text-sm text-gray-500">กำลังเชื่อมต่อ LINE…</p>
    </div>
  )
}

function FullScreenError({ message, onRetry }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-white text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-3xl">
        ✕
      </div>
      <p className="font-semibold text-gray-800">เกิดข้อผิดพลาด</p>
      <p className="text-sm text-gray-500 max-w-xs">{message}</p>
      <button className="btn-primary" onClick={onRetry}>
        ลองใหม่อีกครั้ง
      </button>
    </div>
  )
}

function PendingApprovalScreen() {
  const { logout } = useAuth()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-white text-center">
      <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500 text-3xl">
        ⏳
      </div>
      <p className="font-semibold text-gray-800">บัญชีรอการอนุมัติ</p>
      <p className="text-sm text-gray-500 max-w-xs">
        บัญชีของคุณอยู่ระหว่างรอการตรวจสอบจากเจ้าหน้าที่
        กรุณารอการอนุมัติก่อนเข้าใช้งานระบบ
      </p>
      <button className="btn-secondary" onClick={logout}>
        ออกจากระบบ
      </button>
    </div>
  )
}

function ForbiddenScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-white text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 text-3xl">
        🚫
      </div>
      <p className="font-semibold text-gray-800">ไม่มีสิทธิ์เข้าถึง</p>
      <p className="text-sm text-gray-500 max-w-xs">
        คุณไม่มีสิทธิ์เข้าถึงหน้านี้
      </p>
      <Navigate to="/dashboard" replace />
    </div>
  )
}

// ---------------------------------------------------------------------------
// ProtectedRoute
// ---------------------------------------------------------------------------
/**
 * @param {{ roles?: Array<'User'|'Officer'|'Executive'> }} props
 */
export default function ProtectedRoute({ roles }) {
  const { user, status, error } = useAuth()

  // ยังไม่ได้ login → ไปหน้า login
  if (status === 'idle')    return <Navigate to="/login" replace />
  if (status === 'loading') return <FullScreenSpinner />
  if (status === 'error')   return <Navigate to="/login" replace />
  if (!user)                return <Navigate to="/login" replace />
  if (!user.isActive)       return <PendingApprovalScreen />

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <ForbiddenScreen />
  }

  return <Outlet />
}
