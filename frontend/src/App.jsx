import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import Login from '../pages/login'
import SignUp from '../pages/SIgnUp'
import FreelancerHomePage from '../pages/FreelancerHomePage'
import FreelancerProfilePage from '../pages/FreelancerProfilePage'
import FreelancerStatsPage from '../pages/FreelancerStatsPage'
import FreelancerSettingsPage from '../pages/FreelancerSettingsPage'
import FreelancerLayout from './components/FreelancerLayout'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        <Route element={<FreelancerLayout />}>
          <Route path="/freelancer/home" element={<FreelancerHomePage />} />
          <Route path="/freelancer/profile" element={<FreelancerProfilePage />} />
          <Route path="/freelancer/stats" element={<FreelancerStatsPage />} />
          <Route path="/freelancer/settings" element={<FreelancerSettingsPage />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
