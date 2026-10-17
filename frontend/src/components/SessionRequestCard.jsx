import Avatar from './ui/Avatar'
import Badge from './ui/Badge'

/**
 * SessionRequestCard – color-graded luxury session card.
 * Props: request (object), viewAs ('student'|'tutor'), onAccept, onReject, onCancel
 */
const STATUS_ACCENTS = {
  confirmed: 'border-l-emerald-500 bg-gradient-to-r from-emerald-50/20 via-transparent to-transparent',
  accepted:  'border-l-emerald-500 bg-gradient-to-r from-emerald-50/20 via-transparent to-transparent',
  pending:   'border-l-amber-500 bg-gradient-to-r from-amber-50/20 via-transparent to-transparent',
  rejected:  'border-l-rose-500 bg-gradient-to-r from-rose-50/20 via-transparent to-transparent',
  declined:  'border-l-rose-500 bg-gradient-to-r from-rose-50/20 via-transparent to-transparent',
  completed: 'border-l-sky-500 bg-gradient-to-r from-sky-50/20 via-transparent to-transparent',
  cancelled: 'border-l-slate-400 bg-gradient-to-r from-slate-50/20 via-transparent to-transparent',
}

const SessionRequestCard = ({ request, viewAs = 'student', onAccept, onReject, onCancel, isActionLoading = false }) => {
  const { tutorName, tutorInitials, studentName, studentInitials, subject, topic, status, date, time, duration, mode, notes } = request

  const normStatus     = (status || '').toLowerCase()
  const personName     = viewAs === 'student' ? tutorName    : studentName
  const personInitials = viewAs === 'student' ? tutorInitials : studentInitials
  const accentClass    = STATUS_ACCENTS[normStatus] || STATUS_ACCENTS.cancelled

  return (
    <div className={`card border-l-4 ${accentClass} hover:shadow-card-hover transition-all duration-200`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <Avatar name={personName} initials={personInitials} size="md" />
          <div>
            <p className="font-bold text-slate-900 text-sm tracking-tight">{personName || (viewAs === 'student' ? 'Assigned Tutor' : 'Student')}</p>
            <p className="text-primary-700 font-semibold text-sm mt-0.5">{subject} {topic && topic !== subject ? `– ${topic}` : ''}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium text-slate-500">
              {date && <span className="flex items-center gap-1">📅 {date}</span>}
              {time && <span className="flex items-center gap-1">⏰ {time}</span>}
              {duration && <span className="flex items-center gap-1">⏱ {duration} min</span>}
              {mode && <span className="flex items-center gap-1">{mode.toLowerCase().includes('online') ? '💻' : '📍'} {mode}</span>}
            </div>
            {notes && (
              <p className="text-xs text-slate-500 mt-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/60 italic">
                "{notes}"
              </p>
            )}
          </div>
        </div>
        <Badge status={normStatus}>
          {status ? status.toUpperCase() : 'PENDING'}
        </Badge>
      </div>

      {/* Actions */}
      {(onAccept || onReject || onCancel) && (
        <div className="flex gap-2.5 mt-4 pt-3.5 border-t border-slate-100/90">
          {viewAs === 'tutor' && normStatus === 'pending' && (
            <>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => onAccept?.(request.id)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 shadow-sm shadow-emerald-600/20 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Accept Session
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={() => onReject?.(request.id)}
                className="btn-danger py-1.5 px-4 text-xs font-bold disabled:opacity-50"
              >
                Decline
              </button>
            </>
          )}
          {viewAs === 'student' && (normStatus === 'pending' || normStatus === 'accepted' || normStatus === 'confirmed') && (
            <button
              type="button"
              disabled={isActionLoading}
              onClick={() => onCancel?.(request.id)}
              className="btn-secondary py-1.5 px-4 text-xs font-semibold text-rose-600 hover:bg-rose-50 border-rose-200 disabled:opacity-50"
            >
              Cancel Session
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default SessionRequestCard
