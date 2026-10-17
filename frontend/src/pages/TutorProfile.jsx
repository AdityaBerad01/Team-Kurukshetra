import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { SAMPLE_TUTORS } from '../data/sampleData'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import StarRating from '../components/ui/StarRating'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'

const DURATION_OPTIONS = [30, 45, 60, 90, 120]
const TODAY_DATE = new Date().toISOString().split('T')[0]

const TutorProfile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const tutor = SAMPLE_TUTORS.find((t) => t.id === id)

  const [bookModal, setBookModal] = useState(false)
  const [bookForm, setBookForm]   = useState({ date: '', time: '', duration: 60, topic: '', notes: '', mode: 'Online' })
  const [bookErrors, setBookErrors] = useState({})
  const [bookDone, setBookDone]   = useState(false)

  if (!tutor) {
    return (
      <div className="page-container py-24 text-center">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-3xl mx-auto mb-4">🔍</div>
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">Tutor Profile Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">The requested educator does not exist or has completed their mentorship.</p>
        <Link to="/tutors" className="btn-primary">Browse All Tutors</Link>
      </div>
    )
  }

  const validateBook = () => {
    const e = {}
    if (!bookForm.date) e.date = 'Select a date.'
    if (!bookForm.time) e.time = 'Select a time slot.'
    if (!bookForm.topic.trim()) e.topic = 'Enter your primary study goal or topic.'
    return e
  }

  const handleBook = (e) => {
    e.preventDefault()
    const errs = validateBook()
    setBookErrors(errs)
    if (Object.keys(errs).length > 0) return
    setBookDone(true)
  }

  const { name, initials, subjects, rating, reviewCount, hourlyRate, currency, experience, mode, bio, verified, location, university, degree, languages, availability, reviews } = tutor

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
            <p className="text-xs font-medium text-slate-400 mt-1">{university} · {degree}</p>
            <div className="flex justify-center mt-3.5">
              <StarRating rating={rating} reviewCount={reviewCount} size="md" />
            </div>

            <div className="border-t border-slate-100 mt-6 pt-5 space-y-3.5 text-xs sm:text-sm text-left font-medium">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Location</span>
                <span className="font-semibold text-slate-800">📍 {location}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Teaching Exp.</span>
                <span className="font-semibold text-slate-800">{experience}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Hourly Rate</span>
                <span className="font-extrabold text-slate-900 text-base">
                  <span className="text-xs text-primary-700 font-bold">{currency}</span>
                  {hourlyRate}
                  <span className="text-xs text-slate-400 font-normal">/hr</span>
                </span>
              </div>
              <div className="flex justify-between items-start gap-2">
                <span className="text-slate-500 flex-shrink-0">Languages</span>
                <span className="font-semibold text-slate-800 text-right">{languages.join(', ')}</span>
              </div>
            </div>

            {user ? (
              <button
                type="button"
                onClick={() => setBookModal(true)}
                className="btn-primary w-full justify-center mt-6 py-3 font-bold shadow-lg shadow-primary-600/25"
              >
                📅 Book a Tutoring Session
              </button>
            ) : (
              <Link
                to="/login"
                className="btn-primary w-full justify-center mt-6 py-3 font-bold shadow-lg shadow-primary-600/25"
              >
                Login to Schedule Session
              </Link>
            )}
          </div>

          {/* Availability */}
          <div className="card bg-white/95 border-slate-200/80">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight mb-3">Weekly Availability</h3>
            <div className="flex flex-wrap gap-2">
              {availability.map((day) => (
                <span
                  key={day}
                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-primary-50 text-primary-800 border border-primary-200/70"
                >
                  {day}
                </span>
              ))}
            </div>
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
            <p className="text-slate-600 text-sm leading-relaxed font-normal">{bio}</p>
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

      {/* ── Book Modal ── */}
      <Modal
        isOpen={bookModal}
        onClose={() => { setBookModal(false); setBookDone(false); setBookErrors({}) }}
        title={`Book Session with ${name}`}
        size="md"
      >
        {bookDone ? (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-3 border border-emerald-200/80 shadow-inner">
              ✓
            </div>
            <h3 className="font-bold text-slate-900 text-lg tracking-tight mb-1">Request Submitted!</h3>
            <p className="text-sm text-slate-500 mb-4">Your tutoring session request has been forwarded to {name}.</p>
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-800 mb-5 text-left flex items-start gap-2">
              <span>⚠️</span>
              <span><strong>UI Preview:</strong> Simulated booking flow. When backend database endpoints are connected, this will create a MongoDB session document.</span>
            </div>
            <button
              type="button"
              onClick={() => setBookModal(false)}
              className="btn-primary w-full justify-center py-2.5 font-bold"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleBook} noValidate className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className={`input ${bookErrors.date ? 'input-error' : ''}`}
                  min={TODAY_DATE}
                  value={bookForm.date}
                  onChange={(e) => setBookForm((f) => ({ ...f, date: e.target.value }))}
                />
                {bookErrors.date && <p className="field-error">{bookErrors.date}</p>}
              </div>
              <div>
                <label className="label">Time</label>
                <input
                  type="time"
                  className={`input ${bookErrors.time ? 'input-error' : ''}`}
                  value={bookForm.time}
                  onChange={(e) => setBookForm((f) => ({ ...f, time: e.target.value }))}
                />
                {bookErrors.time && <p className="field-error">{bookErrors.time}</p>}
              </div>
            </div>

            <div>
              <label className="label">Session Duration</label>
              <div className="flex gap-2 flex-wrap">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => setBookForm((f) => ({ ...f, duration: d }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      bookForm.duration === d
                        ? 'bg-gradient-to-r from-primary-600 to-indigo-600 border-primary-600 text-white shadow-sm ring-2 ring-primary-400/30'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
                    }`}
                  >
                    {d} min
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Study Goal / Topic</label>
              <input
                type="text"
                className={`input ${bookErrors.topic ? 'input-error' : ''}`}
                placeholder="e.g. Differential Equations, Midterm Review"
                value={bookForm.topic}
                onChange={(e) => setBookForm((f) => ({ ...f, topic: e.target.value }))}
              />
              {bookErrors.topic && <p className="field-error">{bookErrors.topic}</p>}
            </div>

            <div>
              <label className="label">Meeting Mode</label>
              <div className="flex gap-2">
                {tutor.mode.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setBookForm((f) => ({ ...f, mode: m }))}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      bookForm.mode === m
                        ? 'bg-primary-50 border-primary-300 text-primary-700 ring-2 ring-primary-500/20'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m === 'Online' ? '💻 Online Video' : '📍 In-person'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">
                Additional Notes <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                className="input h-20 resize-none"
                placeholder="Share any questions or materials in advance…"
                value={bookForm.notes}
                onChange={(e) => setBookForm((f) => ({ ...f, notes: e.target.value }))}
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
                className="btn-primary flex-1 justify-center font-bold shadow-md shadow-primary-600/25"
              >
                Send Request
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

export default TutorProfile
