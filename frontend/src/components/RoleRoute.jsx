import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './ui/LoadingSpinner'

/**
 * Route wrapper that validates the authenticated user's role.
 * Redirects to appropriate fallback dashboard if user role is not in allowedRoles.
 */
export const RoleRoute = ({ children, allowedRoles, fallback }) => {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = user.role?.toUpperCase()
  if (allowedRoles && !allowedRoles.includes(role)) {
    const defaultFallback = role === 'TUTOR' ? '/tutor-dashboard' : '/student-dashboard'
    return <Navigate to={fallback || defaultFallback} replace />
  }

  return children
}

export default RoleRoute
