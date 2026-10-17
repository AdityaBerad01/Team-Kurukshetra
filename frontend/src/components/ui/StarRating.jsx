/**
 * StarRating – color-graded luxury star rating display.
 * Props: rating (number 0-5), reviewCount (number), size ('sm'|'md'|'lg')
 */
const StarRating = ({ rating = 0, reviewCount = null, size = 'sm' }) => {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1)
  const sizeClass = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {stars.map((star) => (
          <svg
            key={star}
            className={`${sizeClass} ${
              star <= Math.round(rating)
                ? 'text-accent-gold drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]'
                : 'text-slate-200'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      <span className="text-xs sm:text-sm font-bold text-slate-800 ml-0.5 tracking-tight">
        {rating.toFixed(1)}
      </span>
      {reviewCount !== null && (
        <span className="text-xs font-medium text-slate-400">
          ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  )
}

export default StarRating
