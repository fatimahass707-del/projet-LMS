import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCourse, createChapter } from '../services/api';

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
    <div className="animate-fade-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* En-tête */}
      <div className="d-flex align-items-center gap-3 mb-5">
        <button
          className="btn-outline-premium btn-sm"
          style={{ padding: '0.4rem 0.8rem' }}
          onClick={() => step === 2 ? setStep(1) : navigate('/teacher')}
        >
          ← Retour
        </button>
        <h2 className="fw-bold mb-0">
          {step === 1 ? 'Créer un nouveau cours ✨' : 'Ajouter des chapitres 📚'}
        </h2>
      </div>

      {/* Indicateur d'étapes */}
      <div className="d-flex align-items-center gap-3 mb-5">
        <div className={`d-flex align-items-center gap-2 ${step >= 1 ? 'text-primary fw-bold' : 'text-muted'}`}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= 1 ? 'var(--primary-color)' : 'var(--surface-light)', color: step >= 1 ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
          <span>Informations du cours</span>
        </div>
        <div style={{ flex: 1, height: '2px', background: step >= 2 ? 'var(--primary-color)' : 'var(--border-color)' }}></div>
        <div className={`d-flex align-items-center gap-2 ${step >= 2 ? 'text-primary fw-bold' : 'text-muted'}`}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: step >= 2 ? 'var(--primary-color)' : 'var(--surface-light)', color: step >= 2 ? 'white' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
          <span>Chapitres</span>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="alert alert-danger py-2">{error}</div>
      )}

      {/* ---- ÉTAPE 1 : Cours ---- */}
      {step === 1 && (
        <div className="glass-card animate-slide-up" style={{ padding: '2.5rem' }}>
          <form onSubmit={handleCourseSubmit}>
            <div className="mb-4">
              <label className="text-secondary small fw-bold mb-2">TITRE DU COURS *</label>
              <input
                type="text"
                name="title"
                className="form-control-premium"
                placeholder="Ex: Introduction au JavaScript"
                value={courseData.title}
                onChange={handleCourseChange}
                required
              />
            </div>

            <div className="mb-5">
              <label className="text-secondary small fw-bold mb-2">DESCRIPTION</label>
              <textarea
                name="description"
                className="form-control-premium"
                rows="5"
                placeholder="Décrivez le contenu de votre cours en quelques phrases..."
                value={courseData.description}
                onChange={handleCourseChange}
              />
            </div>

            <button type="submit" className="btn-premium w-100">
              Suivant → Ajouter des chapitres
            </button>
          </form>
        </div>
      )}

      {/* ---- ÉTAPE 2 : Chapitres ---- */}
      {step === 2 && (
        <form onSubmit={handleFinalSubmit} className="animate-slide-up">
          <div className="d-flex flex-column gap-3 mb-4">
            {chapters.map((chapter, index) => (
              <div className="glass-card p-4 d-flex flex-column gap-3" key={index}>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>
                      {index + 1}
                    </div>
                    <span className="fw-bold text-primary">Chapitre {index + 1}</span>
                  </div>
                  {chapters.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeChapter(index)}
                      style={{ borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  name="title"
                  className="form-control-premium"
                  placeholder="Titre du chapitre"
                  value={chapter.title}
                  onChange={(e) => handleChapterChange(index, e)}
                />
              </div>
            ))}
          </div>

          {/* Ajouter un chapitre */}
          <button
            type="button"
            className="btn-outline-premium w-100 mb-4"
            style={{ borderStyle: 'dashed' }}
            onClick={addChapter}
          >
            + Ajouter un chapitre
          </button>

          {/* Soumettre */}
          <button
            type="submit"
            className="btn-premium w-100"
            style={{ background: 'var(--success-color)' }}
            disabled={loading}
          >
            {loading ? 'Création en cours...' : '✓ Terminer et créer le cours'}
          </button>
        </form>
      )}
    </div>
  );
}

export default CourseCreator;