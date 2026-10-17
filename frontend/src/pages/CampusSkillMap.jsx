import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchCampusSkillMap } from '../api/skillMap'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const CAMPUS_OPTIONS = ['All Campuses', 'Main Campus', 'North Campus', 'Tech Campus', 'South Campus']

const STATUS_BADGES = {
  CRITICAL_SHORTAGE: { label: '🔥 Urgent Mentor Shortage', color: 'bg-rose-100 text-rose-800 border-rose-300' },
  HIGH_DEMAND:       { label: '⚡ High Demand',           color: 'bg-amber-100 text-amber-800 border-amber-300' },
  BALANCED:          { label: '⚖️ Balanced Supply',        color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  AVAILABLE:         { label: '✓ Tutors Available',       color: 'bg-sky-100 text-sky-800 border-sky-300' },
}

const CampusSkillMap = () => {
  const [selectedCampus, setSelectedCampus] = useState('All Campuses')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const campusParam = selectedCampus === 'All Campuses' ? '' : selectedCampus

    fetchCampusSkillMap(campusParam)
      .then((res) => {
        if (!isMounted) return
        setData(res)
      })
      .catch((err) => console.error('Failed to load campus skill map:', err))
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [selectedCampus])

  if (loading && !data) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500 mt-4">Aggregating campus learning demand analytics…</p>
      </div>
    )
  }

  const {
    total_active_students = 0,
    total_active_tutors = 0,
    total_sessions_booked = 0,
    subject_breakdown = [],
    high_opportunity_subjects = [],
  } = data || {}

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Campus-Wide Learning Analytics
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Campus Skill Demand Map
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Privacy-safe aggregated insights into academic subject demand, tutor availability, and peer tutoring shortages.
          </p>
        </div>

        {/* Campus Filter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <label className="text-xs font-bold text-slate-500">Campus:</label>
          <select
            value={selectedCampus}
            onChange={(e) => {
              setSelectedCampus(e.target.value)
              setLoading(true)
            }}
            className="input-field text-xs py-2 w-44 font-semibold"
          >
            {CAMPUS_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="card bg-white p-6 border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Students</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{total_active_students}</p>
            <p className="text-xs text-slate-500 mt-1">Pursuing coursework mentorship</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center text-2xl font-bold">
            🎓
          </div>
        </div>

        <div className="card bg-white p-6 border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Peer Mentors</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{total_active_tutors}</p>
            <p className="text-xs text-slate-500 mt-1">Offering open calendar slots</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-2xl font-bold">
            👨‍🏫
          </div>
        </div>

        <div className="card bg-white p-6 border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tutoring Hours</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{total_sessions_booked}</p>
            <p className="text-xs text-slate-500 mt-1">Exchanged peer-to-peer</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center text-2xl font-bold">
            ⏱️
          </div>
        </div>
      </div>

      {/* High Opportunity / Shortage Alerts */}
      {high_opportunity_subjects.length > 0 && (
        <div className="card bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent border-amber-200/80 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                High-Opportunity Subject Shortages
              </h2>
              <p className="text-xs text-slate-600">
                High student booking demand with few available peer tutors — ideal topics to offer as a tutor for learning credits!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {high_opportunity_subjects.map((sub, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-white border border-amber-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">{sub.subject}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    Gap: +{sub.gap}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Demand: <strong>{sub.demand_count}</strong> requests</span>
                  <span>Supply: <strong>{sub.supply_count}</strong> tutors</span>
                </div>
                <Link
                  to={`/tutors?subject=${encodeURIComponent(sub.subject)}`}
                  className="btn-secondary py-1 px-2.5 text-[11px] font-bold w-full justify-center flex items-center gap-1 mt-1 text-slate-700 hover:text-primary-700"
                >
                  Find Tutors for {sub.subject} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Subject Demand vs Supply Breakdown */}
      <div className="card bg-white p-6 border-slate-200/90 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Subject Demand &amp; Supply Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Real-time balance of tutor availability vs student inquiries across academic departments
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {subject_breakdown.map((item, idx) => {
            const badge = STATUS_BADGES[item.status] || STATUS_BADGES.AVAILABLE
            const totalActivity = item.tutors_available + item.student_requests
            const supplyPercent = totalActivity > 0 ? (item.tutors_available / totalActivity) * 100 : 50

            return (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-900">{item.subject}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                    <span>👨‍🏫 Tutors: <strong className="text-slate-900">{item.tutors_available}</strong></span>
                    <span>📝 Inquiries: <strong className="text-primary-700">{item.student_requests}</strong></span>
                    <Link
                      to={`/tutors?subject=${encodeURIComponent(item.subject)}`}
                      className="text-xs font-bold text-primary-700 hover:text-primary-800 hover:underline flex items-center gap-0.5"
                    >
                      Find Tutors →
                    </Link>
                  </div>
                </div>

                {/* Progress bar ratio */}
                <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-2 transition-all duration-500"
                    style={{ width: `${supplyPercent}%` }}
                    title={`Supply: ${item.tutors_available}`}
                  />
                  <div
                    className="bg-primary-600 h-2 transition-all duration-500"
                    style={{ width: `${100 - supplyPercent}%` }}
                    title={`Demand: ${item.student_requests}`}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CampusSkillMap
