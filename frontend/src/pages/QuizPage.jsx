import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuiz, submitQuiz } from '../services/api';
import { CheckCircle2, ArrowLeft, ClipboardList, Send, Loader2, Info } from 'lucide-react';

function QuizPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const data = await getQuiz(quizId);
      setQuiz(data);
      const initialAnswers = {};
      data.questions?.forEach(q => {
        initialAnswers[q.id] = null;
      });
      setAnswers(initialAnswers);
    } catch (err) {
      console.error('Erreur chargement quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (questionId, optionId) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const handleSubmit = async () => {
    const unanswered = Object.values(answers).some(a => a === null);
    if (unanswered) {
      if (!window.confirm('Certaines questions ne sont pas répondues. Soumettre quand même ?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await submitQuiz(quizId, answers);
      navigate(`/results/${quizId}`, {
        state: {
          quizTitle: quiz?.title,
          ...result
        }
      });
    } catch (err) {
      alert('❌ Échec de la soumission.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="page-wrapper d-flex align-items-center justify-content-center">
      <div className="text-center">
        <Loader2 className="animate-spin text-gold mb-3" size={48} />
        <p className="text-secondary">Chargement du quiz...</p>
      </div>
    </div>
  );

  if (!quiz) return (
    <div className="page-wrapper d-flex align-items-center justify-content-center">
      <div className="glass-card text-center p-5 animate-fade-up">
        <Info className="text-danger mb-4" size={64} />
        <h2 className="text-danger">Quiz non trouvé</h2>
        <button className="btn-premium mt-4" onClick={() => navigate(-1)}>Retour</button>
      </div>
    </div>
  );

  if (quiz.alreadySubmitted) {
    return (
      <div className="page-wrapper d-flex align-items-center justify-content-center">
        <div className="glass-card text-center p-5 animate-fade-up" style={{ maxWidth: '600px' }}>
          <div className="mb-4 d-flex justify-content-center">
            <div className="stat-icon" style={{ width: '100px', height: '100px' }}>
              <CheckCircle2 size={48} className="text-success" />
            </div>
          </div>
          <h2 className="text-primary fw-bold mb-3">Quiz déjà complété</h2>
          <p className="text-secondary mb-4 fs-5">
            Vous avez déjà validé vos réponses pour ce quiz professionnel.
            <br />
            <span className="text-muted small">Score précédent :</span>
            <br />
            <strong className="display-6 text-primary">{quiz.previousScore?.score} / {quiz.previousScore?.total}</strong>
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <button className="btn-outline-premium" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} /> Retour
            </button>
            <button className="btn-premium" onClick={() => navigate(`/results/${quizId}`, { state: { quizTitle: quiz.title, score: quiz.previousScore?.score, total: quiz.previousScore?.total } })}>
              Voir les détails
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="main-content">
        <div className="container py-5" style={{ maxWidth: '850px' }}>
          <div className="d-flex align-items-center justify-content-between mb-5 animate-fade-up">
            <div className="d-flex align-items-center gap-3">
              <ClipboardList className="text-primary" size={32} />
              <h2 className="text-primary fw-bold mb-0" style={{ fontSize: '2.5rem' }}>{quiz.title}</h2>
            </div>
            <button className="btn-outline-premium d-flex align-items-center gap-2" onClick={() => navigate(-1)}>
              <ArrowLeft size={18} /> Abandonner
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="animate-fade-up">
            {quiz.questions?.map((question, index) => (
              <div key={question.id} className="glass-card mb-5 p-5 animate-fade-up border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                <div className="mb-4 d-flex align-items-start gap-4">
                  <div className="stat-icon fw-bold shadow-sm d-flex align-items-center justify-content-center rounded-circle" style={{ width: '45px', height: '45px', flexShrink: 0, fontSize: '1.2rem', background: 'var(--primary-color)', color: '#ffffff' }}>
                    {index + 1}
                  </div>
                  <h4 className="fw-bold m-0 mt-2 flex-grow-1" style={{ color: 'var(--text-primary)', lineHeight: 1.4 }}>{question.question_text}</h4>
                </div>
                
                <div className="options-container ps-md-5 pt-2">
                  {question.options?.map((option, optIndex) => {
                    const isSelected = answers[question.id] === option.id;
                    const letter = String.fromCharCode(65 + optIndex);
                    return (
                      <label
                        key={option.id}
                        className={`quiz-option ${isSelected ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          className="d-none"
                          checked={isSelected}
                          onChange={() => handleOptionSelect(question.id, option.id)}
                        />
                        <div className="quiz-option-letter">{letter}</div>
                        <div className="flex-grow-1">{option.text}</div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="d-flex justify-content-end gap-3 mt-5 pt-4 border-top border-white border-opacity-10">
              <button
                type="button"
                className="btn-outline-premium"
                onClick={() => navigate(-1)}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn-premium px-5 d-flex align-items-center gap-2"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> Envoi...
                  </>
                ) : (
                  <>
                    <Send size={20} /> Soumettre mes réponses
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default QuizPage;