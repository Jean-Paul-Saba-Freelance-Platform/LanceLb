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
import FreelancerClientProfilePage from '../pages/FreelancerClientProfilePage'
import ClientFreelancerProfilePage from '../pages/ClientFreelancerProfilePage'
import FreelancerFreelancerProfilePage from '../pages/FreelancerFreelancerProfilePage'
import ClientHomePage from '../pages/ClientHomePage'
import ClientProfilePage from '../pages/ClientProfilePage'
import ClientStatsPage from '../pages/ClientStatsPage'
import ClientSettingsPage from '../pages/ClientSettingsPage'
import ClientJobsPage from '../pages/ClientJobsPage'
import ClientApplicationsPage from '../pages/ClientApplicationsPage'
import ClientProjectsPage from '../pages/ClientProjectsPage'
import FreelancerProjectsPage from '../pages/FreelancerProjectsPage'
import ProjectDetailPage from '../pages/ProjectDetailPage'
import MessagesPage from '../pages/MessagesPage'
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
import FreelancerRoute from './components/FreelancerRoute'
import AuthRedirect from './components/AuthRedirect'
import AdminDashboard from '../pages/AdminDashboard'
import GoogleAuthSuccess from '../pages/GoogleAuthSuccess'
import ExplorePeoplePage from '../pages/ExplorePeoplePage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Redirect already-authenticated users away from auth pages */}
        <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
        <Route path="/signup" element={<AuthRedirect><SignUp /></AuthRedirect>} />
        <Route path="/verify-otp" element={<OtpForm />} />
        <Route path="/auth/google/success" element={<GoogleAuthSuccess />} />
        <Route path="/admin" element={<AdminDashboard />} />
        
        <Route element={<FreelancerLayout />}>
          {/* All freelancer routes are guarded — unauthenticated → /login, client → /client/home */}
          <Route path="/freelancer/home" element={<FreelancerRoute><FreelancerHomePage /></FreelancerRoute>} />
          <Route path="/freelancer/profile" element={<FreelancerRoute><FreelancerProfilePage /></FreelancerRoute>} />
          <Route path="/freelancer/stats" element={<FreelancerRoute><FreelancerStatsPage /></FreelancerRoute>} />
          <Route path="/freelancer/settings" element={<FreelancerRoute><FreelancerSettingsPage /></FreelancerRoute>} />
          <Route path="/freelancer/messages" element={<FreelancerRoute><MessagesPage /></FreelancerRoute>} />
          <Route path="/freelancer/find-work" element={<FreelancerRoute><FreelancerFindWorkPage /></FreelancerRoute>} />
          <Route path="/freelancer/proposals" element={<FreelancerRoute><FreelancerProposalsPage /></FreelancerRoute>} />
          <Route path="/freelancer/deliver-work" element={<FreelancerRoute><FreelancerDeliverWorkPage /></FreelancerRoute>} />
          <Route path="/freelancer/client-profile/:clientId" element={<FreelancerRoute><FreelancerClientProfilePage /></FreelancerRoute>} />
          <Route path="/freelancer/projects" element={<FreelancerRoute><FreelancerProjectsPage /></FreelancerRoute>} />
          <Route path="/freelancer/projects/:projectId" element={<FreelancerRoute><ProjectDetailPage /></FreelancerRoute>} />
          <Route path="/freelancer/explore" element={<FreelancerRoute><ExplorePeoplePage /></FreelancerRoute>} />
          {/* Same-type profile views — reuse existing profile page components */}
          <Route path="/freelancer/freelancer-profile/:freelancerId" element={<FreelancerRoute><FreelancerFreelancerProfilePage /></FreelancerRoute>} />
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
            path="/client/messages"
            element={
              <ClientRoute>
                <MessagesPage />
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
          <Route
            path="/client/jobs/:jobId/applications"
            element={
              <ClientRoute>
                <ClientApplicationsPage />
              </ClientRoute>
            }
          />
          <Route
            path="/client/projects"
            element={
              <ClientRoute>
                <ClientProjectsPage />
              </ClientRoute>
            }
          />
          <Route
            path="/client/projects/new"
            element={
              <ClientRoute>
                <ClientProjectsPage />
              </ClientRoute>
            }
          />
          <Route
            path="/client/projects/:projectId"
            element={
              <ClientRoute>
                <ProjectDetailPage />
              </ClientRoute>
            }
          />

          <Route
            path="/client/freelancer-profile/:freelancerId"
            element={
              <ClientRoute>
                <ClientFreelancerProfilePage />
              </ClientRoute>
            }
          />
          <Route
            path="/client/explore"
            element={
              <ClientRoute>
                <ExplorePeoplePage />
              </ClientRoute>
            }
          />
          {/* Same-type profile views — reuse existing profile page components */}
          <Route
            path="/client/client-profile/:clientId"
            element={
              <ClientRoute>
                <FreelancerClientProfilePage />
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
