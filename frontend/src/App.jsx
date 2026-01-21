import { useState } from 'react'
import Login from '../pages/login'
import SignUp from '../pages/SIgnUp'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handlePageSwitch = (newPage) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentPage(newPage)
      setIsTransitioning(false)
    }, 300)
  }

  return (
    <div className={`app-container ${isTransitioning ? 'transitioning' : ''}`}>
      {currentPage === 'login' ? (
        <div className={isTransitioning ? 'page-exit' : 'page-enter'}>
          <Login onSwitchToSignup={() => handlePageSwitch('signup')} />
        </div>
      ) : (
        <div className={isTransitioning ? 'page-exit' : 'page-enter'}>
          <SignUp onSwitchToLogin={() => handlePageSwitch('login')} />
        </div>
      )}
    </div>
  )
}

export default App

