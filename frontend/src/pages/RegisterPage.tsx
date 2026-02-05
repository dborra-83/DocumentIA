import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Alert } from '../components/Alert'

export const RegisterPage = () => {
  const navigate = useNavigate()
  const { register, error, clearError } = useAuth()
  
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
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Invalid email format'
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])/.test(password)) {
      errors.password = 'Password must contain at least one lowercase letter'
    } else if (!/(?=.*[A-Z])/.test(password)) {
      errors.password = 'Password must contain at least one uppercase letter'
    } else if (!/(?=.*\d)/.test(password)) {
      errors.password = 'Password must contain at least one number'
    } else if (!/(?=.*[!@#$%^&*])/.test(password)) {
      errors.password = 'Password must contain at least one special character (!@#$%^&*)'
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
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
            <h3 className="font-semibold mb-2">Registration Successful!</h3>
            <p>
              Your account has been created. Please check your email for a verification code.
              You will be redirected to the confirmation page shortly.
            </p>
          </Alert>
          <div className="mt-4 text-center">
            <Link to="/confirm-email" state={{ email }} className="text-blue-600 hover:text-blue-500">
              Go to confirmation now
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
            Document Analysis
          </h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            Create your account
          </h2>
          <p className="text-gray-600">
            Start analyzing documents with AI
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
              label="Email address"
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
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={validationErrors.password}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              helperText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
            />

            <Input
              label="Confirm Password"
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
              I agree to the{' '}
              <a href="/terms" className="text-blue-600 hover:text-blue-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                Privacy Policy
              </a>
            </label>
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading}
          >
            Create account
          </Button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </div>
        </form>

        {/* Password Requirements */}
        <div className="card bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">Password Requirements:</p>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>At least 8 characters long</li>
            <li>Contains uppercase letter (A-Z)</li>
            <li>Contains lowercase letter (a-z)</li>
            <li>Contains number (0-9)</li>
            <li>Contains special character (!@#$%^&*)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
