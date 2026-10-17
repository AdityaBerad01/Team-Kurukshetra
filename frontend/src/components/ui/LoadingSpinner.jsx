/**
 * LoadingSpinner – color-graded luxury loading spinner.
 * Props: fullPage (bool), size ('sm'|'md'|'lg')
 */
const sizeMap = { sm: 'w-5 h-5 border-2', md: 'w-9 h-9 border-[3px]', lg: 'w-14 h-14 border-4' }

const Spinner = ({ size = 'md' }) => (
  <div
    className={`${sizeMap[size]} border-primary-200/80 border-t-primary-600 border-r-primary-500 rounded-full animate-spin shadow-sm`}
  />
)

const LoadingSpinner = ({ fullPage = false, size = 'md' }) => {
  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-md flex items-center justify-center z-50">
        <div className="p-5 rounded-3xl bg-white shadow-2xl border border-slate-100 flex flex-col items-center gap-3">
          <Spinner size={size} />
          <span className="text-xs font-bold text-slate-700 tracking-tight">Loading PeerConnect…</span>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner size={size} />
    </div>
  )
}

export default LoadingSpinner
