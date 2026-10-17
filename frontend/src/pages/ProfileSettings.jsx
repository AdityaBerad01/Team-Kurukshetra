import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { SAMPLE_STUDENT_PROFILE, SAMPLE_TUTOR_PROFILE, SAMPLE_SUBJECTS } from '../data/sampleData'
import Avatar from '../components/ui/Avatar'
import Modal from '../components/ui/Modal'

const SECTIONS = ['Profile', 'Security', 'Notifications']

const ProfileSettings = () => {
  const { user, logout } = useAuth()
  const [section, setSection] = useState('Profile')
  const [saved, setSaved] = useState(false)
  const [deleteModal, setDeleteModal] = useState(false)

  const baseProfile = user?.role === 'tutor' ? SAMPLE_TUTOR_PROFILE : SAMPLE_STUDENT_PROFILE
  const [form, setForm] = useState({
    name: baseProfile.name,
    email: baseProfile.email,
    phone: baseProfile.phone || '',
    university: baseProfile.university || '',
    degree: baseProfile.degree || '',
    bio: baseProfile.bio || '',
    subjects: baseProfile.subjects || [],
    hourlyRate: baseProfile.hourlyRate || '',
  })
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' })
  const [pwErrors, setPwErrors] = useState({})
  const [pwSaved, setPwSaved] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const toggleSubject = (s) => {
    setForm((f) => ({
      ...f,
      subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s],
    }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

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
          Account Management
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Profile &amp; Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Configure your personal credentials, communication preferences, and security.</p>
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 mt-3 text-xs text-amber-800 flex items-center gap-2">
          <span>⚠️</span>
          <span><strong>UI Preview:</strong> Form changes update local view state only. Real API persistence will connect in backend phase.</span>
        </div>
      </div>

      {/* Avatar Card */}
      <div className="card bg-white/95 border-slate-200/80 flex items-center gap-5 p-6">
        <Avatar name={form.name} size="xl" />
        <div className="flex-1">
          <p className="font-extrabold text-slate-900 text-xl tracking-tight">{form.name}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200/60">
              {user?.role}
            </span>
            <span className="text-xs text-slate-400 font-medium">· Member since {baseProfile.joinedDate}</span>
          </div>
          <button type="button" className="btn-secondary mt-3 text-xs py-1.5 px-3.5 font-semibold">
            Change Photo
          </button>
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

      {/* ── Profile Section ── */}
      {section === 'Profile' && (
        <form onSubmit={handleSave} className="card bg-white/95 border-slate-200/80 space-y-5 p-7">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="label">Full Name</label>
              <input className="input" value={form.name} onChange={set('name')} />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input" value={form.email} onChange={set('email')} />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <input className="input" value={form.phone} onChange={set('phone')} placeholder="+91 ..." />
            </div>
            <div>
              <label className="label">University / College</label>
              <input className="input" value={form.university} onChange={set('university')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Degree &amp; Major</label>
              <input className="input" value={form.degree} onChange={set('degree')} />
            </div>
          </div>

          <div>
            <label className="label">Bio</label>
            <textarea
              className="input h-24 resize-none"
              value={form.bio}
              onChange={set('bio')}
              placeholder="Tell other students or tutors about your academic focus…"
            />
          </div>

          <div>
            <label className="label">Active Subjects</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {SAMPLE_SUBJECTS.map((s) => (
                <button
                  type="button"
                  key={s.name}
                  onClick={() => toggleSubject(s.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    form.subjects.includes(s.name)
                      ? 'bg-gradient-to-r from-primary-600 to-indigo-600 border-primary-600 text-white shadow-sm ring-2 ring-primary-400/30'
                      : 'bg-white border-slate-200/90 text-slate-600 hover:border-primary-300'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {user?.role === 'tutor' && (
            <div>
              <label className="label">Hourly Tutoring Rate (₹)</label>
              <input type="number" className="input" value={form.hourlyRate} onChange={set('hourlyRate')} min={0} />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button type="submit" className="btn-primary font-bold shadow-md shadow-primary-600/25">
              {saved ? '✅ Changes Saved!' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* ── Security Section ── */}
      {section === 'Security' && (
        <form onSubmit={handlePwSave} className="card bg-white/95 border-slate-200/80 space-y-5 p-7">
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
              ✅ Password validation passed. Connect Flask backend to write to DB.
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
        <div className="card bg-white/95 border-slate-200/80 space-y-4 p-7">
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

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSaved(true)}
              className="btn-primary font-bold shadow-md shadow-primary-600/25"
            >
              {saved ? '✅ Preferences Saved!' : 'Save Preferences'}
            </button>
          </div>
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
