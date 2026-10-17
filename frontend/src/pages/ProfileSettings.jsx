import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { SAMPLE_SUBJECTS, ALL_DAYS } from '../data/sampleData'
import { fetchMyTutorProfile, createTutorProfile, updateTutorProfile } from '../api/tutors'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const ProfileSettings = () => {
  const { user, logout } = useAuth()
  const isTutor = user?.role?.toUpperCase() === 'TUTOR'

  const SECTIONS = ['General Profile', ...(isTutor ? ['Tutor Profile'] : []), 'Security', 'Notifications']
  const [section, setSection] = useState('General Profile')
  const [deleteModal, setDeleteModal] = useState(false)

  // General profile state initialized directly from user
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    university: user?.university || '',
  })
  const [generalSaved, setGeneralSaved] = useState(false)

  // Tutor profile state
  const [tutorProfileExists, setTutorProfileExists] = useState(false)
  const [tutorLoading, setTutorLoading] = useState(Boolean(isTutor))
  const [tutorSaving, setTutorSaving]   = useState(false)
  const [tutorFeedback, setTutorFeedback] = useState(null)
  const [tutorForm, setTutorForm] = useState({
    subjects: user?.subjects || ['Mathematics'],
    introduction: user?.bio || '',
    department: '',
    year_of_study: '3rd Year Undergraduate',
    teaching_modes: ['ONLINE'],
    hourly_rate: 300,
    availability: ['Monday', 'Wednesday', 'Friday'],
  })

  // Fetch tutor profile if user is a TUTOR
  useEffect(() => {
    if (isTutor) {
      let isMounted = true
      fetchMyTutorProfile()
        .then((data) => {
          if (isMounted && data) {
            setTutorProfileExists(true)
            setTutorForm({
              subjects: data.subjects || [],
              introduction: data.introduction || data.bio || '',
              department: data.department || '',
              year_of_study: data.year_of_study || '3rd Year Undergraduate',
              teaching_modes: data.teaching_modes || ['ONLINE'],
              hourly_rate: data.hourly_rate || data.hourlyRate || 300,
              availability: data.availability || ['Monday', 'Wednesday', 'Friday'],
            })
          }
        })
        .catch(() => {
          if (isMounted) setTutorProfileExists(false)
        })
        .finally(() => {
          if (isMounted) setTutorLoading(false)
        })

      return () => { isMounted = false }
    }
  }, [isTutor])

  const toggleSubject = (s) => {
    setTutorForm((f) => ({
      ...f,
      subjects: f.subjects.includes(s)
        ? f.subjects.filter((x) => x !== s)
        : [...f.subjects, s],
    }))
  }

  const toggleTeachingMode = (mode) => {
    setTutorForm((f) => {
      const exists = f.teaching_modes.includes(mode)
      if (exists && f.teaching_modes.length === 1) return f // Keep at least one
      return {
        ...f,
        teaching_modes: exists
          ? f.teaching_modes.filter((m) => m !== mode)
          : [...f.teaching_modes, mode],
      }
    })
  }

  const toggleDay = (day) => {
    setTutorForm((f) => ({
      ...f,
      availability: f.availability.includes(day)
        ? f.availability.filter((d) => d !== day)
        : [...f.availability, day],
    }))
  }

  const handleTutorSave = async (e) => {
    e.preventDefault()
    setTutorSaving(true)
    setTutorFeedback(null)

    if (tutorForm.subjects.length === 0) {
      setTutorFeedback({ type: 'error', message: 'Please select at least one teaching subject.' })
      setTutorSaving(false)
      return
    }

    try {
      if (tutorProfileExists) {
        await updateTutorProfile(tutorForm)
        setTutorFeedback({ type: 'success', message: 'Tutor profile updated successfully!' })
      } else {
        await createTutorProfile(tutorForm)
        setTutorProfileExists(true)
        setTutorFeedback({ type: 'success', message: 'Tutor profile published successfully to the directory!' })
      }
    } catch (err) {
      console.error('Failed to save tutor profile:', err)
      setTutorFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save tutor profile. Please verify your fields.',
      })
    } finally {
      setTutorSaving(false)
    }
  }

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwSaved, setPwSaved] = useState(false)

  const handlePwSave = (e) => {
    e.preventDefault()
    const errs = {}
    if (!pwForm.current) errs.current = 'Enter current password.'
    if (!pwForm.next || pwForm.next.length < 8) errs.next = 'Must be at least 8 characters.'
    if (pwForm.next !== pwForm.confirm) errs.confirm = 'New passwords do not match.'
    setPwErrors(errs)
    if (Object.keys(errs).length === 0) {
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 2500)
    }
  }

  const [notifs, setNotifs] = useState({ email: true, sms: false, bookings: true, reminders: true })
  const toggleNotif = (k) => setNotifs((n) => ({ ...n, [k]: !n[k] }))

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-primary-700 uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-primary-600" />
          Account &amp; Mentorship Settings
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Profile &amp; Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your personal credentials, tutor bio, and discovery options.</p>
      </div>

      {/* Avatar Card */}
      <div className="card bg-white/95 border-slate-200/80 flex items-center gap-5 p-6 shadow-card">
        <Avatar name={form.name} size="xl" />
        <div className="flex-1">
          <p className="font-extrabold text-slate-900 text-xl tracking-tight">{form.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200/60">
              {user?.role}
            </span>
            <span className="text-xs text-slate-400 font-medium">{form.email}</span>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/70 shadow-sm">
        {SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-150 ${
              section === s
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-md shadow-primary-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* ── General Profile Section ── */}
      {section === 'General Profile' && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setGeneralSaved(true)
            setTimeout(() => setGeneralSaved(false), 2500)
          }}
          className="card bg-white/95 border-slate-200/80 space-y-5 p-7 shadow-card"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" disabled className="input bg-slate-50 cursor-not-allowed" value={form.email} />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 ..." />
            </div>
            <div>
              <label className="label">University / College</label>
              <input className="input" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="submit" className="btn-primary font-bold shadow-md shadow-primary-600/25">
              {generalSaved ? '✅ Saved!' : 'Save Details'}
            </button>
          </div>
        </form>
      )}

      {/* ── Tutor Profile Section (Tutor only) ── */}
      {section === 'Tutor Profile' && isTutor && (
        <div className="card bg-white/95 border-slate-200/80 p-7 shadow-card space-y-6">
          <div>
            <h2 className="font-extrabold text-slate-900 text-lg tracking-tight">Public Tutor Profile</h2>
            <p className="text-xs text-slate-500 mt-1">
              This information is publicly visible to students browsing the directory to book sessions with you.
            </p>
          </div>

          {tutorLoading ? (
            <div className="py-12 flex flex-col items-center justify-center">
              <LoadingSpinner size="md" />
              <p className="text-xs text-slate-400 mt-3">Loading your tutor profile…</p>
            </div>
          ) : (
            <form onSubmit={handleTutorSave} className="space-y-5">
              {tutorFeedback && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold border ${
                    tutorFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {tutorFeedback.message}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="label">Department / Major</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Computer Science, Mechanical Eng."
                    value={tutorForm.department}
                    onChange={(e) => setTutorForm({ ...tutorForm, department: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Year of Study / Standing</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. 3rd Year Undergraduate, Masters, PhD"
                    value={tutorForm.year_of_study}
                    onChange={(e) => setTutorForm({ ...tutorForm, year_of_study: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Hourly Tutoring Rate (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className="input pl-8"
                    value={tutorForm.hourly_rate}
                    onChange={(e) => setTutorForm({ ...tutorForm, hourly_rate: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label">Teaching Introduction &amp; Bio</label>
                <textarea
                  className="input h-28 resize-none leading-relaxed"
                  placeholder="Introduce yourself to prospective students: mention your achievements, coursework mastered, and teaching style…"
                  value={tutorForm.introduction}
                  onChange={(e) => setTutorForm({ ...tutorForm, introduction: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Supported Teaching Modes</label>
                <div className="flex gap-3">
                  {[
                    { id: 'ONLINE', label: '💻 Online Video (Remote)' },
                    { id: 'ON_CAMPUS', label: '📍 In-Person (On Campus)' },
                  ].map((m) => {
                    const active = tutorForm.teaching_modes.includes(m.id)
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleTeachingMode(m.id)}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                          active
                            ? 'bg-primary-50 text-primary-800 border-primary-300 ring-2 ring-primary-500/20 shadow-sm'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="label">Subject Specializations</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {SAMPLE_SUBJECTS.map((s) => {
                    const active = tutorForm.subjects.includes(s.name)
                    return (
                      <button
                        type="button"
                        key={s.name}
                        onClick={() => toggleSubject(s.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          active
                            ? 'bg-gradient-to-r from-primary-600 to-indigo-600 border-primary-600 text-white shadow-sm ring-2 ring-primary-400/30'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-primary-300'
                        }`}
                      >
                        {s.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="label">Available Days for Tutoring</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {ALL_DAYS.map((day) => {
                    const active = tutorForm.availability.includes(day)
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {day}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={tutorSaving}
                  className="btn-primary font-bold shadow-md shadow-primary-600/25 disabled:opacity-50"
                >
                  {tutorSaving ? 'Saving Profile…' : tutorProfileExists ? 'Update Public Profile' : 'Publish Tutor Profile'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Security Section ── */}
      {section === 'Security' && (
        <form onSubmit={handlePwSave} className="card bg-white/95 border-slate-200/80 space-y-5 p-7 shadow-card">
          <div>
            <h3 className="font-bold text-slate-900 text-base tracking-tight">Change Password</h3>
            <p className="text-xs text-slate-400 mt-0.5">Keep your account secure with a strong password.</p>
          </div>

          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className={`input ${pwErrors.current ? 'input-error' : ''}`}
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
            />
            {pwErrors.current && <p className="field-error">{pwErrors.current}</p>}
          </div>

          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className={`input ${pwErrors.next ? 'input-error' : ''}`}
              value={pwForm.next}
              onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
              placeholder="Minimum 8 characters"
            />
            {pwErrors.next && <p className="field-error">{pwErrors.next}</p>}
          </div>

          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className={`input ${pwErrors.confirm ? 'input-error' : ''}`}
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
            />
            {pwErrors.confirm && <p className="field-error">{pwErrors.confirm}</p>}
          </div>

          {pwSaved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-800 font-medium">
              ✅ Password updated successfully!
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button type="submit" className="btn-primary font-bold shadow-md shadow-primary-600/25">
              Update Password
            </button>
          </div>

          {/* Danger zone */}
          <div className="border border-rose-200/80 rounded-2xl bg-rose-50/40 p-5 mt-6">
            <h4 className="font-bold text-rose-800 text-sm">Danger Zone</h4>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">Permanently delete your account and associated session history.</p>
            <button
              type="button"
              onClick={() => setDeleteModal(true)}
              className="btn-danger py-2 px-4 text-xs font-bold"
            >
              Delete Account
            </button>
          </div>
        </form>
      )}

      {/* ── Notifications Section ── */}
      {section === 'Notifications' && (
        <div className="card bg-white/95 border-slate-200/80 space-y-4 p-7 shadow-card">
          <div>
            <h3 className="font-bold text-slate-900 text-base tracking-tight">Notification Channels</h3>
            <p className="text-xs text-slate-400 mt-0.5">Control how and when PeerConnect notifies you.</p>
          </div>

          {[
            { key: 'email',     label: 'Email Notifications', desc: 'Receive booking confirmations and mentor updates via email' },
            { key: 'sms',       label: 'SMS Notifications',   desc: 'Receive urgent timetable changes via SMS text message' },
            { key: 'bookings',  label: 'Booking Alerts',      desc: 'Immediate alerts when a student or tutor responds' },
            { key: 'reminders', label: 'Session Reminders',   desc: 'Automated notification 1 hour prior to session start' },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-bold text-slate-900 tracking-tight">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleNotif(key)}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${
                  notifs[key] ? 'bg-gradient-to-r from-primary-600 to-indigo-600' : 'bg-slate-200'
                }`}
                role="switch"
                aria-checked={notifs[key]}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    notifs[key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Confirm Account Deletion" size="sm">
        <div className="text-center py-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl mx-auto mb-3 border border-rose-200">
            ⚠️
          </div>
          <p className="text-sm font-medium text-slate-600 mb-6 leading-relaxed">
            This action is permanent and irreversible. All your study records and tutor ratings will be permanently erased.
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setDeleteModal(false)} className="btn-secondary flex-1 justify-center font-semibold">
              Cancel
            </button>
            <button
              type="button"
              className="btn-danger flex-1 justify-center font-bold"
              onClick={() => {
                setDeleteModal(false)
                logout()
              }}
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ProfileSettings
