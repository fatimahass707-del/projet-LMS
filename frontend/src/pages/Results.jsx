import { useLocation, useNavigate } from 'react-router-dom';
import ProgressBar from '../components/ProgressBar';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state || {};

  const getGradeColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'danger';
  };

  const getGradeMessage = (percentage) => {
    if (percentage >= 80) return '🎉 Excellent travail !';
    if (percentage >= 60) return '👍 Bien joué, continuez !';
    return '📚 Révisez et réessayez !';
  };

  return (
    <div className="container py-5" style={{ maxWidth: '600px' }}>
      <div className="card text-center">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">📊 Résultats du Quiz</h4>
        </div>
        <div className="card-body">
          {result.quizTitle && (
            <h5 className="card-title mb-4">{result.quizTitle}</h5>
          )}
          
          <div className="display-1 fw-bold mb-3">
            {result.score} / {result.total}
          </div>
          
          <div className="mb-4">
            <ProgressBar value={result.percentage} />
            <p className="mt-2">
              <strong>{result.percentage}%</strong> de bonnes réponses
            </p>
          </div>

          <div className={`alert alert-${getGradeColor(result.percentage)}`}>
            {getGradeMessage(result.percentage)}
          </div>

          <div className="d-grid gap-2">
            <button 
              className="btn btn-primary"
              onClick={() => navigate('/student')}
            >
              Retour à mes cours
            </button>
            {result.percentage < 80 && (
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigate(-1)}
              >
                Réessayer le quiz
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Results;