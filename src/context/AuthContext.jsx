/**
 * AuthContext.jsx
 *
 * Auth flow (Production):
 *   App mount → liff.init() ทันที
 *     ├─ liff.isLoggedIn() = true  → fetch profile → status='ready'
 *     │   (กรณีกลับจาก LINE OAuth หรือ session ยังอยู่)
 *     └─ liff.isLoggedIn() = false → status='idle' → แสดงปุ่ม Login
 *
 *   ผู้ใช้กดปุ่ม → startLogin() → liff.login() → redirect ไป LINE
 *   กลับมา → app reload → useEffect auto-detect session อีกครั้ง
 *
 * Auth flow (Dev Mode — ไม่มี VITE_LIFF_ID):
 *   status='idle' → แสดงตัวเลือก Role → กดปุ่ม → fake user
 */
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import liff from '@line/liff'
import { fetchUserProfile, gasPost } from '../utils/api'

const AuthContext = createContext(null)

const LIFF_ID          = import.meta.env.VITE_LIFF_ID || ''
export const IS_DEV_MODE = !LIFF_ID

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }) {
  /**
   * status:
   *   'loading' — กำลังตรวจสอบ LIFF session (แสดง splash)
   *   'idle'    — ไม่ได้ login → แสดงปุ่ม Login
   *   'ready'   — login สำเร็จ → route ตาม userStatus
   *   'error'   — เกิดข้อผิดพลาด
   */
  const [status, setStatus] = useState('loading')
  const [user,   setUser]   = useState(null)
  const [error,  setError]  = useState(null)

  // ----- Auto-init LIFF เมื่อ app โหลด ────────────────────────────────────
  useEffect(() => {
    if (IS_DEV_MODE) {
      setStatus('idle')
      return
    }

    let cancelled = false

    const checkSession = async () => {
      try {
        /**
         * liff.init() ถูกเรียกแล้วใน main.jsx ก่อน React render
         * ดังนั้นตรงนี้เพียงแค่ตรวจว่า isLoggedIn() หรือเปล่า
         * ไม่ต้อง init ซ้ำ (การ init ซ้ำจะ throw error)
         */
        if (!liff.isLoggedIn()) {
          if (!cancelled) setStatus('idle')
          return
        }

        // ── Login สำเร็จ: ดึงข้อมูลจาก LINE + GAS ──────────────────────
        const lineProfile = await liff.getProfile()
        const profile     = await fetchUserProfile(lineProfile.userId)

        if (!cancelled) {
          setUser({
            uid:        lineProfile.userId,
            name:       profile?.name       || lineProfile.displayName,
            pictureUrl: lineProfile.pictureUrl,
            department: profile?.department ?? '',
            position:   profile?.position   ?? '',
            role:       profile?.role       ?? 'User',
            userStatus: profile?.userStatus ?? 'new',
            isActive:   profile?.isActive   ?? false,
          })
          setStatus('ready')
        }
      } catch (err) {
        console.error('[AuthContext] liff.init failed:', err)
        // ไม่แสดง error หน้าแดง → แค่แสดงปุ่ม login ใหม่
        if (!cancelled) {
          setError(err.message ?? 'เกิดข้อผิดพลาด')
          setStatus('idle')
        }
      }
    }

    checkSession()
    return () => { cancelled = true }
  }, [])

  // ----- startLogin: ผู้ใช้กดปุ่ม login ───────────────────────────────────
  const startLogin = useCallback(async (devRole = 'User') => {
    setError(null)

    // ── Dev Mode ────────────────────────────────────────────────────────
    if (IS_DEV_MODE) {
      setStatus('loading')
      await new Promise(r => setTimeout(r, 600))
      setUser({
        uid:        'U_DEV_000000000000000000000000000',
        name:       `ทดสอบ ระบบ [${devRole}]`,
        pictureUrl: null,
        department: 'ฝ่ายพัฒนาระบบ',
        position:   'นักวิชาการคอมพิวเตอร์',
        role:       devRole,
        userStatus: 'active',
        isActive:   true,
      })
      setStatus('ready')
      return
    }

    // ── Production: liff.init() เสร็จแล้วใน main.jsx ──────────────────
    // เรียก liff.login() ได้เลย → redirect ไป LINE
    liff.login()
  }, [])

  // ----- registerUser: ส่งข้อมูลสมัครไปยัง GAS ──────────────────────────
  const registerUser = useCallback(async ({ name, position, department }) => {
    if (!user?.uid) throw new Error('No user session')
    await gasPost('registerUser', { uid: user.uid, name, position, department })
    setUser(prev => ({ ...prev, name, position, department, userStatus: 'pending' }))
  }, [user])

  // ----- Logout ────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (!IS_DEV_MODE && liff.isLoggedIn()) liff.logout()
    setUser(null)
    setStatus('idle')
  }, [])

  const isUser       = user?.role === 'User'
  const isOfficer    = user?.role === 'Officer'
  const isExecutive  = user?.role === 'Executive'
  const isPrivileged = isOfficer || isExecutive

  return (
    <AuthContext.Provider value={{
      user, status, error,
      isUser, isOfficer, isExecutive, isPrivileged,
      startLogin, registerUser, logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
