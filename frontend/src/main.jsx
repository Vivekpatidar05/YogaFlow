import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'

// Restore scroll to top when navigating between pages
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <ScrollToTop />
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--surface)',
              color: 'var(--text)',
              border: '1px solid var(--border2)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
              padding: '12px 16px',
            },
            success: { iconTheme: { primary: 'var(--primary)', secondary: 'var(--surface)' } },
            error: { iconTheme: { primary: '#dc2626', secondary: 'var(--surface)' } },
          }}
        />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
