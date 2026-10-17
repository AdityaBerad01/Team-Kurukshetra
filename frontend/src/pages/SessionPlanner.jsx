import { useState, useEffect } from 'react'
import { fetchMyRequests, fetchIncomingRequests } from '../api/requests'
import { fetchSessionPlan, updateSessionPlan, recordSessionConfidence, fetchConfidenceTrends } from '../api/sessionPlans'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Badge from '../components/ui/Badge'

const CONFIDENCE_LEVELS = [
  { val: 1, label: '1 - Highly Confused / Anxious' },
  { val: 2, label: '2 - Basic Familiarity' },
  { val: 3, label: '3 - Moderate Understanding' },
  { val: 4, label: '4 - Confident Practitioner' },
  { val: 5, label: '5 - Exam Ready / Mastered' },
]

const SessionPlanner = () => {
  const { user } = useAuth()
  const isTutor = user?.role?.toUpperCase() === 'TUTOR'

  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [planLoading, setPlanLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(null)

  // Form states for plan
  const [objectives, setObjectives] = useState('')
  const [difficultConcepts, setDifficultConcepts] = useState('')
  const [agendaItems, setAgendaItems] = useState([])
  const [newAgendaText, setNewAgendaText] = useState('')

  // Confidence form state
  const [preConf, setPreConf] = useState(3)
  const [postConf, setPostConf] = useState(4)
  const [confNotes, setConfNotes] = useState('')
  const [confSaving, setConfSaving] = useState(false)

  const handleSelectSession = (s) => {
    setSelectedSession(s)
    setPlanLoading(true)
    setSaveSuccess(null)
  }

  useEffect(() => {
    let isMounted = true
    const fetchSessionsFn = isTutor ? fetchIncomingRequests : fetchMyRequests

    Promise.all([
      fetchSessionsFn().catch(() => []),
      !isTutor ? fetchConfidenceTrends().catch(() => []) : Promise.resolve([]),
    ])
      .then(([allSessions, confTrends]) => {
        if (!isMounted) return
        setSessions(allSessions || [])
        setTrends(confTrends || [])
        if (allSessions && allSessions.length > 0) {
          setSelectedSession(allSessions[0])
          setPlanLoading(true)
        }
      })
      .catch((err) => console.error('Failed to load session planner data:', err))
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [isTutor])

  useEffect(() => {
    if (!selectedSession) return
    let isMounted = true

    fetchSessionPlan(selectedSession.id)
      .then((data) => {
        if (!isMounted) return
        setObjectives(data.objectives || '')
        setDifficultConcepts(data.difficult_concepts || '')
        setAgendaItems(data.agenda_items || [])
        if (data.pre_confidence) setPreConf(data.pre_confidence)
        if (data.post_confidence) setPostConf(data.post_confidence)
        setConfNotes(data.confidence_notes || '')
      })
      .catch((err) => console.error('Failed to load plan:', err))
      .finally(() => {
        if (isMounted) setPlanLoading(false)
      })

    return () => { isMounted = false }
  }, [selectedSession])

  const handleToggleAgenda = (itemId) => {
    const updated = agendaItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    )
    setAgendaItems(updated)
  }

  const handleAddAgendaItem = (e) => {
    e.preventDefault()
    if (!newAgendaText.trim()) return
    const newItem = {
      id: `a_${Date.now()}`,
      text: newAgendaText.trim(),
      completed: false,
    }
    setAgendaItems([...agendaItems, newItem])
    setNewAgendaText('')
  }

  const handleSavePlan = async () => {
    if (!selectedSession) return
    setSaving(true)
    setSaveSuccess(null)
    try {
      await updateSessionPlan(selectedSession.id, {
        objectives,
        difficult_concepts: difficultConcepts,
        agenda_items: agendaItems,
      })
      setSaveSuccess('Session agenda and learning objectives saved!')
      setTimeout(() => setSaveSuccess(null), 3000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save plan.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveConfidence = async () => {
    if (!selectedSession) return
    setConfSaving(true)
    try {
      await recordSessionConfidence(selectedSession.id, {
        pre_confidence: preConf,
        post_confidence: postConf,
        confidence_notes: confNotes,
      })
      const updatedTrends = await fetchConfidenceTrends().catch(() => [])
      setTrends(updatedTrends)
      alert('Confidence scores recorded successfully!')
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record confidence.')
    } finally {
      setConfSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500 mt-4">Loading session agendas &amp; tracker…</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-primary-600" />
          Pedagogical Framework
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Smart Session Planner &amp; Confidence Tracker
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Define clear learning objectives, structure the appointment agenda, and measure confidence gains.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="card text-center py-16 bg-white border-slate-200">
          <span className="text-4xl block mb-2">📋</span>
          <h2 className="text-lg font-bold text-slate-900">No scheduled sessions to plan</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Book or accept a tutoring session to collaboratively prepare agendas, objectives, and confidence metrics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Session Selector */}
          <div className="card bg-white p-5 border-slate-200/90 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Select Session ({sessions.length})
            </h2>
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {sessions.map((s) => {
                const isSelected = selectedSession?.id === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSession(s)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50/70 shadow-sm ring-1 ring-primary-400'
                        : 'border-slate-200/70 bg-white hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {s.subject}
                      </span>
                      <Badge status={(s.status || '').toLowerCase()}>{s.status}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isTutor ? `Student: ${s.studentName}` : `Tutor: ${s.tutorName}`}
                    </p>
                    <p className="text-[11px] text-primary-700 font-semibold mt-0.5">
                      📅 {s.date} {s.time ? `· ⏰ ${s.time}` : ''}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Confidence Trends Summary for Students */}
            {!isTutor && trends.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  📈 Confidence Growth Trends
                </h3>
                <div className="space-y-2">
                  {trends.slice(0, 3).map((t, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-xs">
                      <div className="flex justify-between items-center font-bold text-emerald-900">
                        <span>{t.subject}</span>
                        {t.delta !== null && (
                          <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full text-[10px]">
                            {t.delta > 0 ? `+${t.delta}` : t.delta} Confidence
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-1">
                        Pre: {t.pre_confidence}/5 → Post: {t.post_confidence}/5
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 2 Columns: Plan Editor & Confidence Tracker */}
          <div className="lg:col-span-2 space-y-6">
            {planLoading ? (
              <div className="card text-center py-20 bg-white border-slate-200">
                <LoadingSpinner size="md" />
                <p className="text-xs font-semibold text-slate-400 mt-2">Loading session plan…</p>
              </div>
            ) : (
              <>
                {/* Plan Content Card */}
                <div className="card bg-white p-6 border-slate-200/90 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                        Session Plan: {selectedSession?.subject}
                      </h2>
                      <p className="text-xs text-slate-400">
                        Collaborative agenda visible to both mentor and student
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSavePlan}
                      className="btn-primary py-2 px-5 text-xs font-bold shadow-md shadow-primary-600/20"
                    >
                      {saving ? 'Saving…' : 'Save Plan'}
                    </button>
                  </div>

                  {saveSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-pulse">
                      ✓ {saveSuccess}
                    </div>
                  )}

                  {/* Objectives */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      🎯 Learning Objectives for this Session
                    </label>
                    <textarea
                      rows={2}
                      value={objectives}
                      onChange={(e) => setObjectives(e.target.value)}
                      placeholder="e.g. Master inductive proofs and solve 5 recurrence relation problems."
                      className="input-field text-sm"
                    />
                  </div>

                  {/* Difficult Concepts */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      ⚠️ Bottleneck / Difficult Concepts to Address
                    </label>
                    <input
                      type="text"
                      value={difficultConcepts}
                      onChange={(e) => setDifficultConcepts(e.target.value)}
                      placeholder="e.g. Base case formulation and strong induction steps"
                      className="input-field text-sm"
                    />
                  </div>

                  {/* Interactive Agenda Checklist */}
                  <div className="space-y-2 pt-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      ✅ Structured Agenda Checklist
                    </label>
                    <div className="space-y-2">
                      {agendaItems.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleAgenda(item.id)}
                          className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                            item.completed
                              ? 'bg-emerald-50/50 border-emerald-300 text-slate-400 line-through'
                              : 'bg-slate-50/60 border-slate-200/80 text-slate-800 hover:bg-slate-100/60'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(item.completed)}
                            onChange={() => {}}
                            className="w-4 h-4 rounded text-primary-600 cursor-pointer"
                          />
                          <span className="text-xs font-semibold select-none flex-1">
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Add Agenda Item */}
                    <form onSubmit={handleAddAgendaItem} className="flex gap-2 pt-2">
                      <input
                        type="text"
                        value={newAgendaText}
                        onChange={(e) => setNewAgendaText(e.target.value)}
                        placeholder="Add agenda topic or checkpoint…"
                        className="input-field text-xs flex-1"
                      />
                      <button type="submit" className="btn-secondary text-xs px-4 py-2 font-bold">
                        + Add
                      </button>
                    </form>
                  </div>
                </div>

                {/* Confidence Tracker Card */}
                <div className="card bg-white p-6 border-slate-200/90 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>📊</span> Confidence Tracker (1–5 Scale)
                      </h2>
                      <p className="text-xs text-slate-400">
                        Self-report your topic confidence before and after the tutoring session
                      </p>
                    </div>
                    {!isTutor && (
                      <button
                        type="button"
                        disabled={confSaving}
                        onClick={handleSaveConfidence}
                        className="btn-secondary py-1.5 px-4 text-xs font-bold text-primary-700 border-primary-200 hover:bg-primary-50"
                      >
                        {confSaving ? 'Recording…' : 'Record Confidence'}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pre-Confidence */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Pre-Session Confidence
                      </span>
                      <select
                        disabled={isTutor}
                        value={preConf}
                        onChange={(e) => setPreConf(Number(e.target.value))}
                        className="input-field text-xs font-bold bg-white"
                      >
                        {CONFIDENCE_LEVELS.map((lvl) => (
                          <option key={lvl.val} value={lvl.val}>{lvl.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Post-Confidence */}
                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                      <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                        Post-Session Mastery
                      </span>
                      <select
                        disabled={isTutor}
                        value={postConf}
                        onChange={(e) => setPostConf(Number(e.target.value))}
                        className="input-field text-xs font-bold bg-white text-emerald-900"
                      >
                        {CONFIDENCE_LEVELS.map((lvl) => (
                          <option key={lvl.val} value={lvl.val}>{lvl.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Learner Confidence Notes &amp; Breakthroughs
                    </label>
                    <input
                      type="text"
                      disabled={isTutor}
                      value={confNotes}
                      onChange={(e) => setConfNotes(e.target.value)}
                      placeholder="e.g. Mastered problem 3; feeling confident for the exam."
                      className="input-field text-xs"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionPlanner
