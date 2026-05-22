/**
 * OrgReport.jsx — Officer: organization-wide leave statistics
 *
 * Shows summary stats and a per-person table. Supports CSV export.
 */
import { useEffect, useState } from 'react'
import { fetchOrgReport } from '../../utils/api'

const FISCAL_YEAR = 2569

export default function OrgReport() {
  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    fetchOrgReport(FISCAL_YEAR)
      .then(d => setReport(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const rows = (report?.rows ?? []).filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.department.toLowerCase().includes(search.toLowerCase())
  )

  function exportCsv() {
    const headers = ['ชื่อ', 'ฝ่าย/แผนก', 'ลาป่วย', 'ลากิจ', 'ลาพักผ่อน', 'รวม']
    const csvRows = [
      headers.join(','),
      ...rows.map(r => [
        `"${r.name}"`, `"${r.department}"`,
        r.sick, r.personal, r.vacation,
        r.sick + r.personal + r.vacation,
      ].join(',')),
    ]
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `leave_report_${FISCAL_YEAR}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="page-title">รายงานภาพรวมองค์กร</h2>
          <p className="page-subtitle">ปีงบประมาณ {FISCAL_YEAR}</p>
        </div>
        {!loading && report && (
          <button className="btn-outline text-sm flex-shrink-0" onClick={exportCsv}>
            ⬇ Export CSV
          </button>
        )}
      </div>

      {/* Summary stat cards */}
      {!loading && report?.summary && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="บุคลากรทั้งหมด"   value={report.summary.totalStaff}    color="text-primary-600 bg-primary-50" />
          <StatCard label="ยื่นลาทั้งหมด"    value={report.summary.totalRequests}  color="text-amber-600   bg-amber-50"   />
          <StatCard label="อนุมัติแล้ว"       value={report.summary.totalApproved} color="text-green-600   bg-green-50"   />
          <StatCard label="รอการดำเนินการ"   value={report.summary.totalPending}  color="text-red-600     bg-red-50"     />
        </div>
      )}

      {/* Search */}
      <input
        className="input"
        placeholder="ค้นหาชื่อ / ฝ่ายงาน..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : rows.length === 0 ? (
        <div className="card text-center py-8 text-gray-400 text-sm">ไม่พบข้อมูล</div>
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-100">
                {['ชื่อ-สกุล', 'ฝ่าย', 'ป่วย', 'กิจ', 'พักผ่อน'].map(h => (
                  <th key={h} className="px-3 py-3 font-medium text-gray-500 text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-3 py-3 font-medium text-gray-800">{r.name}</td>
                  <td className="px-3 py-3 text-gray-500 text-xs">{r.department}</td>
                  <td className="px-3 py-3 text-red-600   font-semibold">{r.sick}</td>
                  <td className="px-3 py-3 text-amber-600 font-semibold">{r.personal}</td>
                  <td className="px-3 py-3 text-blue-600  font-semibold">{r.vacation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className={`card ${color} text-center py-3`}>
      <p className="text-2xl font-bold">{value ?? '-'}</p>
      <p className="text-xs font-medium text-gray-600 mt-1">{label}</p>
    </div>
  )
}
