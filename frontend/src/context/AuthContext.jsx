/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { loginUser, registerUser, fetchCurrentUser } from '../api/auth'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem('access_token')))

  // Verify and hydrate current user from JWT token on page mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) return

    let isMounted = true
    fetchCurrentUser()
      .then((safeUser) => {
        if (isMounted && safeUser) {
          setUser(safeUser)
        }
      })
      .catch(() => {
        // Token invalid or expired
        if (isMounted) {
          localStorage.removeItem('access_token')
          setUser(null)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * Log in with email and password via Flask backend.
   * Also accepts an existing user object for demo/testing.
   */
  const login = useCallback(async (emailOrData, password) => {
    // If called with a mock/demo user object directly
    if (typeof emailOrData === 'object' && emailOrData !== null && !password) {
      if (emailOrData.access_token) {
        localStorage.setItem('access_token', emailOrData.access_token)
      }
      setUser(emailOrData)
      return emailOrData
    }

    const payload = typeof emailOrData === 'object' ? emailOrData : { email: emailOrData, password }
    const result = await loginUser(payload)
    if (result?.access_token) {
      localStorage.setItem('access_token', result.access_token)
    }
    const loggedInUser = result?.user || result
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  /**
   * Register a new user via Flask backend and authenticate automatically.
   */
  const register = useCallback(async (formData) => {
    const result = await registerUser(formData)
    if (result?.access_token) {
      localStorage.setItem('access_token', result.access_token)
    }
    setUser(result)
    return result
  }, [])

  /**
   * Clear JWT access token and logged-in user state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    setUser(null)
  }, [])

  const isTutor = user?.role?.toUpperCase() === 'TUTOR'
  const isStudent = user?.role?.toUpperCase() === 'STUDENT'

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        isLoggedIn: !!user,
        isTutor,
        isStudent,
        login,
        register,
        logout,
      }}
    >
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
