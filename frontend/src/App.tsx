import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { UserRoleProvider } from './components/layout/UserRoleProvider'
import { AppLayout } from './components/layout/AppLayout'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import { LoadingSpinner } from './components/common/LoadingSpinner'

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = lazy(() => import('./pages/RegisterPage').then(m => ({ default: m.RegisterPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const JobsPage = lazy(() => import('./pages/JobsPage').then(m => ({ default: m.JobsPage })))
const JobDetailPage = lazy(() => import('./pages/JobDetailPage').then(m => ({ default: m.JobDetailPage })))
const CreateJobPage = lazy(() => import('./pages/CreateJobPage').then(m => ({ default: m.CreateJobPage })))
const EditJobPage = lazy(() => import('./pages/EditJobPage').then(m => ({ default: m.EditJobPage })))
const MyApplicationsPage = lazy(() => import('./pages/MyApplicationsPage').then(m => ({ default: m.MyApplicationsPage })))
const JobApplicationsPage = lazy(() => import('./pages/JobApplicationsPage').then(m => ({ default: m.JobApplicationsPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const VedaPage = lazy(() => import('./pages/VedaPage').then(m => ({ default: m.VedaPage })))
const AssessmentsPage = lazy(() => import('./pages/AssessmentsPage').then(m => ({ default: m.AssessmentsPage })))
const ContestsPage = lazy(() => import('./pages/ContestsPage').then(m => ({ default: m.ContestsPage })))
const ChallengesPage = lazy(() => import('./pages/ChallengesPage').then(m => ({ default: m.ChallengesPage })))
const EditProfilePage = lazy(() => import('./pages/EditProfilePage').then(m => ({ default: m.EditProfilePage })))
const VideoRecordingPage = lazy(() => import('./pages/VideoRecordingPage').then(m => ({ default: m.VideoRecordingPage })))
const VideoRecordPage = lazy(() => import('./pages/VideoRecordPage').then(m => ({ default: m.VideoRecordPage })))
const PlacementDashboardPage = lazy(() => import('./pages/placement/PlacementDashboardPage').then(m => ({ default: m.PlacementDashboardPage })))
const EligibleStudentsPage = lazy(() => import('./pages/placement/EligibleStudentsPage').then(m => ({ default: m.EligibleStudentsPage })))
const PlacementDataPage = lazy(() => import('./pages/placement/PlacementDataPage').then(m => ({ default: m.PlacementDataPage })))
const PlacementJobsPage = lazy(() => import('./pages/placement/PlacementJobsPage').then(m => ({ default: m.PlacementJobsPage })))
const PlacementMembersPage = lazy(() => import('./pages/placement/PlacementMembersPage').then(m => ({ default: m.PlacementMembersPage })))
const CareerCopilotPage = lazy(() => import('./pages/CareerCopilotPage').then(m => ({ default: m.CareerCopilotPage })))

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" text="Loading page..." />
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <UserRoleProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/jobs" element={<JobsPage />} />
                <Route path="/jobs/:id" element={<JobDetailPage />} />
                <Route path="/assessments" element={<AssessmentsPage />} />
                <Route path="/contests" element={<ContestsPage />} />
                <Route path="/challenges" element={<ChallengesPage />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/edit" element={<EditProfilePage />} />
                  <Route path="/video/intro" element={<VideoRecordingPage />} />
                  <Route path="/video/record" element={<VideoRecordPage />} />
                  <Route path="/jobs/new" element={<CreateJobPage />} />
                  <Route path="/jobs/:id/edit" element={<EditJobPage />} />
                  <Route path="/my-applications" element={<MyApplicationsPage />} />
                  <Route path="/jobs/:id/applications" element={<JobApplicationsPage />} />
                  <Route path="/veda" element={<VedaPage />} />
                  {/* Placement Team Routes */}
                  <Route path="/placement/dashboard" element={<PlacementDashboardPage />} />
                  <Route path="/placement/students" element={<EligibleStudentsPage />} />
                  <Route path="/placement/batch-data" element={<PlacementDataPage />} />
                  <Route path="/placement/jobs" element={<PlacementJobsPage />} />
                  <Route path="/placement/members" element={<PlacementMembersPage />} />
                  {/* Career Copilot */}
                  <Route path="/career-copilot" element={<CareerCopilotPage />} />
                </Route>
                <Route path="/" element={<JobsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </UserRoleProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
