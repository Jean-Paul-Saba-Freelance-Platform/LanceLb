import { useState } from 'react'
import Login from '../pages/login'
import SignUp from '../pages/SIgnUp'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('login')

  return (
    <>
      {currentPage === 'login' ? (
        <Login onSwitchToSignup={() => setCurrentPage('signup')} />
      ) : (
        <SignUp onSwitchToLogin={() => setCurrentPage('login')} />
      )}
    </>
  )
}

export default App

