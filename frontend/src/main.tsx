import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Index from './pages/Index.tsx'
import Room from './pages/Room.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/room" element={<Room />} />
    </Routes>
    </BrowserRouter>
  </StrictMode>,
)
