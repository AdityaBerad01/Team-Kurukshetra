import { Link } from 'react-router-dom'
import Avatar from './ui/Avatar'
import StarRating from './ui/StarRating'
import Badge from './ui/Badge'

/**
 * TutorCard – color-graded luxury card for search results.
 * Props: tutor (object from sampleData / API)
 */
const TutorCard = ({ tutor }) => {
  const { id, name, initials, subjects, rating, reviewCount, hourlyRate, currency, experience, mode, bio, verified, location } = tutor

  return (
    <div className="card hover:shadow-card-hover hover:-translate-y-1 hover:border-primary-300/80 transition-all duration-300 group bg-white/95">
      <div className="flex items-start gap-4">
        <Avatar name={name} initials={initials} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-primary-700 transition-colors tracking-tight">
                  {name}
                </h3>
                {verified && (
                  <span
                    title="Verified Academic Mentor"
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black border border-emerald-300/70"
                  >
                    ✓
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                📍 {location} · <span className="text-slate-500 font-semibold">{experience} exp.</span>
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-extrabold text-slate-900 text-lg tracking-tight">
                <span className="text-sm font-semibold text-primary-700 mr-0.5">{currency}</span>
                {hourlyRate}
                <span className="text-xs text-slate-400 font-normal">/hr</span>
              </p>
            </div>
          </div>

          <div className="mt-1.5">
            <StarRating rating={rating} reviewCount={reviewCount} />
          </div>

          <p className="text-sm text-slate-500 mt-2.5 line-clamp-2 leading-relaxed">
            {bio}
          </p>

          <div className="flex flex-wrap gap-1.5 mt-3.5">
            {subjects.map((s) => (
              <span
                key={s}
                className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-primary-50/90 text-primary-800 border border-primary-200/70"
              >
                {s}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-100/90">
            <div className="flex gap-1.5">
              {mode.map((m) => (
                <Badge key={m} variant={m === 'Online' ? 'blue' : 'green'}>
                  {m === 'Online' ? '💻 Online' : '📍 In-person'}
                </Badge>
              ))}
            </div>
            <Link
              to={`/tutors/${id}`}
              className="btn-primary py-2 px-4 text-xs font-bold"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TutorCard
