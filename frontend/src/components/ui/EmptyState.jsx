/**
 * EmptyState – color-graded luxury empty state container.
 * Props: icon (string emoji), title, description, action (ReactNode)
 */
const EmptyState = ({ icon = '📭', title = 'Nothing here yet', description = '', action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center px-4">
    <div className="w-16 h-16 rounded-3xl bg-slate-50 text-3xl flex items-center justify-center mb-4 border border-slate-200/70 shadow-inner">
      {icon}
    </div>
    <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mb-1">{title}</h3>
    {description && <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
)

export default EmptyState
