import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ResumeAnalyzer from './pages/ResumeAnalyzer';
import MockInterview from './pages/MockInterview';
import InterviewRoom from './pages/InterviewRoom';
import CodingPractice from './pages/CodingPractice';
import AptitudePractice from './pages/AptitudePractice';
import InterviewReport from './pages/InterviewReport';
import Analytics from './pages/Analytics';
import StudyPlan from './pages/StudyPlan';
import InterviewHistory from './pages/InterviewHistory';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Routes>
          {/* Public Authentication Routes */}
          <Route
            path="login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="signup"
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            }
          />

          {/* Dedicated Full-Screen Voice Interview Room (Outside Dashboard AppLayout) */}
          <Route
            path="interview/room"
            element={
              <ProtectedRoute>
                <InterviewRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="interview/room/:sessionId"
            element={
              <ProtectedRoute>
                <InterviewRoom />
              </ProtectedRoute>
            }
          />

          {/* Protected Application Routes (Require Login / Signup) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="resume" element={<ResumeAnalyzer />} />
            <Route path="interview" element={<MockInterview />} />
            <Route path="coding" element={<CodingPractice />} />
            <Route path="aptitude" element={<AptitudePractice />} />
            <Route path="report/:id" element={<InterviewReport />} />
            <Route path="interview/report/:id" element={<InterviewReport />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="recommendations" element={<StudyPlan />} />
            <Route path="history" element={<InterviewHistory />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  );
}
