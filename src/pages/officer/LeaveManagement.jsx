/**
 * LeaveManagement.jsx — Officer: verify leave requests before forwarding to Executive
 *
 * Lists requests with status "Pending".
 * Officer can:
 *  - Verify (pre-approve) → sets status to "Verified"
 *  - Reject → sets status to "Rejected" with note
 */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { fetchPendingVerifications, verifyLeaveRequest } from '../../utils/api'

export default function LeaveManagement() {
  const [list,    setList]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null) // { req, action: 'verify'|'reject' }
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchPendingVerifications()
      setList(data ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleSubmit() {
    setSaving(true)
    try {
      await verifyLeaveRequest({
        requestId: modal.req.id,
        action:    modal.action,
        note:      note.trim(),
      })
      toast.success(modal.action === 'verify' ? 'ส่งต่อผู้บริหารแล้ว' : 'ปฏิเสธใบลาแล้ว')
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.message ?? 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">ตรวจสอบใบลา</h2>
        <p className="page-subtitle">รายการรอการตรวจสอบ {list.length} รายการ</p>
      </div>

      {loading ? (
        <Skeletons />
      ) : list.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {list.map(req => (
            <div key={req.id} className="card space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm text-gray-900">{req.name}</p>
                  <p className="text-xs text-gray-500">{req.department}</p>
                </div>
                <span className="badge-pending">รอตรวจสอบ</span>
              </div>

              {/* Details */}
              <div className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1 text-sm">
                <Row label="ประเภท" value={req.leaveType} />
                <Row label="วันที่"  value={`${req.startDate} – ${req.endDate} (${req.totalDays} วัน)`} />
                <Row label="เหตุผล" value={req.reason} />
              </div>

              {/* Certificate */}
              {req.certUrl && (
                <a
                  href={req.certUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary-600 underline flex items-center gap-1"
                >
                  📎 ดูใบรับรองแพทย์
                </a>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button className="btn-success flex-1" onClick={() => { setModal({ req, action: 'verify' }); setNote('') }}>
                  ตรวจสอบแล้ว / ส่งต่อ
                </button>
                <button className="btn-danger flex-1"  onClick={() => { setModal({ req, action: 'reject' }); setNote('') }}>
                  ไม่ผ่าน
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="font-semibold text-gray-900">
              {modal.action === 'verify' ? '✅ ส่งต่อผู้บริหาร' : '❌ ปฏิเสธใบลา'}
            </h3>
            <p className="text-sm text-gray-600">
              {modal.req.name} · {modal.req.leaveType} · {modal.req.totalDays} วัน
            </p>
            <div>
              <label className="label">หมายเหตุถึงผู้บริหาร</label>
              <textarea
                className="input resize-none min-h-[80px]"
                placeholder={modal.action === 'verify' ? 'เอกสารครบถ้วน...' : 'เหตุผลการปฏิเสธ...'}
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setModal(null)}>ยกเลิก</button>
              <button
                className={modal.action === 'verify' ? 'btn-success flex-1' : 'btn-danger flex-1'}
                onClick={handleSubmit}
                disabled={saving}
              >
                {saving ? 'กำลังบันทึก…' : 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-14 flex-shrink-0">{label}:</span>
      <span className="text-gray-700">{value}</span>
    </div>
  )
}

function Skeletons() {
  return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-28 rounded-2xl bg-gray-100 animate-pulse" />)}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card text-center py-10 text-gray-400">
      <p className="text-2xl mb-2">✅</p>
      <p className="text-sm">ไม่มีรายการรอการตรวจสอบ</p>
    </div>
  )
}
