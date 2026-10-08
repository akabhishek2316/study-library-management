import {
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import { useAuth } from './AuthContext'
import Home from './pages/Home'
import Layout from './Layout'
import AdmissionRequests from './pages/AdmissionRequests'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import Seats from './pages/Seats'
import Setup from './pages/Setup'
import Memberships from './pages/Memberships'
import Payments from './pages/Payments'
import Attendance from './pages/Attendance'
import Kiosk from './pages/Kiosk'
import MyAttendance from './pages/MyAttendance'
import Notifications from './pages/Notifications'
import Notices from './pages/Notices'
import MyNotices from './pages/MyNotices'
import MyFeedback from './pages/MyFeedback'
import Feedback from './pages/Feedback'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import MyDashboard from './pages/MyDashboard'
import VerifyReceipt from './pages/VerifyReceipt'
import Admission from './pages/Admission'
import ChangeSeat from './pages/ChangeSeat'
import SeatChangeRequests from './pages/SeatChangeRequests'
import ChangePassword from './pages/ChangePassword'
import About from './pages/About'

function Guard({ roles, children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <p className="center">
        Loading...
      </p>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }

  if (!roles.includes(user.role)) {
    return (
      <Navigate
        to="/"
        replace
      />
    )
  }

  return children
}

function ApprovedStudentOnly({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <p className="center">
        Loading...
      </p>
    )
  }

  if (
    !user ||
    user.role !== 'student'
  ) {
    return (
      <Navigate
        to="/login"
        replace
      />
    )
  }



  if (user.admissionStatus !== 'approved') {
    return (
      <Navigate
        to="/student"
        replace
      />
    )
  }

  return children
}

function OwnerOnly({ children }) {
  const { user } = useAuth()

  return user.role === 'owner' ? (
    children
  ) : (
    <Navigate
      to="/admin"
      replace
    />
  )
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/about"
        element={<About />}
      />

      <Route
        path="/admission"
        element={<Admission />}
      />

      <Route
        path="/verify-receipt/:token"
        element={<VerifyReceipt />}
      />

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/admin"
        element={
          <Guard
            roles={['owner', 'staff']}
          >
            <Layout admin />
          </Guard>
        }
      >
        <Route
          index
          element={<Dashboard />}
        />

        <Route
          path="students"
          element={<Students />}
        />

        <Route
          path="admissions"
          element={<AdmissionRequests />}
        />

        <Route
          path="seats"
          element={<Seats />}
        />

        <Route
          path="seat-change-requests"
          element={<SeatChangeRequests />}
        />

        <Route
          path="memberships"
          element={<Memberships />}
        />

        <Route
          path="payments"
          element={<Payments />}
        />

        <Route
          path="attendance"
          element={<Attendance />}

        />

        <Route
          path="change-password"
          element={<ChangePassword />}
        />

        <Route
          path="notices"
          element={<Notices />}
        />

        <Route
          path="feedback"
          element={<Feedback />}
        />

        <Route
          path="notifications"
          element={<Notifications />}
        />

        <Route
          path="setup"
          element={
            <OwnerOnly>
              <Setup />
            </OwnerOnly>
          }
        />

        <Route
          path="analytics"
          element={
            <OwnerOnly>
              <Analytics />
            </OwnerOnly>
          }
        />

        <Route
          path="reports"
          element={
            <OwnerOnly>
              <Reports />
            </OwnerOnly>
          }
        />

        <Route
          path="settings"
          element={
            <OwnerOnly>
              <Settings />
            </OwnerOnly>
          }
        />
      </Route>

      <Route
        path="/student"
        element={
          <Guard roles={['student']}>
            <Layout />
          </Guard>
        }
      >
        <Route
          index
          element={<MyDashboard />}
        />

        <Route
          path="change-seat"
          element={
            <ApprovedStudentOnly>
              <ChangeSeat />
            </ApprovedStudentOnly>
          }
        />

        <Route
          path="change-password"
          element={<ChangePassword />}
        />

        <Route
          path="attendance"
          element={
            <ApprovedStudentOnly>
              <MyAttendance />
            </ApprovedStudentOnly>
          }
        />

        <Route
          path="notices"
          element={
            <ApprovedStudentOnly>
              <MyNotices />
            </ApprovedStudentOnly>
          }
        />

        <Route
          path="feedback"
          element={
            <ApprovedStudentOnly>
              <MyFeedback />
            </ApprovedStudentOnly>
          }
        />

        <Route
          path="notifications"
          element={
            <ApprovedStudentOnly>
              <Notifications />
            </ApprovedStudentOnly>
          }
        />
      </Route>

      <Route
        path="/kiosk"
        element={<Kiosk />}
      />
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  )
}