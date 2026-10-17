import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Avatar from './ui/Avatar'

const NAV_LINKS = [
  { to: '/',          label: 'Home',        exact: true },
  { to: '/tutors',    label: 'Find Tutors', exact: false },
]

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const isTutor = user?.role?.toUpperCase() === 'TUTOR'
  const dashboardPath = isTutor ? '/tutor-dashboard' : '/student-dashboard'

  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] transition-all">
      <nav className="page-container flex items-center justify-between h-16">
        {/* Brand with radiant gem emblem */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group" onClick={() => setMenuOpen(false)}>
          <div className="w-9 h-9 bg-gradient-to-tr from-primary-700 via-primary-600 to-indigo-400 rounded-xl flex items-center justify-center shadow-md shadow-primary-600/25 ring-2 ring-primary-500/20 group-hover:scale-105 transition-transform duration-200">
            <span className="text-white text-base font-bold drop-shadow-sm">P</span>
          </div>
          <span className="font-extrabold text-xl text-slate-900 tracking-tight">
            Peer<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Connect</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1.5">
          {NAV_LINKS.map(({ to, label, exact }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={exact}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
          {user && (
            <li>
              <NavLink
                to={dashboardPath}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                Dashboard
              </NavLink>
            </li>
          )}
        </ul>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/wallet"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors shadow-xs"
                title="Your Learn-to-Earn Credit Balance"
              >
                <span>🪙</span>
                <span>{user.credits ?? 100}</span>
              </Link>
              <Link to="/profile" className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-100/80 transition-all">
                <Avatar name={user.name} initials={user.initials} size="sm" />
                <span className="text-sm font-semibold text-slate-700">{user.name.split(' ')[0]}</span>
              </Link>
              <button onClick={handleLogout} className="btn-ghost text-sm font-semibold">
                Log Out
              </button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Log In</Link>
              <Link to="/register" className="btn-primary">Sign Up Free</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-slate-100 px-4 py-3 space-y-1.5 shadow-xl">
          {NAV_LINKS.map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60' : 'text-slate-700 hover:bg-slate-50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          {user ? (
            <>
              <NavLink
                to={dashboardPath}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-2.5 rounded-xl text-sm font-semibold ${isActive ? 'bg-primary-50 text-primary-700' : 'text-slate-700 hover:bg-slate-50'}`
                }
              >
                Dashboard
              </NavLink>
              <Link
                to="/wallet"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <span>🪙</span> Credit Wallet ({user.credits ?? 100})
              </Link>
              <Link
                to="/my-requests"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
              >
                <span>📋</span> {isTutor ? 'Incoming Sessions' : 'My Sessions'}
              </Link>
              {isTutor ? (
                <Link
                  to="/manage-availability"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  <span>📅</span> My Availability
                </Link>
              ) : (
                <Link
                  to="/progress"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl"
                >
                  <span>📊</span> Learning Progress
                </Link>
              )}
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 rounded-xl">
                <Avatar name={user.name} size="sm" /> Profile &amp; Settings
              </Link>
              <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 rounded-xl font-semibold">
                Log Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-2">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary w-full justify-center">Log In</Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary w-full justify-center">Sign Up Free</Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export default Navbar
