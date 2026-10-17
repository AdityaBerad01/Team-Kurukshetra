import Modal from './ui/Modal'
import Badge from './ui/Badge'
import Avatar from './ui/Avatar'

const SessionDetailsModal = ({ isOpen, onClose, session }) => {
  if (!isOpen || !session) return null

  const normStatus = (session.status || '').toLowerCase()

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Session Details">
      <div className="space-y-5">
        {/* Header summary */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-3">
            <Avatar name={session.tutorName || session.studentName} initials={session.tutorInitials || session.studentInitials} size="lg" />
            <div>
              <p className="font-bold text-slate-900 text-base">{session.subject}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Tutor: <span className="font-semibold text-slate-800">{session.tutorName || 'Peer Tutor'}</span>
                {session.studentName && (
                  <> • Student: <span className="font-semibold text-slate-800">{session.studentName}</span></>
                )}
              </p>
            </div>
          </div>
          <Badge status={normStatus}>
            {session.status || 'PENDING'}
          </Badge>
        </div>

        {/* Schedule & Mode Information */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-100 bg-white">
            <span className="text-slate-400 block mb-1">📅 Scheduled Date</span>
            <span className="font-bold text-slate-800 text-sm">{session.date || 'To be scheduled'}</span>
          </div>
          <div className="p-3 rounded-xl border border-slate-100 bg-white">
            <span className="text-slate-400 block mb-1">⏰ Time &amp; Duration</span>
            <span className="font-bold text-slate-800 text-sm">
              {session.time || 'TBD'} {session.duration ? `(${session.duration} min)` : ''}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-slate-100 bg-white">
            <span className="text-slate-400 block mb-1">📍 Learning Mode</span>
            <span className="font-bold text-slate-800 text-sm">
              {session.mode?.toLowerCase().includes('online') ? '💻 Online Session' : '🏢 On Campus'}
            </span>
          </div>
          <div className="p-3 rounded-xl border border-slate-100 bg-white">
            <span className="text-slate-400 block mb-1">🆔 Session Reference</span>
            <span className="font-mono text-slate-600 text-[11px] break-all">{session.id}</span>
          </div>
        </div>

        {/* Student Inquiry Message */}
        {session.notes && (
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Learning Goals &amp; Questions</h4>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 leading-relaxed italic">
              "{session.notes}"
            </div>
          </div>
        )}

        {/* Stored Review (if completed and reviewed) */}
        {session.is_reviewed && session.review && (
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Session Review &amp; Rating</span>
              <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                <span>{'★'.repeat(session.review.rating)}</span>
                <span className="text-slate-400 font-normal">{'★'.repeat(5 - session.review.rating)}</span>
                <span className="text-xs text-amber-900 ml-1">({session.review.rating}/5)</span>
              </div>
            </div>
            {session.review.comment && (
              <p className="text-xs text-slate-700 italic bg-white/80 p-2.5 rounded-xl border border-amber-200/50">
                "{session.review.comment}"
              </p>
            )}
            {session.review.created_at && (
              <p className="text-[10px] text-amber-700/80 mt-1.5 text-right">
                Submitted on {session.review.created_at.split('T')[0]}
              </p>
            )}
          </div>
        )}

        {/* Timestamps */}
        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex flex-wrap justify-between gap-2">
          {session.created_at && (
            <span>Created: {session.created_at.split('T')[0]}</span>
          )}
          {session.completed_at && (
            <span>Completed: {session.completed_at.split('T')[0]}</span>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary py-2 px-5 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default SessionDetailsModal
