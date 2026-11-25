import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.jsx'
import { TenantProvider } from './context/TenantContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { initStorage } from './utils/storage.js'

// Initialize seed data if not present
initStorage()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TenantProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </TenantProvider>
  </StrictMode>,
)
