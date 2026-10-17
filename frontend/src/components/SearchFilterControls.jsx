/**
 * SearchFilterControls – color-graded luxury search input with collapsible filter drawer.
 *
 * Props:
 * - query: string
 * - onQueryChange: (val: string) => void
 * - onSubmit: (e: React.FormEvent) => void
 * - subject: string
 * - onSubjectChange: (val: string) => void
 * - subjectsList: Array<{ id: string|number, name: string }>
 * - mode: string
 * - onModeChange: (val: string) => void
 * - modesList: Array<string>
 * - maxPrice: number
 * - onMaxPriceChange: (val: number) => void
 * - sortBy: string
 * - onSortByChange: (val: string) => void
 * - sortOptions: Array<{ value: string, label: string }>
 * - filtersOpen: boolean
 * - onToggleFilters: () => void
 * - hasFilters: boolean
 * - onClearFilters: () => void
 */
const SearchFilterControls = ({
  query,
  onQueryChange,
  onSubmit,
  subject,
  onSubjectChange,
  subjectsList = [],
  mode,
  onModeChange,
  modesList = ['Online', 'In-person'],
  maxPrice,
  onMaxPriceChange,
  sortBy,
  onSortByChange,
  sortOptions = [],
  filtersOpen,
  onToggleFilters,
  hasFilters,
  onClearFilters,
}) => {
  return (
    <div className="mb-6 space-y-4">
      {/* Search Input Bar */}
      <form onSubmit={onSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search by name, subject, or academic topic…"
            className="input pl-10 h-11"
          />
        </div>
        <button type="submit" className="btn-primary px-6 h-11 font-bold">
          Search
        </button>
        <button
          type="button"
          onClick={onToggleFilters}
          className={`btn-secondary h-11 gap-2 font-semibold ${
            filtersOpen ? 'border-primary-400 bg-primary-50/70 text-primary-700 ring-2 ring-primary-500/20' : ''
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
            />
          </svg>
          <span>Filters</span>
          {hasFilters && <span className="w-2 h-2 rounded-full bg-accent-gold ring-2 ring-amber-300" />}
        </button>
      </form>

      {/* Filter Panel */}
      {filtersOpen && (
        <div className="card bg-white/95 border-slate-200/80 shadow-card">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Subject Selector */}
            <div>
              <label className="label">Subject</label>
              <select
                value={subject}
                onChange={(e) => onSubjectChange(e.target.value)}
                className="input"
              >
                <option value="">All Subjects</option>
                {subjectsList.map((s) => (
                  <option key={s.id || s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Selector */}
            <div>
              <label className="label">Teaching Mode</label>
              <select
                value={mode}
                onChange={(e) => onModeChange(e.target.value)}
                className="input"
              >
                <option value="">All Modes</option>
                {modesList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Price Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="label mb-0">Max Hourly Rate</label>
                <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-md border border-primary-200/60">
                  ₹{maxPrice}/hr
                </span>
              </div>
              <input
                type="range"
                min={100}
                max={1000}
                step={50}
                value={maxPrice}
                onChange={(e) => onMaxPriceChange(Number(e.target.value))}
                className="w-full accent-primary-600 mt-2 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-1">
                <span>₹100</span>
                <span>₹1,000</span>
              </div>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="label">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className="input"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {hasFilters && (
            <div className="mt-5 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClearFilters}
                className="btn-ghost text-rose-600 hover:bg-rose-50 text-xs font-bold"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchFilterControls
