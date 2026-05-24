import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import './App.css';

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
            <Layout userRole={localStorage.getItem('role') || 'student'}>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Route Admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout userRole="admin">
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Routes enseignant */}
        <Route path="/teacher" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <Layout userRole="teacher">
              <TeacherDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/teacher/create-course" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <Layout userRole="teacher">
              <CourseCreator />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/teacher/course/:id" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <Layout userRole="teacher">
              <CourseManager />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Routes étudiant */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student', 'admin']}>
            <Layout userRole="student">
              <StudentDashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Sans Distraction Layouts (No standard Layout wrapper) */}
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