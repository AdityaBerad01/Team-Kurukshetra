import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SAMPLE_TUTORS, SAMPLE_SUBJECTS } from '../data/sampleData'
import TutorCard from '../components/TutorCard'
import EmptyState from '../components/ui/EmptyState'
import SearchFilterControls from '../components/SearchFilterControls'

const MODES = ['Online', 'In-person']
const SORT_OPTIONS = [
  { value: 'rating',     label: 'Highest Rated' },
  { value: 'price_asc',  label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'reviews',    label: 'Most Reviewed' },
]

const FindTutors = () => {
  const [searchParams, setSearchParams] = useSearchParams()

  const [query, setQuery]             = useState(searchParams.get('q') || '')
  const [subject, setSubject]         = useState(searchParams.get('subject') || '')
  const [mode, setMode]               = useState('')
  const [maxPrice, setMaxPrice]       = useState(1000)
  const [sortBy, setSortBy]           = useState('rating')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const handleSearch = (e) => {
    e.preventDefault()
    const params = {}
    if (query) params.q = query
    if (subject) params.subject = subject
    setSearchParams(params)
  }

  const filtered = useMemo(() => {
    let list = [...SAMPLE_TUTORS]

    const q = query.toLowerCase()
    if (q) {
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.subjects.some((s) => s.toLowerCase().includes(q)) ||
          t.bio.toLowerCase().includes(q),
      )
    }

    if (subject) list = list.filter((t) => t.subjects.includes(subject))
    if (mode) list = list.filter((t) => t.mode.includes(mode))
    list = list.filter((t) => t.hourlyRate <= maxPrice)

    if (sortBy === 'rating')     list.sort((a, b) => b.rating - a.rating)
    if (sortBy === 'reviews')    list.sort((a, b) => b.reviewCount - a.reviewCount)
    if (sortBy === 'price_asc')  list.sort((a, b) => a.hourlyRate - b.hourlyRate)
    if (sortBy === 'price_desc') list.sort((a, b) => b.hourlyRate - a.hourlyRate)

    return list
  }, [query, subject, mode, maxPrice, sortBy])

  const clearFilters = () => {
    setQuery('')
    setSubject('')
    setMode('')
    setMaxPrice(1000)
    setSortBy('rating')
    setSearchParams({})
  }

  const hasFilters = query || subject || mode || maxPrice < 1000 || sortBy !== 'rating'

  return (
    <div className="page-container py-10">
      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-primary-600" />
          Academic Directory
        </div>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Find Your Peer Mentor
          </h1>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-800 border border-primary-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
            Showing {filtered.length} verified educator{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Connect with vetted peer tutors across dozens of undergraduate and competitive subjects.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <SearchFilterControls
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSearch}
        subject={subject}
        onSubjectChange={setSubject}
        subjectsList={SAMPLE_SUBJECTS}
        mode={mode}
        onModeChange={setMode}
        modesList={MODES}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOptions={SORT_OPTIONS}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen(!filtersOpen)}
        hasFilters={Boolean(hasFilters)}
        onClearFilters={clearFilters}
      />

      {/* Results */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No mentors match your filter criteria"
          description="Try broadening your subject, relaxing the hourly rate limit, or clearing active filters."
          action={
            <button type="button" onClick={clearFilters} className="btn-primary">
              Clear All Filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filtered.map((tutor) => (
            <TutorCard key={tutor.id} tutor={tutor} />
          ))}
        </div>
      )}
    </div>
  )
}

export default FindTutors
