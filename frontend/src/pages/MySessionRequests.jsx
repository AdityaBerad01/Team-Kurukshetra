import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SAMPLE_STUDENT_REQUESTS } from '../data/sampleData'
import SessionRequestCard from '../components/SessionRequestCard'
import EmptyState from '../components/ui/EmptyState'

const FILTERS = ['all', 'pending', 'confirmed', 'completed', 'rejected', 'cancelled']

const MySessionRequests = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState(SAMPLE_STUDENT_REQUESTS)
  const [filter, setFilter] = useState('all')

  const handleCancel = (id) => setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)))

  const displayed = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  const counts = FILTERS.reduce(
    (acc, f) => ({
      ...acc,
      [f]: f === 'all' ? requests.length : requests.filter((r) => r.status === f).length,
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
            Booking History
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {user?.name ? `${user.name.split(' ')[0]}'s Tutoring Requests` : 'My Session Requests'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Track and manage all your academic tutoring appointments.</p>
        </div>
        <Link to="/tutors" className="btn-primary gap-2 font-bold shadow-md shadow-primary-600/25 flex-shrink-0">
          <span>+ Find New Tutor</span>
        </Link>
      </div>

      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-800 flex items-center gap-2">
        <span>⚠️</span>
        <span>Showing simulated session records for UI preview. Real requests will sync with MongoDB.</span>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-150 ${
              filter === f
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 border-primary-600 text-white shadow-md shadow-primary-600/25 ring-2 ring-primary-400/30'
                : 'bg-white border-slate-200/90 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {counts[f] > 0 && (
              <span
                className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  filter === f ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {counts[f]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results */}
      {displayed.length === 0 ? (
        <EmptyState
          icon="📋"
          title={`No ${filter === 'all' ? '' : filter} requests`}
          description="Your tutoring appointments will be logged here."
          action={<Link to="/tutors" className="btn-primary">Find a Tutor</Link>}
        />
      ) : (
        <div className="space-y-4">
          {displayed.map((r) => (
            <SessionRequestCard key={r.id} request={r} viewAs="student" onCancel={handleCancel} />
          ))}
        </div>
      )}
    </div>
  )
}

export default MySessionRequests
