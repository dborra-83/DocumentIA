import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes'
import { AuthProvider } from './contexts/AuthContext'
import { BrandingProvider } from './contexts/BrandingContext'
import { LanguageProvider } from './contexts/LanguageContext'

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <BrandingProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrandingProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}

export default App
