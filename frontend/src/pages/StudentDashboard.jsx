import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchStudentDashboard } from '../api/dashboard'
import { cancelRequest } from '../api/requests'
import SessionRequestCard from '../components/SessionRequestCard'
import SessionDetailsModal from '../components/SessionDetailsModal'
import ReviewModal from '../components/ReviewModal'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const GREETING_TIME = new Date().getHours() < 12 ? 'morning' : 'afternoon'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Modals state
  const [detailsSession, setDetailsSession] = useState(null)
  const [reviewSession, setReviewSession] = useState(null)

  useEffect(() => {
    let isMounted = true
    fetchStudentDashboard()
      .then((data) => {
        if (isMounted) {
          setDashboardData(data)
          setError(null)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Failed to load student dashboard.')
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

  const stats = dashboardData?.stats || {
    total_requests: 0,
    pending_requests: 0,
    upcoming_sessions: 0,
    completed_sessions: 0,
    total_tutors: 0,
  }

  const recentActivity = dashboardData?.recent_activity || []
  const unreviewedSessions = dashboardData?.unreviewed_sessions || []

  const statCards = [
    { label: 'Upcoming Sessions', value: stats.upcoming_sessions, icon: '📅', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200/70' },
    { label: 'Pending Requests',  value: stats.pending_requests,  icon: '⏳', color: 'text-amber-700 bg-amber-50 border border-amber-200/70' },
    { label: 'Sessions Completed',value: stats.completed_sessions,icon: '✅', color: 'text-sky-700 bg-sky-50 border border-sky-200/70' },
    { label: 'Learning Credits',  value: `${stats.credits_balance ?? 100} 🪙`, icon: '🪙', color: 'text-primary-700 bg-primary-50 border border-primary-200/70', link: '/wallet' },
  ]

  const recommendations = dashboardData?.recommendations || []

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

      {/* Unreviewed Completed Sessions Banner */}
      {unreviewedSessions.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <p className="text-xs font-bold text-amber-950">You have {unreviewedSessions.length} completed session{unreviewedSessions.length > 1 ? 's' : ''} ready to review!</p>
              <p className="text-xs text-amber-800/90 mt-0.5">Help your peer mentors by rating your learning experience.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReviewSession(unreviewedSessions[0])}
            className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 shadow-sm transition-all whitespace-nowrap self-start sm:self-auto"
          >
            Review Session →
          </button>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon, color, link }) => {
          const content = (
            <div className={`card hover:shadow-card-hover transition-all duration-200 bg-white/95 h-full ${link ? 'cursor-pointer hover:border-primary-400' : ''}`}>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-inner ${color}`}>
                {icon}
              </div>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{isLoading ? '...' : value}</p>
              <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
            </div>
          )
          return link ? (
            <Link key={label} to={link}>
              {content}
            </Link>
          ) : (
            <div key={label}>{content}</div>
          )
        })}
      </div>

      {/* Smart Tutor Recommendations */}
      {recommendations.length > 0 && (
        <section className="p-6 rounded-2xl bg-gradient-to-r from-amber-50/80 via-primary-50/40 to-slate-50/80 border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 text-amber-700 text-sm font-bold">
                ✨
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Recommended Mentors for Your Goals
                </h2>
                <p className="text-xs text-slate-500">
                  Algorithmic matches based on your subjects, languages, and upcoming slots
                </p>
              </div>
            </div>
            <Link to="/tutors" className="text-xs font-bold text-primary-700 hover:underline">
              View All Mentors →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec) => (
              <div key={rec.id} className="card bg-white p-4 border-slate-200 shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{rec.name}</h3>
                    <p className="text-[11px] text-slate-400">📍 {rec.location || 'Campus'}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                    {rec.match_percentage || '92% match'}
                  </span>
                </div>

                {rec.reasons && rec.reasons.length > 0 && (
                  <div className="space-y-1">
                    {rec.reasons.slice(0, 2).map((r, i) => (
                      <p key={i} className="text-[11px] text-slate-600 flex items-center gap-1">
                        <span>✓</span>
                        <span className="truncate">{r}</span>
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-800">
                    ₹{rec.hourlyRate || 300}<span className="text-[10px] font-normal text-slate-400">/hr</span>
                  </span>
                  <Link
                    to={`/tutors/${rec.id}`}
                    className="btn-primary py-1 px-3 text-[11px] font-bold"
                  >
                    View &amp; Book
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Session Activity */}
      <section className="card bg-white/95">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Recent Tutoring Activity</h2>
            <p className="text-xs text-slate-400">Your latest appointments, inquiries, and reviews</p>
          </div>
          <Link to="/my-requests" className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline">
            View All Requests ({stats.total_requests}) →
          </Link>
        </div>
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : recentActivity.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No tutoring activity yet"
            description="Explore our verified peer mentors and schedule your first session."
            action={<Link to="/tutors" className="btn-primary">Find a Tutor</Link>}
          />
        ) : (
          <div className="space-y-4">
            {recentActivity.map((r) => (
              <SessionRequestCard
                key={r.id}
                request={r}
                viewAs="student"
                onCancel={handleCancel}
                onReview={(s) => setReviewSession(s)}
                onViewDetails={(s) => setDetailsSession(s)}
                isActionLoading={actionLoadingId === r.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/tutors" className="card hover:shadow-card-hover hover:border-primary-300 transition-all flex items-center gap-3.5 p-4 bg-white/95">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl text-primary-700">🔍</div>
            <div>
              <p className="font-bold text-sm text-slate-900">Find a Tutor</p>
              <p className="text-xs text-slate-400">Filter by subjects &amp; rates</p>
            </div>
          </Link>
          <Link to="/wallet" className="card hover:shadow-card-hover hover:border-primary-300 transition-all flex items-center gap-3.5 p-4 bg-white/95">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl text-amber-700">🪙</div>
            <div>
              <p className="font-bold text-sm text-slate-900">Credit Wallet</p>
              <p className="text-xs text-slate-400">Balance &amp; transactions</p>
            </div>
          </Link>
          <Link to="/progress" className="card hover:shadow-card-hover hover:border-primary-300 transition-all flex items-center gap-3.5 p-4 bg-white/95">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-xl text-teal-700">📊</div>
            <div>
              <p className="font-bold text-sm text-slate-900">Learning Progress</p>
              <p className="text-xs text-slate-400">Quizzes &amp; skill growth</p>
            </div>
          </Link>
          <Link to="/profile" className="card hover:shadow-card-hover hover:border-primary-300 transition-all flex items-center gap-3.5 p-4 bg-white/95">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl text-emerald-700">👤</div>
            <div>
              <p className="font-bold text-sm text-slate-900">Profile &amp; Settings</p>
              <p className="text-xs text-slate-400">Account &amp; preferences</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Review Modal */}
      {reviewSession && (
        <ReviewModal
          isOpen={Boolean(reviewSession)}
          onClose={() => setReviewSession(null)}
          session={reviewSession}
          onSuccess={() => {
            setSuccessMsg('Review submitted successfully! Thank you for supporting the tutor community.')
            setRefreshKey((k) => k + 1)
          }}
        />
      )}

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

export default StudentDashboard
