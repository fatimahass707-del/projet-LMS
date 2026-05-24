import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyCourses, deleteCourse } from '../services/api';
import { 
  BookOpen, Users, Plus, 
  Trash2, Zap, Loader2, Settings
} from 'lucide-react';

function TeacherDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getMyCourses();
      if (data.error) {
        setError(data.error);
        setCourses([]);
      } else {
        setCourses(data);
      }
    } catch (err) {
      setError('Erreur lors du chargement des cours');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId, e) => {
    e.stopPropagation();
    if (!window.confirm('Supprimer ce cours définitivement ?')) return;

    try {
      await deleteCourse(courseId);
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  if (loading && courses.length === 0) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="animate-fade-up">
      <header className="d-flex justify-content-between align-items-end mb-5">
        <div>
          <h1 className="fw-bold text-primary mb-2">
            Espace Formateur
          </h1>
          <p className="text-secondary fs-5">Pilotez vos formations et suivez vos cohortes.</p>
        </div>
        <Link to="/teacher/create-course" className="btn-premium">
          <Plus size={18} className="me-2" /> Nouveau Cours
        </Link>
      </header>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Tabs Menu */}
      <div className="d-flex gap-2 mb-5 border-bottom pb-2 overflow-auto" style={{ borderColor: 'var(--border-color)' }}>
        <button 
          className={`tab-btn-modern ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Tableau de bord
        </button>
        <button 
          className={`tab-btn-modern ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Mes Formations
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div>
          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <div className="glass-card d-flex align-items-center gap-4">
                <div className="stat-icon text-primary bg-primary bg-opacity-10 rounded p-3">
                  <BookOpen size={32} />
                </div>
                <div>
                  <h2 className="mb-0 fw-bold">{courses.length}</h2>
                  <span className="text-muted small fw-bold text-uppercase">Cours publiés</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card d-flex align-items-center gap-4">
                <div className="stat-icon text-info bg-info bg-opacity-10 rounded p-3">
                  <Users size={32} />
                </div>
                <div>
                  <h2 className="mb-0 fw-bold">
                    {courses.reduce((acc, c) => acc + Number(c.students_count || 0), 0)}
                  </h2>
                  <span className="text-muted small fw-bold text-uppercase">Élèves inscrits</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card d-flex align-items-center gap-4">
                <div className="stat-icon text-success bg-success bg-opacity-10 rounded p-3">
                  <Zap size={32} />
                </div>
                <div>
                  <h2 className="mb-0 fw-bold">
                    {courses.filter(c => (c.students_count || 0) > 0).length}
                  </h2>
                  <span className="text-muted small fw-bold text-uppercase">Modules Actifs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold mb-0">Dernières Formations</h4>
            <button className="btn btn-link text-primary text-decoration-none small" onClick={() => setActiveTab('courses')}>Voir tout →</button>
          </div>

          <div className="row g-4">
            {courses.slice(0, 3).map(course => (
              <div className="col-md-4" key={course.id}>
                <div className="glass-card p-4 d-flex flex-column h-100" style={{ cursor: 'pointer' }} onClick={() => navigate(`/teacher/course/${course.id}`)}>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="score-badge info">{course.students_count || 0} Inscrits</span>
                    <button 
                      className="btn btn-sm btn-outline-danger p-1 border-0" 
                      onClick={(e) => handleDelete(course.id, e)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <h5 className="fw-bold mb-2">{course.title}</h5>
                  <p className="text-secondary small mb-4" style={{ flex: 1 }}>{course.description || 'Gérez le contenu et les évaluations.'}</p>
                  <button className="btn-premium w-100 py-2">Administrer</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div>
          <h4 className="fw-bold mb-4">Répertoire Complet</h4>
          <div className="row g-4">
            {courses.map(course => (
              <div className="col-md-6 col-lg-4" key={course.id}>
                <div className="glass-card p-4 d-flex flex-column h-100">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div className="text-primary bg-primary bg-opacity-10 p-2 rounded"><BookOpen size={20} /></div>
                    <span className="score-badge info">{course.students_count || 0} Inscrits</span>
                  </div>
                  <h5 className="fw-bold mb-3">{course.title}</h5>
                  <p className="text-secondary small mb-4" style={{ flex: 1 }}>{course.description || 'Module d\'enseignement complet.'}</p>
                  <div className="d-flex gap-2 mt-auto">
                    <button className="btn-premium flex-grow-1" onClick={() => navigate(`/teacher/course/${course.id}`)}>Gérer</button>
                    <button 
                      className="btn btn-outline-danger" 
                      onClick={(e) => handleDelete(course.id, e)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TeacherDashboard;