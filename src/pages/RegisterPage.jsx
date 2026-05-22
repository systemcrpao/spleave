/**
 * RegisterPage.jsx
 *
 * แสดงเมื่อผู้ใช้ login LINE สำเร็จแต่ยังไม่มีข้อมูลในระบบ
 * บังคับกรอก: ชื่อ-นามสกุล, ตำแหน่ง, ฝ่าย/กอง
 * หลัง submit → userStatus = 'pending' → ไปหน้า /pending
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ตัวเลือก ฝ่าย/กอง ของ อบจ.เชียงราย (แก้ไขตามโครงสร้างจริง)
const DEPARTMENTS = [
  'สำนักปลัดองค์การบริหารส่วนจังหวัด',
  'กองแผนและงบประมาณ',
  'กองคลัง',
  'กองช่าง',
  'กองพัสดุและทรัพย์สิน',
  'กองการศึกษา ศาสนา และวัฒนธรรม',
  'กองการเจ้าหน้าที่',
  'กองสาธารณสุข',
  'หน่วยตรวจสอบภายใน',
  'อื่นๆ',
]

export default function RegisterPage() {
  const { user, registerUser, logout } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name:       user?.name || '',   // pre-fill จาก LINE display name
    position:   '',
    department: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!form.name.trim())       return setError('กรุณากรอกชื่อ-นามสกุล')
    if (!form.position.trim())   return setError('กรุณากรอกตำแหน่ง')
    if (!form.department)        return setError('กรุณาเลือกฝ่าย/กอง')

    setLoading(true)
    try {
      await registerUser({
        name:       form.name.trim(),
        position:   form.position.trim(),
        department: form.department,
      })
      navigate('/pending', { replace: true })
    } catch (err) {
      setError(err.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#111' }} className="min-h-screen flex flex-col items-center justify-between py-10 px-4">
      <div />

      <div className="w-full max-w-[360px] space-y-4 animate-[slideUp_0.45s_ease-out]">

        {/* Header */}
        <div className="text-center space-y-1 pb-2">
          <p className="text-3xl font-black" style={{ color: '#06C755', fontFamily: 'Arial Black, sans-serif' }}>LINE</p>
          <p className="text-white text-sm font-medium">สมัครเข้าใช้งานระบบ</p>
          <p className="text-gray-400 text-xs">ระบบบริหารจัดการการลา · อบจ.เชียงราย</p>
        </div>

        {/* Profile strip */}
        {user?.pictureUrl && (
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{ background: '#1c1c1e' }}>
            <img src={user.pictureUrl} alt="LINE" className="w-10 h-10 rounded-full object-cover" />
            <div>
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-gray-400 text-xs">บัญชี LINE</p>
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#1c1c1e' }}>
          <div className="px-5 pt-5 pb-1">
            <p className="text-gray-300 text-sm font-medium">กรอกข้อมูลสำหรับสมัคร</p>
            <p className="text-gray-500 text-xs mt-0.5">ข้อมูลจะถูกตรวจสอบโดยเจ้าหน้าที่ก่อนอนุมัติ</p>
          </div>

          <form onSubmit={handleSubmit} className="px-5 pt-4 pb-5 space-y-4">

            {/* ชื่อ-นามสกุล */}
            <div className="space-y-1.5">
              <label className="text-gray-400 text-xs">ชื่อ-นามสกุล <span style={{ color: '#06C755' }}>*</span></label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="เช่น นายสมชาย ใจดี"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:ring-2"
                style={{
                  background: '#2c2c2e',
                  border: '1px solid #3a3a3c',
                  '--tw-ring-color': '#06C755',
                }}
              />
            </div>

            {/* ตำแหน่ง */}
            <div className="space-y-1.5">
              <label className="text-gray-400 text-xs">ตำแหน่ง <span style={{ color: '#06C755' }}>*</span></label>
              <input
                type="text"
                name="position"
                value={form.position}
                onChange={handleChange}
                placeholder="เช่น นักวิชาการคอมพิวเตอร์ชำนาญการ"
                className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:ring-2"
                style={{ background: '#2c2c2e', border: '1px solid #3a3a3c', '--tw-ring-color': '#06C755' }}
              />
            </div>

            {/* ฝ่าย/กอง */}
            <div className="space-y-1.5">
              <label className="text-gray-400 text-xs">ฝ่าย / กอง <span style={{ color: '#06C755' }}>*</span></label>
              <select
                name="department"
                value={form.department}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 appearance-none"
                style={{
                  background: '#2c2c2e',
                  border: '1px solid #3a3a3c',
                  color: form.department ? '#fff' : '#4a4a4c',
                  '--tw-ring-color': '#06C755',
                }}
              >
                <option value="">-- เลือกฝ่าย/กอง --</option>
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d} style={{ background: '#2c2c2e', color: '#fff' }}>{d}</option>
                ))}
              </select>
            </div>

            {/* Error */}
            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 rounded-lg px-3 py-2">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-black transition-opacity disabled:opacity-60"
              style={{ background: '#06C755' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                  กำลังส่งข้อมูล…
                </span>
              ) : 'ยืนยันการสมัคร'}
            </button>
          </form>
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="w-full py-2 text-xs text-gray-600 hover:text-gray-400 transition-colors"
        >
          ออกจากระบบ / ใช้บัญชี LINE อื่น
        </button>
      </div>

      <p className="text-gray-700 text-[11px]">© อบจ.เชียงราย ปีงบประมาณ 2569</p>
    </div>
  )
}
