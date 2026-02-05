import { useState, FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthService } from '../services/authService'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Alert } from '../components/Alert'

export const ConfirmEmailPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const emailFromState = (location.state as { email?: string })?.email || ''
  
  const [email, setEmail] = useState(emailFromState)
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResendSuccess(false)

    if (!email || !code) {
      return
    }

    setIsLoading(true)
    try {
      await AuthService.confirmRegistration(email, code)
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Confirmation failed'
      setError(errorMessage)
      console.error('Confirmation error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setError(null)
    setResendSuccess(false)

    if (!email) {
      return
    }

    setIsResending(true)
    try {
      await AuthService.resendConfirmationCode(email)
      setResendSuccess(true)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend code'
      setError(errorMessage)
      console.error('Resend error:', err)
    } finally {
      setIsResending(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full">
          <Alert variant="success">
            <h3 className="font-semibold mb-2">Email Confirmed!</h3>
            <p>Your email has been verified successfully. Redirecting to login...</p>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Confirm Your Email
          </h1>
          <p className="text-gray-600">
            Enter the verification code sent to your email
          </p>
        </div>

        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {resendSuccess && (
          <Alert variant="success">
            Verification code resent successfully! Check your email.
          </Alert>
        )}

        <form className="mt-8 space-y-6 card" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              disabled={!!emailFromState}
            />

            <Input
              label="Verification Code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              autoFocus
              maxLength={6}
            />
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={isLoading}
            disabled={isLoading || !email || !code}
          >
            Confirm Email
          </Button>

          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending || !email}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:text-gray-400"
            >
              {isResending ? 'Sending...' : "Didn't receive the code? Resend"}
            </button>
            
            <div className="text-sm">
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Back to login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
