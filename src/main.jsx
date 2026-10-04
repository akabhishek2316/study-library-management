import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import { AuthProvider } from './AuthContext'
import App from './App'

import './styles.css'

ReactDOM.createRoot(
  document.getElementById('root')
).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
)

// Installable app + fast reopen
// (only in the built version)
if (
  'serviceWorker' in navigator &&
  import.meta.env.PROD
) {
  window.addEventListener(
    'load',
    () =>
      navigator.serviceWorker
        .register('/sw.js')
        .catch(() => {})
  )
}