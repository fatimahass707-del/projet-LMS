import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import CourseCreator from './pages/CourseCreator';
import CourseManager from './pages/CourseManager';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';
import CourseView from './pages/CourseView';
import QuizPage from './pages/QuizPage';
import Results from './pages/Results';
import Profile from './pages/Profile';

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Route Profil (Tous) */}
        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
            <Profile />
          </ProtectedRoute>
        } />

        {/* Route Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Routes enseignant */}
        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherDashboard />
          </ProtectedRoute>
        } />
        <Route path="/teacher/create-course" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <CourseCreator />
          </ProtectedRoute>
        } />
        <Route path="/teacher/course/:id" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <CourseManager />
          </ProtectedRoute>
        } />

        {/* Routes étudiant */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/course/:id" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <CourseView />
          </ProtectedRoute>
        } />
        <Route path="/quiz/:quizId" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <QuizPage />
          </ProtectedRoute>
        } />
        <Route path="/results/:quizId" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <Results />
          </ProtectedRoute>
        } />

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;