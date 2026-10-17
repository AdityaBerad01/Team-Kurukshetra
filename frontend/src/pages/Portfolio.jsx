import { useState, useEffect } from 'react'
import { fetchMyPortfolio, updateMyPortfolio } from '../api/portfolio'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'
import Avatar from '../components/ui/Avatar'

const Portfolio = () => {
  const { user } = useAuth()
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState(null)

  // Edit header modal
  const [headerModal, setHeaderModal] = useState(false)
  const [headline, setHeadline] = useState('')
  const [bioSummary, setBioSummary] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  // Add project modal
  const [projectModal, setProjectModal] = useState(false)
  const [projForm, setProjForm] = useState({
    title: '',
    description: '',
    repo_url: '',
    demo_url: '',
    skills: '',
  })

  // Skill input
  const [newSkill, setNewSkill] = useState('')

  useEffect(() => {
    let isMounted = true
    fetchMyPortfolio()
      .then((data) => {
        if (!isMounted) return
        setPortfolio(data)
        setHeadline(data.headline || '')
        setBioSummary(data.bio_summary || '')
        setIsPublic(data.is_public ?? true)
      })
      .catch((err) => console.error('Failed to load portfolio:', err))
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [])

  const handleSaveHeader = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updated = await updateMyPortfolio({
        headline,
        bio_summary: bioSummary,
        is_public: isPublic,
      })
      setPortfolio(updated)
      setHeaderModal(false)
      setSaveMsg('Portfolio details updated successfully!')
      setTimeout(() => setSaveMsg(null), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update portfolio.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddProject = async (e) => {
    e.preventDefault()
    if (!projForm.title.trim()) return

    const skillsArray = projForm.skills.split(',').map((s) => s.trim()).filter(Boolean)
    const newProject = {
      title: projForm.title.trim(),
      description: projForm.description.trim(),
      repo_url: projForm.repo_url.trim(),
      demo_url: projForm.demo_url.trim(),
      skills: skillsArray,
      is_public: true,
    }

    setSaving(true)
    try {
      const currentProjects = portfolio?.projects || []
      const updated = await updateMyPortfolio({
        projects: [...currentProjects, newProject],
      })
      setPortfolio(updated)
      setProjectModal(false)
      setProjForm({ title: '', description: '', repo_url: '', demo_url: '', skills: '' })
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add project.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Delete this project from your portfolio?')) return
    const remaining = (portfolio?.projects || []).filter((p) => p.id !== projectId)
    try {
      const updated = await updateMyPortfolio({ projects: remaining })
      setPortfolio(updated)
    } catch {
      alert('Failed to delete project.')
    }
  }

  const handleAddSkill = async (e) => {
    e.preventDefault()
    if (!newSkill.trim()) return
    const currentSkills = portfolio?.skills || []
    if (currentSkills.includes(newSkill.trim())) {
      setNewSkill('')
      return
    }

    try {
      const updated = await updateMyPortfolio({
        skills: [...currentSkills, newSkill.trim()],
      })
      setPortfolio(updated)
      setNewSkill('')
    } catch {
      alert('Failed to add skill.')
    }
  }

  const handleRemoveSkill = async (skillToRemove) => {
    const remaining = (portfolio?.skills || []).filter((s) => s !== skillToRemove)
    try {
      const updated = await updateMyPortfolio({ skills: remaining })
      setPortfolio(updated)
    } catch {
      alert('Failed to remove skill.')
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500 mt-4">Compiling verified skill portfolio…</p>
      </div>
    )
  }

  const {
    user_name = user?.name || 'Peer Scholar',
    user_role = user?.role || 'STUDENT',
    campus = user?.campus || 'Campus',
    verified_achievements = [],
    projects = [],
    skills = [],
  } = portfolio || {}

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="card bg-gradient-to-r from-primary-900 via-primary-800 to-indigo-950 text-white p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar name={user_name} size="xl" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{user_name}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/20 text-white">
                  {user_role}
                </span>
              </div>
              <p className="text-sm text-primary-200 font-semibold mt-1">
                {headline || 'Aspiring Scholar & Peer Mentor'}
              </p>
              <p className="text-xs text-primary-300 mt-0.5">
                📍 {campus || 'Academic Campus'} · {isPublic ? '🌐 Public Portfolio' : '🔒 Private'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setHeaderModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white/15 text-white hover:bg-white/25 border border-white/20 transition-all"
            >
              ✎ Edit Header &amp; Bio
            </button>
            <button
              type="button"
              onClick={() => setProjectModal(true)}
              className="btn-primary text-xs py-2 px-4 shadow-lg shadow-black/20"
            >
              + Add Project
            </button>
          </div>
        </div>

        {bioSummary && (
          <p className="relative z-10 text-xs text-primary-100 max-w-2xl mt-5 pt-4 border-t border-white/15 leading-relaxed">
            "{bioSummary}"
          </p>
        )}

        {saveMsg && (
          <div className="mt-3 text-xs font-bold text-emerald-300">
            ✓ {saveMsg}
          </div>
        )}
      </div>

      {/* Platform-Verified Achievements Section */}
      <div className="card bg-white p-6 border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏆</span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Platform-Verified Credentials &amp; Badges
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Authoritatively issued from completed peer tutoring sessions, verified reviews, and diagnostic tests
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {verified_achievements.length} Verified Credentials
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {verified_achievements.map((ach, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-amber-50/50 to-white border border-amber-200/80 shadow-xs space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ach.badge}</span>
                <h3 className="font-bold text-xs text-slate-900 leading-snug">{ach.title}</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">{ach.description}</p>
              <span className="inline-block text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                ✓ Cryptographically Verified
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Showcase */}
      <div className="card bg-white p-6 border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💻</span>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Academic &amp; Technical Projects Showcase
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Demonstrate hands-on coursework applications, repositories, and study tools
            </p>
          </div>
          <button
            type="button"
            onClick={() => setProjectModal(true)}
            className="btn-secondary py-1.5 px-3 text-xs font-bold"
          >
            + New Project
          </button>
        </div>

        {projects.length === 0 ? (
          <div className="py-10 text-center text-slate-400">
            <span className="text-3xl block mb-2">📁</span>
            <p className="text-xs font-bold text-slate-600">No projects added yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Showcase your coding repositories or laboratory research reports.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((proj) => (
              <div key={proj.id} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-3 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-sm text-slate-900">{proj.title}</h3>
                    <button
                      type="button"
                      onClick={() => handleDeleteProject(proj.id)}
                      className="text-slate-400 hover:text-rose-600 text-xs"
                      title="Delete project"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{proj.description}</p>
                  {proj.skills && proj.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {proj.skills.map((s, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700 font-semibold">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-200/60">
                  {proj.repo_url && (
                    <a
                      href={proj.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary py-1 px-2.5 text-[11px] font-bold"
                    >
                      Repository ↗
                    </a>
                  )}
                  {proj.demo_url && (
                    <a
                      href={proj.demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary py-1 px-2.5 text-[11px] font-bold"
                    >
                      Live Demo ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skills Cloud */}
      <div className="card bg-white p-6 border-slate-200/90 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>🧠</span> Subject &amp; Technical Competencies
        </h2>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-50 text-primary-800 border border-primary-200/60 shadow-xs"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="text-primary-400 hover:text-rose-600 font-bold ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Add Skill Input */}
        <form onSubmit={handleAddSkill} className="flex gap-2 max-w-sm pt-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add new skill (e.g. Graph Algorithms)…"
            className="input-field text-xs flex-1"
          />
          <button type="submit" className="btn-secondary text-xs px-3 font-bold">
            + Add
          </button>
        </form>
      </div>

      {/* Edit Header Modal */}
      {headerModal && (
        <Modal
          isOpen={headerModal}
          onClose={() => setHeaderModal(false)}
          title="Edit Portfolio Profile Header"
        >
          <form onSubmit={handleSaveHeader} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Professional Headline</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Computer Science Junior · Specializing in Data Structures"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio Summary</label>
              <textarea
                rows={3}
                value={bioSummary}
                onChange={(e) => setBioSummary(e.target.value)}
                placeholder="Highlight your academic focus, passions, and tutoring philosophy."
                className="input-field text-sm"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPublicCheck"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 cursor-pointer"
              />
              <label htmlFor="isPublicCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Make portfolio publicly discoverable across campus
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHeaderModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs py-2 px-5 font-bold"
              >
                {saving ? 'Saving…' : 'Save Header'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Project Modal */}
      {projectModal && (
        <Modal
          isOpen={projectModal}
          onClose={() => setProjectModal(false)}
          title="Add Project to Proof-of-Skill Showcase"
        >
          <form onSubmit={handleAddProject} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={projForm.title}
                onChange={(e) => setProjForm({ ...projForm, title: e.target.value })}
                placeholder="e.g. Distributed Key-Value Store"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={projForm.description}
                onChange={(e) => setProjForm({ ...projForm, description: e.target.value })}
                placeholder="Describe key features, architectural design decisions, and what problem it solves."
                className="input-field text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GitHub / Code Repository URL</label>
                <input
                  type="url"
                  value={projForm.repo_url}
                  onChange={(e) => setProjForm({ ...projForm, repo_url: e.target.value })}
                  placeholder="https://github.com/..."
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Live Demo URL (Optional)</label>
                <input
                  type="url"
                  value={projForm.demo_url}
                  onChange={(e) => setProjForm({ ...projForm, demo_url: e.target.value })}
                  placeholder="https://..."
                  className="input-field text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Skills &amp; Technologies Used</label>
              <input
                type="text"
                value={projForm.skills}
                onChange={(e) => setProjForm({ ...projForm, skills: e.target.value })}
                placeholder="Python, Flask, Docker, PyMongo"
                className="input-field text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProjectModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs py-2 px-5 font-bold"
              >
                {saving ? 'Adding…' : 'Add to Portfolio'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default Portfolio
