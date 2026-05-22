/**
 * AuthContext.jsx
 *
 * จัดการ LINE LIFF และ session ผู้ใช้ (uid, name, department, role)
 * Roles: 'User' | 'Officer' | 'Executive'
 *
 * DEV MODE: เมื่อไม่มี VITE_LIFF_ID จะแสดงหน้า Login แต่ให้เลือก Role
 * เพื่อเข้าระบบแบบจำลองแทน LIFF จริง
 */
import { createContext, useContext, useState, useCallback } from 'react'
import liff from '@line/liff'
import { fetchUserProfile } from '../utils/api'

const AuthContext = createContext(null)

const LIFF_ID     = import.meta.env.VITE_LIFF_ID || ''
export const IS_DEV_MODE = !LIFF_ID

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }) {
  /** @type {'idle'|'loading'|'ready'|'error'} */
  const [status, setStatus] = useState('idle')
  const [user,   setUser]   = useState(null)
  const [error,  setError]  = useState(null)

  // ----- startLogin: เรียกจากหน้า LoginPage เมื่อผู้ใช้กดปุ่ม ─────────────
  /**
   * @param {string} [devRole] - ใช้เฉพาะ Dev Mode: 'User'|'Officer'|'Executive'
   */
  const startLogin = useCallback(async (devRole = 'User') => {
    setStatus('loading')
    setError(null)

    // ── Dev Mode ──────────────────────────────────────────────────────────
    if (IS_DEV_MODE) {
      await new Promise(r => setTimeout(r, 1000)) // จำลอง loading
      setUser({
        uid:        'U_DEV_000000000000000000000000000',
        name:       `ทดสอบ ระบบ [${devRole}]`,
        pictureUrl: null,
        department: 'ฝ่ายพัฒนาระบบ',
        position:   'นักวิชาการคอมพิวเตอร์',
        role:       devRole,
        isActive:   true,
      })
      setStatus('ready')
      return
    }

    // ── Production: LIFF จริง ────────────────────────────────────────────
    try {
      await liff.init({ liffId: LIFF_ID })

      if (!liff.isLoggedIn()) {
        liff.login()
        // หน้าจะถูก redirect โดย LIFF — ไม่ต้อง setStatus อะไรเพิ่ม
        return
      }

      const lineProfile = await liff.getProfile()
      const uid         = lineProfile.userId
      const profile     = await fetchUserProfile(uid)

      setUser({
        uid,
        name:       lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
        department: profile?.department ?? '',
        position:   profile?.position   ?? '',
        role:       profile?.role       ?? 'User',
        isActive:   profile?.isActive   ?? false,
      })
      setStatus('ready')
    } catch (err) {
      console.error('[AuthContext] LIFF init failed:', err)
      setError(err.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
      setStatus('error')
    }
  }, [])

  // ----- resumeSession: ตรวจสอบ LIFF token ที่ยังอยู่ (เรียกจาก LoginPage) ──
  const resumeSession = useCallback(async () => {
    if (IS_DEV_MODE) return false // ไม่มี session ใน dev mode
    try {
      await liff.init({ liffId: LIFF_ID })
      if (!liff.isLoggedIn()) return false

      setStatus('loading')
      const lineProfile = await liff.getProfile()
      const profile     = await fetchUserProfile(lineProfile.userId)

      setUser({
        uid:        lineProfile.userId,
        name:       lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl,
        department: profile?.department ?? '',
        position:   profile?.position   ?? '',
        role:       profile?.role       ?? 'User',
        isActive:   profile?.isActive   ?? false,
      })
      setStatus('ready')
      return true
    } catch {
      return false
    }
  }, [])

  // ----- Logout ─────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    if (!IS_DEV_MODE && liff.isLoggedIn()) liff.logout()
    setUser(null)
    setStatus('idle')
  }, [])

  const isUser      = user?.role === 'User'
  const isOfficer   = user?.role === 'Officer'
  const isExecutive = user?.role === 'Executive'
  const isPrivileged = isOfficer || isExecutive

  const value = {
    user, status, error,
    isUser, isOfficer, isExecutive, isPrivileged,
    startLogin, resumeSession, logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
