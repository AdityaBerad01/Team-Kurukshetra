import { Link } from 'react-router-dom'

/**
 * 404 Not Found page – color-graded luxury layout.
 */
const NotFound = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 py-16">
    <div className="w-20 h-20 rounded-3xl bg-primary-50 text-primary-600 flex items-center justify-center text-4xl mb-6 shadow-inner border border-primary-200/60">
      🔍
    </div>
    <span className="text-xs font-bold uppercase tracking-widest text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200/60 mb-3">
      Error 404
    </span>
    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
      Page Not Found
    </h1>
    <p className="text-slate-500 max-w-sm mb-8 text-sm leading-relaxed font-normal">
      The academic resource or profile you requested could not be located.
    </p>
    <Link to="/" className="btn-primary px-8 py-3 font-bold shadow-md shadow-primary-600/25">
      ← Return to Homepage
    </Link>
  </div>
)

export default NotFound
