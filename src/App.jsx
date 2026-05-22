/**
 * App.jsx — Root router
 *
 * Route tree:
 *
 * /login                  → LoginPage (public, shown while LIFF initialises)
 * /                       → redirect to /dashboard
 * / (ProtectedRoute)
 *   Layout
 *   ├── /dashboard             ← all roles
 *   ├── /leave-request         ← all roles
 *   ├── /leave-history         ← all roles
 *   ├── /officer/*             ← Officer only
 *   │   ├── /registrations
 *   │   ├── /leave-manage
 *   │   └── /org-report
 *   └── /executive/*           ← Executive only
 *       ├── /dashboard
 *       └── /approvals
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute   from './components/ProtectedRoute'
import Layout           from './components/Layout'
import LoginPage        from './pages/LoginPage'
import RegisterPage     from './pages/RegisterPage'
import PendingPage      from './pages/PendingPage'

// Pages — common
import Dashboard        from './pages/common/Dashboard'
import LeaveRequestForm from './pages/common/LeaveRequestForm'
import LeaveHistory     from './pages/common/LeaveHistory'

// Pages — officer
import RegistrationApproval from './pages/officer/RegistrationApproval'
import LeaveManagement      from './pages/officer/LeaveManagement'
import OrgReport            from './pages/officer/OrgReport'

// Pages — executive
import ExecDashboard    from './pages/executive/ExecDashboard'
import PendingApprovals from './pages/executive/PendingApprovals'

// Determine base URL for GitHub Pages
const BASE = import.meta.env.BASE_URL

export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <AuthProvider>
        <Routes>
          {/* Public routes — ไม่ต้อง auth */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/pending"  element={<PendingPage />} />

          {/* หน้า default → redirect ไป login ก่อน */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Authenticated shell */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>

              {/* ── Common ── */}
              <Route path="dashboard"    element={<Dashboard />} />
              <Route path="leave-request" element={<LeaveRequestForm />} />
              <Route path="leave-history" element={<LeaveHistory />} />

              {/* ── Officer ── */}
              <Route element={<ProtectedRoute roles={['Officer']} />}>
                <Route path="officer/registrations" element={<RegistrationApproval />} />
                <Route path="officer/leave-manage"  element={<LeaveManagement />} />
                <Route path="officer/org-report"    element={<OrgReport />} />
              </Route>

              {/* ── Executive ── */}
              <Route element={<ProtectedRoute roles={['Executive']} />}>
                <Route path="executive/dashboard" element={<ExecDashboard />} />
                <Route path="executive/approvals" element={<PendingApprovals />} />
              </Route>

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
