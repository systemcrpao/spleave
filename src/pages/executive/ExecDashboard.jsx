/**
 * ExecDashboard.jsx — Executive: daily absence overview
 *
 * Shows who is absent today across the organization.
 */
import { useEffect, useState } from 'react'
import { fetchExecDashboard } from '../../utils/api'
import dayjs from 'dayjs'
import 'dayjs/locale/th'

dayjs.locale('th')

export default function ExecDashboard() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExecDashboard()
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const today = dayjs().format('D MMMM BBBB')

  return (
    <div className="space-y-5">
      <div>
        <h2 className="page-title">กระดานผู้บริหาร</h2>
        <p className="page-subtitle">วันนี้ {today}</p>
      </div>

      {/* Summary strip */}
      {!loading && data?.summary && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="ลาวันนี้"      value={data.summary.absentToday}   color="text-red-600    bg-red-50"    />
          <SummaryCard label="บุคลากรทั้งหมด" value={data.summary.totalStaff}    color="text-primary-600 bg-primary-50" />
          <SummaryCard label="รอดำเนินการ"   value={data.summary.pendingApprovals} color="text-amber-600 bg-amber-50" />
        </div>
      )}

      {/* Department breakdown */}
      {!loading && data?.departments && data.departments.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-500 mb-2">แยกตามฝ่ายงาน</h3>
          <div className="space-y-2">
            {data.departments.map(dept => (
              <div key={dept.name} className="card flex items-center gap-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{dept.name}</p>
                  <p className="text-xs text-gray-500">{dept.total} คน</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-500">{dept.absent}</p>
                  <p className="text-xs text-gray-400">ลาวันนี้</p>
                </div>
                {/* Mini bar */}
                <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${dept.total > 0 ? (dept.absent / dept.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Absent staff list */}
      <section>
        <h3 className="text-sm font-semibold text-gray-500 mb-2">รายชื่อผู้ลาวันนี้</h3>
        {loading ? (
          <Skeletons />
        ) : !data?.absentList || data.absentList.length === 0 ? (
          <div className="card text-center py-8 text-gray-400">
            <p className="text-2xl mb-2">🎉</p>
            <p className="text-sm">ไม่มีผู้ลาวันนี้</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.absentList.map((person, i) => (
              <div key={i} className="card flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold flex-shrink-0">
                  {person.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{person.name}</p>
                  <p className="text-xs text-gray-500 truncate">{person.department}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-gray-700">{person.leaveType}</p>
                  <p className="text-xs text-gray-400">{person.endDate} คืน</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  return (
    <div className={`card ${color} text-center py-3`}>
      <p className="text-2xl font-bold">{value ?? '-'}</p>
      <p className="text-[11px] font-medium text-gray-600 mt-1 leading-tight">{label}</p>
    </div>
  )
}

function Skeletons() {
  return (
    <div className="space-y-2">
      {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />)}
    </div>
  )
}
