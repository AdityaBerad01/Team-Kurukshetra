import { useState, useEffect } from 'react'
import { fetchMyAssessments, fetchProgressSummary, submitAssessment, createAssessment } from '../api/assessments'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'

const LearningProgress = () => {
  const { user } = useAuth()
  const isTutor = user?.role?.toUpperCase() === 'TUTOR'

  const [progress, setProgress] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [error, setError] = useState(null)

  // Authoring modal state for tutors
  const [authorModal, setAuthorModal] = useState(false)
  const [authorForm, setAuthorForm] = useState({
    title: '',
    subject: 'Mathematics',
    student_id: 'ALL',
    assessment_type: 'PRE_SESSION',
  })
  const [authorQuestions, setAuthorQuestions] = useState([
    { question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' },
  ])
  const [authorSaving, setAuthorSaving] = useState(false)
  const [authorError, setAuthorError] = useState(null)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let isMounted = true
    Promise.all([fetchProgressSummary(), fetchMyAssessments()])
      .then(([progData, assessList]) => {
        if (!isMounted) return
        setProgress(progData)
        setAssessments(assessList || [])
        setError(null)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Failed to load learning progress:', err)
        setError('Unable to load learning assessments. Please try again.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [refreshTrigger])

  const startQuiz = (quiz) => {
    setActiveQuiz(quiz)
    setAnswers({})
    setQuizResult(null)
  }

  const handleSelectOption = (questionId, optionIdx) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }))
  }

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return
    setSubmitting(true)
    try {
      const res = await submitAssessment(activeQuiz.id, answers)
      setQuizResult(res)
      setRefreshTrigger((k) => k + 1)
    } catch (err) {
      console.error('Failed to submit quiz:', err)
      alert(err.response?.data?.message || 'Failed to submit quiz. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAddQuestion = () => {
    setAuthorQuestions((prev) => [
      ...prev,
      { question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' },
    ])
  }

  const handleRemoveQuestion = (idx) => {
    if (authorQuestions.length <= 1) return
    setAuthorQuestions((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleUpdateQuestion = (idx, field, value) => {
    setAuthorQuestions((prev) => {
      const copy = [...prev]
      copy[idx] = { ...copy[idx], [field]: value }
      return copy
    })
  }

  const handleUpdateOption = (qIdx, optIdx, val) => {
    setAuthorQuestions((prev) => {
      const copy = [...prev]
      const newOpts = [...copy[qIdx].options]
      newOpts[optIdx] = val
      copy[qIdx] = { ...copy[qIdx], options: newOpts }
      return copy
    })
  }

  const handleCreateAssessment = async (e) => {
    e.preventDefault()
    setAuthorError(null)

    if (!authorForm.title.trim()) {
      setAuthorError('Please enter an assessment title.')
      return
    }
    if (!authorForm.subject.trim()) {
      setAuthorError('Please specify the subject.')
      return
    }

    for (let i = 0; i < authorQuestions.length; i++) {
      const q = authorQuestions[i]
      if (!q.question.trim()) {
        setAuthorError(`Question ${i + 1} text cannot be empty.`)
        return
      }
      if (q.options.some((opt) => !opt.trim())) {
        setAuthorError(`Question ${i + 1} must have all 4 options filled out.`)
        return
      }
    }

    setAuthorSaving(true)
    try {
      const payload = {
        title: authorForm.title.trim(),
        subject: authorForm.subject.trim(),
        student_id: authorForm.student_id.trim() || 'ALL',
        assessment_type: authorForm.assessment_type,
        questions: authorQuestions.map((q, idx) => ({
          id: `q${idx + 1}`,
          question: q.question.trim(),
          options: q.options.map((opt) => opt.trim()),
          correct_index: Number(q.correct_index),
          explanation: q.explanation.trim(),
        })),
      }
      await createAssessment(payload)
      setAuthorModal(false)
      setAuthorForm({ title: '', subject: 'Mathematics', student_id: 'ALL', assessment_type: 'PRE_SESSION' })
      setAuthorQuestions([{ question: '', options: ['', '', '', ''], correct_index: 0, explanation: '' }])
      setRefreshTrigger((k) => k + 1)
    } catch (err) {
      console.error('Failed to author assessment:', err)
      setAuthorError(err.response?.data?.message || 'Failed to create assessment.')
    } finally {
      setAuthorSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="text-sm font-semibold text-slate-500 mt-4">Compiling learning progress metrics…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card bg-rose-50 border-rose-200 p-8 text-center my-6">
        <p className="text-rose-700 font-bold mb-3">{error}</p>
        <button
          type="button"
          onClick={() => { setLoading(true); setRefreshTrigger((k) => k + 1) }}
          className="btn-secondary text-xs"
        >
          Try Again
        </button>
      </div>
    )
  }

  const {
    total_quizzes_completed = 0,
    average_score = 0,
    baseline_pre_score = 65,
    post_session_score = 85,
    improvement_pct = 20,
    topics_mastered = [],
    milestones = [],
  } = progress || {}

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-primary-600" />
          Academic Mastery Engine
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Learning Progress & Assessments
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Objective diagnostic tests, pre- and post-session evaluations, and verified knowledge growth.
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="card bg-white p-5 border-slate-200/90 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Quizzes</p>
          <p className="text-3xl font-extrabold text-slate-900 mt-1">{total_quizzes_completed}</p>
          <p className="text-xs text-slate-500 mt-2">Diagnostic evaluations taken</p>
        </div>

        <div className="card bg-white p-5 border-slate-200/90 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average Score</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold text-primary-700">{average_score}%</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Cumulative assessment grade</p>
        </div>

        <div className="card bg-white p-5 border-slate-200/90 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pre-Session Baseline</p>
          <p className="text-3xl font-extrabold text-amber-600 mt-1">{baseline_pre_score}%</p>
          <p className="text-xs text-slate-500 mt-2">Diagnostic pre-test average</p>
        </div>

        <div className="card bg-gradient-to-tr from-emerald-600 to-teal-700 text-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Post-Session Evaluation</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black">{post_session_score}%</span>
            <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">+{improvement_pct}% gain</span>
          </div>
          <p className="text-xs text-emerald-100 mt-2">Verified post-tutoring mastery increase</p>
        </div>
      </div>

      {/* Topic Mastery & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Mastery */}
        <div className="card bg-white p-6 border-slate-200/90 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 tracking-tight flex items-center justify-between">
            <span>📊 Topic Mastery Breakdown</span>
            <span className="text-xs font-semibold text-slate-400">{topics_mastered.length} subjects</span>
          </h2>
          {topics_mastered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No topic assessments recorded yet. Take a quiz below to establish your baseline!
            </div>
          ) : (
            <div className="space-y-4">
              {topics_mastered.map((t, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-800">{t.subject}</span>
                    <span className="text-primary-700 font-bold">{t.avg_score}% ({t.quizzes_count} tests)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, t.avg_score)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestones */}
        <div className="card bg-white p-6 border-slate-200/90 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-4 tracking-tight">
            🎯 Academic Milestones
          </h2>
          <div className="space-y-3.5">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                  m.achieved
                    ? 'bg-emerald-50/60 border-emerald-200/70'
                    : 'bg-slate-50/50 border-slate-200/60 opacity-60'
                }`}
              >
                <span className="text-xl leading-none mt-0.5">{m.achieved ? '✅' : '🔒'}</span>
                <div>
                  <h3 className={`text-xs font-bold ${m.achieved ? 'text-emerald-900' : 'text-slate-700'}`}>
                    {m.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Available & Completed Quizzes */}
      <div className="card bg-white p-6 border-slate-200/90 shadow-sm">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Assigned &amp; Completed Assessments
            </h2>
            <p className="text-xs text-slate-500">
              Diagnostic evaluations authored by peer mentors for specific coursework goals.
            </p>
          </div>
          {isTutor && (
            <button
              type="button"
              onClick={() => { setAuthorModal(true); setAuthorError(null) }}
              className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 shadow-sm"
            >
              + Author Assessment
            </button>
          )}
        </div>

        {assessments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <span className="text-4xl block mb-2">📝</span>
            <p className="text-sm font-semibold text-slate-600">No assessments assigned yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Your tutor can assign pre-session diagnostics and post-session evaluations during bookings.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {assessments.map((quiz) => (
              <div key={quiz.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{quiz.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      quiz.status === 'SUBMITTED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                    }`}>
                      {quiz.status === 'SUBMITTED' ? `Score: ${quiz.score}%` : 'Ready to Take'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      {quiz.assessment_type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Subject: <strong>{quiz.subject}</strong> · {quiz.questions?.length || 0} questions
                  </p>
                </div>

                <div>
                  {quiz.status === 'ASSIGNED' ? (
                    <button
                      type="button"
                      onClick={() => startQuiz(quiz)}
                      className="btn-primary text-xs py-2 px-4 shadow-sm"
                    >
                      Take Assessment →
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startQuiz(quiz)}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      Review Answers
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {activeQuiz && (
        <Modal
          isOpen={Boolean(activeQuiz)}
          onClose={() => setActiveQuiz(null)}
          title={activeQuiz.title}
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
              <span>Subject: <strong>{activeQuiz.subject}</strong></span>
              <span>Type: <strong>{activeQuiz.assessment_type}</strong></span>
            </div>

            {quizResult && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
                <span className="text-3xl block">🎉</span>
                <p className="text-sm font-extrabold text-emerald-900">
                  Quiz Submitted! Your Score: {quizResult.score}%
                </p>
                <p className="text-xs text-emerald-700">
                  Your academic progress has been updated in the ledger.
                </p>
              </div>
            )}

            <div className="space-y-6">
              {activeQuiz.questions?.map((q, idx) => {
                const qId = q.id || String(idx)
                const isSubmitted = activeQuiz.status === 'SUBMITTED' || Boolean(quizResult)
                const currentAnswer = answers[qId] !== undefined ? answers[qId] : activeQuiz.student_answers?.[qId]

                return (
                  <div key={qId} className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-bold text-slate-800">
                      {idx + 1}. {q.question}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      {q.options?.map((opt, oIdx) => {
                        const isSelected = Number(currentAnswer) === oIdx
                        const isCorrect = q.correct_index !== undefined && Number(q.correct_index) === oIdx

                        let optClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/60'
                        if (isSubmitted) {
                          if (isCorrect) optClass = 'bg-emerald-100/80 border-emerald-400 text-emerald-900 font-bold'
                          else if (isSelected && !isCorrect) optClass = 'bg-rose-100/80 border-rose-300 text-rose-900 font-bold'
                        } else if (isSelected) {
                          optClass = 'bg-primary-50 border-primary-500 text-primary-900 font-bold'
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={isSubmitted || submitting}
                            onClick={() => handleSelectOption(qId, oIdx)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs border transition-all ${optClass}`}
                          >
                            <span className="font-semibold mr-2">{String.fromCharCode(65 + oIdx)}.</span>
                            {opt}
                          </button>
                        )
                      })}
                    </div>

                    {isSubmitted && q.explanation && (
                      <p className="text-[11px] text-slate-500 pt-2 italic">
                        💡 Explanation: {q.explanation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {activeQuiz.status === 'ASSIGNED' && !quizResult && (
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveQuiz(null)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || Object.keys(answers).length < (activeQuiz.questions?.length || 0)}
                  onClick={handleSubmitQuiz}
                  className="btn-primary text-xs py-2 px-5 disabled:opacity-50"
                >
                  {submitting ? 'Submitting & Grading…' : 'Submit Assessment'}
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Author Assessment Modal */}
      {authorModal && (
        <Modal
          isOpen={authorModal}
          onClose={() => setAuthorModal(false)}
          title="Author Diagnostic / Evaluation Assessment"
        >
          <form onSubmit={handleCreateAssessment} className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
            {authorError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                ⚠ {authorError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Title</label>
                <input
                  type="text"
                  value={authorForm.title}
                  onChange={(e) => setAuthorForm({ ...authorForm, title: e.target.value })}
                  placeholder="e.g. Calculus Derivatives Diagnostic"
                  className="input-field text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={authorForm.subject}
                  onChange={(e) => setAuthorForm({ ...authorForm, subject: e.target.value })}
                  placeholder="e.g. Mathematics, Computer Science"
                  className="input-field text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Audience</label>
                <select
                  value={authorForm.student_id}
                  onChange={(e) => setAuthorForm({ ...authorForm, student_id: e.target.value })}
                  className="input-field text-xs font-medium"
                >
                  <option value="ALL">Open to All Campus Scholars (Diagnostic)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assessment Type</label>
                <select
                  value={authorForm.assessment_type}
                  onChange={(e) => setAuthorForm({ ...authorForm, assessment_type: e.target.value })}
                  className="input-field text-xs font-medium"
                >
                  <option value="PRE_SESSION">Pre-Session Diagnostic</option>
                  <option value="POST_SESSION">Post-Session Evaluation</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Questions ({authorQuestions.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="text-xs font-bold text-primary-700 hover:text-primary-800"
                >
                  + Add Question
                </button>
              </div>

              {authorQuestions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 rounded-xl border border-slate-200/80 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Question {qIdx + 1}</span>
                    {authorQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIdx)}
                        className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                    placeholder="Enter question prompt…"
                    className="input-field text-xs bg-white"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-500 w-4">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                          placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          className="input-field text-xs bg-white flex-1"
                          required
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Correct Answer Choice
                      </label>
                      <select
                        value={q.correct_index}
                        onChange={(e) => handleUpdateQuestion(qIdx, 'correct_index', Number(e.target.value))}
                        className="input-field text-xs bg-white"
                      >
                        <option value={0}>Option A</option>
                        <option value={1}>Option B</option>
                        <option value={2}>Option C</option>
                        <option value={3}>Option D</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Explanation (Shown after completion)
                      </label>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                        placeholder="Why is this answer correct?"
                        className="input-field text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAuthorModal(false)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={authorSaving}
                className="btn-primary text-xs py-2 px-5"
              >
                {authorSaving ? 'Saving Assessment…' : 'Publish Assessment'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

export default LearningProgress
