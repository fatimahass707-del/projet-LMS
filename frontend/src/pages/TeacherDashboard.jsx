import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyCourses, deleteCourse } from '../services/api';
import { 
  LayoutDashboard, BookOpen, Users, Plus, 
  Trash2, GraduationCap, Zap, Sparkles,
  Search, Bell, LogOut, User, Settings,
  ChevronRight, BarChart3, Megaphone
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
    if (!window.confirm('Supprimer ce cours ?')) return;

    try {
      await deleteCourse(courseId);
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (err) {
      setError('Erreur lors de la suppression');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading && courses.length === 0) return (
    <div className="page-wrapper d-flex align-items-center justify-content-center">
      <Sparkles className="animate-pulse text-gold" size={48} />
    </div>
  );

  return (
    <div className="dashboard-container-v2">
      {/* Premium Top Navbar */}
      <nav className="dash-nav-top">
        <div className="dash-nav-container">
          <div className="d-flex align-items-center gap-4">
            <div className="nav-logo" onClick={() => navigate('/')}>
              <Zap size={28} className="text-gold" />
              <span className="logo-text">Academy <span className="text-gold">Admin</span></span>
            </div>
            
            <div className="nav-links-group">
              <button 
                className={`nav-item-v2 ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <LayoutDashboard size={18} /> Dashboard
              </button>
              <button 
                className={`nav-item-v2 ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                <BookOpen size={18} /> Mes Cours
              </button>
              <button 
                className="nav-item-v2"
                onClick={() => navigate('/teacher/create-course')}
              >
                <Plus size={18} /> Nouveau Cours
              </button>
              <button className="nav-item-v2">
                <BarChart3 size={18} /> Statistiques
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="nav-icon-btn">
              <Search size={20} />
            </div>
            <div className="nav-icon-btn">
              <Bell size={20} />
            </div>
            
            <div className="nav-user-profile">
              <div className="user-avatar-mini" style={{ background: 'var(--grad-primary)' }}>
                {user?.name?.charAt(0)}
              </div>
              <div className="user-info-mini d-none d-md-block">
                <p className="user-name">{user?.name || 'Professeur'}</p>
                <p className="user-role">Enseignant Expert</p>
              </div>
              <button onClick={handleLogout} className="logout-btn-mini" title="Déconnexion">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content-v2 animate-fade-up">
        <header className="content-header-v2 mb-5">
          <div className="d-flex justify-content-between align-items-end w-100">
            <div>
              <h1 className="display-4 fw-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                Espace <span className="text-gold">Pédagogique</span>
              </h1>
              <p className="text-secondary fs-5">Pilotez vos formations et suivez vos cohortes.</p>
            </div>
            <Link to="/teacher/create-course" className="btn-premium d-flex align-items-center gap-2 mb-2">
              <Plus size={20} /> Lancer un nouveau cours
            </Link>
          </div>
        </header>

        {error && <div className="alert alert-danger mb-4 reveal">{error}</div>}

        {activeTab === 'dashboard' && (
          <div className="tab-content-v2">
            <div className="row g-4 mb-5">
              <div className="col-md-4">
                <div className="stat-card-premium">
                  <div className="stat-card-glow"></div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="stat-icon-v2 text-gold"><BookOpen size={24} /></div>
                    <span className="stat-badge">Catalogue</span>
                  </div>
                  <h2 className="stat-value">{courses.length}</h2>
                  <p className="stat-label-v2">Cours publiés</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card-premium">
                  <div className="stat-card-glow"></div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="stat-icon-v2 text-info"><Users size={24} /></div>
                    <span className="stat-badge info">Cohorte</span>
                  </div>
                  <h2 className="stat-value">
                    {courses.reduce((acc, c) => acc + (c.students_count || 0), 0)}
                  </h2>
                  <p className="stat-label-v2">Étudiants inscrits</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card-premium">
                  <div className="stat-card-glow"></div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="stat-icon-v2 text-success"><Zap size={24} /></div>
                    <span className="stat-badge success">Activité</span>
                  </div>
                  <h2 className="stat-value">
                    {courses.filter(c => (c.students_count || 0) > 0).length}
                  </h2>
                  <p className="stat-label-v2">Modules actifs</p>
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4">
              <h4 className="fw-bold text-white mb-0" style={{ fontFamily: "'Playfair Display', serif" }}>Dernières Formations</h4>
              <button className="btn btn-link text-gold text-decoration-none small" onClick={() => setActiveTab('courses')}>Voir tout le catalogue →</button>
            </div>

            <div className="row g-4">
              {courses.slice(0, 3).map(course => (
                <div className="col-md-4" key={course.id}>
                  <div className="card-premium-v2" onClick={() => navigate(`/teacher/course/${course.id}`)}>
                    <div className="card-image-placeholder">
                      <GraduationCap size={48} className="text-white opacity-10" />
                    </div>
                    <div className="p-4">
                      <div className="d-flex justify-content-between mb-3">
                        <span className="stat-badge info">{course.students_count || 0} Inscrits</span>
                        <div className="d-flex gap-2">
                          <button 
                            className="logout-btn-mini p-1" 
                            onClick={(e) => handleDelete(course.id, e)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <h5 className="text-white fw-bold mb-3">{course.title}</h5>
                      <p className="text-secondary small mb-4 line-clamp-2">{course.description || 'Gérez le contenu et les évaluations.'}</p>
                      <button className="btn-premium w-100 py-2">Gérer la formation</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="tab-content-v2">
            <h4 className="fw-bold text-white mb-4">Répertoire Complet</h4>
            <div className="row g-4">
              {courses.map(course => (
                <div className="col-md-6 col-lg-4" key={course.id}>
                  <div className="card-premium-v2" onClick={() => navigate(`/teacher/course/${course.id}`)}>
                    <div className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <div className="stat-icon-v2 small"><BookOpen size={20} /></div>
                        <span className="stat-badge">{course.students_count || 0} ÉLÈVES</span>
                      </div>
                      <h5 className="text-white fw-bold mb-3">{course.title}</h5>
                      <p className="text-secondary small mb-4">{course.description || 'Module d\'enseignement complet.'}</p>
                      <div className="d-flex gap-2 mt-auto">
                        <button className="btn-premium flex-grow-1 py-2">Administrer</button>
                        <button 
                          className="logout-btn-mini" 
                          onClick={(e) => handleDelete(course.id, e)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default TeacherDashboard;