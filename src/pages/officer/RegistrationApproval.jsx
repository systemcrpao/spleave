/**
 * RegistrationApproval.jsx — Officer: approve new user registrations
 *
 * Fetches users with status "Pending", lets the officer:
 *  - Approve + set initial leave quotas
 *  - Reject (with note)
 */
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { fetchPendingRegistrations, processRegistration } from '../../utils/api'

const DEFAULT_QUOTAS = { sickTotal: 30, personalTotal: 6, vacationTotal: 10 }

export default function RegistrationApproval() {
  const [list,    setList]    = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(null) // { user, action: 'approve'|'reject' }
  const [quotas,  setQuotas]  = useState({ ...DEFAULT_QUOTAS })
  const [note,    setNote]    = useState('')
  const [saving,  setSaving]  = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await fetchPendingRegistrations()
      setList(data ?? [])
    } catch { /* handled silently */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  function openModal(user, action) {
    setModal({ user, action })
    setQuotas({ ...DEFAULT_QUOTAS })
    setNote('')
  }

  async function handleSubmit() {
    if (!modal) return
    setSaving(true)
    try {
      await processRegistration({
        uid:    modal.user.uid,
        action: modal.action,
        ...(modal.action === 'approve' ? quotas : {}),
        note:   note.trim(),
      })
      toast.success(modal.action === 'approve' ? 'อนุมัติเรียบร้อยแล้ว' : 'ปฏิเสธเรียบร้อยแล้ว')
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
        <h2 className="page-title">อนุมัติผู้ใช้งานใหม่</h2>
        <p className="page-subtitle">รายการรอการตรวจสอบ {list.length} รายการ</p>
      </div>

      {loading ? (
        <Skeletons />
      ) : list.length === 0 ? (
        <EmptyState label="ไม่มีรายการรอการอนุมัติ" />
      ) : (
        <div className="space-y-3">
          {list.map(u => (
            <div key={u.uid} className="card space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold flex-shrink-0">
                  {u.name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{u.name}</p>
                  <p className="text-xs text-gray-500">{u.position} · {u.department}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="btn-success flex-1" onClick={() => openModal(u, 'approve')}>
                  อนุมัติ
                </button>
                <button className="btn-danger flex-1" onClick={() => openModal(u, 'reject')}>
                  ปฏิเสธ
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
              {modal.action === 'approve' ? '✅ อนุมัติ' : '❌ ปฏิเสธ'}: {modal.user.name}
            </h3>

            {modal.action === 'approve' && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ตั้งค่าโควต้าเริ่มต้น</p>
                {[
                  { key: 'sickTotal',     label: 'ลาป่วย (วัน)'    },
                  { key: 'personalTotal', label: 'ลากิจ (วัน)'    },
                  { key: 'vacationTotal', label: 'ลาพักผ่อน (วัน)' },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <label className="text-sm text-gray-700">{label}</label>
                    <input
                      type="number"
                      min="0"
                      max="365"
                      className="input w-20 text-center"
                      value={quotas[key]}
                      onChange={e => setQuotas(p => ({ ...p, [key]: Number(e.target.value) }))}
                    />
                  </div>
                ))}
              </div>
            )}

            <div>
              <label className="label">หมายเหตุ</label>
              <textarea
                className="input resize-none min-h-[72px]"
                placeholder="(ไม่บังคับ)"
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

function Skeletons() {
  return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />)}
    </div>
  )
}

function EmptyState({ label }) {
  return (
    <div className="card text-center py-10 text-gray-400">
      <p className="text-2xl mb-2">🎉</p>
      <p className="text-sm">{label}</p>
    </div>
  )
}
