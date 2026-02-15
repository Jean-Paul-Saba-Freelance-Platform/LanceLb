import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Home from '../pages/Home'
import Login from '../pages/login'
import SignUp from '../pages/SIgnUp'
import OtpForm from '../pages/otp'
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
import PostJobStep1Title from '../pages/client/postJob/PostJobStep1Title'
import PostJobStep2Skills from '../pages/client/postJob/PostJobStep2Skills'
import PostJobStep3Description from '../pages/client/postJob/PostJobStep3Description'
import PostJobStep4Scope from '../pages/client/postJob/PostJobStep4Scope'
import PostJobStep5Budget from '../pages/client/postJob/PostJobStep5Budget'
import PostJobStep6Review from '../pages/client/postJob/PostJobStep6Review'
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
        <Route path="/verify-otp" element={<OtpForm />} />
        
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

          {/* Post-a-Job wizard routes */}
          <Route
            path="/client/post-job"
            element={<Navigate to="/client/post-job/title" replace />}
          />
          <Route
            path="/client/post-job/title"
            element={
              <ClientRoute>
                <PostJobStep1Title />
              </ClientRoute>
            }
          />
          <Route
            path="/client/post-job/skills"
            element={
              <ClientRoute>
                <PostJobStep2Skills />
              </ClientRoute>
            }
          />
          <Route
            path="/client/post-job/description"
            element={
              <ClientRoute>
                <PostJobStep3Description />
              </ClientRoute>
            }
          />
          <Route
            path="/client/post-job/scope"
            element={
              <ClientRoute>
                <PostJobStep4Scope />
              </ClientRoute>
            }
          />
          <Route
            path="/client/post-job/budget"
            element={
              <ClientRoute>
                <PostJobStep5Budget />
              </ClientRoute>
            }
          />
          <Route
            path="/client/post-job/review"
            element={
              <ClientRoute>
                <PostJobStep6Review />
              </ClientRoute>
            }
          />
        </Route>
        
      </Routes>
    </Router>
  )
}

export default App
