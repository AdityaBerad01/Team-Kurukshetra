import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchMyRequests, cancelRequest } from '../api/requests'
import { fetchTutors } from '../api/tutors'
import SessionRequestCard from '../components/SessionRequestCard'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const GREETING_TIME = new Date().getHours() < 12 ? 'morning' : 'afternoon'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [totalTutors, setTotalTutors] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      fetchMyRequests().catch(() => []),
      fetchTutors({ per_page: 1 }).catch(() => ({ total: 0 })),
    ])
      .then(([reqData, tutorsData]) => {
        if (isMounted) {
          setRequests(reqData || [])
          setTotalTutors(tutorsData?.total || 0)
          setError(null)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Failed to load dashboard data.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this tutoring session?')) {
      return
    }

    setActionLoadingId(id)
    setError(null)
    setSuccessMsg(null)
    try {
      await cancelRequest(id)
      setSuccessMsg('Session request cancelled successfully.')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to cancel session request.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const upcoming = requests.filter((r) => {
    const s = (r.status || '').toLowerCase()
    return s === 'accepted' || s === 'confirmed'
  })
  const pending = requests.filter((r) => (r.status || '').toLowerCase() === 'pending')

  const statCards = [
    { label: 'Upcoming Sessions', value: upcoming.length, icon: '📅', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200/70' },
    { label: 'Pending Requests',  value: pending.length,  icon: '⏳', color: 'text-amber-700 bg-amber-50 border border-amber-200/70' },
    { label: 'Total Inquiries',   value: requests.length, icon: '📋', color: 'text-sky-700 bg-sky-50 border border-sky-200/70' },
    { label: 'Tutors Available',  value: totalTutors,     icon: '👨‍🏫', color: 'text-primary-700 bg-primary-50 border border-primary-200/70' },
  ]

  return (
    <div className="max-w-4xl space-y-8">
      {/* Greeting Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Student Portal
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Good {GREETING_TIME}, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-normal">
              Track your mentorship schedule, upcoming reviews, and pending bookings.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true)
              setRefreshKey((k) => k + 1)
            }}
            disabled={isLoading}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 self-start"
            title="Refresh dashboard"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="p-3.5 mt-3 rounded-xl text-xs font-medium bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-rose-500 font-bold ml-2">✕</button>
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 mt-3 rounded-xl text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
            <span>{successMsg}</span>
            <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-600 font-bold ml-2">✕</button>
          </div>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon, color }) => (
          <div key={label} className="card hover:shadow-card-hover transition-all duration-200 bg-white/95">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-inner ${color}`}>
              {icon}
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{isLoading ? '...' : value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming Sessions */}
      <section className="card bg-white/95">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Upcoming Sessions</h2>
            <p className="text-xs text-slate-400">Confirmed sessions with your peer mentors</p>
          </div>
          <Link to="/my-requests" className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline">
            View All Requests →
          </Link>
        </div>
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No upcoming sessions"
            description="Explore our verified peer tutors and schedule your first session."
            action={<Link to="/tutors" className="btn-primary">Find a Tutor</Link>}
          />
        ) : (
          <div className="space-y-4">
            {upcoming.map((r) => (
              <SessionRequestCard
                key={r.id}
                request={r}
                viewAs="student"
                onCancel={handleCancel}
                isActionLoading={actionLoadingId === r.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Pending Requests */}
      <section className="card bg-white/95">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Pending Tutor Requests</h2>
            <p className="text-xs text-slate-400">Awaiting acceptance from your selected tutor</p>
          </div>
          <Badge status="pending">{pending.length} Pending</Badge>
        </div>
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : pending.length === 0 ? (
          <EmptyState icon="⏳" title="No pending requests" description="When you request a tutor, it will appear here." />
        ) : (
          <div className="space-y-4">
            {pending.map((r) => (
              <SessionRequestCard
                key={r.id}
                request={r}
                viewAs="student"
                onCancel={handleCancel}
                isActionLoading={actionLoadingId === r.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/tutors" className="card hover:shadow-card-hover hover:border-primary-300 transition-all flex items-center gap-3.5 p-4 bg-white/95">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl text-primary-700">🔍</div>
            <div>
              <p className="font-bold text-sm text-slate-900">Find a Tutor</p>
              <p className="text-xs text-slate-400">Filter by subjects &amp; rates</p>
            </div>
          </Link>
          <Link to="/my-requests" className="card hover:shadow-card-hover hover:border-primary-300 transition-all flex items-center gap-3.5 p-4 bg-white/95">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl text-amber-700">📋</div>
            <div>
              <p className="font-bold text-sm text-slate-900">My Requests</p>
              <p className="text-xs text-slate-400">History and cancellations</p>
            </div>
          </Link>
          <Link to="/profile" className="card hover:shadow-card-hover hover:border-primary-300 transition-all flex items-center gap-3.5 p-4 bg-white/95">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl text-emerald-700">👤</div>
            <div>
              <p className="font-bold text-sm text-slate-900">Profile &amp; Settings</p>
              <p className="text-xs text-slate-400">Account and preferences</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default StudentDashboard
