/**
 * PendingApprovals.jsx — Executive: final approval/rejection of leave requests
 *
 * Shows requests with status "Verified" (pre-approved by Officer).
 * Executive can Approve or Reject with a note.
 */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { fetchPendingApprovals, approveLeaveRequest } from '../../utils/api'

export default function PendingApprovals() {
  const [list,    setList]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null) // { req, action: 'approve'|'reject' }
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchPendingApprovals()
      setList(data ?? [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleSubmit() {
    if (!modal) return
    if (modal.action === 'reject' && !note.trim()) {
      toast.error('กรุณาระบุเหตุผลการปฏิเสธ')
      return
    }
    setSaving(true)
    try {
      await approveLeaveRequest({
        requestId: modal.req.id,
        action:    modal.action,
        note:      note.trim(),
      })
      toast.success(modal.action === 'approve' ? 'อนุมัติการลาเรียบร้อย' : 'ปฏิเสธการลาเรียบร้อย')
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
        <h2 className="page-title">อนุมัติการลา</h2>
        <p className="page-subtitle">คำขอรอการอนุมัติขั้นสุดท้าย {list.length} รายการ</p>
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
                  <p className="font-semibold text-gray-900">{req.name}</p>
                  <p className="text-xs text-gray-500">{req.position} · {req.department}</p>
                </div>
                <span className="badge-verified flex-shrink-0">รอผู้บริหาร</span>
              </div>

              {/* Leave details */}
              <div className="bg-blue-50 rounded-xl px-3 py-2.5 space-y-1 text-sm">
                <DetailRow label="ประเภท" value={req.leaveType} />
                <DetailRow label="วันที่"  value={`${req.startDate} – ${req.endDate} (${req.totalDays} วัน)`} />
                <DetailRow label="เหตุผล" value={req.reason} />
              </div>

              {/* Officer's note */}
              {req.officerNote && (
                <div className="bg-green-50 rounded-xl px-3 py-2 text-xs text-green-700">
                  <span className="font-semibold">เจ้าหน้าที่: </span>{req.officerNote}
                </div>
              )}

              {/* Certificate */}
              {req.certUrl && (
                <a href={req.certUrl} target="_blank" rel="noreferrer"
                   className="text-xs text-primary-600 underline">
                  📎 ดูใบรับรองแพทย์
                </a>
              )}

              {/* Action buttons */}
              <div className="flex gap-2 pt-1">
                <button
                  className="btn-success flex-1"
                  onClick={() => { setModal({ req, action: 'approve' }); setNote('') }}
                >
                  ✅ อนุมัติ
                </button>
                <button
                  className="btn-danger flex-1"
                  onClick={() => { setModal({ req, action: 'reject' }); setNote('') }}
                >
                  ❌ ไม่อนุมัติ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl">
            <h3 className="font-semibold text-lg text-gray-900">
              {modal.action === 'approve' ? '✅ ยืนยันอนุมัติ' : '❌ ยืนยันไม่อนุมัติ'}
            </h3>
            <p className="text-sm text-gray-600">
              <span className="font-medium">{modal.req.name}</span>
              {' '}ขอ{modal.req.leaveType} {modal.req.totalDays} วัน
            </p>

            <div>
              <label className="label">
                หมายเหตุ{modal.action === 'reject' && <span className="text-red-500"> *</span>}
              </label>
              <textarea
                className="input resize-none min-h-[80px]"
                placeholder={
                  modal.action === 'approve'
                    ? 'หมายเหตุเพิ่มเติม (ไม่บังคับ)'
                    : 'ระบุเหตุผลการไม่อนุมัติ...'
                }
                value={note}
                onChange={e => setNote(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setModal(null)}>ยกเลิก</button>
              <button
                className={modal.action === 'approve' ? 'btn-success flex-1' : 'btn-danger flex-1'}
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

function DetailRow({ label, value }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-14 flex-shrink-0 text-xs">{label}:</span>
      <span className="text-gray-700 text-xs">{value}</span>
    </div>
  )
}

function Skeletons() {
  return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card text-center py-10 text-gray-400">
      <p className="text-2xl mb-2">🎉</p>
      <p className="text-sm">ไม่มีรายการรออนุมัติ</p>
    </div>
  )
}
