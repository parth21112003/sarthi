import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Spinner from './components/common/Spinner';
import { useAuth } from './context/AuthContext';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const CounselorDashboard = lazy(() => import('./pages/CounselorDashboard'));
const CounselorDirectory = lazy(() => import('./pages/CounselorDirectory'));
const CounselorProfile = lazy(() => import('./pages/CounselorProfile'));
const Meetings = lazy(() => import('./pages/Meetings'));
const CounselorSchedule = lazy(() => import('./pages/CounselorSchedule'));
const Profile = lazy(() => import('./pages/Profile'));
const Messages = lazy(() => import('./pages/Messages'));
const Community = lazy(() => import('./pages/Community'));
const AptitudeTest = lazy(() => import('./pages/AptitudeTest'));
const SessionNotes = lazy(() => import('./pages/SessionNotes'));
const VideoCall = lazy(() => import('./pages/VideoCall'));
const CareerPaths = lazy(() => import('./pages/CareerPaths'));
const Notifications = lazy(() => import('./pages/Notifications'));
const NotFound = lazy(() => import('./pages/NotFound'));

const Loading = () => (
  <div className="flex-center" style={{ minHeight: '100vh' }}>
    <Spinner size="lg" />
  </div>
);

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  if (isAuthenticated && user) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }
  return children;
};

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        
        <Route element={<ProtectedRoute role="student" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/counselors" element={<CounselorDirectory />} />
          <Route path="/student/counselors/:id" element={<CounselorProfile />} />
          <Route path="/student/meetings" element={<Meetings />} />
          <Route path="/student/messages" element={<Messages />} />
          <Route path="/student/community" element={<Community />} />
          <Route path="/student/aptitude" element={<AptitudeTest />} />
          <Route path="/student/career-paths" element={<CareerPaths />} />
          <Route path="/student/session-notes" element={<SessionNotes />} />
          <Route path="/student/notifications" element={<Notifications />} />
          <Route path="/student/profile" element={<Profile />} />
        </Route>
        
        <Route element={<ProtectedRoute role="counselor" />}>
          <Route path="/counselor/dashboard" element={<CounselorDashboard />} />
          <Route path="/counselor/schedule" element={<CounselorSchedule />} />
          <Route path="/counselor/meetings" element={<Meetings />} />
          <Route path="/counselor/session-notes" element={<SessionNotes />} />
          <Route path="/counselor/messages" element={<Messages />} />
          <Route path="/counselor/notifications" element={<Notifications />} />
          <Route path="/counselor/profile" element={<Profile />} />
        </Route>

        {/* WebRTC Video Call Room */}
        <Route path="/call/:meetingId" element={<VideoCall />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
