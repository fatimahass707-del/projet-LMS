import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuiz, submitQuiz } from '../services/api';

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
      // Initialiser les réponses
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
    // Vérifier que toutes les questions ont une réponse
    const unanswered = Object.values(answers).some(a => a === null);
    if (unanswered) {
      if (!window.confirm('Certaines questions ne sont pas répondues. Soumettre quand même ?')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      const result = await submitQuiz(quizId, answers);
      navigate('/results', { 
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

  if (loading) return <div className="p-4">Chargement du quiz...</div>;
  if (!quiz) return <div className="p-4 text-danger">Quiz non trouvé.</div>;

  return (
    <div className="container py-4" style={{ maxWidth: '800px' }}>
      <h2 className="mb-4">📝 {quiz.title}</h2>

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        {quiz.questions?.map((question, index) => (
          <div key={question.id} className="card mb-4">
            <div className="card-header bg-light">
              <strong>Question {index + 1}</strong>
            </div>
            <div className="card-body">
              <p className="card-text">{question.question_text}</p>
              
              <div className="list-group">
                {question.options?.map(option => (
                  <label 
                    key={option.id}
                    className={`list-group-item list-group-item-action ${
                      answers[question.id] === option.id ? 'active' : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      className="me-2"
                      checked={answers[question.id] === option.id}
                      onChange={() => handleOptionSelect(question.id, option.id)}
                    />
                    {option.text}
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}

        <div className="d-flex justify-content-between">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate(-1)}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className="btn btn-success"
            disabled={submitting}
          >
            {submitting ? 'Envoi...' : 'Soumettre le quiz'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default QuizPage;