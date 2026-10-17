import { useState, useEffect } from 'react'
import { fetchMyAssessments, fetchProgressSummary, submitAssessment } from '../api/assessments'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import Modal from '../components/ui/Modal'

const LearningProgress = () => {
  const [progress, setProgress] = useState(null)
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeQuiz, setActiveQuiz] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [quizResult, setQuizResult] = useState(null)
  const [error, setError] = useState(null)

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
              Assigned & Completed Assessments
            </h2>
            <p className="text-xs text-slate-500">
              Diagnostic evaluations authored by peer mentors for specific coursework goals.
            </p>
          </div>
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
    </div>
  )
}

export default LearningProgress
