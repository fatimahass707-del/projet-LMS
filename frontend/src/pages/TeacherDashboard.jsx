import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCourses, deleteCourse } from '../services/api';
import Navbar from '../components/Navbar';

function TeacherDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const teacherName = localStorage.getItem('name');

  // Charger les cours au montage du composant
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
    } catch (err) {
      setError('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Supprimer ce cours ?')) return;

    try {
      await deleteCourse(courseId);
      // Mettre à jour la liste sans recharger
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="main-content">
        <div className="container">

          {/* En-tête */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold mb-0">Bonjour, {teacherName} 👋</h3>
              <p className="text-muted mb-0">Gérez vos cours et chapitres</p>
            </div>
            <Link to="/teacher/create-course" className="btn btn-primary">
              + Créer un cours
            </Link>
          </div>

          {/* Stats */}
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="stat-card">
                <div className="stat-number">{courses.length}</div>
                <div className="stat-label">Cours créés</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card">
                <div className="stat-number">
                  {courses.reduce((acc, c) => acc + (c.students_count || 0), 0)}
                </div>
                <div className="stat-label">Étudiants inscrits</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card">
                <div className="stat-number">
                  {courses.filter(c => (c.students_count || 0) > 0).length}
                </div>
                <div className="stat-label">Cours actifs</div>
              </div>
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="alert alert-danger">{error}</div>
          )}

          {/* Liste des cours */}
          <h5 className="section-title">Mes cours</h5>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" />
            </div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: '3rem' }}>📚</div>
              <p>Vous n'avez pas encore de cours.</p>
              <Link to="/teacher/create-course" className="btn btn-primary mt-2">
                Créer mon premier cours
              </Link>
            </div>
          ) : (
            <div className="row">
              {courses.map(course => (
                <div className="col-md-6 col-lg-4" key={course.id}>
                  <div className="course-card">
                    <h5>{course.title}</h5>
                    <p className="text-muted-sm mb-2">{course.description}</p>
                    <div className="d-flex align-items-center gap-2 mb-3">
                      <span className="badge bg-light text-dark">
                        👥 {course.students_count || 0} étudiant(s)
                      </span>
                    </div>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-primary flex-fill"
                        onClick={() => navigate(`/teacher/course/${course.id}`)}
                      >
                        Gérer
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(course.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default TeacherDashboard;