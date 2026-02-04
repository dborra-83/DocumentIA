/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, ReactNode } from 'react'
import type { User, AuthTokens } from '../types'
import { AuthService } from '../services/authService'

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [tokens, setTokens] = useState<AuthTokens | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing session on mount
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const session = await AuthService.getCurrentSession()
      if (session) {
        setUser(session.user)
        setTokens(session.tokens)
      }
    } catch (error) {
      console.error('Session check failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)
      const { user: loggedInUser, tokens: userTokens } = await AuthService.login(email, password)
      setUser(loggedInUser)
      setTokens(userTokens)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string) => {
    try {
      setError(null)
      setIsLoading(true)
      await AuthService.register(email, password)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setError(null)
      await AuthService.logout()
      setUser(null)
      setTokens(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed'
      setError(errorMessage)
      throw error
    }
  }

  const refreshToken = async () => {
    try {
      setError(null)
      const session = await AuthService.refreshSession()
      if (session) {
        setUser(session.user)
        setTokens(session.tokens)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed'
      setError(errorMessage)
      // If refresh fails, logout the user
      setUser(null)
      setTokens(null)
      throw error
    }
  }

  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    tokens,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshToken,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
