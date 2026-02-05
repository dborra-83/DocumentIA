import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useLanguage } from '../contexts/LanguageContext'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Alert } from '../components/Alert'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { register, error, clearError } = useAuth()
  const { t } = useLanguage()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [validationErrors, setValidationErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({})

  const validate = (): boolean => {
    const errors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {}

    // Email validation
    if (!email) {
      errors.email = t('register.emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = t('register.emailInvalid')
    }

    // Password validation
    if (!password) {
      errors.password = t('register.passwordRequired')
    } else if (password.length < 8) {
      errors.password = t('register.passwordMin')
    } else if (!/(?=.*[a-z])/.test(password)) {
      errors.password = t('register.passwordLowercase')
    } else if (!/(?=.*[A-Z])/.test(password)) {
      errors.password = t('register.passwordUppercase')
    } else if (!/(?=.*\d)/.test(password)) {
      errors.password = t('register.passwordNumber')
    } else if (!/(?=.*[!@#$%^&*])/.test(password)) {
      errors.password = t('register.passwordSpecial')
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = t('register.confirmRequired')
    } else if (password !== confirmPassword) {
      errors.confirmPassword = t('register.passwordsNoMatch')
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
      await register(email, password)
      setSuccess(true)
      // Redirect to confirmation page after 2 seconds
      setTimeout(() => {
        navigate('/confirm-email', { state: { email } })
      }, 2000)
    } catch (err) {
      // Error is handled by context
      console.error('Registration error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Alert variant="success">
            <h3 className="font-semibold mb-2">{t('register.success')}</h3>
            <p>
              {t('register.successMessage')}
            </p>
          </Alert>
          <div className="mt-4 text-center">
            <Link to="/confirm-email" state={{ email }} className="text-blue-600 hover:text-blue-500">
              {t('register.goToConfirm')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('register.appTitle')}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {t('register.subtitle')}
          </h2>
          <p className="text-gray-600">
            {t('register.appSubtitle')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="error" onClose={clearError}>
            {error}
          </Alert>
        )}

        {/* Registration Form */}
        <form className="mt-8 space-y-6 card" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label={t('register.email')}
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
              label={t('register.password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={validationErrors.password}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              helperText={t('register.helperText')}
            />

            <Input
              label={t('register.confirmPassword')}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={validationErrors.confirmPassword}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
          </div>

          <div className="flex items-start">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              {t('register.termsAgree')}{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-500">
                {t('register.termsService')}
              </a>{' '}
              {t('register.and')}{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                {t('register.privacyPolicy')}
              </a>
            </label>
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t('register.createAccount')}
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">{t('register.hasAccount')} </span>
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('register.login')}
            </Link>
          </div>
        </form>

        {/* Password Requirements */}
        <div className="card bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">{t('register.passwordRequirements')}</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>{t('register.req1')}</li>
            <li>{t('register.req2')}</li>
            <li>{t('register.req3')}</li>
            <li>{t('register.req4')}</li>
            <li>{t('register.req5')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
