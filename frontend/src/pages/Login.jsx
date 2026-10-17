import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const validate = (fields) => {
  const errors = {}
  if (!fields.email.trim()) errors.email = 'Email address is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = 'Please enter a valid academic or personal email.'
  if (!fields.password) errors.password = 'Password is required.'
  else if (fields.password.length < 6) errors.password = 'Password must be at least 6 characters.'
  return errors
}

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [fields, setFields] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [apiNote, setApiNote] = useState(false)
  const [demoRole, setDemoRole] = useState('student')

  const set = (k) => (e) => setFields((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setApiNote(true)
  }

  const handleDemoLogin = () => {
    const demoUser =
      demoRole === 'tutor'
        ? { id: 'u_tutor', name: 'Priya Sharma', initials: 'PS', email: 'priya@example.com', role: 'tutor' }
        : { id: 'u_student', name: 'Aditya Berad', initials: 'AB', email: 'aditya@example.com', role: 'student' }
    login(demoUser)
    navigate(demoRole === 'tutor' ? '/tutor-dashboard' : '/student-dashboard')
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-brand-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card bg-white/95 border-slate-200/80 shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-gradient-to-tr from-primary-700 via-primary-600 to-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-primary-600/30 ring-4 ring-primary-500/10">
              <span className="text-white text-2xl font-bold drop-shadow">P</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-slate-500 mt-1">Sign in to your PeerConnect account</p>
          </div>

          {/* Backend Notice */}
          <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 mb-6 text-xs text-amber-800 flex items-start gap-2.5">
            <span className="text-base leading-none">⚠️</span>
            <div>
              <strong>UI Preview Mode:</strong> Backend authentication API is in development. You can sign in immediately using the <strong>Demo Login</strong> below.
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                placeholder="you@university.edu"
                value={fields.email}
                onChange={set('email')}
                autoComplete="email"
              />
              {errors.email && <p className="field-error">{errors.email}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="label mb-0">Password</label>
                <Link to="#" className="text-xs font-semibold text-primary-600 hover:text-primary-700 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={fields.password}
                onChange={set('password')}
                autoComplete="current-password"
              />
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            {apiNote && (
              <div className="bg-sky-50 border border-sky-200 rounded-2xl p-3 text-xs text-sky-800">
                ℹ️ Input validation passed! Connect Flask JWT authentication to verify real database credentials.
              </div>
            )}

            <button type="submit" className="btn-primary w-full justify-center py-3 font-bold text-sm shadow-lg shadow-primary-600/25">
              Sign In
            </button>
          </form>

          {/* Demo Login Switcher */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-center text-slate-400 mb-3">
              One-Click Role Explorer
            </p>
            <div className="flex gap-2 mb-3 bg-slate-50 p-1 rounded-xl border border-slate-200/70">
              {['student', 'tutor'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setDemoRole(r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    demoRole === r
                      ? 'bg-white text-primary-700 shadow-sm ring-1 ring-slate-200/70'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {r === 'student' ? '📚 Student View' : '🎓 Tutor View'}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleDemoLogin}
              className="btn-secondary w-full justify-center py-2.5 text-xs font-bold text-slate-700"
            >
              Continue as Demo {demoRole === 'student' ? 'Student (Aditya)' : 'Tutor (Priya)'} →
            </button>
          </div>

          <p className="text-center text-sm text-slate-500 mt-6 font-normal">
            Don&apos;t have an account yet?{' '}
            <Link to="/register" className="text-primary-600 font-bold hover:text-primary-700 hover:underline">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
