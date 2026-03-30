import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import AppPage from './pages/AppPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/apps/:appId" element={<AppPage />} />
    </Routes>
  )
}
