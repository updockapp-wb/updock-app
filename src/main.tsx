import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
// mapbox-gl CSS moved into src/components/Map.tsx so it defers with the lazy Map chunk (D-07).
import './index.css'


ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
