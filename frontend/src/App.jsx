import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';

// Pages - Fatima
import Login from './pages/Login';
import Register from './pages/Register';
import TeacherDashboard from './pages/TeacherDashboard';
import CourseCreator from './pages/CourseCreator';

// Pages - Ikram
import StudentDashboard from './pages/StudentDashboard';
import CourseView from './pages/CourseView';
import QuizPage from './pages/QuizPage';
import Results from './pages/Results';

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Routes publiques */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Routes enseignant - Fatima */}
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

        {/* Routes étudiant - Ikram */}
        <Route path="/student" element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        } />
        <Route path="/course/:id" element={
          <ProtectedRoute allowedRoles={['student']}>
            <CourseView />
          </ProtectedRoute>
        } />
        <Route path="/quiz/:id" element={
          <ProtectedRoute allowedRoles={['student']}>
            <QuizPage />
          </ProtectedRoute>
        } />
        <Route path="/results/:quizId" element={
          <ProtectedRoute allowedRoles={['student']}>
            <Results />
          </ProtectedRoute>
        } />

        {/* Redirection par défaut */}
        <Route path="/" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;