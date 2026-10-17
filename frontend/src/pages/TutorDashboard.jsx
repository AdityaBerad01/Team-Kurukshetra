import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { fetchIncomingRequests, acceptRequest, declineRequest } from '../api/requests'
import { fetchTutorSlots } from '../api/slots'
import SessionRequestCard from '../components/SessionRequestCard'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const TutorDashboard = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState([])
  const [slotsCount, setSlotsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      fetchIncomingRequests().catch(() => []),
      user?.id ? fetchTutorSlots(user.id).catch(() => []) : Promise.resolve([]),
    ])
      .then(([reqData, slotsData]) => {
        if (isMounted) {
          setRequests(reqData || [])
          const availCount = (slotsData || []).filter((s) => s.status === 'AVAILABLE').length
          setSlotsCount(availCount)
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
  }, [user?.id, refreshKey])

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

  const incoming = requests.filter((r) => (r.status || '').toLowerCase() === 'pending')
  const confirmed = requests.filter((r) => {
    const s = (r.status || '').toLowerCase()
    return s === 'accepted' || s === 'confirmed'
  })

  const stats = [
    { label: 'Incoming Requests',  value: incoming.length,  icon: '📩', color: 'text-amber-700 bg-amber-50 border border-amber-200/70' },
    { label: 'Confirmed Sessions', value: confirmed.length, icon: '✅', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200/70' },
    { label: 'Available Slots',    value: slotsCount,       icon: '📅', color: 'text-sky-700 bg-sky-50 border border-sky-200/70' },
    { label: 'Total Inquiries',    value: requests.length,  icon: '📋', color: 'text-primary-700 bg-primary-50 border border-primary-200/70' },
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
              <p className="text-xs text-primary-700">Keep your subject specializations, rates, and teaching modes up-to-date.</p>
            </div>
          </div>
          <Link to="/profile" className="btn-primary py-1.5 px-3 text-xs font-bold whitespace-nowrap">
            Edit Profile →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon, color }) => (
          <div key={label} className="card hover:shadow-card-hover transition-all duration-200 bg-white/95">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-inner ${color}`}>
              {icon}
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{isLoading ? '...' : value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
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
          {incoming.length > 0 && <Badge status="pending">{incoming.length} New Requests</Badge>}
        </div>
        {isLoading ? (
          <LoadingSpinner size="sm" />
        ) : incoming.length === 0 ? (
          <EmptyState icon="📩" title="No pending requests" description="New student booking requests will appear here for your review." />
        ) : (
          <div className="space-y-4">
            {incoming.map((r) => (
              <SessionRequestCard
                key={r.id}
                request={r}
                viewAs="tutor"
                onAccept={handleAccept}
                onReject={handleReject}
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
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">Confirmed Sessions</h2>
            <p className="text-xs text-slate-400">Scheduled 1-on-1 tutoring sessions</p>
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
              <SessionRequestCard key={r.id} request={r} viewAs="tutor" />
            ))}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-base font-bold text-slate-900 tracking-tight mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/manage-availability" className="card hover:shadow-card-hover hover:border-primary-300 transition-all flex items-center gap-3.5 p-4 bg-white/95">
            <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl text-primary-700">📅</div>
            <div>
              <p className="font-bold text-sm text-slate-900">Manage Availability</p>
              <p className="text-xs text-slate-400">Add or edit your weekly time slots</p>
            </div>
          </Link>
          <Link to="/profile" className="card hover:shadow-card-hover hover:border-primary-300 transition-all flex items-center gap-3.5 p-4 bg-white/95">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl text-emerald-700">👤</div>
            <div>
              <p className="font-bold text-sm text-slate-900">Tutor Profile &amp; Settings</p>
              <p className="text-xs text-slate-400">Update subjects, rates, and bio</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  )
}

export default TutorDashboard
