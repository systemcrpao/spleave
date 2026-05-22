/**
 * LoginPage.jsx — LINE-style login page
 *
 * รูปแบบ: พื้นหลังดำ + card ตรงกลาง + โลโก้ LINE สีเขียว
 * เหมือนหน้า access.line.me/oauth2/v2.1/login
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, IS_DEV_MODE } from '../context/AuthContext'

const DEV_ROLES = [
  { value: 'User',      label: 'ผู้ใช้งานทั่วไป',      desc: 'ยื่นลา · ดูประวัติ'                },
  { value: 'Officer',   label: 'เจ้าหน้าที่',            desc: 'ตรวจสอบใบลา · อนุมัติสมาชิก'     },
  { value: 'Executive', label: 'ผู้บริหาร',              desc: 'อนุมัติขั้นสุดท้าย · ภาพรวมองค์กร' },
]

export default function LoginPage() {
  const { startLogin, resumeSession, status, user } = useAuth()
  const navigate = useNavigate()

  const [phase,   setPhase]   = useState('splash')   // 'splash' | 'fade' | 'login'
  const [devRole, setDevRole] = useState('User')

  // ── Splash timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      if (cancelled) return
      setPhase('fade')
      await new Promise(r => setTimeout(r, 350))
      if (cancelled) return
      setPhase('login')
      if (!IS_DEV_MODE) {
        const resumed = await resumeSession()
        if (!cancelled && resumed) navigate('/dashboard', { replace: true })
      }
    }, 1600)
    return () => { cancelled = true; clearTimeout(t) }
  }, [resumeSession, navigate])

  // ── redirect เมื่อ login สำเร็จ ──────────────────────────────────────────
  useEffect(() => {
    if (status === 'ready' && user) navigate('/dashboard', { replace: true })
  }, [status, user, navigate])

  const handleLogin = () => startLogin(devRole)

  // ══════════════════════════════════════════════════════════════════════════
  //  SPLASH
  // ══════════════════════════════════════════════════════════════════════════
  if (phase === 'splash' || phase === 'fade') {
    return (
      <div
        style={{ background: '#111' }}
        className={[
          'fixed inset-0 flex flex-col items-center justify-center gap-5',
          'transition-opacity duration-350',
          phase === 'fade' ? 'opacity-0' : 'opacity-100',
        ].join(' ')}
      >
        {/* Pulsing LINE logo */}
        <div className="relative flex items-center justify-center">
          <span
            className="absolute w-24 h-24 rounded-full animate-ping opacity-20"
            style={{ background: '#06C755' }}
          />
          <div
            className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
            style={{ background: '#06C755' }}
          >
            <LineBubbleIcon className="w-12 h-12 text-white" />
          </div>
        </div>

        <div className="text-center space-y-1">
          <p className="text-2xl font-bold" style={{ color: '#06C755' }}>LINE</p>
          <p className="text-gray-400 text-xs">ระบบบริหารจัดการการลา · อบจ.เชียงราย</p>
        </div>

        <div className="flex gap-1.5 mt-1">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ background: '#06C755', opacity: 0.7, animationDelay: `${i * 0.17}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  LOGIN FORM — LINE-style
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div
      style={{ background: '#111' }}
      className="min-h-screen flex flex-col items-center justify-between py-10 px-4"
    >
      {/* spacer top */}
      <div />

      {/* ── Main Card ── */}
      <div
        className="w-full max-w-[360px] rounded-2xl overflow-hidden animate-[slideUp_0.45s_ease-out]"
        style={{ background: '#1c1c1e' }}
      >
        {/* Header */}
        <div className="flex flex-col items-center pt-8 pb-6 px-8">
          <p
            className="text-4xl font-black tracking-tight mb-1"
            style={{ color: '#06C755', fontFamily: 'Arial Black, sans-serif' }}
          >
            LINE
          </p>
          <p className="text-gray-400 text-xs text-center">
            ระบบบริหารจัดการการลา<br />องค์การบริหารส่วนจังหวัดเชียงราย
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: '#2c2c2e' }} />

        {/* Form area */}
        <div className="px-8 py-6 space-y-3">

          {/* Dev mode: role selector (แทน email/password) */}
          {IS_DEV_MODE ? (
            <>
              {/* Badge */}
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-400 text-[11px] font-semibold tracking-widest uppercase">
                  Dev Mode
                </span>
              </div>

              {/* Role select (dropdown-style) */}
              <div className="space-y-0.5">
                <label className="text-gray-500 text-xs">เลือกบทบาทสำหรับทดสอบ</label>
                <div
                  className="w-full rounded-lg overflow-hidden"
                  style={{ border: '1px solid #3a3a3c' }}
                >
                  {DEV_ROLES.map((r, i) => (
                    <button
                      key={r.value}
                      onClick={() => setDevRole(r.value)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left transition-colors"
                      style={{
                        background: devRole === r.value ? '#06C755' : 'transparent',
                        borderTop: i > 0 ? '1px solid #3a3a3c' : 'none',
                      }}
                    >
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: devRole === r.value ? '#000' : '#e5e5e5' }}
                        >
                          {r.label}
                        </p>
                        <p
                          className="text-[11px] mt-0.5"
                          style={{ color: devRole === r.value ? '#004d1f' : '#888' }}
                        >
                          {r.desc}
                        </p>
                      </div>
                      {devRole === r.value && (
                        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 20 20" fill="#000">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-5.121-5.121a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Login button */}
              <button
                onClick={handleLogin}
                disabled={status === 'loading'}
                className="w-full py-3 rounded-lg font-bold text-sm transition-opacity disabled:opacity-60 mt-1"
                style={{ background: '#06C755', color: '#000' }}
              >
                {status === 'loading' ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    กำลังเชื่อมต่อ…
                  </span>
                ) : (
                  'เข้าสู่ระบบ'
                )}
              </button>
            </>
          ) : (
            /* ── Production: LINE OAuth ── */
            <>
              {/* Info text */}
              <p className="text-gray-400 text-sm text-center leading-relaxed">
                กรุณาเข้าสู่ระบบด้วยบัญชี LINE<br />
                เพื่อใช้งานระบบการลาออนไลน์
              </p>

              {/* LINE login button */}
              <button
                onClick={handleLogin}
                disabled={status === 'loading'}
                className="w-full py-3 rounded-lg font-bold text-sm transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: '#06C755', color: '#000' }}
              >
                {status === 'loading' ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                    กำลังเชื่อมต่อ…
                  </>
                ) : (
                  <>
                    <LineBubbleIcon className="w-5 h-5" style={{ color: '#000' }} />
                    เข้าสู่ระบบด้วย LINE
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px" style={{ background: '#3a3a3c' }} />
                <span className="text-gray-500 text-xs">เข้าสู่ระบบด้วยวิธีอื่น</span>
                <div className="flex-1 h-px" style={{ background: '#3a3a3c' }} />
              </div>

              {/* QR placeholder button */}
              <button
                className="w-full py-3 rounded-lg text-sm font-medium border transition-colors"
                style={{ borderColor: '#3a3a3c', color: '#e5e5e5', background: 'transparent' }}
                onClick={handleLogin}
              >
                เข้าสู่ระบบด้วยตัวลาริโค้ด
              </button>
            </>
          )}

          {/* Error */}
          {status === 'error' && (
            <p className="text-center text-xs text-red-400 pt-1">
              เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
            </p>
          )}

          {/* "กรณีเข้าสู่ระบบไม่ได้" */}
          <div className="pt-2 text-center">
            <p className="text-gray-600 text-xs">กรณีเข้าสู่ระบบไม่ได้</p>
            <button className="text-xs mt-0.5" style={{ color: '#06C755' }}>
              ติดต่อผู้ดูแลระบบ
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center space-y-1">
        <p className="text-gray-600 text-[11px]">© LY Corporation · อบจ.เชียงราย</p>
        <div className="flex items-center justify-center gap-3">
          <button className="text-gray-600 text-[11px] hover:text-gray-400">นโยบายความเป็นส่วนตัว</button>
          <span className="text-gray-700">·</span>
          <button className="text-gray-600 text-[11px] hover:text-gray-400">ข้อกำหนดการใช้บริการ</button>
        </div>
      </div>
    </div>
  )
}

// ─── Inline SVG: LINE bubble icon ────────────────────────────────────────────
function LineBubbleIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.89c.50 0 .906.41.906.91s-.406.91-.906.91H17.24v1.093h2.125c.5 0 .906.41.906.91s-.406.91-.906.91H16.33a.908.908 0 01-.906-.91V9.89c0-.5.406-.91.906-.91h3.035zm-5.016 0c.5 0 .905.41.905.91v3.823c0 .5-.405.91-.905.91s-.906-.41-.906-.91V10.8c0-.5.406-.91.906-.91zm-2.343 0c.5 0 .826.344.906.91l.008.135v2.47l1.977-3.074a.91.91 0 011.667.47v3.822c0 .5-.406.91-.906.91s-.906-.41-.906-.91v-2.47l-1.977 3.074a.91.91 0 01-1.669-.46V10.8c0-.5.4-.91.9-.91zM9.035 9.89c.5 0 .906.41.906.91v3.823c0 .5-.406.91-.906.91H6.001a.908.908 0 01-.906-.91V10.8c0-.5.406-.91.906-.91s.906.41.906.91v2.913h1.22V10.8c0-.5.407-.91.908-.91zM12 2C6.477 2 2 6.055 2 11.064c0 4.51 3.713 8.285 8.733 8.948.34.072.803.224.92.512.106.264.07.675.034.944l-.149.906c-.046.264-.211 1.033.91.563 1.12-.47 6.04-3.563 8.24-6.104C22.26 14.586 23 12.909 23 11.063 23 6.055 18.523 2 12 2z" />
    </svg>
  )
}
