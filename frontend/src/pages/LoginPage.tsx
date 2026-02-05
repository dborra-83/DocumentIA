import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../contexts/LanguageContext'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Alert } from '../components/Alert'

export const LoginPage = () => {
  const navigate = useNavigate()
  const { login, error, clearError } = useAuth()
  const { t } = useLanguage()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{ email?: string; password?: string }>({})

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {}

    if (!email) {
      errors.email = t('login.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('login.emailInvalid')
    }

    if (!password) {
      errors.password = t('login.passwordRequired')
    } else if (password.length < 8) {
      errors.password = t('login.passwordMin')
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    clearError()

    if (!validate()) {
      return
    }

    setIsLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      // Error is handled by context
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('login.appTitle')}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {t('login.subtitle')}
          </h2>
          <p className="text-gray-600">
            {t('login.appSubtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Login Form */}
        <form className="mt-8 space-y-6 card" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label={t('login.email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={validationErrors.email}
              placeholder="you@example.com"
              required
              autoComplete="email"
              autoFocus
            />

            <Input
              label={t('login.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={validationErrors.password}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                {t('login.rememberMe')}
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                {t('login.forgotPassword')}
              </Link>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t('login.signIn')}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">{t('login.noAccount')} </span>
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              {t('login.register')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
