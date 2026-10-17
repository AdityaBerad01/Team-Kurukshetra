import { useState } from 'react'
import Modal from './ui/Modal'
import { submitReview } from '../api/reviews'

const RATING_LABELS = {
  1: 'Poor – Needs significant improvement',
  2: 'Fair – Did not meet expectations',
  3: 'Good – Satisfactory learning session',
  4: 'Very Good – Helpful and engaging',
  5: 'Excellent – Outstanding mentorship!',
}

const ReviewModal = ({ isOpen, onClose, session, onSuccess }) => {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen || !session) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!rating) {
      setError('Please select a star rating between 1 and 5.')
      return
    }
    if (!comment.trim() || comment.trim().length < 3) {
      setError('Please write at least 3 characters in your review.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      await submitReview({
        request_id: session.id,
        rating,
        comment: comment.trim(),
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to submit review. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const activeStars = hoverRating || rating

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isSubmitting) onClose()
      }}
      title="Review Your Mentorship Session"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Session context */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Session</p>
          <p className="text-sm font-bold text-slate-900 mt-0.5">
            {session.tutorName} – <span className="text-primary-700">{session.subject}</span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            📅 {session.date} {session.time ? `• ⏰ ${session.time}` : ''}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Star Rating Selection */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
            Rating <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-1.5 py-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                className="text-2xl transition-transform hover:scale-125 focus:outline-none"
                aria-label={`${star} star`}
              >
                <span className={star <= activeStars ? 'text-amber-400' : 'text-slate-200'}>
                  ★
                </span>
              </button>
            ))}
            <span className="text-xs font-semibold text-slate-600 ml-2">
              {RATING_LABELS[activeStars] || ''}
            </span>
          </div>
        </div>

        {/* Comment Textarea */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Feedback &amp; Comments <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {comment.length}/1000
            </span>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder="Share your experience: How well did the tutor explain concepts? Was the pace suitable?"
            className="input-field text-sm leading-relaxed"
            required
          />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="btn-secondary py-2 px-4 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary py-2 px-5 text-xs font-bold shadow-md shadow-primary-600/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ReviewModal
