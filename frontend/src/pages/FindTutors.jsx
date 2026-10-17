import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchTutors, fetchTutorRecommendations } from '../api/tutors'
import { SAMPLE_SUBJECTS } from '../data/sampleData'
import TutorCard from '../components/TutorCard'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
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
  const [mode, setMode]               = useState(searchParams.get('mode') || '')
  const [date, setDate]               = useState(searchParams.get('date') || '')
  const [maxPrice, setMaxPrice]       = useState(1000)
  const [sortBy, setSortBy]           = useState('rating')
  const [page, setPage]               = useState(1)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [tutors, setTutors]           = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [total, setTotal]             = useState(0)
  const [totalPages, setTotalPages]   = useState(1)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    let isMounted = true

    // Map UI mode to backend expected mode
    let apiMode = mode
    if (mode === 'In-person') apiMode = 'ON_CAMPUS'
    else if (mode === 'Online') apiMode = 'ONLINE'

    fetchTutors({
      q: query,
      subject,
      mode: apiMode,
      date,
      page,
      per_page: 12,
    })
      .then((data) => {
        if (!isMounted) return
        let list = data.tutors || []
        // Apply client-side sorting and price threshold
        list = list.filter((t) => (t.hourlyRate || t.hourly_rate || 300) <= maxPrice)
        if (sortBy === 'price_asc') {
          list.sort((a, b) => (a.hourlyRate || a.hourly_rate || 0) - (b.hourlyRate || b.hourly_rate || 0))
        } else if (sortBy === 'price_desc') {
          list.sort((a, b) => (b.hourlyRate || b.hourly_rate || 0) - (a.hourlyRate || a.hourly_rate || 0))
        }

        setTutors(list)
        setTotal(data.total || list.length)
        setTotalPages(data.total_pages || 1)
        setError(null)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load tutors:', err)
        setError(err.response?.data?.message || 'Unable to connect to tutor directory. Please try again.')
        setLoading(false)
      })

    return () => { isMounted = false }
  }, [query, subject, mode, date, page, maxPrice, sortBy, refreshIndex])

  useEffect(() => {
    let isMounted = true

    let apiMode = mode
    if (mode === 'In-person') apiMode = 'ON_CAMPUS'
    else if (mode === 'Online') apiMode = 'ONLINE'

    fetchTutorRecommendations({
      subject,
      mode: apiMode,
      limit: 3,
    })
      .then((recs) => {
        if (!isMounted) return
        setRecommendations(Array.isArray(recs) ? recs : [])
      })
      .catch((err) => {
        console.warn('Failed to load tutor recommendations:', err)
        if (isMounted) setRecommendations([])
      })

    return () => { isMounted = false }
  }, [subject, mode, refreshIndex])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setLoading(true)
    const params = {}
    if (query) params.q = query
    if (subject) params.subject = subject
    if (mode) params.mode = mode
    if (date) params.date = date
    setSearchParams(params)
    setRefreshIndex((i) => i + 1)
  }

  const clearFilters = () => {
    setQuery('')
    setSubject('')
    setMode('')
    setDate('')
    setMaxPrice(1000)
    setSortBy('rating')
    setPage(1)
    setLoading(true)
    setSearchParams({})
    setRefreshIndex((i) => i + 1)
  }

  const hasFilters = Boolean(query || subject || mode || date || maxPrice < 1000 || sortBy !== 'rating')

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
            Showing {total} verified educator{total !== 1 ? 's' : ''}
          </span>
        </div>
        <p className="text-slate-500 text-sm mt-1">
          Connect with vetted peer tutors across undergraduate coursework and competitive subjects.
        </p>
      </div>

      {/* Search & Filter Controls */}
      <SearchFilterControls
        query={query}
        onQueryChange={setQuery}
        onSubmit={handleSearch}
        subject={subject}
        onSubjectChange={(s) => { setSubject(s); setPage(1); setLoading(true) }}
        subjectsList={SAMPLE_SUBJECTS}
        mode={mode}
        onModeChange={(m) => { setMode(m); setPage(1); setLoading(true) }}
        modesList={MODES}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOptions={SORT_OPTIONS}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen(!filtersOpen)}
        date={date}
        onDateChange={(d) => { setDate(d); setPage(1); setLoading(true) }}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
      />

      {/* Loading state */}
      {loading && (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm font-semibold text-slate-500 mt-4">Searching verified peer mentors…</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="card bg-rose-50/80 border-rose-200 p-8 text-center my-6">
          <p className="text-rose-700 font-bold mb-3">{error}</p>
          <button
            type="button"
            onClick={() => { setLoading(true); setRefreshIndex((i) => i + 1) }}
            className="btn-secondary text-xs"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {!loading && !error && tutors.length === 0 && (
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
      )}

      {/* Recommended Mentors Highlight */}
      {!loading && !error && recommendations.length > 0 && (
        <section aria-label="Recommended Mentors" className="mb-10 p-6 rounded-2xl bg-gradient-to-r from-amber-50/70 via-primary-50/40 to-slate-50/60 border border-amber-200/70 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/10 text-amber-700 text-sm font-bold">
                ✨
              </span>
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Recommended Mentors for You
                </h2>
                <p className="text-xs text-slate-500">
                  {subject ? `Top-matched educators teaching ${subject}` : 'High-rated mentors with active upcoming availability'}
                </p>
              </div>
            </div>
            <span className="self-start sm:self-auto text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-full border border-amber-300/60">
              Explainable AI Match
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {recommendations.map((recTutor) => (
              <TutorCard key={`rec-${recTutor.id}`} tutor={recTutor} />
            ))}
          </div>
        </section>
      )}

      {!loading && !error && tutors.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600">
              {hasFilters ? 'Filtered Mentors' : 'All Verified Mentors'} ({total})
            </h2>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {tutors.map((tutor) => (
              <TutorCard key={tutor.id} tutor={tutor} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => { setPage((p) => Math.max(1, p - 1)); setLoading(true) }}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                ← Previous
              </button>
              <span className="text-xs font-bold text-slate-600 px-3">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); setLoading(true) }}
                className="btn-secondary text-xs disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default FindTutors
