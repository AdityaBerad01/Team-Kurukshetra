import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const SUBJECTS = ['Mathematics', 'Physics', 'Computer Science', 'Chemistry', 'English', 'Biology', 'Economics', 'Statistics']

const validate = (fields) => {
  const errors = {}
  if (!fields.name.trim()) errors.name = 'Full name is required.'
  if (!fields.email.trim()) errors.email = 'Email address is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = 'Please enter a valid email address.'
  if (!fields.password) errors.password = 'Password is required.'
  else if (fields.password.length < 8) errors.password = 'Must be at least 8 characters.'
  if (fields.password !== fields.confirm) errors.confirm = 'Passwords do not match.'
  if (!fields.role) errors.role = 'Please select your role.'
  return errors
}

const Register = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1) // 1 = role select, 2 = details form
  const [submitted, setSubmitted] = useState(false)
  const [fields, setFields] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: '',
    university: '',
    subjects: [],
    bio: '',
  })
  const [errors, setErrors] = useState({})

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }))

  const toggleSubject = (s) => {
    setFields((f) => ({
      ...f,
      subjects: f.subjects.includes(s) ? f.subjects.filter((x) => x !== s) : [...f.subjects, s],
    }))
  }

  const handleRoleSelect = (role) => {
    setFields((f) => ({ ...f, role }))
    setStep(2)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-brand-bg flex items-center justify-center px-4 py-12">
        <div className="card bg-white/95 max-w-md w-full text-center py-10 px-8 shadow-2xl border-slate-200/80">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-200/80 shadow-inner">
            🎉
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">You&apos;re almost there!</h2>
          <p className="text-slate-500 text-sm mb-4 leading-relaxed">
            Your registration details have been validated successfully.
          </p>
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 mb-6 text-xs text-amber-800 text-left flex items-start gap-2.5">
            <span className="text-base">⚠️</span>
            <div>
              <strong>UI Preview Mode:</strong> The backend MongoDB registration endpoint is not yet wired to this form. No database record has been saved.
            </div>
          </div>
          <button onClick={() => navigate('/login')} className="btn-primary w-full justify-center py-3 font-bold">
            Proceed to Login Portal
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-brand-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Step 1 – Role selection */}
        {step === 1 && (
          <div className="card bg-white/95 border-slate-200/80 shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-tr from-primary-700 via-primary-600 to-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-600/30">
                <span className="text-white text-xl font-bold">P</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Join PeerConnect</h1>
              <p className="text-sm text-slate-500 mt-1 font-normal">Select your primary role on our academic platform</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { role: 'student', icon: '📚', title: "I'm a Student", desc: 'Find peer tutors and book personalized sessions to master difficult coursework.' },
                { role: 'tutor',   icon: '🎓', title: "I'm a Tutor",   desc: 'Share your subject expertise, set your hourly rates, and mentor peers.' },
              ].map(({ role, icon, title, desc }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleRoleSelect(role)}
                  className="card text-left p-6 hover:border-primary-400 hover:shadow-card-hover hover:bg-primary-50/20 group transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center text-2xl transition-colors mb-3">
                    {icon}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-primary-700 transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-normal">{desc}</p>
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-slate-500 mt-8 font-normal">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}

        {/* Step 2 – Details form */}
        {step === 2 && (
          <div className="card bg-white/95 border-slate-200/80 shadow-2xl p-8">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
            >
              ← Back to role selection
            </button>

            <div className="flex items-center gap-3.5 mb-6 p-3 rounded-2xl bg-primary-50/80 border border-primary-200/70">
              <span className="text-3xl">{fields.role === 'tutor' ? '🎓' : '📚'}</span>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Create your account</h1>
                <p className="text-xs text-primary-700 font-semibold capitalize">
                  Registering as: <strong>{fields.role}</strong>
                </p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 mb-5 text-xs text-amber-800">
              ⚠️ <strong>UI Preview Mode:</strong> Form validation is active. Backend registration is in progress.
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className={`input ${errors.name ? 'input-error' : ''}`}
                  placeholder="Aditya Berad"
                  value={fields.name}
                  onChange={set('name')}
                />
                {errors.name && <p className="field-error">{errors.name}</p>}
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  className={`input ${errors.email ? 'input-error' : ''}`}
                  placeholder="aditya@university.edu"
                  value={fields.email}
                  onChange={set('email')}
                />
                {errors.email && <p className="field-error">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Password</label>
                  <input
                    type="password"
                    className={`input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Min 8 chars"
                    value={fields.password}
                    onChange={set('password')}
                  />
                  {errors.password && <p className="field-error">{errors.password}</p>}
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input
                    type="password"
                    className={`input ${errors.confirm ? 'input-error' : ''}`}
                    placeholder="Repeat password"
                    value={fields.confirm}
                    onChange={set('confirm')}
                  />
                  {errors.confirm && <p className="field-error">{errors.confirm}</p>}
                </div>
              </div>

              <div>
                <label className="label">University / Academic Institution</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Mumbai University"
                  value={fields.university}
                  onChange={set('university')}
                />
              </div>

              <div>
                <label className="label">
                  Subjects {fields.role === 'tutor' ? 'You Can Teach' : 'You Need Help With'}
                </label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {SUBJECTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSubject(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        fields.subjects.includes(s)
                          ? 'bg-gradient-to-r from-primary-600 to-indigo-600 border-primary-600 text-white shadow-sm ring-2 ring-primary-400/40'
                          : 'bg-white border-slate-200/90 text-slate-600 hover:border-primary-300 hover:bg-primary-50/40'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {fields.role === 'tutor' && (
                <div>
                  <label className="label">Academic Bio &amp; Teaching Experience</label>
                  <textarea
                    className="input h-24 resize-none"
                    placeholder="Describe your academic background, achievements, and teaching methodology…"
                    value={fields.bio}
                    onChange={set('bio')}
                  />
                </div>
              )}

              <button type="submit" className="btn-primary w-full justify-center py-3.5 font-bold shadow-lg shadow-primary-600/25 mt-2">
                Create Account
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6 font-normal">
              Already registered?{' '}
              <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Register
