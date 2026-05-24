import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { searchCourses, enrollCourse, getMyEnrollments } from '../services/api';
import CourseCard from '../components/CourseCard';
import { Search, AlertCircle, Loader2 } from 'lucide-react';

function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [query]);

  const fetchResults = async () => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const searchResult = await searchCourses(query);
      
      if (searchResult.error) {
        setError(searchResult.error);
        setResults([]);
      } else {
        setResults(Array.isArray(searchResult) ? searchResult : []);
      }
    } catch (err) {
      setError('Erreur lors de la recherche');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchEnrolled = async () => {
      const enrolled = await getMyEnrollments();
      if (Array.isArray(enrolled)) {
        setEnrolledCourses(enrolled.map(e => e.id || e.course_id));
      }
    };
    fetchEnrolled();
  }, []);

  const handleEnroll = async (courseId) => {
    try {
      setEnrolling(true);
      const res = await enrollCourse(courseId);
      if (!res.error) {
        setEnrolledCourses([...enrolledCourses, courseId]);
        setTimeout(() => navigate(`/course/${courseId}`), 500);
      } else {
        setError(res.error);
      }
    } catch (err) {
      setError('Erreur lors de l\'inscription');
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="container-lg py-5">
      <div className="mb-5">
        <h1 className="mb-2 d-flex align-items-center gap-2">
          <Search size={32} style={{ color: 'var(--primary-color)' }} />
          Résultats de recherche
        </h1>
        <p className="text-muted">
          {query && `Résultats pour: "${query}"`}
        </p>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <Loader2 size={40} className="spinner" style={{ color: 'var(--primary-color)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : results.length === 0 ? (
        <div className="alert alert-info text-center py-5">
          <Search size={48} className="mb-3" style={{ color: 'var(--primary-color)', opacity: 0.5 }} />
          <h5>Aucun cours trouvé</h5>
          <p className="text-muted">
            {query 
              ? `Aucun cours correspondant à "${query}". Essayez une autre recherche.`
              : 'Veuillez saisir un terme de recherche.'}
          </p>
        </div>
      ) : (
        <div className="courses-grid">
          {results.map(course => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              instructor={course.teacher_name}
              category={course.category}
              isCatalog={true}
              isEnrolled={enrolledCourses.includes(course.id)}
              onEnroll={handleEnroll}
            />
          ))}
        </div>
      )}

      <style>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default SearchResults;
