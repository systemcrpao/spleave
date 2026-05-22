/**
 * Dashboard.jsx — Personal dashboard (all roles)
 *
 * Shows:
 *  - Leave quota cards (Sick / Personal / Vacation) for fiscal year 2569
 *  - Quick-action buttons
 *  - Last 3 leave request statuses
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchLeaveQuota, fetchLeaveHistory } from '../../utils/api'
import { IconCalendarPlus, IconHistory, IconChevronRight } from '../../components/icons'

const FISCAL_YEAR = 2569

const QUOTA_CONFIG = [
  { key: 'sick',      label: 'ลาป่วย',     color: 'bg-red-50   text-red-600   border-red-200'    },
  { key: 'personal',  label: 'ลากิจ',     color: 'bg-amber-50 text-amber-600 border-amber-200'  },
  { key: 'vacation',  label: 'ลาพักผ่อน', color: 'bg-blue-50  text-blue-600  border-blue-200'   },
]

const STATUS_MAP = {
  Pending:  { label: 'รอการตรวจสอบ', cls: 'badge-pending'  },
  Verified: { label: 'รอการอนุมัติ', cls: 'badge-verified' },
  Approved: { label: 'อนุมัติแล้ว',   cls: 'badge-approved' },
  Rejected: { label: 'ไม่อนุมัติ',    cls: 'badge-rejected' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const [quota,   setQuota]   = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.uid) return
    Promise.all([
      fetchLeaveQuota(user.uid),
      fetchLeaveHistory(user.uid, FISCAL_YEAR),
    ])
      .then(([q, h]) => {
        setQuota(q)
        setHistory((h ?? []).slice(0, 3))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [user?.uid])

  return (
    <div className="space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="page-title">สวัสดี, {user?.name?.split(' ')[0]} 👋</h2>
        <p className="page-subtitle">{user?.department} · ปีงบประมาณ {FISCAL_YEAR}</p>
      </div>

      {/* Quota cards */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 mb-2">โควต้าวันลาคงเหลือ</h3>
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {QUOTA_CONFIG.map(({ key, label, color }) => {
              const used  = quota?.[`${key}Used`]  ?? 0
              const total = quota?.[`${key}Total`] ?? 0
              const left  = total - used
              return (
                <div key={key} className={`card border ${color.split(' ').slice(2).join(' ')} text-center py-4`}>
                  <p className={`text-2xl font-bold ${color.split(' ')[1]}`}>{left}</p>
                  <p className="text-xs font-medium text-gray-600 mt-1">{label}</p>
                  <p className="text-[10px] text-gray-400">{used}/{total} วัน</p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3">
        <Link to="/leave-request" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <span className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600">
            <IconCalendarPlus />
          </span>
          <span className="text-sm font-medium">ยื่นขอลา</span>
          <IconChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>
        <Link to="/leave-history" className="card flex items-center gap-3 hover:shadow-md transition-shadow">
          <span className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
            <IconHistory />
          </span>
          <span className="text-sm font-medium">ประวัติการลา</span>
          <IconChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
        </Link>
      </section>

      {/* Recent leave requests */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-500">คำขอล่าสุด</h3>
          <Link to="/leave-history" className="text-xs text-primary-600 font-medium">ดูทั้งหมด</Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="card text-center py-8 text-gray-400 text-sm">ยังไม่มีคำขอลา</div>
        ) : (
          <div className="space-y-2">
            {history.map((req) => {
              const s = STATUS_MAP[req.status] ?? { label: req.status, cls: 'badge-pending' }
              return (
                <div key={req.id} className="card flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{req.leaveType}</p>
                    <p className="text-xs text-gray-400">{req.startDate} – {req.endDate}</p>
                  </div>
                  <span className={s.cls}>{s.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
