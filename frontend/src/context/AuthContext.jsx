/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react'

/**
 * AuthContext – UI-only placeholder.
 *
 * ⚠️  No real authentication is implemented here.
 * This context tracks a local UI state so pages can conditionally render
 * based on role. Replace with real JWT / session logic when the backend is ready.
 */
const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  // null = logged out.  Object = logged-in user shape.
  const [user, setUser] = useState(null)

  /** Simulate login – DOES NOT call any backend endpoint */
  const login = (userData) => setUser(userData)

  /** Clear local user state */
  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook to access auth context */
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export default AuthContext
