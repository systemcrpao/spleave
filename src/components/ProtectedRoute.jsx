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

function ForbiddenScreen() {
  return <Navigate to="/dashboard" replace />
}

// ---------------------------------------------------------------------------
// ProtectedRoute
// ---------------------------------------------------------------------------
export default function ProtectedRoute({ roles }) {
  const { user, status } = useAuth()

  // ยังไม่ได้ login → ไปหน้า login
  if (status === 'idle')    return <Navigate to="/login" replace />
  if (status === 'loading') return <FullScreenSpinner />
  if (status === 'error')   return <Navigate to="/login" replace />
  if (!user)                return <Navigate to="/login" replace />

  // ยังไม่ได้กรอกข้อมูลสมัคร → บังคับสมัครก่อน
  if (user.userStatus === 'new')     return <Navigate to="/register" replace />

  // รอการอนุมัติ
  if (user.userStatus === 'pending') return <Navigate to="/pending" replace />

  // ถูกปฏิเสธ
  if (user.userStatus === 'rejected') return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ background: '#111' }}>
      <p className="text-4xl">🚫</p>
      <p className="text-white font-semibold">บัญชีถูกปฏิเสธ</p>
      <p className="text-gray-400 text-sm">กรุณาติดต่อผู้ดูแลระบบ</p>
    </div>
  )

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <ForbiddenScreen />
  }

  return <Outlet />
}
