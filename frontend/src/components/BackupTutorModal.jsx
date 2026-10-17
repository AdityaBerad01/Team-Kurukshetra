import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchBackupTutors } from '../api/requests'
import Modal from './ui/Modal'
import LoadingSpinner from './ui/LoadingSpinner'
import Avatar from './ui/Avatar'
import StarRating from './ui/StarRating'

const BackupTutorModal = ({ isOpen, onClose, session }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !session) return
    let isMounted = true

    fetchBackupTutors(session.id)
      .then((res) => {
        if (!isMounted) return
        setData(res)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load backup tutors:', err)
        setError('Unable to find alternative backup tutors at this time.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [isOpen, session])

  if (!isOpen || !session) return null

  const backupTutors = data?.backup_tutors || []

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Backup Tutor Matches"
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
        {/* Context banner */}
        <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Original Appointment</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            Subject: <span className="text-primary-700">{session.subject}</span>
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Your original booking was {session.status?.toLowerCase()}. We identified top-matching alternative mentors with upcoming available calendar slots.
          </p>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <LoadingSpinner size="md" />
            <p className="text-xs font-semibold text-slate-400 mt-3">Finding compatible replacement mentors…</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-xs font-medium text-center">
            {error}
          </div>
        ) : backupTutors.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No alternative tutors with open slots found for this specific subject right now.
            <div className="mt-3">
              <Link to="/tutors" onClick={onClose} className="btn-primary text-xs">
                Browse Full Tutor Directory
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {backupTutors.map((tutor) => {
              const tutorId = tutor.user_id || tutor.id
              return (
                <div
                  key={tutorId}
                  className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-primary-400 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={tutor.name} initials={tutor.initials} size="md" />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{tutor.name}</h4>
                        <p className="text-[11px] text-slate-400">
                          {tutor.university} · {tutor.location}
                        </p>
                        <div className="mt-1">
                          <StarRating rating={tutor.rating || 4.9} reviewCount={tutor.reviewCount} size="sm" />
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200">
                        {tutor.compatibility_score ? `${tutor.compatibility_score}% match` : 'Top Match'}
                      </span>
                      <p className="text-xs font-extrabold text-slate-900 mt-1">
                        ₹{tutor.hourly_rate || tutor.hourlyRate || 300}/hr
                      </p>
                    </div>
                  </div>

                  {/* Matching Reasons */}
                  {tutor.reasons && tutor.reasons.length > 0 && (
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      {tutor.reasons.map((r, idx) => (
                        <p key={idx} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{r}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Available Slots Preview */}
                  {tutor.available_slots && tutor.available_slots.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Compatible Open Slots:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {tutor.available_slots.map((slot) => (
                          <span
                            key={slot.id}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
                          >
                            📅 {slot.date} ({slot.start_time})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Link
                      to={`/tutors/${tutorId}`}
                      onClick={onClose}
                      className="btn-primary py-1.5 px-4 text-xs font-bold"
                    >
                      Book Replacement Session →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-1.5 px-4 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default BackupTutorModal
