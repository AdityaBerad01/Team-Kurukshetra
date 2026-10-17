import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Avatar from './ui/Avatar'

const STUDENT_LINKS = [
  { to: '/student-dashboard',  icon: '🏠', label: 'Dashboard'       },
  { to: '/my-requests',        icon: '📋', label: 'My Requests'     },
  { to: '/tutors',             icon: '🔍', label: 'Find Tutors'     },
  { to: '/profile',            icon: '👤', label: 'Profile & Settings' },
]

const TUTOR_LINKS = [
  { to: '/tutor-dashboard',    icon: '🏠', label: 'Dashboard'       },
  { to: '/manage-availability',icon: '📅', label: 'My Availability' },
  { to: '/profile',            icon: '👤', label: 'Profile & Settings' },
]

const Sidebar = () => {
  const { user } = useAuth()
  if (!user) return null

  const links = user.role === 'tutor' ? TUTOR_LINKS : STUDENT_LINKS

  return (
    <aside className="w-64 flex-shrink-0 hidden lg:flex flex-col bg-white/95 border-r border-slate-200/80 min-h-[calc(100vh-64px)] backdrop-blur-sm">
      {/* User info */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} initials={user.initials} size="md" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900 truncate tracking-tight">{user.name}</p>
            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary-50 text-primary-700 border border-primary-200/60">
              {user.role}
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3.5 space-y-1">
        {links.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              }`
            }
          >
            <span className="text-base">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
