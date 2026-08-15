import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './Home'
import Dashboard from './Dashboard'
import Onboarding from './Onboarding'
import { isOnboardingComplete } from './lib/onboarding'

function App() {
  const [complete, setComplete] = useState(isOnboardingComplete);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/onboarding"
        element={complete ? <Navigate to="/dash" replace /> : <Onboarding onComplete={() => setComplete(true)} />}
      />
      <Route
        path="/dash"
        element={complete ? <Dashboard /> : <Navigate to="/onboarding" replace />}
      />
    </Routes>
  )
}

export default App
