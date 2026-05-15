import { useLocation, useNavigate } from 'react-router-dom';
import { Trophy, ThumbsUp, Target, ArrowLeft, CheckCircle2 } from 'lucide-react';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state || {};

  const getGradeColorClass = (percentage) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 60) return 'text-warning';
    return 'text-danger';
  };

  const getGradeMessage = (percentage) => {
    if (percentage >= 80) return 'Excellence académique atteinte !';
    if (percentage >= 60) return 'Bonne maîtrise des concepts.';
    return 'Un effort supplémentaire est requis.';
  };

  return (
    <div className="page-wrapper">
      <div className="main-content d-flex align-items-center justify-content-center">
        <div className="container py-5" style={{ maxWidth: '650px' }}>
          <div className="glass-card text-center animate-fade-up p-5">
            
            <div className="mb-4 d-flex justify-content-center">
              <div className="stat-icon" style={{ width: '100px', height: '100px', fontSize: '3rem' }}>
                {result.percentage >= 80 ? <Trophy size={48} className="text-gold" /> : 
                 result.percentage >= 60 ? <ThumbsUp size={48} className="text-primary-light" /> : 
                 <Target size={48} className="text-danger" />}
              </div>
            </div>

            <h2 className="text-gold fw-bold mb-2" style={{ fontSize: '2.5rem' }}>Résultats du Quiz</h2>
            {result.quizTitle && (
              <p className="text-secondary mb-5 fs-5">{result.quizTitle}</p>
            )}
            
            <div className={`display-3 fw-bold mb-2 ${getGradeColorClass(result.percentage)}`}>
              {result.score} <span className="text-muted" style={{ fontSize: '2rem' }}>/ {result.total}</span>
            </div>
            
            <div className="mb-5 mt-4">
              <div className="premium-progress" style={{ height: '12px' }}>
                <div className="premium-progress-bar" style={{ width: `${result.percentage}%` }}></div>
              </div>
              <p className="mt-3 text-secondary fw-medium">
                <strong className="text-gold">{result.percentage}%</strong> de réussite globale
              </p>
            </div>

            <div className="score-badge success w-100 p-4 mb-5 d-flex align-items-center justify-content-center gap-3" style={{ fontSize: '1.2rem', textTransform: 'none' }}>
              <CheckCircle2 size={24} />
              {getGradeMessage(result.percentage)}
            </div>

            <div className="d-flex flex-column gap-3">
              <button 
                className="btn-premium w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                onClick={() => navigate('/student')}
              >
                <ArrowLeft size={20} /> Retour au Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Results;