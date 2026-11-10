import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.addEventListener('error', (e) => {
  document.body.innerHTML = `<div style="color:red; padding:20px; font-family:monospace; white-space:pre-wrap; z-index:99999; position:relative;">${e.error?.stack || e.message}</div>`
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
