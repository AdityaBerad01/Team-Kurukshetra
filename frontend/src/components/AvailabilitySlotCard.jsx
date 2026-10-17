/**
 * AvailabilitySlotCard – color-graded luxury availability slot card.
 *
 * Props:
 * - day: string (e.g. 'Monday')
 * - slots: Array<string> (e.g. ['09:00 AM', '10:00 AM'])
 * - isEditable?: boolean (whether delete buttons are shown)
 * - onRemoveDay?: () => void
 * - onRemoveSlot?: (slot: string) => void
 * - onSelectSlot?: (slot: string) => void
 * - selectedSlot?: string
 */
const AvailabilitySlotCard = ({
  day,
  slots = [],
  isEditable = false,
  onRemoveDay,
  onRemoveSlot,
  onSelectSlot,
  selectedSlot,
}) => {
  return (
    <div className="card hover:shadow-card-hover transition-all duration-200 bg-white/95">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">📅</span>
          <h3 className="font-bold text-slate-900 tracking-tight">{day}</h3>
          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2.5 py-0.5 rounded-full border border-primary-200/60">
            {slots.length} slot{slots.length !== 1 ? 's' : ''} available
          </span>
        </div>
        {isEditable && onRemoveDay && (
          <button
            type="button"
            onClick={onRemoveDay}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors font-semibold"
          >
            Remove Day
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {slots.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No available slots configured</p>
        ) : (
          slots.map((time) => {
            const isSelected = selectedSlot === time

            return (
              <span
                key={time}
                onClick={onSelectSlot ? () => onSelectSlot(time) : undefined}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  onSelectSlot ? 'cursor-pointer hover:scale-105 select-none' : ''
                } ${
                  isSelected
                    ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/30 ring-2 ring-primary-400/50'
                    : 'bg-primary-50/80 text-primary-800 border border-primary-200/70 hover:bg-primary-100/70 hover:border-primary-300'
                }`}
              >
                <span>⏰ {time}</span>
                {isEditable && onRemoveSlot && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveSlot(time)
                    }}
                    className="hover:text-rose-600 text-primary-400 ml-1 text-base leading-none transition-colors"
                    aria-label={`Remove ${time}`}
                  >
                    ×
                  </button>
                )}
              </span>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AvailabilitySlotCard
