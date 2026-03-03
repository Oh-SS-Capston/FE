import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './App.css'
import LandingPage from './LandingPage'
import AnalyPage from './AnalyPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/analyze" element={<AnalyPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
