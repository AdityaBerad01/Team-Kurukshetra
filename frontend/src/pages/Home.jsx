import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { SAMPLE_SUBJECTS } from '../data/sampleData'
import { fetchTutors } from '../api/tutors'
import TutorCard from '../components/TutorCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'

/* ────── Hero search bar ────── */
const HeroSearch = () => {
  const [query, setQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (query.trim()) navigate(`/tutors?q=${encodeURIComponent(query.trim())}`)
    else navigate('/tutors')
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mt-8">
      <div className="relative flex-1">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by subject, topic, or tutor name…"
          className="w-full pl-12 pr-5 py-4 rounded-xl border border-white/20 bg-white/10 text-white placeholder-indigo-200/70 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white/15 focus:border-white/40 text-sm shadow-inner transition-all"
        />
      </div>
      <button
        type="submit"
        className="px-8 py-4 rounded-xl bg-white text-primary-800 font-bold hover:bg-primary-50 shadow-lg shadow-black/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm flex-shrink-0 flex items-center justify-center gap-2"
      >
        <span>Find Tutors</span>
        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </form>
  )
}

/* ────── How It Works ────── */
const HOW_STEPS = [
  { step: '01', icon: '🔍', title: 'Search Tutors', desc: 'Browse verified peer tutors filtered by subject, teaching mode, price, and schedule.' },
  { step: '02', icon: '📅', title: 'Book a Session', desc: 'Select a mutually convenient slot and submit your request directly to the tutor.' },
  { step: '03', icon: '🎓', title: 'Learn & Excel', desc: 'Collaborate live in high-focus 1-on-1 sessions tailored to your coursework.' },
  { step: '04', icon: '⭐', title: 'Review & Grow', desc: 'Provide constructive feedback to maintain excellence across our peer network.' },
]

/* ────── Stats ────── */
const STATS = [
  { value: '500+', label: 'Verified Peer Tutors' },
  { value: '1,200+', label: 'Sessions Completed' },
  { value: '48+', label: 'Academic Subjects' },
  { value: '4.8★', label: 'Average Peer Rating' },
]

const Home = () => {
  const [featuredTutors, setFeaturedTutors] = useState([])
  const [loadingTutors, setLoadingTutors] = useState(true)
  const popularSubjects = SAMPLE_SUBJECTS.slice(0, 8)

  useEffect(() => {
    let isMounted = true
    fetchTutors({ per_page: 3 })
      .then((data) => {
        if (isMounted) {
          setFeaturedTutors(data.tutors || [])
        }
      })
      .catch(() => {
        if (isMounted) setFeaturedTutors([])
      })
      .finally(() => {
        if (isMounted) setLoadingTutors(false)
      })
    return () => { isMounted = false }
  }, [])

  return (
    <div className="bg-brand-bg">
      {/* ── Hero: Cinema-grade Midnight Sapphire Gradient ── */}
      <section className="relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-primary-950 to-brand-dark text-white overflow-hidden py-24 lg:py-32 border-b border-indigo-950">
        {/* Ambient atmospheric lighting orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-600/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-10 w-96 h-96 bg-violet-600/15 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="page-container relative z-10 text-center">
          {/* Subtle luminous pill badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 text-indigo-200 border border-white/15 text-xs sm:text-sm font-semibold mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(99,102,241,0.25)]">
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
            <span>Join 500+ Verified Tutors &amp; 1,200+ Students</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 text-white drop-shadow-sm">
            Learn Together.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-primary-300 to-accent-gold">
              Teach Together.
            </span><br />
            Grow Together.
          </h1>

          <p className="text-lg sm:text-xl text-indigo-100/90 max-w-2xl mx-auto font-normal leading-relaxed">
            PeerConnect bridges students with high-achieving peer tutors for collaborative, affordable, and transformative learning sessions.
          </p>

          <HeroSearch />

          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 text-xs text-indigo-200/80">
            <span className="font-semibold text-white/90">Trending Subjects:</span>
            {['Mathematics', 'Computer Science', 'Physics', 'Economics'].map((sub) => (
              <Link
                key={sub}
                to={`/tutors?subject=${encodeURIComponent(sub)}`}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
              >
                {sub}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats Bar: Frosted Satin Contrast ── */}
      <section className="bg-gradient-to-b from-white to-slate-50/70 border-b border-slate-200/80">
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x-0 md:divide-x divide-slate-200/60">
            {STATS.map(({ value, label }) => (
              <div key={label} className="px-2">
                <p className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-700 to-indigo-600 tracking-tight">
                  {value}
                </p>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Popular Subjects ── */}
      <section className="py-20 px-4">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 tracking-wider uppercase mb-1">
                <span className="w-2 h-2 rounded-full bg-primary-600" />
                Curated Categories
              </div>
              <h2 className="section-title">Popular Subjects</h2>
              <p className="section-subtitle">Find expert peer assistance across high-demand disciplines</p>
            </div>
            <Link to="/tutors" className="btn-secondary hidden sm:inline-flex gap-2">
              <span>Browse All Subjects</span>
              <span>→</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
            {popularSubjects.map(({ id, name, icon, count }) => (
              <Link
                key={id}
                to={`/tutors?subject=${encodeURIComponent(name)}`}
                className="group card hover:shadow-card-hover hover:-translate-y-1 hover:border-primary-300 hover:bg-primary-50/20 transition-all duration-300 flex flex-col items-center text-center py-7 px-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-slate-50 group-hover:bg-primary-100/70 flex items-center justify-center text-3xl mb-3.5 transition-colors shadow-inner">
                  {icon}
                </div>
                <p className="font-bold text-slate-900 text-sm group-hover:text-primary-700 transition-colors">
                  {name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{count} active tutors</p>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8 sm:hidden">
            <Link to="/tutors" className="btn-secondary w-full justify-center">Browse All Subjects</Link>
          </div>
        </div>
      </section>

      {/* ── Featured Tutors ── */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50/60 border-y border-slate-200/70">
        <div className="page-container">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary-700 tracking-wider uppercase mb-1">
                <span className="w-2 h-2 rounded-full bg-accent-gold" />
                Hand-Picked Mentors
              </div>
              <h2 className="section-title">Featured Tutors</h2>
              <p className="section-subtitle">Top-rated peer tutors with proven academic excellence</p>
            </div>
            <Link to="/tutors" className="btn-secondary hidden sm:inline-flex gap-2">
              <span>View All Tutors</span>
              <span>→</span>
            </Link>
          </div>

          {loadingTutors ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : featuredTutors.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {featuredTutors.map((tutor) => (
                <TutorCard key={tutor.id} tutor={tutor} />
              ))}
            </div>
          ) : (
            <div className="card text-center py-12 px-6 bg-white/95 max-w-lg mx-auto border-slate-200">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center text-2xl mx-auto mb-3">
                🎓
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Discover Academic Mentors</h3>
              <p className="text-slate-500 text-xs mb-5">
                Explore our full verified peer tutor directory to find mentors by subject, rate, and availability.
              </p>
              <Link to="/tutors" className="btn-primary inline-flex justify-center text-xs">
                Browse All Tutors →
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4">
        <div className="page-container">
          <div className="text-center max-w-xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200/60 text-xs font-bold tracking-wider uppercase mb-3">
              Frictionless Process
            </div>
            <h2 className="section-title">How PeerConnect Works</h2>
            <p className="section-subtitle">Get connected with your mentor in four effortless steps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_STEPS.map(({ step, icon, title, desc }) => (
              <div
                key={step}
                className="card relative hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 p-7 group"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center text-2xl transition-colors">
                    {icon}
                  </div>
                  <span className="text-xl font-extrabold text-slate-200 group-hover:text-primary-300 transition-colors">
                    {step}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA: Cosmic Obsidian Glow Banner ── */}
      <section className="py-20 px-4">
        <div className="page-container">
          <div className="relative rounded-3xl bg-gradient-to-r from-primary-900 via-indigo-900 to-brand-dark text-white text-center py-16 px-6 sm:px-12 overflow-hidden shadow-2xl border border-white/10">
            {/* Ambient background blur */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 blur-[100px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent-gold/15 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <span className="inline-block px-3 py-1 rounded-full bg-white/10 text-indigo-200 border border-white/15 text-xs font-semibold uppercase tracking-wider mb-4">
                Empower Your Academic Journey
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
                Ready to accelerate your learning?
              </h2>
              <p className="text-indigo-100/90 mb-8 text-base sm:text-lg font-normal">
                Join our peer-to-peer network today to master difficult coursework or share your knowledge as a tutor.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="px-8 py-3.5 rounded-xl bg-white text-primary-800 font-bold hover:bg-primary-50 shadow-lg shadow-black/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/tutors"
                  className="px-8 py-3.5 rounded-xl border border-white/30 text-white font-semibold hover:bg-white/10 active:scale-[0.98] transition-all text-sm"
                >
                  Browse All Tutors
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
