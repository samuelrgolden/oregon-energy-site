import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import BridgerApp from './BridgerApp.jsx'
import { initTheme } from './lib/theme'

initTheme()
document.documentElement.classList.add('js-reveal')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BridgerApp />
  </StrictMode>,
)
