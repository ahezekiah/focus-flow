import { Routes, Route } from 'react-router-dom'
import Home from './Home'
import Dashboard from './Dashboard'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dash" element={<Dashboard />} />
    </Routes>
  )
}

export default App
