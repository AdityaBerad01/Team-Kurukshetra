import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchTutorDashboard } from '../api/dashboard'
import { fetchIncomingRequests, acceptRequest, declineRequest, completeRequest } from '../api/requests'
import SessionRequestCard from '../components/SessionRequestCard'
import SessionDetailsModal from '../components/SessionDetailsModal'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const TutorDashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [incomingRequests, setIncomingRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [detailsSession, setDetailsSession] = useState(null)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      fetchTutorDashboard().catch(() => null),
      fetchIncomingRequests().catch(() => []),
    ])
      .then(([dashData, allIncoming]) => {
        if (isMounted) {
          setDashboardData(dashData)
          setIncomingRequests(allIncoming || [])
          setError(null)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Failed to load tutor dashboard data.')
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  const handleAccept = async (id) => {
    setActionLoadingId(id)
    setError(null)
    setSuccessMsg(null)
    try {
      await acceptRequest(id)
      setSuccessMsg('Session request accepted! The slot is now confirmed.')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to accept session request.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleReject = async (id) => {
    setActionLoadingId(id)
    setError(null)
    setSuccessMsg(null)
    try {
      await declineRequest(id)
      setSuccessMsg('Session request declined.')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to decline session request.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleComplete = async (id) => {
    if (!window.confirm('Mark this tutoring session as completed?')) return

    setActionLoadingId(id)
    setError(null)
    setSuccessMsg(null)
    try {
      await completeRequest(id)
      setSuccessMsg('Session marked as completed! The student can now leave a review.')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to mark session as completed.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const stats = dashboardData?.stats || {
    incoming_requests: 0,
    available_slots: 0,
    accepted_sessions: 0,
    completed_sessions: 0,
    average_rating: 0.0,
    total_reviews: 0,
    total_inquiries: 0,
  }

  const pending = incomingRequests.filter((r) => (r.status || '').toLowerCase() === 'pending')
  const confirmed = incomingRequests.filter((r) => {
    const s = (r.status || '').toLowerCase()
    return s === 'accepted' || s === 'confirmed'
  })
  const completed = incomingRequests.filter((r) => (r.status || '').toLowerCase() === 'completed')

  const statsList = [
    { label: 'Incoming Requests',  value: stats.incoming_requests,  icon: '📩', color: 'text-amber-700 bg-amber-50 border border-amber-200/70' },
    { label: 'Confirmed Sessions', value: stats.accepted_sessions,  icon: '✅', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200/70' },
    { label: 'Completed Sessions', value: stats.completed_sessions, icon: '🎓', color: 'text-indigo-700 bg-indigo-50 border border-indigo-200/70' },
    {
      label: 'Average Rating',
      value: stats.total_reviews > 0 ? `${stats.average_rating} ★` : 'N/A',
      subtext: stats.total_reviews > 0 ? `${stats.total_reviews} review${stats.total_reviews > 1 ? 's' : ''}` : 'No reviews yet',
      icon: '⭐',
      color: 'text-amber-700 bg-amber-50 border border-amber-200/70',
    },
  ]

  return (
    <div className="max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-primary-600" />
              Mentor Operations
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-500 mt-1 text-sm font-normal">
              Manage your student booking requests, weekly schedule, and active tutorials.
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

        <div className="bg-primary-50/80 border border-primary-200/80 rounded-2xl p-4 mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎓</span>
            <div>
              <p className="text-xs font-bold text-primary-900">Academic Mentorship Profile</p>
              <p className="text-xs text-primary-700">
                {stats.available_slots} active open slot{stats.available_slots === 1 ? '' : 's'} on your schedule. Keep specializations and rates updated.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/manage-availability" className="btn-secondary py-1.5 px-3 text-xs font-bold whitespace-nowrap">
              Slots ({stats.available_slots})
            </Link>
            <Link to="/profile" className="btn-primary py-1.5 px-3 text-xs font-bold whitespace-nowrap">
              Edit Profile →
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsList.map(({ label, value, subtext, icon, color }) => (
          <div key={label} className="card hover:shadow-card-hover transition-all duration-200 bg-white/95">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-inner ${color}`}>
              {icon}
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{isLoading ? '...' : value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
            {subtext && <p className="text-[11px] text-slate-400 font-medium">{subtext}</p>}
          </div>
        ))}
      </div>

      {/* Incoming Requests */}
      <section className="card bg-white/95">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Incoming Booking Requests</h2>
            <p className="text-xs text-slate-400">Review and accept or decline student session inquiries</p>
          </div>
          {pending.length > 0 && <Badge status="pending">{pending.length} New Requests</Badge>}
        </div>
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : pending.length === 0 ? (
          <EmptyState icon="📩" title="No pending requests" description="New student booking requests will appear here for your review." />
        ) : (
          <div className="space-y-4">
            {pending.map((r) => (
              <SessionRequestCard
                key={r.id}
                request={r}
                viewAs="tutor"
                onAccept={handleAccept}
                onReject={handleReject}
                onViewDetails={(s) => setDetailsSession(s)}
                isActionLoading={actionLoadingId === r.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Confirmed Sessions */}
      <section className="card bg-white/95">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Scheduled Sessions</h2>
            <p className="text-xs text-slate-400">Accepted 1-on-1 tutoring sessions – mark completed once conducted</p>
          </div>
          <Badge status="confirmed">{confirmed.length} Scheduled</Badge>
        </div>
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : confirmed.length === 0 ? (
          <EmptyState icon="📅" title="No confirmed sessions yet" description="Accepted student bookings will show up here." />
        ) : (
          <div className="space-y-4">
            {confirmed.map((r) => (
              <SessionRequestCard
                key={r.id}
                request={r}
                viewAs="tutor"
                onComplete={handleComplete}
                onViewDetails={(s) => setDetailsSession(s)}
                isActionLoading={actionLoadingId === r.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Completed Sessions & Feedback */}
      {completed.length > 0 && (
        <section className="card bg-white/95">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">Completed Sessions &amp; Reviews</h2>
              <p className="text-xs text-slate-400">Past tutoring engagements and student feedback</p>
            </div>
            <Badge status="completed">{completed.length} Completed</Badge>
          </div>
          <div className="space-y-4">
            {completed.map((r) => (
              <SessionRequestCard
                key={r.id}
                request={r}
                viewAs="tutor"
                onViewDetails={(s) => setDetailsSession(s)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/manage-availability" className="card hover:shadow-card-hover hover:border-primary-300 transition-all flex items-center gap-3.5 p-4 bg-white/95">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl text-primary-700">📅</div>
            <div>
              <p className="font-bold text-sm text-slate-900">Manage Availability</p>
              <p className="text-xs text-slate-400">Add or edit your weekly time slots ({stats.available_slots} available)</p>
            </div>
          </Link>
          <Link to="/profile" className="card hover:shadow-card-hover hover:border-primary-300 transition-all flex items-center gap-3.5 p-4 bg-white/95">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl text-emerald-700">👤</div>
            <div>
              <p className="font-bold text-sm text-slate-900">Tutor Profile &amp; Settings</p>
              <p className="text-xs text-slate-400">Update subjects, rates, and mentorship bio</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Session Details Modal */}
      {detailsSession && (
        <SessionDetailsModal
          isOpen={Boolean(detailsSession)}
          onClose={() => setDetailsSession(null)}
          session={detailsSession}
        />
      )}
    </div>
  )
}

export default TutorDashboard
