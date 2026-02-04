import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { validateConfig } from './config'

// Validate configuration before starting the app
if (!validateConfig()) {
  console.error('Application configuration is invalid. Please check your environment variables.');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
