import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { HomePage } from '../pages/HomePage'
import { LoginPage } from '../pages/LoginPage'
import { RegisterPage } from '../pages/RegisterPage'
import { ConfirmEmailPage } from '../pages/ConfirmEmailPage'
import { AnalyzePage } from '../pages/AnalyzePage'
import { DebugPage } from '../pages/DebugPage'
import HistoryPage from '../pages/HistoryPage'
import DashboardPage from '../pages/DashboardPage'
import AdminPage from '../pages/AdminPage'
import { Layout } from '../components/Layout'

// Placeholder components
const NotFoundPage = () => <div className="container p-8"><h1>404 - Page Not Found</h1></div>

// Protected Route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Layout>{children}</Layout>
}

export const AppRoutes = () => {
  const { isAuthenticated } = useAuth()

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />} 
      />
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} 
      />
      <Route 
        path="/confirm-email" 
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <ConfirmEmailPage />} 
      />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analyze"
        element={
          <ProtectedRoute>
            <AnalyzePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/debug"
        element={
          <ProtectedRoute>
            <DebugPage />
          </ProtectedRoute>
        }
      />

      {/* Default routes */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
