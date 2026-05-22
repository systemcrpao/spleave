/**
 * LeaveHistory.jsx — Personal leave history (all roles)
 *
 * Shows a filterable list of the user's leave requests with their statuses.
 */
import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { fetchLeaveHistory } from '../../utils/api'

const FISCAL_YEAR = 2569

const STATUS_CONFIG = {
  Pending:   { label: 'รอตรวจสอบ', cls: 'badge-pending'   },
  Verified:  { label: 'รอผู้บริหาร', cls: 'badge-verified' },
  Approved:  { label: 'อนุมัติ',     cls: 'badge-approved' },
  Rejected:  { label: 'ไม่อนุมัติ',  cls: 'badge-rejected' },
  Cancelled: { label: 'ยกเลิก',      cls: 'badge-cancelled'},
}

const FILTERS = ['ทั้งหมด', 'Pending', 'Verified', 'Approved', 'Rejected']

export default function LeaveHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('ทั้งหมด')

  useEffect(() => {
    if (!user?.uid) return
    fetchLeaveHistory(user.uid, FISCAL_YEAR)
      .then(data => setHistory(data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.uid])

  const displayed = filter === 'ทั้งหมด'
    ? history
    : history.filter(r => r.status === filter)

  return (
    <div className="space-y-4">
      <div>
        <h2 className="page-title">ประวัติการลา</h2>
        <p className="page-subtitle">ปีงบประมาณ {FISCAL_YEAR}</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              filter === f
                ? 'bg-primary-600 border-primary-600 text-white'
                : 'bg-white border-gray-300 text-gray-600',
            ].join(' ')}
          >
            {STATUS_CONFIG[f]?.label ?? f}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm">ไม่พบรายการ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map(req => {
            const s = STATUS_CONFIG[req.status] ?? { label: req.status, cls: 'badge-pending' }
            return (
              <div key={req.id} className="card space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{req.leaveType}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {req.startDate}
                      {req.startDate !== req.endDate ? ` – ${req.endDate}` : ''}
                      {' '}({req.totalDays} วัน)
                    </p>
                  </div>
                  <span className={s.cls}>{s.label}</span>
                </div>
                {req.reason && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
                    {req.reason}
                  </p>
                )}
                {req.approverNote && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    หมายเหตุ: {req.approverNote}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
