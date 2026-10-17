import { useState, useEffect } from 'react'
import { fetchResources, createResource, toggleUpvoteResource, deleteResource } from '../api/resources'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'

const SUBJECT_CATEGORIES = ['All', 'Mathematics', 'Computer Science', 'Physics', 'Chemistry', 'Economics', 'Statistics']
const LANGUAGES = ['All', 'English', 'Hindi', 'Marathi']

const CommunityResources = () => {
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('All')
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [sortBy, setSortBy] = useState('popular')
  const [refreshKey, setRefreshKey] = useState(0)

  // Creation modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject: 'Mathematics',
    topic: '',
    language: 'English',
    resource_type: 'LINK',
    url: '',
    tags: '',
  })

  useEffect(() => {
    let isMounted = true
    const params = {
      q: query.trim(),
      subject: selectedSubject === 'All' ? '' : selectedSubject,
      language: selectedLanguage === 'All' ? '' : selectedLanguage,
      sort_by: sortBy,
    }

    fetchResources(params)
      .then((data) => {
        if (!isMounted) return
        setResources(data.resources || [])
        setError(null)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load community resources:', err)
        setError('Unable to load resources. Please try again.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [query, selectedSubject, selectedLanguage, sortBy, refreshKey])

  const handleUpvote = async (resourceId) => {
    if (!user) {
      alert('Please log in to upvote study materials.')
      return
    }

    try {
      const updated = await toggleUpvoteResource(resourceId)
      setResources((prev) =>
        prev.map((r) => (r.id === resourceId ? { ...r, upvotes: updated.upvotes, has_upvoted: updated.has_upvoted } : r))
      )
    } catch (err) {
      console.error('Failed to upvote resource:', err)
    }
  }

  const handleDelete = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this study resource?')) return
    try {
      await deleteResource(resourceId)
      setResources((prev) => prev.filter((r) => r.id !== resourceId))
    } catch (err) {
      console.error('Failed to delete resource:', err)
      alert(err.response?.data?.message || 'Could not delete resource.')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setFormError(null)

    if (!form.title.trim()) {
      setFormError('Resource title is required.')
      return
    }
    if (form.resource_type === 'LINK' && !form.url.trim()) {
      setFormError('Valid resource URL is required for link submissions.')
      return
    }

    setSubmitting(true)
    try {
      const tagsArray = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
      await createResource({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        tags: tagsArray,
      })
      setModalOpen(false)
      setForm({
        title: '',
        description: '',
        subject: 'Mathematics',
        topic: '',
        language: 'English',
        resource_type: 'LINK',
        url: '',
        tags: '',
      })
      setRefreshKey((k) => k + 1)
    } catch (err) {
      console.error('Failed to publish resource:', err)
      setFormError(err.response?.data?.message || 'Failed to submit resource. Please check inputs.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Peer Knowledge Exchange
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Community Notes &amp; Resources
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse peer-submitted lecture notes, cheat sheets, video links, and course guides.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setModalOpen(true); setFormError(null) }}
          className="btn-primary gap-2 font-bold shadow-md shadow-primary-600/25 flex-shrink-0"
        >
          <span>+ Share Resource</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card bg-white p-5 border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by topic, keyword, or course tags…"
              className="input-field pl-10 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="input-field text-xs py-2 w-36"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l === 'All' ? 'All Languages' : l}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field text-xs py-2 w-36"
            >
              <option value="popular">Most Helpful</option>
              <option value="newest">Recently Added</option>
            </select>
          </div>
        </div>

        {/* Subject Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {SUBJECT_CATEGORIES.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                selectedSubject === sub
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Resource Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm font-semibold text-slate-500 mt-4">Loading community study library…</p>
        </div>
      ) : error ? (
        <div className="card bg-rose-50 border-rose-200 p-6 text-center">
          <p className="text-rose-700 font-bold mb-2">{error}</p>
          <button type="button" onClick={() => setRefreshKey((k) => k + 1)} className="btn-secondary text-xs">
            Retry
          </button>
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No study resources found"
          description="Be the first peer scholar to share lecture notes or study guides for this topic."
          action={
            <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
              + Share First Resource
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resources.map((res) => {
            const isAuthor = user?.id && String(user.id) === String(res.author_id)
            return (
              <div key={res.id} className="card bg-white p-5 border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-card-hover transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200/60">
                      {res.subject}
                    </span>
                    <span className="text-[11px] font-medium text-slate-400">
                      🗣️ {res.language}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-snug tracking-tight">
                      {res.title}
                    </h3>
                    {res.topic && (
                      <p className="text-xs font-semibold text-primary-700 mt-0.5">{res.topic}</p>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {res.description || 'Verified peer educational material.'}
                  </p>

                  {res.tags && res.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {res.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    Shared by <span className="font-bold text-slate-700">{res.author_name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Upvote button */}
                    <button
                      type="button"
                      onClick={() => handleUpvote(res.id)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                        res.has_upvoted
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200'
                      }`}
                      title="Mark as helpful"
                    >
                      <span>▲</span>
                      <span>{res.upvotes}</span>
                    </button>

                    {/* Open link */}
                    {res.url && (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary py-1 px-3 text-xs font-bold flex items-center gap-1"
                      >
                        <span>Open</span>
                        <span>↗</span>
                      </a>
                    )}

                    {isAuthor && (
                      <button
                        type="button"
                        onClick={() => handleDelete(res.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete your submission"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Submit Resource Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Share Study Material with Peers"
        >
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {formError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Resource Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Linear Algebra Eigenvalues Cheat Sheet"
                className="input-field text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="input-field text-xs"
                >
                  {SUBJECT_CATEGORIES.filter((s) => s !== 'All').map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm({ ...form, language: e.target.value })}
                  className="input-field text-xs"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi (हिंदी)</option>
                  <option value="Marathi">Marathi (मराठी)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Specific Topic / Unit</label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="e.g. Unit 3: Matrices & Vector Spaces"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Resource URL / Link <span className="text-rose-500">*</span></label>
              <input
                type="url"
                required
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://drive.google.com/... or https://github.com/..."
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description &amp; Key Takeaways</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe what this note covers and how it helps students prepare for exams."
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="midterms, formula-sheet, proofs"
                className="input-field text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary text-xs py-2 px-5 font-bold"
              >
                {submitting ? 'Publishing…' : 'Share Material'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default CommunityResources
