import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Index from './pages/Index.tsx'
import Room from './pages/Room.tsx'
import LiarGame from './pages/LiarGame.tsx'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/room/:roomId" element={<Room />} />
      <Route path="/liargame" element={<LiarGame />} />
    </Routes>
  </BrowserRouter>,
)
