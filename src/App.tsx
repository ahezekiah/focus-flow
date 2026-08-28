import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './Home'
import Dashboard from './Dashboard'
import Onboarding from './Onboarding'
import SignIn from './SignIn'
import { getCurrentAccount, signOut, type AccountRecord } from './lib/accounts'
import { releaseIdentity } from './lib/identity'

function App() {
  const [account, setAccount] = useState<AccountRecord | undefined>(getCurrentAccount);

  const signedIn = !!account;
  const completed = !!account?.onboardingCompleted;

  function handleSignOut() {
    signOut();
    void releaseIdentity();
    setAccount(undefined);
  }

  return (
    <Routes>
      <Route path="/" element={<Home signedIn={signedIn} completed={completed} />} />
      <Route
        path="/signin"
        element={
          completed ? <Navigate to="/dash" replace />
          : signedIn ? <Navigate to="/onboarding" replace />
          : <SignIn onSignedIn={setAccount} />
        }
      />
      <Route
        path="/onboarding"
        element={
          completed ? <Navigate to="/dash" replace /> : <Onboarding account={account} onAccountChange={setAccount} />
        }
      />
      <Route
        path="/dash"
        element={
          completed ? <Dashboard account={account!} onSignOut={handleSignOut} onAccountChange={setAccount} />
          : signedIn ? <Navigate to="/onboarding" replace />
          : <Navigate to="/" replace />
        }
      />
    </Routes>
  )
}

export default App
