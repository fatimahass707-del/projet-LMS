import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyEnrollments, enrollCourse, getCourses } from '../services/api';

function StudentDashboard() {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [enrolled, allCourses] = await Promise.all([
        getMyEnrollments(),
        getCourses()
      ]);
      setEnrolledCourses(enrolled || []);
      
      // Filtrer les cours déjà suivis
      const enrolledIds = new Set(enrolled?.map(c => c.id) || []);
      setAvailableCourses(allCourses?.filter(c => !enrolledIds.has(c.id)) || []);
    } catch (err) {
      setError('Erreur de chargement des données.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId) => {
    try {
      await enrollCourse(courseId);
      alert('✅ Inscription réussie !');
      fetchData(); // Rafraîchir la liste
    } catch (err) {
      alert('❌ Échec de l\'inscription.');
    }
  };

  if (loading) return <div className="p-4">Chargement...</div>;
  if (error) return <div className="p-4 text-danger">{error}</div>;

  return (
    <div className="container py-4">
      <h2 className="mb-4">📚 Mes Cours</h2>

      {/* Cours inscrits */}
      <section className="mb-5">
        <h4 className="mb-3">Cours en cours</h4>
        {enrolledCourses.length === 0 ? (
          <p className="text-muted">Vous n'êtes inscrit à aucun cours pour le moment.</p>
        ) : (
          <div className="row g-3">
            {enrolledCourses.map(course => (
              <div className="col-md-4" key={course.id}>
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{course.title}</h5>
                    <p className="card-text small text-muted">
                      Par {course.teacher_name} • {course.total_chapters} chapitres
                    </p>
                    <p className="card-text">{course.description}</p>
                    <Link 
                      to={`/course/${course.id}`} 
                      className="btn btn-primary btn-sm"
                    >
                      Accéder au cours
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cours disponibles */}
      <section>
        <h4 className="mb-3">Cours disponibles</h4>
        {availableCourses.length === 0 ? (
          <p className="text-muted">Aucun nouveau cours disponible.</p>
        ) : (
          <div className="row g-3">
            {availableCourses.map(course => (
              <div className="col-md-4" key={course.id}>
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{course.title}</h5>
                    <p className="card-text small text-muted">
                      Par {course.teacher_name}
                    </p>
                    <p className="card-text">{course.description}</p>
                    <button 
                      onClick={() => handleEnroll(course.id)}
                      className="btn btn-outline-success btn-sm"
                    >
                      S'inscrire
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default StudentDashboard;