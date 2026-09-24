import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './theme.css'
import { AlertProvider } from './components/AlertProvider.tsx'
import Index from './pages/Index.tsx'
import Room from './pages/Room.tsx'

// 저장된 테마 적용 (기본 다크)
document.body.classList.toggle('light-mode', localStorage.getItem('theme') === 'light')

createRoot(document.getElementById('root')!).render(
  <AlertProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  </AlertProvider>,
)
