import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  fetchMyRequests,
  fetchIncomingRequests,
  cancelRequest,
  completeRequest,
  acceptRequest,
  declineRequest,
} from '../api/requests'
import SessionRequestCard from '../components/SessionRequestCard'
import SessionDetailsModal from '../components/SessionDetailsModal'
import ReviewModal from '../components/ReviewModal'
import BackupTutorModal from '../components/BackupTutorModal'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const FILTERS = [
  { key: 'all', label: 'All Requests' },
  { key: 'pending', label: 'Pending' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'completed', label: 'Completed' },
  { key: 'declined', label: 'Declined' },
  { key: 'cancelled', label: 'Cancelled' },
]

const MySessionRequests = () => {
  const { user } = useAuth()
  const isTutor = user?.role?.toUpperCase() === 'TUTOR'
  const viewAs = isTutor ? 'tutor' : 'student'

  const [requests, setRequests] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [filter, setFilter] = useState('all')
  const [refreshKey, setRefreshKey] = useState(0)

  // Modals state
  const [detailsSession, setDetailsSession] = useState(null)
  const [reviewSession, setReviewSession] = useState(null)
  const [backupSession, setBackupSession] = useState(null)

  useEffect(() => {
    let isMounted = true
    const fetchFn = isTutor ? fetchIncomingRequests : fetchMyRequests
    fetchFn()
      .then((data) => {
        if (isMounted) {
          setRequests(data || [])
          setError(null)
          setIsLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.response?.data?.message || 'Failed to load your session requests.')
          setIsLoading(false)
        }
      })
    return () => {
      isMounted = false
    }
  }, [refreshKey, isTutor])

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

  const handleDecline = async (id) => {
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

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this tutoring request?')) {
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

  const handleComplete = async (id) => {
    if (!window.confirm('Mark this tutoring session as completed?')) {
      return
    }

    setActionLoadingId(id)
    setError(null)
    setSuccessMsg(null)
    try {
      await completeRequest(id)
      setSuccessMsg('Session marked as completed! You can now write a review for your tutor.')
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to complete session.')
    } finally {
      setActionLoadingId(null)
    }
  }

  const matchesFilter = (r, f) => {
    if (f === 'all') return true
    const s = (r.status || '').toLowerCase()
    if (f === 'accepted') return s === 'accepted' || s === 'confirmed'
    if (f === 'declined') return s === 'declined' || s === 'rejected'
    return s === f
  }

  const displayed = requests.filter((r) => matchesFilter(r, filter))

  const counts = FILTERS.reduce(
    (acc, f) => ({
      ...acc,
      [f.key]: requests.filter((r) => matchesFilter(r, f.key)).length,
    }),
    {},
  )

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {isTutor ? 'Incoming Mentorship Sessions' : 'Booking History & Reviews'}
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isTutor
              ? 'Incoming Tutoring Requests'
              : user?.name ? `${user.name.split(' ')[0]}'s Tutoring Requests` : 'My Session Requests'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isTutor
              ? 'Review, accept, decline, or complete tutoring appointments scheduled by students.'
              : 'Track, complete, and review all your academic tutoring appointments.'}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setIsLoading(true)
              setRefreshKey((k) => k + 1)
            }}
            disabled={isLoading}
            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
            title="Refresh requests"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
          {!isTutor && (
            <Link to="/tutors" className="btn-primary gap-2 font-bold shadow-md shadow-primary-600/25 flex-shrink-0 text-xs py-2 px-3.5">
              <span>+ Find Tutor</span>
            </Link>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3.5 rounded-xl text-xs font-medium bg-rose-50 border border-rose-200 text-rose-700 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="text-rose-500 font-bold ml-2">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 rounded-xl text-xs font-medium bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-600 font-bold ml-2">✕</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-150 ${
              filter === f.key
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 border-primary-600 text-white shadow-md shadow-primary-600/25 ring-2 ring-primary-400/30'
                : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {f.label}
            {counts[f.key] > 0 && (
              <span
                className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  filter === f.key ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {counts[f.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content State */}
      {isLoading ? (
        <div className="card text-center py-12">
          <LoadingSpinner size="md" />
          <p className="text-sm font-medium text-slate-400 mt-2">Loading session requests...</p>
        </div>
      ) : displayed.length === 0 ? (
        <EmptyState
          icon="📋"
          title={`No ${filter === 'all' ? '' : filter} requests`}
          description={
            filter === 'all'
              ? isTutor
                ? 'You have not received any session requests yet.'
                : 'You have not submitted any tutoring requests yet.'
              : `No requests found with status '${filter}'.`
          }
          action={
            isTutor ? (
              <Link to="/manage-availability" className="btn-primary">Manage Availability</Link>
            ) : (
              <Link to="/tutors" className="btn-primary">Find a Tutor</Link>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {displayed.map((r) => (
            <SessionRequestCard
              key={r.id}
              request={r}
              viewAs={viewAs}
              onAccept={handleAccept}
              onReject={handleDecline}
              onCancel={handleCancel}
              onComplete={handleComplete}
              onReview={(s) => setReviewSession(s)}
              onViewDetails={(s) => setDetailsSession(s)}
              onFindBackup={(s) => setBackupSession(s)}
              isActionLoading={actionLoadingId === r.id}
            />
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewSession && (
        <ReviewModal
          isOpen={Boolean(reviewSession)}
          onClose={() => setReviewSession(null)}
          session={reviewSession}
          onSuccess={() => {
            setSuccessMsg('Review submitted successfully! Thank you for rating your tutor.')
            setRefreshKey((k) => k + 1)
          }}
        />
      )}

      {/* Backup Tutor Modal */}
      {backupSession && (
        <BackupTutorModal
          isOpen={Boolean(backupSession)}
          onClose={() => setBackupSession(null)}
          session={backupSession}
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

export default MySessionRequests
