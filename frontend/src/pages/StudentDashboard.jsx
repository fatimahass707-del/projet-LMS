import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyEnrollments, getMySubmissions, getAnnouncements } from '../services/api';
import { 
  LayoutDashboard, BookOpen, User, LogOut, 
  Megaphone, CheckCircle2, Award, Clock, 
  GraduationCap, Search, Bell, Sparkles
} from 'lucide-react';

function StudentDashboard() {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => { 
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [enrolled, subs] = await Promise.all([
        getMyEnrollments(), getMySubmissions()
      ]);

      if (enrolled.error) return setError(enrolled.error);

      setEnrolledCourses(enrolled || []);
      if (!subs.error) setSubmissions(subs || []);

      if (Array.isArray(enrolled) && enrolled.length > 0) {
        let allAnn = [];
        for (const c of enrolled) {
          const ann = await getAnnouncements(c.id);
          if (Array.isArray(ann)) {
            allAnn = [...allAnn, ...ann.map(a => ({...a, course_title: c.title}))];
          }
        }
        setAnnouncements(allAnn.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)));
      }
    } catch (err) { 
      setError('Erreur de chargement des données.');
    }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return (
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
              <GraduationCap size={28} className="text-gold" />
              <span className="logo-text">LMS <span className="text-gold">Pro</span></span>
            </div>
            
            <div className="nav-links-group">
              <button 
                className={`nav-item-v2 ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <LayoutDashboard size={18} /> Vue d'ensemble
              </button>
              <button 
                className={`nav-item-v2 ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                <BookOpen size={18} /> Formations
              </button>
              <button 
                className={`nav-item-v2 ${activeTab === 'grades' ? 'active' : ''}`}
                onClick={() => setActiveTab('grades')}
              >
                <Award size={18} /> Résultats
              </button>
              <button 
                className={`nav-item-v2 ${activeTab === 'announcements' ? 'active' : ''}`}
                onClick={() => setActiveTab('announcements')}
              >
                <Megaphone size={18} /> Annonces
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="nav-icon-btn">
              <Search size={20} />
            </div>
            <div className="nav-icon-btn position-relative">
              <Bell size={20} />
              {announcements.length > 0 && <span className="notif-badge"></span>}
            </div>
            
            <div className="nav-user-profile">
              <div className="user-avatar-mini">
                {user?.name?.charAt(0)}
              </div>
              <div className="user-info-mini d-none d-md-block">
                <p className="user-name">{user?.name || 'Étudiant'}</p>
                <p className="user-role">Premium Learner</p>
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
          <div>
            <h1 className="display-4 fw-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Bienvenue, <span className="text-gold">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-secondary fs-5">Votre parcours d'excellence continue ici.</p>
          </div>
        </header>

        {error && <div className="alert alert-danger mb-4 reveal">{error}</div>}

        {activeTab === 'overview' && (
          <div className="tab-content-v2">
            <div className="row g-4 mb-5">
              <div className="col-md-4">
                <div className="stat-card-premium">
                  <div className="stat-card-glow"></div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="stat-icon-v2"><BookOpen size={24} /></div>
                    <span className="stat-badge">En cours</span>
                  </div>
                  <h2 className="stat-value">{enrolledCourses.length}</h2>
                  <p className="stat-label-v2">Formations suivies</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card-premium">
                  <div className="stat-card-glow"></div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="stat-icon-v2 text-success"><CheckCircle2 size={24} /></div>
                    <span className="stat-badge success">Validation</span>
                  </div>
                  <h2 className="stat-value">
                    {submissions.length > 0 ? (submissions.reduce((acc, s) => acc + s.percentage, 0) / submissions.length).toFixed(0) : '0'}%
                  </h2>
                  <p className="stat-label-v2">Score moyen global</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="stat-card-premium">
                  <div className="stat-card-glow"></div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="stat-icon-v2 text-gold"><Clock size={24} /></div>
                    <span className="stat-badge warning">Activité</span>
                  </div>
                  <h2 className="stat-value">{submissions.length}</h2>
                  <p className="stat-label-v2">Quiz validés</p>
                </div>
              </div>
            </div>

            <h4 className="fw-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>Continuer mon parcours</h4>
            <div className="row g-4">
              {enrolledCourses.slice(0, 3).map(c => (
                <div className="col-md-4" key={c.id}>
                  <div className="card-premium-v2" onClick={() => navigate(`/course/${c.id}`)}>
                    <div className="card-image-placeholder">
                      <BookOpen size={40} className="text-white opacity-20" />
                    </div>
                    <div className="p-4">
                      <span className="text-gold small fw-bold uppercase letter-spacing-1 mb-2 d-block">{c.category || 'ACADÉMIQUE'}</span>
                      <h5 className="text-white fw-bold mb-4">{c.title}</h5>
                      <div className="progress-v2">
                        <div className="progress-v2-bar" style={{ width: `${c.progress}%` }}></div>
                      </div>
                      <div className="d-flex justify-content-between mt-2">
                        <span className="text-muted small">Progression</span>
                        <span className="text-gold small fw-bold">{c.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="tab-content-v2">
            <h4 className="fw-bold text-white mb-4">Mes Formations</h4>
            <div className="row g-4">
              {enrolledCourses.map(c => (
                <div className="col-md-6 col-lg-4" key={c.id}>
                  <div className="card-premium-v2" onClick={() => navigate(`/course/${c.id}`)}>
                    <div className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="stat-icon-v2 small"><BookOpen size={20} /></div>
                        <span className="score-badge info">{c.progress}%</span>
                      </div>
                      <h5 className="text-white fw-bold mb-3">{c.title}</h5>
                      <p className="text-secondary small mb-4">{c.description || 'Formation immersive de haute qualité.'}</p>
                      <button className="btn-premium w-100 py-2">Reprendre le cours</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'grades' && (
          <div className="tab-content-v2">
            <h4 className="fw-bold text-white mb-4">Relevé de Notes</h4>
            <div className="glass-card p-0 overflow-hidden">
              <table className="table-modern mb-0">
                <thead>
                  <tr>
                    <th>Cours</th>
                    <th>Évaluation</th>
                    <th>Score</th>
                    <th>Date</th>
                    <th className="text-end">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map(s => (
                    <tr key={s.id}>
                      <td><span className="text-white fw-bold">{s.course_title}</span></td>
                      <td>{s.quiz_title}</td>
                      <td><span className="text-gold fw-bold">{s.percentage}%</span></td>
                      <td><span className="text-muted small">{new Date(s.submitted_at).toLocaleDateString()}</span></td>
                      <td className="text-end">
                        <span className={`score-badge ${s.percentage >= 60 ? 'success' : 'danger'}`}>
                          {s.percentage >= 60 ? 'VALIDÉ' : 'ÉCHEC'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="tab-content-v2">
            <h4 className="fw-bold text-white mb-4">Actualités & Annonces</h4>
            <div className="row g-4">
              {announcements.map(ann => (
                <div key={ann.id} className="col-12">
                  <div className="glass-card p-4">
                    <div className="d-flex gap-4">
                      <div className="stat-icon-v2"><Megaphone size={24} /></div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h5 className="text-white mb-0">{ann.title}</h5>
                          <span className="text-muted small">{new Date(ann.created_at).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gold small fw-bold mb-2">{ann.course_title}</p>
                        <p className="text-secondary mb-0">{ann.content}</p>
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

export default StudentDashboard;