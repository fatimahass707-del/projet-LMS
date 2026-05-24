import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getCourseById,
  getChaptersByCourse,
  getResourcesByChapter,
  getAnnouncements,
  getProgress,
  updateProgress,
  getQuizzesByCourse
} from '../services/api';
import FileViewer from '../components/FileViewer';
import { 
  ArrowLeft, BookOpen, ClipboardList, Megaphone, 
  CheckCircle2, ChevronRight, FileText, Video, 
  Link as LinkIcon, GraduationCap, PlayCircle, Loader2,
  Inbox, Sun, Moon
} from 'lucide-react';
import './CourseView.css';

function CourseView() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [resources, setResources] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [progress, setProgress] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [showQuizzes, setShowQuizzes] = useState(false);
  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  useEffect(() => { loadCourseData(); }, [courseId]);

  const loadCourseData = async () => {
    try {
      const [courseData, chaptersData, announcementsData, progressData, quizzesData] = await Promise.all([
        getCourseById(courseId),
        getChaptersByCourse(courseId),
        getAnnouncements(courseId),
        getProgress(courseId),
        getQuizzesByCourse(courseId)
      ]);

      if (courseData.error) return console.error(courseData.error);
      setCourse(courseData);

      const chaptersList = Array.isArray(chaptersData) ? chaptersData : [];
      setChapters(chaptersList);
      
      const annList = Array.isArray(announcementsData) ? announcementsData : [];
      setAnnouncements(annList);

      const qzList = Array.isArray(quizzesData) ? quizzesData : [];
      setQuizzes(qzList);
      
      setProgress(progressData?.stats || null);

      const resourcesMap = {};
      for (const chapter of chaptersList) {
        const res = await getResourcesByChapter(chapter.id);
        resourcesMap[chapter.id] = Array.isArray(res) ? res : [];
      }
      setResources(resourcesMap);
    } catch (err) {
      console.error('Erreur chargement cours:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResourceView = async (resource) => {
    try {
      await updateProgress({ course_id: courseId, resource_id: resource.id });
      loadCourseData();
    } catch (err) {
      console.error('Erreur mise à jour progression:', err);
    }
  };

  const getResourceIcon = (type) => {
    switch(type) {
      case 'pdf': return <FileText size={20} className="text-danger" />;
      case 'video': return <Video size={20} className="text-info" />;
      case 'link': return <LinkIcon size={20} className="text-success" />;
      default: return <BookOpen size={20} className="text-muted" />;
    }
  };

  if (loading) return (
    <div className="course-viewer-container d-flex align-items-center justify-content-center w-100">
      <div className="text-center">
        <Loader2 className="animate-spin text-primary mb-3" size={48} />
        <p className="text-muted">Initialisation du cours...</p>
      </div>
    </div>
  );

  if (!course) return (
    <div className="course-viewer-container d-flex align-items-center justify-content-center w-100">
      <div className="glass-card text-center p-5">
        <Inbox className="text-danger mb-4 mx-auto" size={64} />
        <h2 className="text-danger">Cours non trouvé</h2>
        <Link to="/student" className="btn-premium mt-4">Retour au catalogue</Link>
      </div>
    </div>
  );

  return (
    <div className="course-viewer-container">
      {/* SIDEBAR */}
      <aside className="viewer-sidebar">
        <div className="viewer-sidebar-header">
          <Link to="/student" className="btn-outline-premium d-inline-flex align-items-center gap-2 mb-3" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
            <ArrowLeft size={16} /> Retour
          </Link>
          <h4 className="fw-bold mb-1">{course.title}</h4>
          <p className="text-muted small mb-0">Module d'apprentissage</p>
        </div>

        <div className="viewer-sidebar-content">
          {progress && (
            <div className="sidebar-section">
              <h6 className="sidebar-title">Ma Progression</h6>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="text-muted small fw-bold">COMPLÉTÉ</span>
                <span className="text-primary fw-bold">{progress.percentage}%</span>
              </div>
              <div className="progress" style={{ height: '6px' }}>
                <div 
                  className="progress-bar bg-primary" 
                  role="progressbar" 
                  style={{ width: `${progress.percentage}%` }} 
                  aria-valuenow={progress.percentage} 
                  aria-valuemin="0" 
                  aria-valuemax="100"
                ></div>
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <h6 className="sidebar-title">Structure du cours</h6>
            <div className="d-flex flex-column gap-1">
              {chapters.map((chapter, index) => (
                <button 
                  key={chapter.id} 
                  className={`chapter-btn ${selectedChapter?.id === chapter.id && !showQuizzes ? 'active' : ''}`} 
                  onClick={() => { setSelectedChapter(chapter); setShowQuizzes(false); }}
                >
                  <div className="d-flex align-items-center overflow-hidden">
                    <span className="chapter-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="text-truncate">{chapter.title}</span>
                  </div>
                  <ChevronRight size={16} className="text-muted flex-shrink-0 ms-2" />
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h6 className="sidebar-title">Évaluations</h6>
            <button 
              className={`chapter-btn ${showQuizzes ? 'active' : ''}`} 
              onClick={() => setShowQuizzes(true)}
            >
              <div className="d-flex align-items-center">
                <ClipboardList size={18} className="me-2 text-primary" />
                <span>Quizz & Évaluations</span>
              </div>
              <span className="score-badge info ms-2">{quizzes.length}</span>
            </button>
          </div>

          {announcements.length > 0 && (
            <div className="sidebar-section">
              <h6 className="sidebar-title">Annonces</h6>
              <div>
                {announcements.map(ann => (
                  <div key={ann.id} className="announcement-box">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <Megaphone size={14} className="text-secondary" />
                      <strong className="small text-primary">{ann.title}</strong>
                    </div>
                    <p className="mb-1 text-muted" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>{ann.content}</p>
                    <div className="text-muted" style={{ fontSize: '0.7rem' }}>{new Date(ann.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="viewer-main">
        <header className="viewer-topbar d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-muted">
            {showQuizzes ? "Évaluations du module" : selectedChapter ? `Chapitre: ${selectedChapter.title}` : "Aperçu du cours"}
          </h5>
          <button className="btn btn-link text-muted p-0" onClick={toggleTheme} title="Basculer le thème">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        <div className="viewer-content-area">
          {showQuizzes ? (
            <div className="animate-fade-up">
              <div className="mb-4">
                <h2 className="fw-bold mb-2">Évaluations</h2>
                <p className="text-muted">Testez vos connaissances pour valider ce module d'apprentissage.</p>
              </div>
              
              <div className="d-flex flex-column gap-3">
                {quizzes.map(quiz => (
                  <div key={quiz.id} className="resource-card">
                    <div className="resource-icon-wrapper" style={{ background: 'rgba(79, 70, 229, 0.1)' }}>
                      <GraduationCap className="text-primary" size={24} />
                    </div>
                    <div className="resource-info">
                      <h4 className="resource-title">{quiz.title}</h4>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted small fw-bold">QUIZZ</span>
                        {quiz.has_submitted && <span className="score-badge success px-2 py-0" style={{ fontSize: '0.65rem' }}>COMPLÉTÉ</span>}
                      </div>
                    </div>
                    <button 
                      className={quiz.has_submitted ? 'btn btn-outline-success fw-bold' : 'btn-premium'} 
                      onClick={() => navigate(`/quiz/${quiz.id}`)}
                      disabled={!!quiz.has_submitted}
                    >
                      {quiz.has_submitted ? <><CheckCircle2 size={16} className="me-1" /> Score</> : 'Démarrer'}
                    </button>
                  </div>
                ))}
                
                {quizzes.length === 0 && (
                  <div className="empty-state-viewer">
                    <ClipboardList className="text-muted mb-3 mx-auto" size={48} opacity={0.5} />
                    <h4 className="text-muted">Aucune évaluation</h4>
                  </div>
                )}
              </div>
            </div>
          ) : !selectedChapter ? (
            <div className="empty-state-viewer animate-fade-up">
              <div className="mb-4">
                <PlayCircle size={64} className="text-primary mx-auto mb-3" />
              </div>
              <h2 className="fw-bold mb-3">Prêt à commencer ?</h2>
              <p className="text-muted mx-auto" style={{ maxWidth: '500px' }}>
                Sélectionnez un chapitre dans le menu latéral pour accéder aux ressources pédagogiques et commencer votre parcours.
              </p>
            </div>
          ) : (
            <div className="animate-fade-up">
              <div className="mb-4">
                <h2 className="fw-bold mb-2">{selectedChapter.title}</h2>
                <p className="text-muted">{selectedChapter.description || 'Consultez les ressources ci-dessous.'}</p>
              </div>

              <div className="d-flex flex-column gap-3">
                {resources[selectedChapter.id]?.map(resource => (
                  <div key={resource.id} className="resource-card flex-column align-items-stretch">
                    <div className="d-flex align-items-center gap-3 w-100 mb-3">
                      <div className="resource-icon-wrapper">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="resource-info">
                        <h4 className="resource-title">{resource.title}</h4>
                        <span className={`score-badge ${resource.type === 'pdf' ? 'danger' : resource.type === 'video' ? 'info' : 'warning'}`}>
                          {resource.type}
                        </span>
                      </div>
                    </div>
                    
                    {/* Viewer de fichier dynamique */}
                    <div className="w-100 rounded p-3" style={{ border: '1px solid #E5E7EB', backgroundColor: 'var(--surface-light)' }}>
                      <FileViewer resource={resource} onView={() => handleResourceView(resource)} />
                    </div>
                  </div>
                ))}

                {resources[selectedChapter.id]?.length === 0 && (
                  <div className="empty-state-viewer">
                    <Inbox className="text-muted mb-3 mx-auto" size={48} opacity={0.5} />
                    <p className="text-muted mb-0">Aucune ressource disponible pour ce chapitre.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CourseView;