import { Outlet, Navigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

/**
 * Dashboard layout – requires user to be logged in.
 * Shows sidebar on large screens and handles session hydration gracefully.
 */
const DashboardLayout = () => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-brand-bg items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-semibold text-slate-400 mt-3">Verifying secure session…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="flex flex-col min-h-screen bg-brand-bg">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
