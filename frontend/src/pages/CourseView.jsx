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
import Navbar from '../components/Navbar';
import FileViewer from '../components/FileViewer';
import { 
  ArrowLeft, BookOpen, ClipboardList, Megaphone, 
  CheckCircle2, ChevronRight, FileText, Video, 
  Link as LinkIcon, GraduationCap, PlayCircle, Loader2,
  Inbox
} from 'lucide-react';

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
      case 'video': return <Video size={20} className="text-primary-light" />;
      case 'link': return <LinkIcon size={20} className="text-gold" />;
      default: return <BookOpen size={20} className="text-secondary" />;
    }
  };

  if (loading) return (
    <div className="page-wrapper d-flex align-items-center justify-content-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-gold mb-3" size={48} />
        <p className="text-secondary">Initialisation du cours...</p>
      </div>
    </div>
  );

  if (!course) return (
    <div className="page-wrapper d-flex align-items-center justify-content-center">
      <div className="glass-card text-center p-5">
        <Inbox className="text-danger mb-4" size={64} />
        <h2 className="text-danger">Cours non trouvé</h2>
        <Link to="/student" className="btn-premium mt-4">Retour au catalogue</Link>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <Navbar />
      
      <div className="course-viewer-layout">
        
        <aside className="course-sidebar animate-fade-in">
          <div className="d-flex align-items-center mb-5 gap-3">
            <Link to="/student" className="btn-outline-premium p-0" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>
              <ArrowLeft size={18} />
            </Link>
            <div className="overflow-hidden">
              <h5 className="mb-0 fw-bold text-truncate text-gold" style={{ fontFamily: "'Playfair Display', serif" }}>{course.title}</h5>
              <p className="mb-0 text-muted small text-truncate">Module d'apprentissage</p>
            </div>
          </div>

          {progress && (
            <div className="sidebar-section">
              <h6 className="sidebar-title">Ma Progression</h6>
              <div className="glass-card p-3 mb-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-secondary small fw-bold">COMPLÉTÉ</span>
                  <span className="text-gold fw-bold">{progress.percentage}%</span>
                </div>
                <div className="premium-progress" style={{ height: '6px' }}>
                  <div className="premium-progress-bar" style={{ width: `${progress.percentage}%` }}></div>
                </div>
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <h6 className="sidebar-title">Structure du cours</h6>
            <div className="d-flex flex-column gap-1">
              {chapters.map((chapter, index) => (
                <button 
                  key={chapter.id} 
                  className={`sidebar-btn ${selectedChapter?.id === chapter.id && !showQuizzes ? 'active' : ''}`} 
                  onClick={() => { setSelectedChapter(chapter); setShowQuizzes(false); }}
                >
                  <span className="opacity-50 small fw-bold">{String(index + 1).padStart(2, '0')}</span>
                  <span className="flex-grow-1 text-truncate">{chapter.title}</span>
                  <ChevronRight size={16} className="opacity-50" />
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h6 className="sidebar-title">Validations</h6>
            <button 
              className={`sidebar-btn ${showQuizzes ? 'active' : ''}`} 
              onClick={() => setShowQuizzes(true)}
            >
              <ClipboardList size={20} className={showQuizzes ? 'text-gold' : 'text-secondary'} />
              <span className="flex-grow-1">Quizz & Évaluations</span>
              <span className="score-badge info px-2">{quizzes.length}</span>
            </button>
          </div>

          {announcements.length > 0 && (
            <div className="sidebar-section">
              <h6 className="sidebar-title">Dernières Annonces</h6>
              <div className="announcement-card-premium">
                <div className="announcement-header d-flex align-items-center gap-2">
                  <Megaphone size={16} className="text-gold" />
                  <span className="small fw-bold">IMPORTANT</span>
                </div>
                <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  {announcements.map(ann => (
                    <div key={ann.id} className="announcement-item">
                      <strong className="d-block text-white small mb-1">{ann.title}</strong>
                      <p className="mb-2 text-secondary" style={{ fontSize: '0.75rem', lineHeight: '1.4' }}>{ann.content}</p>
                      <div className="text-muted" style={{ fontSize: '0.65rem' }}>{new Date(ann.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>

        <main className="course-content-area">
          <div className="container" style={{ maxWidth: '900px' }}>
            {showQuizzes ? (
              <div className="animate-slide-up">
                <div className="mb-5 pb-4 border-bottom border-white border-opacity-10">
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <ClipboardList className="text-gold" size={32} />
                    <h2 className="text-gold fw-bold mb-0" style={{ fontFamily: "'Playfair Display', serif" }}>Évaluations du module</h2>
                  </div>
                  <p className="text-secondary fs-5">Testez vos connaissances pour valider ce module d'apprentissage.</p>
                </div>
                
                <div className="d-flex flex-column gap-3">
                  {quizzes.map(quiz => (
                    <div key={quiz.id} className="glass-card p-4 d-flex align-items-center gap-4 transition-all hover-translate">
                      <div className="stat-icon" style={{ width: '56px', height: '56px', background: 'rgba(202, 138, 4, 0.1)' }}>
                        <GraduationCap className="text-gold" size={28} />
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="fw-bold mb-1 text-white">{quiz.title}</h5>
                        <div className="d-flex align-items-center gap-2">
                          <span className="text-muted small">ÉVALUATION FINALE</span>
                          {quiz.has_submitted && <span className="score-badge success px-2 py-0" style={{ fontSize: '0.6rem' }}>COMPLÉTÉ</span>}
                        </div>
                      </div>
                      <button 
                        className={quiz.has_submitted ? 'btn btn-outline-success d-flex align-items-center gap-2 px-4 py-2 border-0 fw-bold' : 'btn-premium px-5'} 
                        onClick={() => navigate(`/quiz/${quiz.id}`)}
                        disabled={!!quiz.has_submitted}
                      >
                        {quiz.has_submitted ? <><CheckCircle2 size={18} /> Voir score</> : 'Démarrer'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : !selectedChapter ? (
              <div className="empty-state animate-fade-up text-center py-5">
                <div className="mb-4 d-flex justify-content-center">
                  <div className="stat-icon" style={{ width: '120px', height: '120px', fontSize: '4rem' }}>
                    <PlayCircle size={64} className="text-gold animate-pulse" />
                  </div>
                </div>
                <h2 className="text-gold fw-bold mb-3" style={{ fontFamily: "'Playfair Display', serif", fontSize: '3rem' }}>Prêt à commencer ?</h2>
                <p className="text-secondary mx-auto fs-5" style={{ maxWidth: '500px' }}>
                  Sélectionnez un chapitre dans le menu latéral pour accéder aux ressources pédagogiques et commencer votre parcours.
                </p>
              </div>
            ) : (
              <div className="animate-slide-up">
                <div className="mb-5 pb-4 border-bottom border-white border-opacity-10">
                  <div className="score-badge info mb-3 px-3 py-2" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Chapitre Actuel</div>
                  <h2 className="text-white fw-bold mb-0" style={{ fontFamily: "'Playfair Display', serif", fontSize: '3rem' }}>{selectedChapter.title}</h2>
                </div>

                <div className="d-flex flex-column gap-3">
                  {resources[selectedChapter.id]?.map(resource => (
                    <div key={resource.id} className="glass-card p-4 d-flex align-items-center gap-4 transition-all hover-translate">
                      <div className="stat-icon" style={{ width: '56px', height: '56px', background: 'rgba(255, 255, 255, 0.03)' }}>
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="flex-grow-1">
                        <h5 className="fw-bold mb-1 text-white">{resource.title}</h5>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`score-badge ${resource.type === 'pdf' ? 'danger' : resource.type === 'video' ? 'info' : 'warning'} px-2 py-0`} style={{ fontSize: '0.6rem' }}>
                            {resource.type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <FileViewer resource={resource} onView={() => handleResourceView(resource)} />
                    </div>
                  ))}

                  {resources[selectedChapter.id]?.length === 0 && (
                    <div className="text-center py-5 glass-card">
                      <Inbox className="text-muted mb-3 opacity-20" size={64} />
                      <p className="text-secondary">Aucune ressource disponible pour ce chapitre.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default CourseView;