import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse, createChapter } from '../services/api';
import Navbar from '../components/Navbar';

function CourseCreator() {
  const navigate = useNavigate();

  // État du cours
  const [courseData, setCourseData] = useState({ title: '', description: '' });

  // État des chapitres
  const [chapters, setChapters] = useState([{ title: '', order_num: 1 }]);

  // États généraux
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = cours, 2 = chapitres

  // ---- Gestion cours ----
  const handleCourseChange = (e) => {
    setCourseData({ ...courseData, [e.target.name]: e.target.value });
  };

  // ---- Gestion chapitres ----
  const handleChapterChange = (index, e) => {
    const updated = [...chapters];
    updated[index][e.target.name] = e.target.value;
    setChapters(updated);
  };

  const addChapter = () => {
    setChapters([...chapters, { title: '', order_num: chapters.length + 1 }]);
  };

  const removeChapter = (index) => {
    const updated = chapters.filter((_, i) => i !== index);
    setChapters(updated);
  };

  // ---- Étape 1 : Créer le cours ----
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!courseData.title.trim()) {
      return setError('Le titre du cours est obligatoire');
    }

    setStep(2); // passer à l'étape chapitres
  };

  // ---- Étape 2 : Créer les chapitres ----
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Créer le cours
      const courseResult = await createCourse(courseData);
      if (!courseResult.courseId) {
        return setError(courseResult.message || 'Erreur lors de la création du cours');
      }

      const courseId = courseResult.courseId;

      // 2. Créer les chapitres un par un
      for (let i = 0; i < chapters.length; i++) {
        if (chapters[i].title.trim()) {
          await createChapter({
            course_id: courseId,
            title: chapters[i].title,
            order_num: i + 1
          });
        }
      }

      // 3. Rediriger vers le dashboard
      navigate('/teacher');

    } catch (err) {
      setError('Erreur serveur. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <Navbar />

      <div className="main-content">
        <div className="container" style={{ maxWidth: '700px' }}>

          {/* En-tête */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => step === 2 ? setStep(1) : navigate('/teacher')}
            >
              ← Retour
            </button>
            <h4 className="fw-bold mb-0">
              {step === 1 ? 'Créer un cours' : 'Ajouter des chapitres'}
            </h4>
          </div>

          {/* Indicateur d'étapes */}
          <div className="d-flex align-items-center gap-2 mb-4">
            <span className={`badge ${step >= 1 ? 'bg-primary' : 'bg-secondary'}`}>
              1. Informations du cours
            </span>
            <span style={{ color: '#ccc' }}>→</span>
            <span className={`badge ${step >= 2 ? 'bg-primary' : 'bg-secondary'}`}>
              2. Chapitres
            </span>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="alert alert-danger py-2">{error}</div>
          )}

          {/* ---- ÉTAPE 1 : Cours ---- */}
          {step === 1 && (
            <div className="course-card">
              <form onSubmit={handleCourseSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-medium">Titre du cours *</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder="Ex: Introduction au JavaScript"
                    value={courseData.title}
                    onChange={handleCourseChange}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-medium">Description</label>
                  <textarea
                    name="description"
                    className="form-control"
                    rows="4"
                    placeholder="Décrivez le contenu de votre cours..."
                    value={courseData.description}
                    onChange={handleCourseChange}
                  />
                </div>

                <button type="submit" className="btn btn-primary w-100">
                  Suivant → Ajouter des chapitres
                </button>
              </form>
            </div>
          )}

          {/* ---- ÉTAPE 2 : Chapitres ---- */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit}>

              {chapters.map((chapter, index) => (
                <div className="course-card mb-3" key={index}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-medium">Chapitre {index + 1}</span>
                    {chapters.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => removeChapter(index)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    name="title"
                    className="form-control"
                    placeholder="Titre du chapitre"
                    value={chapter.title}
                    onChange={(e) => handleChapterChange(index, e)}
                  />
                </div>
              ))}

              {/* Ajouter un chapitre */}
              <button
                type="button"
                className="btn btn-outline-primary w-100 mb-3"
                onClick={addChapter}
              >
                + Ajouter un chapitre
              </button>

              {/* Soumettre */}
              <button
                type="submit"
                className="btn btn-success w-100"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Création en cours...
                  </>
                ) : (
                  '✓ Créer le cours'
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default CourseCreator;