import { useState, useEffect, useRef, useCallback } from 'react'
import {
  fetchActiveFocusRooms,
  createFocusRoom,
  joinFocusRoom,
  leaveFocusRoom,
  completeFocusSprint,
  fetchMyFocusStats,
} from '../api/focus'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'

const FocusRooms = () => {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  // Pomodoro Timer state
  const [sprintDuration, setSprintDuration] = useState(25) // 25 or 50
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('Computer Science')
  const [sprintGoal, setSprintGoal] = useState('')
  const [sprintSuccessMsg, setSprintSuccessMsg] = useState(null)

  // Room modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [submittingRoom, setSubmittingRoom] = useState(false)
  const [roomError, setRoomError] = useState(null)
  const [roomForm, setRoomForm] = useState({
    title: '',
    subject: 'Computer Science',
    goal: '',
    duration_minutes: 25,
  })

  // Timer interval
  const timerRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    Promise.all([
      fetchActiveFocusRooms().catch(() => []),
      user ? fetchMyFocusStats().catch(() => null) : Promise.resolve(null),
    ])
      .then(([activeRooms, userStats]) => {
        if (!isMounted) return
        setRooms(activeRooms || [])
        setStats(userStats)
      })
      .catch((err) => console.error('Failed to load focus rooms:', err))
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [user, refreshKey])

  const handleSprintFinished = useCallback(async () => {
    try {
      await completeFocusSprint({
        subject: selectedSubject,
        goal: sprintGoal || 'High-focus study sprint',
        duration_minutes: sprintDuration,
      })
      setSprintSuccessMsg(`Sprint completed! ${sprintDuration} minutes logged to your focus record.`)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to log sprint:', err)
    }
  }, [selectedSubject, sprintGoal, sprintDuration])

  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            setTimerRunning(false)
            setTimeout(() => {
              handleSprintFinished()
            }, 0)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning, handleSprintFinished])

  const handleResetTimer = (minutes) => {
    setTimerRunning(false)
    setSprintDuration(minutes)
    setSecondsRemaining(minutes * 60)
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const handleJoin = async (roomId) => {
    if (!user) {
      alert('Please log in to join a collaborative focus sprint.')
      return
    }
    try {
      await joinFocusRoom(roomId)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert(err.response?.data?.message || 'Could not join room.')
    }
  }

  const handleLeave = async (roomId) => {
    try {
      await leaveFocusRoom(roomId)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to leave room:', err)
    }
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    setRoomError(null)
    setSubmittingRoom(true)
    try {
      await createFocusRoom(roomForm)
      setModalOpen(false)
      setRoomForm({ title: '', subject: 'Computer Science', goal: '', duration_minutes: 25 })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setRoomError(err.response?.data?.message || 'Failed to create focus room.')
    } finally {
      setSubmittingRoom(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Study Sprints &amp; Coworking
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Focus Rooms &amp; Study Sprints
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Study synchronously alongside peers using timed Pomodoro sprints to eliminate distraction.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setModalOpen(true); setRoomError(null) }}
          className="btn-primary gap-2 font-bold shadow-md shadow-primary-600/25 flex-shrink-0"
        >
          <span>+ Create Study Room</span>
        </button>
      </div>

      {/* Main Grid: Live Sprint Timer + Study Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer Card */}
        <div className="lg:col-span-2 card bg-gradient-to-br from-slate-900 via-primary-950 to-indigo-950 text-white p-8 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary-200">
                Active Study Sprint
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleResetTimer(25)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  sprintDuration === 25 ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                25 min
              </button>
              <button
                type="button"
                onClick={() => handleResetTimer(50)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  sprintDuration === 50 ? 'bg-white text-slate-900' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                50 min
              </button>
            </div>
          </div>

          {/* Time Display */}
          <div className="text-center py-6">
            <div className="font-mono text-7xl sm:text-8xl font-black tracking-tighter text-white drop-shadow-lg">
              {formatTime(secondsRemaining)}
            </div>
            <p className="text-xs font-medium text-primary-300 mt-3">
              {timerRunning ? '⚡ In Deep Focus Session — Zero Distractions' : 'Select duration and press start'}
            </p>
          </div>

          {/* Controls & Goal input */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={sprintGoal}
                onChange={(e) => setSprintGoal(e.target.value)}
                placeholder="What is your goal for this sprint? (e.g. Read Chapter 4)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white placeholder-primary-200/60 text-xs focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-white/20 bg-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                <option value="Computer Science" className="text-slate-900">Computer Science</option>
                <option value="Mathematics" className="text-slate-900">Mathematics</option>
                <option value="Physics" className="text-slate-900">Physics</option>
                <option value="Chemistry" className="text-slate-900">Chemistry</option>
                <option value="Economics" className="text-slate-900">Economics</option>
              </select>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setTimerRunning(!timerRunning)}
                className={`px-8 py-3 rounded-xl font-black text-sm tracking-wide shadow-lg transition-all ${
                  timerRunning
                    ? 'bg-amber-400 text-slate-900 hover:bg-amber-300 shadow-amber-500/20'
                    : 'bg-emerald-400 text-slate-900 hover:bg-emerald-300 shadow-emerald-500/20'
                }`}
              >
                {timerRunning ? '⏸ Pause Sprint' : '▶ Start Focus Sprint'}
              </button>
              <button
                type="button"
                onClick={() => handleResetTimer(sprintDuration)}
                className="px-5 py-3 rounded-xl font-bold text-xs bg-white/15 text-white hover:bg-white/25 transition-all"
              >
                Reset
              </button>
            </div>

            {sprintSuccessMsg && (
              <p className="text-xs text-center font-bold text-emerald-300 animate-pulse">
                ✓ {sprintSuccessMsg}
              </p>
            )}
          </div>
        </div>

        {/* Stats Column */}
        <div className="card bg-white p-6 border-slate-200/90 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>⏱️</span> Your Focus History
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Sprints</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_sprints || 0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Hours</p>
              <p className="text-2xl font-black text-primary-700 mt-1">{stats?.total_hours || 0}h</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Recent Completed Sprints
            </h3>
            {(!stats?.recent_sprints || stats.recent_sprints.length === 0) ? (
              <p className="text-xs text-slate-400 italic py-2">
                No sprints recorded yet. Run the timer to log your first session!
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {stats.recent_sprints.map((s) => (
                  <div key={s.id} className="p-2.5 rounded-lg border border-slate-200/60 bg-slate-50 text-xs flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">{s.subject}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[150px]">{s.goal || 'Focused study'}</p>
                    </div>
                    <span className="font-extrabold text-primary-700">+{s.duration_minutes}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Focus Rooms Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Active Peer Study Rooms</h2>
            <p className="text-xs text-slate-500">Jump in and study silently alongside fellow classmates</p>
          </div>
          <span className="text-xs font-bold bg-primary-50 text-primary-700 px-3 py-1 rounded-full border border-primary-200/60">
            {rooms.length} Active Rooms
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <LoadingSpinner size="md" />
          </div>
        ) : rooms.length === 0 ? (
          <div className="card text-center py-10 bg-white border-slate-200">
            <span className="text-4xl block mb-2">🏢</span>
            <p className="text-sm font-bold text-slate-800">No active rooms right now</p>
            <p className="text-xs text-slate-400 mt-1">Host a new study sprint to invite peers to study with you!</p>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="btn-primary mt-4 text-xs font-bold"
            >
              + Create First Room
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {rooms.map((room) => (
              <div key={room.id} className="card bg-white p-5 border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-card-hover transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {room.subject}
                    </span>
                    <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                      <span>👥</span> {room.participants_count} studying
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base tracking-tight">{room.title}</h3>
                    {room.goal && (
                      <p className="text-xs text-slate-500 mt-1 italic">"{room.goal}"</p>
                    )}
                  </div>

                  {room.participants && room.participants.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {room.participants.slice(0, 4).map((p, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          {p.name.split(' ')[0]}
                        </span>
                      ))}
                      {room.participants.length > 4 && (
                        <span className="text-[10px] text-slate-400 self-center">
                          +{room.participants.length - 4} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Host: <strong className="text-slate-800">{room.host_name}</strong>
                  </span>

                  {room.is_joined ? (
                    <button
                      type="button"
                      onClick={() => handleLeave(room.id)}
                      className="btn-secondary py-1.5 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 border-rose-200"
                    >
                      Leave Room
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleJoin(room.id)}
                      className="btn-primary py-1.5 px-4 text-xs font-bold"
                    >
                      Join Room →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Room Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Create a Collaborative Focus Room"
        >
          <form onSubmit={handleCreateRoom} className="space-y-4">
            {roomError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {roomError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Room Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={roomForm.title}
                onChange={(e) => setRoomForm({ ...roomForm, title: e.target.value })}
                placeholder="e.g. Physics Midterm Quiet Sprint"
                className="input-field text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={roomForm.subject}
                  onChange={(e) => setRoomForm({ ...roomForm, subject: e.target.value })}
                  placeholder="e.g. Mathematics"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                <select
                  value={roomForm.duration_minutes}
                  onChange={(e) => setRoomForm({ ...roomForm, duration_minutes: Number(e.target.value) })}
                  className="input-field text-xs"
                >
                  <option value={25}>25 Minutes (Standard)</option>
                  <option value={50}>50 Minutes (Deep Work)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Sprint Objective / Goal</label>
              <input
                type="text"
                value={roomForm.goal}
                onChange={(e) => setRoomForm({ ...roomForm, goal: e.target.value })}
                placeholder="e.g. Finish textbook problem set 3"
                className="input-field text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingRoom}
                className="btn-primary text-xs py-2 px-5 font-bold"
              >
                {submittingRoom ? 'Starting Room…' : 'Open Study Room'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default FocusRooms
