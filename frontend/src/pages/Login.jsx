import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const validate = (fields) => {
  const errors = {}
  if (!fields.email.trim()) errors.email = 'Email address is required.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = 'Please enter a valid academic or personal email.'
  if (!fields.password) errors.password = 'Password is required.'
  else if (fields.password.length < 8) errors.password = 'Password must be at least 8 characters.'
  return errors
}

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [fields, setFields] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState(null)

  const set = (k) => (e) => {
    setFields((f) => ({ ...f, [k]: e.target.value }))
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: null }))
    if (apiError) setApiError(null)
  }

  const handleSuccessfulAuth = (loggedInUser) => {
    const isTutor = loggedInUser?.role?.toUpperCase() === 'TUTOR'
    navigate(isTutor ? '/tutor-dashboard' : '/student-dashboard', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setIsSubmitting(true)
    setApiError(null)

    try {
      const loggedInUser = await login(fields.email.trim(), fields.password)
      handleSuccessfulAuth(loggedInUser)
    } catch (err) {
      console.error('Login error:', err)
      const msg = err.response?.data?.message || 'Invalid email or password. Please check your credentials.'
      setApiError(msg)
    } finally {
      setIsSubmitting(false)
    }
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

          {/* Error Message */}
          {apiError && (
            <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-3.5 mb-6 text-xs text-rose-800 flex items-start gap-2.5">
              <span className="text-base leading-none">⚠️</span>
              <div>
                <strong>Authentication error:</strong> {apiError}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                className={`input ${errors.password ? 'input-error' : ''}`}
                placeholder="••••••••"
                value={fields.password}
                onChange={set('password')}
                autoComplete="current-password"
              />
              {errors.password && <p className="field-error">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center py-3 font-bold text-sm shadow-lg shadow-primary-600/25 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Verifying credentials…</span>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8 font-normal">
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
