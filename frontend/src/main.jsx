import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#2d5016',
            border: '1px solid #cddbb9',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 4px 20px rgba(45,80,22,0.12)',
            padding: '12px 16px',
          },
          success: { iconTheme: { primary: '#4a7c16', secondary: '#fff' } },
          error: { iconTheme: { primary: '#dc2626', secondary: '#fff' }, style: { borderColor: '#fecaca' } },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
)
