import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyEnrollments, getMySubmissions, getAnnouncements, getCourses, enrollCourse } from '../services/api';
import CourseCard from '../components/CourseCard';
import { 
  BookOpen, CheckCircle2, Clock, 
  Megaphone, Award, Loader2, Compass
} from 'lucide-react';

function StudentDashboard() {
  const navigate = useNavigate();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);
  const [enrollSuccess, setEnrollSuccess] = useState(null);
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
      const [enrolled, subs, all] = await Promise.all([
        getMyEnrollments(), getMySubmissions(), getCourses()
      ]);

      if (enrolled.error) return setError(enrolled.error);

      setEnrolledCourses(enrolled || []);
      if (!subs.error) setSubmissions(subs || []);
      if (!all.error) setAllCourses(all || []);

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

  const handleEnroll = async (courseId) => {
    setEnrolling(true);
    setError(null);
    setEnrollSuccess(null);
    const res = await enrollCourse(courseId);
    setEnrolling(false);
    if (res.error) return setError(res.error);
    setEnrollSuccess("Inscription réussie ! Vous pouvez maintenant accéder à cette formation.");
    fetchData();
  };

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="animate-fade-up">
      <header className="mb-5">
        <h1 className="fw-bold text-primary mb-2">
          Bienvenue, {user?.prenom || 'Étudiant'}
        </h1>
        <p className="text-secondary fs-5">Votre espace d'apprentissage.</p>
      </header>

      {error && <div className="alert alert-danger mb-4">{error}</div>}

      {/* Tabs Menu */}
      <div className="d-flex gap-2 mb-5 border-bottom pb-2 overflow-auto" style={{ borderColor: 'var(--border-color)' }}>
        <button 
          className={`tab-btn-modern ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Vue d'ensemble
        </button>
        <button 
          className={`tab-btn-modern ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => { setActiveTab('catalog'); setError(null); setEnrollSuccess(null); }}
        >
          <Compass size={18} className="d-inline me-1" /> Catalogue des Formations
        </button>
        <button 
          className={`tab-btn-modern ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          Mes Formations
        </button>
        <button 
          className={`tab-btn-modern ${activeTab === 'grades' ? 'active' : ''}`}
          onClick={() => setActiveTab('grades')}
        >
          Résultats
        </button>
        <button 
          className={`tab-btn-modern ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          Annonces
        </button>
      </div>

      {activeTab === 'overview' && (
        <div>
          {/* Stats Cards */}
          <div className="row g-4 mb-5">
            <div className="col-md-4">
              <div className="glass-card d-flex align-items-center gap-4">
                <div className="stat-icon text-primary bg-primary bg-opacity-10 rounded p-3">
                  <BookOpen size={32} />
                </div>
                <div>
                  <h2 className="mb-0 fw-bold">{enrolledCourses.length}</h2>
                  <span className="text-muted small fw-bold text-uppercase">Formations</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card d-flex align-items-center gap-4">
                <div className="stat-icon text-success bg-success bg-opacity-10 rounded p-3">
                  <CheckCircle2 size={32} />
                </div>
                <div>
                  <h2 className="mb-0 fw-bold">
                    {submissions.length > 0 ? (submissions.reduce((acc, s) => acc + Number(s.percentage), 0) / submissions.length).toFixed(0) : '0'}%
                  </h2>
                  <span className="text-muted small fw-bold text-uppercase">Score Moyen</span>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="glass-card d-flex align-items-center gap-4">
                <div className="stat-icon text-warning bg-warning bg-opacity-10 rounded p-3">
                  <Award size={32} />
                </div>
                <div>
                  <h2 className="mb-0 fw-bold">{submissions.length}</h2>
                  <span className="text-muted small fw-bold text-uppercase">Quiz Validés</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Resume */}
          <h4 className="fw-bold mb-4">Reprendre l'apprentissage</h4>
          {enrolledCourses.length === 0 ? (
            <div className="glass-card p-5 text-center">
              <Compass size={48} className="text-primary mb-3 mx-auto" />
              <h5 className="fw-bold mb-2">Vous n'êtes inscrit à aucune formation</h5>
              <p className="text-muted mb-4">Explorez notre catalogue pour commencer à apprendre dès aujourd'hui.</p>
              <button className="btn-premium px-4 py-2" onClick={() => setActiveTab('catalog')}>Explorer le catalogue</button>
            </div>
          ) : (
            <div className="row g-4">
              {enrolledCourses.slice(0, 3).map(c => (
                <div className="col-md-6 col-lg-4" key={c.id}>
                  <CourseCard 
                    id={c.id}
                    title={c.title}
                    instructor={c.instructor_name || 'Équipe pédagogique'}
                    progress={c.progress || 0}
                    category={c.category || 'Formation'}
                    imageUrl={c.image_url}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'catalog' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="fw-bold mb-0">Catalogue des Formations</h4>
            <span className="text-muted small fw-bold text-uppercase">{allCourses.length} formation(s) disponible(s)</span>
          </div>

          {enrollSuccess && <div className="alert alert-success mb-4 fw-bold">{enrollSuccess}</div>}
          {enrolling && <div className="alert alert-info mb-4 d-flex align-items-center gap-2"><Loader2 className="animate-spin" size={18} /> Inscription en cours...</div>}

          <div className="row g-4">
            {allCourses.length === 0 ? (
              <div className="col-12"><div className="glass-card p-5 text-center text-muted">Aucune formation disponible dans le catalogue pour le moment.</div></div>
            ) : (
              allCourses.map(c => {
                const isEnrolled = enrolledCourses.some(e => e.id === c.id || e.course_id === c.id);
                return (
                  <div className="col-md-6 col-lg-4" key={c.id}>
                    <CourseCard 
                      id={c.id}
                      title={c.title}
                      instructor={c.teacher_name || 'Équipe pédagogique'}
                      progress={0}
                      category={c.category || 'Formation'}
                      imageUrl={c.image_url}
                      isCatalog={true}
                      isEnrolled={isEnrolled}
                      onEnroll={handleEnroll}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div>
          <h4 className="fw-bold mb-4">Mes Formations</h4>
          {enrolledCourses.length === 0 ? (
            <div className="glass-card p-5 text-center text-muted">Vous n'êtes inscrit à aucun cours. Allez dans l'onglet Catalogue pour en ajouter !</div>
          ) : (
            <div className="row g-4">
              {enrolledCourses.map(c => (
                <div className="col-md-6 col-lg-4" key={c.id}>
                  <CourseCard 
                    id={c.id}
                    title={c.title}
                    instructor={c.instructor_name || 'Équipe pédagogique'}
                    progress={c.progress || 0}
                    category={c.category || 'Formation'}
                    imageUrl={c.image_url}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'grades' && (
        <div>
          <h4 className="fw-bold mb-4">Relevé de Notes</h4>
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
                {submissions.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">Aucune évaluation passée.</td></tr>
                ) : (
                  submissions.map(s => (
                    <tr key={s.id}>
                      <td className="fw-bold">{s.course_title}</td>
                      <td>{s.quiz_title}</td>
                      <td className="fw-bold text-primary">{s.percentage}%</td>
                      <td className="text-muted small">{new Date(s.submitted_at).toLocaleDateString()}</td>
                      <td className="text-end">
                        <span className={`score-badge ${s.percentage >= 60 ? 'success' : 'danger'}`}>
                          {s.percentage >= 60 ? 'VALIDÉ' : 'ÉCHEC'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'announcements' && (
        <div>
          <h4 className="fw-bold mb-4">Actualités & Annonces</h4>
          <div className="row g-4">
            {announcements.length === 0 ? (
              <div className="col-12"><p className="text-muted">Aucune annonce pour le moment.</p></div>
            ) : (
              announcements.map(ann => (
                <div key={ann.id} className="col-12">
                  <div className="glass-card d-flex gap-4">
                    <div className="text-warning bg-warning bg-opacity-10 p-3 rounded" style={{ height: 'fit-content' }}>
                      <Megaphone size={24} />
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="mb-0 fw-bold">{ann.title}</h5>
                        <span className="text-muted small bg-light px-2 py-1 rounded">{new Date(ann.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-primary small fw-bold mb-2 text-uppercase">{ann.course_title}</p>
                      <p className="text-secondary mb-0">{ann.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;