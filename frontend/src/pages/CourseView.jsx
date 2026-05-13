import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  getCourseById, 
  getChaptersByCourse, 
  getResourcesByChapter,
  getAnnouncements,
  getProgress,
  updateProgress
} from '../services/api';
import ProgressBar from '../components/ProgressBar';
import FileViewer from '../components/FileViewer';

function CourseView() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [resources, setResources] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [progress, setProgress] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    try {
      const [courseData, chaptersData, announcementsData, progressData] = await Promise.all([
        getCourseById(courseId),
        getChaptersByCourse(courseId),
        getAnnouncements(courseId),
        getProgress(courseId)
      ]);
      
      setCourse(courseData);
      setChapters(chaptersData || []);
      setAnnouncements(announcementsData || []);
      setProgress(progressData?.stats || null);

      // Charger les ressources pour chaque chapitre
      const resourcesMap = {};
      for (const chapter of chaptersData || []) {
        const res = await getResourcesByChapter(chapter.id);
        resourcesMap[chapter.id] = res || [];
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
      loadCourseData(); // Rafraîchir la progression
    } catch (err) {
      console.error('Erreur mise à jour progression:', err);
    }
  };

  if (loading) return <div className="p-4">Chargement du cours...</div>;
  if (!course) return <div className="p-4 text-danger">Cours non trouvé.</div>;

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* Sidebar - Chapitres */}
        <div className="col-md-3">
          <div className="card mb-4">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">{course.title}</h5>
            </div>
            <div className="card-body">
              {progress && (
                <div className="mb-3">
                  <small>Progression: {progress.percentage}%</small>
                  <ProgressBar value={progress.percentage} />
                </div>
              )}
              
              <h6 className="mb-2">Chapitres</h6>
              <div className="list-group list-group-flush">
                {chapters.map(chapter => (
                  <button
                    key={chapter.id}
                    className={`list-group-item list-group-item-action ${
                      selectedChapter?.id === chapter.id ? 'active' : ''
                    }`}
                    onClick={() => setSelectedChapter(chapter)}
                  >
                    <small>{chapter.order_num}.</small> {chapter.title}
                    {resources[chapter.id]?.length > 0 && (
                      <span className="badge bg-secondary ms-2">
                        {resources[chapter.id].length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Annonces */}
          {announcements.length > 0 && (
            <div className="card">
              <div className="card-header bg-warning">
                <h6 className="mb-0">📢 Annonces</h6>
              </div>
              <div className="card-body p-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {announcements.map(ann => (
                  <div key={ann.id} className="mb-2 small">
                    <strong>{ann.title}</strong>
                    <p className="mb-1 text-truncate">{ann.content}</p>
                    <small className="text-muted">
                      {new Date(ann.created_at).toLocaleDateString('fr-FR')}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contenu principal */}
        <div className="col-md-9">
          {!selectedChapter ? (
            <div className="alert alert-info">
              👈 Sélectionnez un chapitre pour commencer.
            </div>
          ) : (
            <div>
              <h4 className="mb-3">
                {selectedChapter.order_num}. {selectedChapter.title}
              </h4>
              
              {resources[selectedChapter.id]?.length === 0 ? (
                <p className="text-muted">Aucune ressource dans ce chapitre.</p>
              ) : (
                <div className="list-group">
                  {resources[selectedChapter.id].map(resource => (
                    <div key={resource.id} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{resource.title}</strong>
                          <span className="badge bg-info ms-2">{resource.type}</span>
                        </div>
                        <FileViewer 
                          resource={resource} 
                          onView={() => handleResourceView(resource)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CourseView;