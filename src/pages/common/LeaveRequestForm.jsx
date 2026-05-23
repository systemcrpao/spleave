/**
 * LeaveRequestForm.jsx — Submit a new leave request (all roles)
 *
 * Fields:
 *  - Leave type (ลาป่วย / ลากิจ / ลาพักผ่อน)
 *  - Start date & End date
 *  - Reason (textarea)
 *  - Medical certificate upload (for sick leave)
 *
 * On submit → gasPost('submitLeaveRequest', payload)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import dayjs from 'dayjs'
import { useAuth } from '../../context/AuthContext'
import { submitLeaveRequest } from '../../utils/api'

const LEAVE_TYPES = [
  { value: 'ลาป่วย',    label: 'ลาป่วย',    needsCert: true  },
  { value: 'ลากิจ',    label: 'ลากิจ',    needsCert: false },
  { value: 'ลาพักผ่อน', label: 'ลาพักผ่อน', needsCert: false },
]

const TODAY = dayjs().format('YYYY-MM-DD')

export default function LeaveRequestForm() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    leaveType: 'ลาป่วย',
    startDate: TODAY,
    endDate:   TODAY,
    reason:    '',
    certFile:  null,
  })
  const [submitting, setSubmitting] = useState(false)

  const selectedType = LEAVE_TYPES.find(t => t.value === form.leaveType)
  const totalDays = dayjs(form.endDate).diff(dayjs(form.startDate), 'day') + 1

  function set(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (totalDays < 1) {
      toast.error('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น')
      return
    }
    if (!form.reason.trim()) {
      toast.error('กรุณาระบุเหตุผลการลา')
      return
    }
    if (selectedType.needsCert && !form.certFile) {
      toast.error('กรุณาแนบใบรับรองแพทย์สำหรับการลาป่วย')
      return
    }
    // ตรวจสอบขนาดไฟล์ (5 MB)
    if (form.certFile && form.certFile.size > 5 * 1024 * 1024) {
      toast.error('ไฟล์ใหญ่เกินไป ต้องไม่เกิน 5 MB')
      return
    }

    setSubmitting(true)
    try {
      // Convert file to base64 if provided
      let certBase64 = null
      if (form.certFile) {
        certBase64 = await fileToBase64(form.certFile)
      }

      await submitLeaveRequest({
        uid:          user.uid,
        leaveType:    form.leaveType,
        startDate:    form.startDate,
        endDate:      form.endDate,
        // totalDays คำนวณโดย GAS server-side
        reason:       form.reason.trim(),
        certBase64,
        certFileName: form.certFile?.name ?? null,
      })

      toast.success('ยื่นคำขอลาเรียบร้อยแล้ว')
      navigate('/leave-history')
    } catch (err) {
      toast.error(err.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="page-title">ยื่นคำขอลา</h2>
        <p className="page-subtitle">กรอกข้อมูลการลาให้ครบถ้วน</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Leave type */}
        <div>
          <label className="label">ประเภทการลา</label>
          <div className="grid grid-cols-3 gap-2">
            {LEAVE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('leaveType', value)}
                className={[
                  'py-2.5 rounded-xl border text-sm font-medium transition-colors',
                  form.leaveType === value
                    ? 'bg-primary-600 border-primary-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400',
                ].join(' ')}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">วันที่เริ่มลา</label>
            <input
              type="date"
              className="input"
              value={form.startDate}
              min={TODAY}
              onChange={e => {
                set('startDate', e.target.value)
                if (e.target.value > form.endDate) set('endDate', e.target.value)
              }}
            />
          </div>
          <div>
            <label className="label">วันที่สิ้นสุด</label>
            <input
              type="date"
              className="input"
              value={form.endDate}
              min={form.startDate}
              onChange={e => set('endDate', e.target.value)}
            />
          </div>
        </div>

        {/* Days summary */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-sm text-primary-700 font-medium text-center">
          จำนวน <span className="text-lg font-bold">{totalDays > 0 ? totalDays : 0}</span> วัน
        </div>

        {/* Reason */}
        <div>
          <label className="label">เหตุผลการลา</label>
          <textarea
            className="input min-h-[100px] resize-none"
            placeholder="ระบุเหตุผลการลา..."
            value={form.reason}
            onChange={e => set('reason', e.target.value)}
            maxLength={500}
          />
          <p className="text-xs text-gray-400 text-right mt-1">{form.reason.length}/500</p>
        </div>

        {/* Medical certificate (sick leave only) */}
        {selectedType?.needsCert && (
          <div>
            <label className="label">
              ใบรับรองแพทย์ <span className="text-red-500">*</span>
            </label>
            <div className={[
              'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors',
              form.certFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-primary-400',
            ].join(' ')}>
              <input
                id="cert-upload"
                type="file"
                className="hidden"
                accept="image/*,application/pdf"
                onChange={e => set('certFile', e.target.files?.[0] ?? null)}
              />
              <label htmlFor="cert-upload" className="cursor-pointer">
                {form.certFile ? (
                  <p className="text-sm text-green-700 font-medium">✓ {form.certFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-500">แตะเพื่อแนบไฟล์</p>
                    <p className="text-xs text-gray-400 mt-1">รองรับ JPG, PNG, PDF (ไม่เกิน 5 MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>
        )}

        {/* Submit */}
        <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
          {submitting ? 'กำลังส่งคำขอ…' : 'ยืนยันการขอลา'}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.readAsDataURL(file)
  })
}
