import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { fetchTutorById } from '../api/tutors'
import { fetchTutorSlots } from '../api/slots'
import { createSessionRequest } from '../api/requests'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import StarRating from '../components/ui/StarRating'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const TutorProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [tutor, setTutor]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  // Real availability slots
  const [availableSlots, setAvailableSlots] = useState([])
  const [slotsLoading, setSlotsLoading]     = useState(false)

  // Booking Modal State
  const [bookModal, setBookModal]     = useState(false)
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [bookSubject, setBookSubject] = useState('')
  const [bookMessage, setBookMessage] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [bookError, setBookError]     = useState(null)
  const [bookDone, setBookDone]       = useState(false)

  useEffect(() => {
    let isMounted = true
    const loadProfile = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchTutorById(id)
        if (!isMounted) return
        setTutor(data)

        // Load available slots using tutor's user_id or id
        const tutorUserId = data.user_id || data.id
        setSlotsLoading(true)
        fetchTutorSlots(tutorUserId, { status: 'AVAILABLE' })
          .then((slots) => {
            if (isMounted) {
              setAvailableSlots(slots || [])
              if (slots && slots.length > 0) {
                setSelectedSlotId(slots[0].id)
              }
            }
          })
          .catch((err) => console.error('Failed to load slots:', err))
          .finally(() => {
            if (isMounted) setSlotsLoading(false)
          })

        if (data.subjects && data.subjects.length > 0) {
          setBookSubject(data.subjects[0])
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load tutor details:', err)
          setError(err.response?.data?.message || 'Tutor profile not found or unavailable.')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    loadProfile()
    return () => { isMounted = false }
  }, [id])

  if (loading) {
    return (
      <div className="page-container py-24 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500 mt-4">Loading educator profile…</p>
      </div>
    )
  }

  if (error || !tutor) {
    return (
      <div className="page-container py-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mx-auto mb-4">🔍</div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Tutor Profile Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">{error || 'The requested educator does not exist.'}</p>
        <Link to="/tutors" className="btn-primary">Browse All Tutors</Link>
      </div>
    )
  }

  const handleBook = async (e) => {
    e.preventDefault()
    setBookError(null)

    if (!selectedSlotId) {
      setBookError('Please select an available session time slot.')
      return
    }
    if (!bookSubject) {
      setBookError('Please select a subject for this session.')
      return
    }

    setSubmitting(true)
    try {
      await createSessionRequest({
        slot_id: selectedSlotId,
        subject: bookSubject,
        message: bookMessage,
      })
      setBookDone(true)

      // Refresh slots
      const tutorUserId = tutor.user_id || tutor.id
      fetchTutorSlots(tutorUserId, { status: 'AVAILABLE' }).then((res) => setAvailableSlots(res || []))
    } catch (err) {
      console.error('Failed to submit booking:', err)
      setBookError(err.response?.data?.message || 'Failed to submit booking request. The slot may have been reserved.')
    } finally {
      setSubmitting(false)
    }
  }

  const {
    name,
    initials,
    subjects = [],
    rating = 4.9,
    reviewCount = 0,
    hourlyRate = 300,
    currency = '₹',
    mode = ['Online'],
    introduction = '',
    bio = '',
    verified = true,
    university = 'Academic Institution',
    department = '',
    year_of_study = '',
    reviews = [],
  } = tutor

  const displayBio = introduction || bio || 'Dedicated peer tutor offering coursework assistance and problem solving.'
  const isSelf = user?.id && (user.id === tutor.user_id || user.id === tutor.id)

  return (
    <div className="page-container py-10">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        ← Back to search results
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Left: Profile Card ── */}
        <div className="lg:col-span-1 space-y-6">
          <div className="card bg-white/95 border-slate-200/80 shadow-card text-center p-7">
            <div className="flex justify-center mb-4">
              <Avatar name={name} initials={initials} size="xl" />
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{name}</h1>
              {verified && (
                <span
                  title="Verified Academic Mentor"
                  className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black border border-emerald-300"
                >
                  ✓
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-400 mt-1">
              {university} {department ? `· ${department}` : ''} {year_of_study ? `(${year_of_study})` : ''}
            </p>
            <div className="flex justify-center mt-3.5">
              <StarRating rating={rating} reviewCount={reviewCount} size="md" />
            </div>

            <div className="border-t border-slate-100 mt-6 pt-5 space-y-3.5 text-xs sm:text-sm text-left font-medium">
              {department && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Department</span>
                  <span className="font-semibold text-slate-800">{department}</span>
                </div>
              )}
              {year_of_study && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Academic Standing</span>
                  <span className="font-semibold text-slate-800">{year_of_study}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Hourly Rate</span>
                <span className="font-extrabold text-slate-900 text-base">
                  <span className="text-xs text-primary-700 font-bold">{currency}</span>
                  {hourlyRate}
                  <span className="text-xs text-slate-400 font-normal">/hr</span>
                </span>
              </div>
            </div>

            {user ? (
              isSelf ? (
                <div className="mt-6 p-3 rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                  This is your public tutor profile
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { setBookModal(true); setBookDone(false); setBookError(null) }}
                  className="btn-primary w-full justify-center mt-6 py-3 font-bold shadow-lg shadow-primary-600/25"
                >
                  📅 Book Tutoring Session
                </button>
              )
            ) : (
              <Link
                to="/login"
                className="btn-primary w-full justify-center mt-6 py-3 font-bold shadow-lg shadow-primary-600/25"
              >
                Login to Schedule Session
              </Link>
            )}
          </div>

          {/* Real Available Slots Widget */}
          <div className="card bg-white/95 border-slate-200/80 shadow-card p-6">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-3 flex items-center justify-between">
              <span>Available Time Slots</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {availableSlots.length} open
              </span>
            </h3>

            {slotsLoading ? (
              <p className="text-xs text-slate-400 py-3">Loading available calendar slots…</p>
            ) : availableSlots.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No active availability slots posted. Check back soon or request a custom time.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {availableSlots.slice(0, 6).map((slot) => (
                  <div
                    key={slot.id}
                    className="p-2.5 rounded-xl border border-slate-200/70 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{slot.date}</p>
                      <p className="text-primary-700 font-semibold">{slot.start_time} - {slot.end_time}</p>
                    </div>
                    <Badge variant={slot.teaching_mode === 'ONLINE' ? 'blue' : 'green'}>
                      {slot.teaching_mode === 'ONLINE' ? 'Online' : 'In-person'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teaching Mode */}
          <div className="card bg-white/95 border-slate-200/80">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-3">Teaching Modes</h3>
            <div className="flex gap-2">
              {mode.map((m) => (
                <Badge key={m} variant={m === 'Online' ? 'blue' : 'green'}>
                  {m === 'Online' ? '💻 Online Video' : '📍 In-person Campus'}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Details ── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio */}
          <div className="card bg-white/95 border-slate-200/80">
            <h2 className="font-bold text-slate-900 text-lg tracking-tight mb-3">About {name}</h2>
            <p className="text-slate-600 text-sm leading-relaxed font-normal">{displayBio}</p>
          </div>

          {/* Subjects */}
          <div className="card bg-white/95 border-slate-200/80">
            <h2 className="font-bold text-slate-900 text-lg tracking-tight mb-3">Subject Specializations</h2>
            <div className="flex flex-wrap gap-2.5">
              {subjects.map((s) => (
                <span
                  key={s}
                  className="px-4 py-2 bg-gradient-to-r from-primary-50 to-indigo-50/70 text-primary-800 rounded-xl text-sm font-semibold border border-primary-200/60 shadow-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div className="card bg-white/95 border-slate-200/80">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 text-lg tracking-tight">
                Peer Reviews ({reviewCount})
              </h2>
              <StarRating rating={rating} size="md" />
            </div>
            {reviews.length === 0 ? (
              <p className="text-sm text-slate-400 italic">No reviews recorded yet for this mentor.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-slate-100/90 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-slate-900">{r.author}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: r.rating }).map((_, i) => (
                          <span key={i} className="text-accent-gold text-xs">★</span>
                        ))}
                        <span className="text-[11px] font-medium text-slate-400 ml-1.5">{r.date}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed font-normal">{r.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Book Modal (Real Slot Booking) ── */}
      <Modal
        isOpen={bookModal}
        onClose={() => setBookModal(false)}
        title={`Book Session with ${name}`}
        size="md"
      >
        {bookDone ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-3 border border-emerald-200/80 shadow-inner">
              ✓
            </div>
            <h3 className="font-bold text-slate-900 text-lg tracking-tight mb-1">Request Submitted!</h3>
            <p className="text-sm text-slate-500 mb-5">
              Your tutoring request has been sent to {name}. You will be notified once the session is confirmed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBookModal(false)}
                className="btn-secondary flex-1 justify-center py-2.5 font-bold"
              >
                Close Window
              </button>
              <button
                type="button"
                onClick={() => navigate('/my-requests')}
                className="btn-primary flex-1 justify-center py-2.5 font-bold shadow-md shadow-primary-600/25"
              >
                View My Requests →
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleBook} noValidate className="space-y-4">
            {bookError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {bookError}
              </div>
            )}

            <div>
              <label className="label">Select Available Time Slot</label>
              {availableSlots.length === 0 ? (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                  This tutor does not have any open availability slots right now. Please check back later.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto p-1">
                  {availableSlots.map((slot) => {
                    const selected = selectedSlotId === slot.id
                    return (
                      <button
                        type="button"
                        key={slot.id}
                        onClick={() => setSelectedSlotId(slot.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                          selected
                            ? 'bg-primary-50 border-primary-400 text-primary-900 ring-2 ring-primary-500/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-xs sm:text-sm">
                            📅 {slot.date} &nbsp;·&nbsp; ⏰ {slot.start_time} - {slot.end_time}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Mode: {slot.teaching_mode === 'ONLINE' ? '💻 Online Video' : '📍 In-person'}
                          </p>
                        </div>
                        {selected && (
                          <span className="text-primary-600 font-extrabold text-sm">✓ Selected</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <label className="label">Select Subject</label>
              <select
                className="input"
                value={bookSubject}
                onChange={(e) => setBookSubject(e.target.value)}
              >
                {subjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">
                Study Goal &amp; Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                className="input h-20 resize-none"
                placeholder="Share your coursework goals or specific questions with the mentor…"
                value={bookMessage}
                onChange={(e) => setBookMessage(e.target.value)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBookModal(false)}
                className="btn-secondary flex-1 justify-center font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || availableSlots.length === 0}
                className="btn-primary flex-1 justify-center font-bold shadow-md shadow-primary-600/25 disabled:opacity-50"
              >
                {submitting ? 'Sending Request…' : 'Send Booking Request'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default TutorProfile
