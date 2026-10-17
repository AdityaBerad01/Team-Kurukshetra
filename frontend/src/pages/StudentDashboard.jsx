import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SAMPLE_STUDENT_REQUESTS, SAMPLE_TUTORS } from '../data/sampleData'
import SessionRequestCard from '../components/SessionRequestCard'
import EmptyState from '../components/ui/EmptyState'
import Badge from '../components/ui/Badge'

const STAT_CARDS = (requests) => [
  { label: 'Upcoming Sessions', value: requests.filter((r) => r.status === 'confirmed').length, icon: '📅', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200/70' },
  { label: 'Pending Requests',  value: requests.filter((r) => r.status === 'pending').length,   icon: '⏳', color: 'text-amber-700 bg-amber-50 border border-amber-200/70' },
  { label: 'Sessions Completed',value: requests.filter((r) => r.status === 'completed').length, icon: '✅', color: 'text-sky-700 bg-sky-50 border border-sky-200/70' },
  { label: 'Tutors Explored',   value: SAMPLE_TUTORS.length,                                     icon: '👨‍🏫', color: 'text-primary-700 bg-primary-50 border border-primary-200/70' },
]

const GREETING_TIME = new Date().getHours() < 12 ? 'morning' : 'afternoon'

const StudentDashboard = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState(SAMPLE_STUDENT_REQUESTS)

  const handleCancel = (id) => {
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)))
  }

  const upcoming = requests.filter((r) => r.status === 'confirmed')
  const pending  = requests.filter((r) => r.status === 'pending')

  return (
    <div className="max-w-4xl space-y-8">
      {/* Greeting Header */}
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
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 mt-3 text-xs text-amber-800 flex items-center gap-2">
          <span>⚠️</span>
          <span><strong>Preview Mode:</strong> Demonstrating UI state with sample data. Connect MongoDB to persist live sessions.</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS(requests).map(({ label, value, icon, color }) => (
          <div key={label} className="card hover:shadow-card-hover transition-all duration-200 bg-white/95">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-3 shadow-inner ${color}`}>
              {icon}
            </div>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
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
        {upcoming.length === 0 ? (
          <EmptyState
            icon="📅"
            title="No upcoming sessions"
            description="Explore our verified peer tutors and schedule your first session."
            action={<Link to="/tutors" className="btn-primary">Find a Tutor</Link>}
          />
        ) : (
          <div className="space-y-4">
            {upcoming.map((r) => (
              <SessionRequestCard key={r.id} request={r} viewAs="student" onCancel={handleCancel} />
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
        {pending.length === 0 ? (
          <EmptyState icon="⏳" title="No pending requests" description="When you request a tutor, it will appear here." />
        ) : (
          <div className="space-y-4">
            {pending.map((r) => (
              <SessionRequestCard key={r.id} request={r} viewAs="student" onCancel={handleCancel} />
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
