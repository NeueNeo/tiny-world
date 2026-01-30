import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// StrictMode disabled - causes double mounting issues with Three.js/R3F
createRoot(document.getElementById('root')!).render(<App />)
