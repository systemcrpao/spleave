/**
 * PendingPage.jsx
 *
 * แสดงเมื่อผู้ใช้ส่งข้อมูลสมัครแล้ว แต่ยังรอเจ้าหน้าที่อนุมัติ
 */
import { useAuth } from '../context/AuthContext'

export default function PendingPage() {
  const { user, logout } = useAuth()

  return (
    <div style={{ background: '#111' }} className="min-h-screen flex flex-col items-center justify-between py-10 px-4">
      <div />

      <div className="w-full max-w-[360px] text-center space-y-5 animate-[slideUp_0.45s_ease-out]">

        {/* Icon */}
        <div className="flex justify-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
            style={{ background: '#1c1c1e' }}
          >
            ⏳
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <p className="text-white text-xl font-bold">รอการอนุมัติ</p>
          <p className="text-gray-400 text-sm leading-relaxed">
            ข้อมูลของคุณถูกส่งแล้ว<br />
            กรุณารอเจ้าหน้าที่ตรวจสอบและอนุมัติ<br />
            ก่อนเข้าใช้งานระบบ
          </p>
        </div>

        {/* User info */}
        {user && (
          <div
            className="rounded-2xl px-5 py-4 text-left space-y-2"
            style={{ background: '#1c1c1e', border: '1px solid #2c2c2e' }}
          >
            <p className="text-gray-500 text-xs uppercase tracking-wider">ข้อมูลที่ส่ง</p>
            <div className="space-y-1.5">
              <Row label="ชื่อ" value={user.name} />
              <Row label="ตำแหน่ง" value={user.position || '—'} />
              <Row label="ฝ่าย/กอง" value={user.department || '—'} />
            </div>
          </div>
        )}

        {/* Steps */}
        <div
          className="rounded-2xl px-5 py-4 text-left"
          style={{ background: '#1c1c1e', border: '1px solid #2c2c2e' }}
        >
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">ขั้นตอนถัดไป</p>
          <div className="space-y-2.5">
            <Step n={1} done text="ลงทะเบียนด้วย LINE แล้ว" />
            <Step n={2} done text="ส่งข้อมูลสมัครแล้ว" />
            <Step n={3} text="รอเจ้าหน้าที่อนุมัติ" />
            <Step n={4} text="เข้าใช้ระบบได้" />
          </div>
        </div>

        <p className="text-gray-600 text-xs">
          หากรอนานผิดปกติ กรุณาติดต่อผู้ดูแลระบบ
        </p>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-3 rounded-xl text-sm font-medium transition-colors"
          style={{ background: '#2c2c2e', color: '#8e8e93' }}
        >
          ออกจากระบบ
        </button>
      </div>

      <p className="text-gray-700 text-[11px]">© อบจ.เชียงราย ปีงบประมาณ 2569</p>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-gray-500 text-xs flex-shrink-0">{label}</span>
      <span className="text-gray-200 text-xs text-right">{value}</span>
    </div>
  )
}

function Step({ n, text, done }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{
          background: done ? '#06C755' : '#2c2c2e',
          color:      done ? '#000'    : '#555',
          border:     done ? 'none'    : '1px solid #3a3a3c',
        }}
      >
        {done ? '✓' : n}
      </div>
      <span className="text-sm" style={{ color: done ? '#fff' : '#555' }}>{text}</span>
    </div>
  )
}
