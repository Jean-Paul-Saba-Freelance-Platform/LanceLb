import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from '../pages/Home'
import Login from '../pages/login'
import SignUp from '../pages/SIgnUp'
import FreelancerHomePage from '../pages/FreelancerHomePage'
import FreelancerProfilePage from '../pages/FreelancerProfilePage'
import FreelancerStatsPage from '../pages/FreelancerStatsPage'
import FreelancerSettingsPage from '../pages/FreelancerSettingsPage'
import FreelancerFindWorkPage from '../pages/FreelancerFindWorkPage'
import FreelancerProposalsPage from '../pages/FreelancerProposalsPage'
import FreelancerDeliverWorkPage from '../pages/FreelancerDeliverWorkPage'
import ClientHomePage from '../pages/ClientHomePage'
import ClientProfilePage from '../pages/ClientProfilePage'
import ClientStatsPage from '../pages/ClientStatsPage'
import ClientSettingsPage from '../pages/ClientSettingsPage'
import ClientJobsPage from '../pages/ClientJobsPage'
import PostJobPage from '../pages/PostJobPage'
import FreelancerLayout from './components/FreelancerLayout'
import ClientLayout from './components/ClientLayout'
import ClientRoute from './components/ClientRoute'
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
          <Route path="/freelancer/find-work" element={<FreelancerFindWorkPage />} />
          <Route path="/freelancer/proposals" element={<FreelancerProposalsPage />} />
          <Route path="/freelancer/deliver-work" element={<FreelancerDeliverWorkPage />} />
        </Route>

        <Route element={<ClientLayout />}>
          <Route 
            path="/client/home" 
            element={
              <ClientRoute>
                <ClientHomePage />
              </ClientRoute>
            } 
          />
          <Route 
            path="/client/profile" 
            element={
              <ClientRoute>
                <ClientProfilePage />
              </ClientRoute>
            } 
          />
          <Route 
            path="/client/stats" 
            element={
              <ClientRoute>
                <ClientStatsPage />
              </ClientRoute>
            } 
          />
          <Route 
            path="/client/settings" 
            element={
              <ClientRoute>
                <ClientSettingsPage />
              </ClientRoute>
            } 
          />
          <Route 
            path="/client/jobs" 
            element={
              <ClientRoute>
                <ClientJobsPage />
              </ClientRoute>
            } 
          />
          <Route 
            path="/client/jobs/new" 
            element={
              <ClientRoute>
                <PostJobPage />
              </ClientRoute>
            } 
          />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
