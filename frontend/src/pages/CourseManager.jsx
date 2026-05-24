import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getCourseById, getChaptersByCourse, getResourcesByChapter, createChapter, deleteChapter,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
  uploadResource, deleteResource,
  createQuiz, deleteQuiz, getCourseStudents, getQuizzesByCourse
} from '../services/api';
import { 
  Settings, Layers, Files, Megaphone, HelpCircle, 
  Users, ArrowLeft, Plus, Trash2, Save, 
  Loader2, Sparkles, FileText, Video, 
  Link as LinkIcon, Trash, ChevronRight, X, RefreshCw
} from 'lucide-react';

function CourseManager() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [resources, setResources] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('chapitres');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Quiz Modal State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    questions: [{ question_text: '', options: [{ text: '', is_correct: true }, { text: '', is_correct: false }] }]
  });

  useEffect(() => { loadData(); }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [c, ch, ann, qz] = await Promise.all([
        getCourseById(id), 
        getChaptersByCourse(id), 
        getAnnouncements(id),
        getQuizzesByCourse(id)
      ]);
      
      if (c.error) setError(c.error); else setCourse(c);
      
      if (ch.error) setError(ch.error); else {
        setChapters(ch);
        const resMap = {};
        for (const chap of ch) {
          const r = await getResourcesByChapter(chap.id);
          resMap[chap.id] = r.error ? [] : r;
        }
        setResources(resMap);
      }
      
      if (ann.error) setError(ann.error); else setAnnouncements(ann);
      if (qz.error) setError(qz.error); else setQuizzes(qz);
      
      if (activeTab === 'students') loadStudents();
    } catch (err) { setError('Erreur de chargement des données.'); }
    finally { setLoading(false); }
  };

  const loadStudents = async () => {
    setIsRefreshing(true);
    const data = await getCourseStudents(id);
    if (!data.error) setStudents(data);
    setIsRefreshing(false);
  };

  useEffect(() => { if(activeTab === 'students') loadStudents(); }, [activeTab]);

  const handleDelete = async (type, itemId) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    let res;
    if (type === 'chapter') res = await deleteChapter(itemId);
    if (type === 'resource') res = await deleteResource(itemId);
    if (type === 'announcement') res = await deleteAnnouncement(itemId);
    if (type === 'quiz') res = await deleteQuiz(itemId);
    
    if (res?.error) setError(res.error);
    else { setSuccess('Élément supprimé avec succès'); loadData(); }
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    const res = await createQuiz({ course_id: id, ...newQuiz });
    if (res.error) setError(res.error);
    else {
      setSuccess('Quiz créé avec succès');
      setShowQuizModal(false);
      setNewQuiz({ title: '', questions: [{ question_text: '', options: [{ text: '', is_correct: true }, { text: '', is_correct: false }] }] });
      loadData();
    }
  };

  const getResourceIcon = (type) => {
    switch(type) {
      case 'pdf': return <FileText size={18} className="text-danger" />;
      case 'video': return <Video size={18} className="text-info" />;
      case 'link': return <LinkIcon size={18} className="text-warning" />;
      default: return <Files size={18} className="text-secondary" />;
    }
  };

  if (loading && !course) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="animate-fade-up">
      <div className="d-flex align-items-center justify-content-between mb-5">
        <div className="d-flex align-items-center gap-4">
          <button 
            className="btn-outline-premium p-0" 
            style={{ width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
            onClick={() => navigate('/teacher')}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Settings size={18} className="text-primary" />
              <span className="text-primary fw-bold small text-uppercase">Gestion du cours</span>
            </div>
            <h1 className="fw-bold mb-0 text-primary">{course?.title}</h1>
          </div>
        </div>
        <div className="d-none d-md-flex align-items-center gap-2 score-badge info">
          <Users size={16} />
          <span>{students.length} Étudiants</span>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4">{error}</div>}
      {success && <div className="alert alert-success mb-4">{success}</div>}

      {/* Tabs Menu */}
      <div className="d-flex gap-2 mb-5 border-bottom pb-2 overflow-auto" style={{ borderColor: 'var(--border-color)' }}>
        {[
          { id: 'chapitres', label: 'Chapitres', icon: <Layers size={18} /> },
          { id: 'ressources', label: 'Ressources', icon: <Files size={18} /> },
          { id: 'annonces', label: 'Annonces', icon: <Megaphone size={18} /> },
          { id: 'quizzes', label: 'Examens', icon: <HelpCircle size={18} /> },
          { id: 'students', label: 'Suivi Élèves', icon: <Users size={18} /> }
        ].map(t => (
          <button 
            key={t.id} 
            className={`tab-btn-modern d-flex align-items-center gap-2 ${activeTab === t.id ? 'active' : ''}`} 
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="animate-fade-up">
        {activeTab === 'chapitres' && (
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="glass-card p-4">
                <h5 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                  <Plus size={20} /> Nouveau Chapitre
                </h5>
                <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  const res = await createChapter({course_id:id, title:e.target.title.value}); 
                  if(!res.error) { e.target.reset(); loadData(); } 
                }}>
                  <div className="mb-4">
                    <label className="text-secondary small fw-bold mb-2">TITRE DU CHAPITRE</label>
                    <input name="title" className="form-control-premium" placeholder="Ex: Introduction au React" required />
                  </div>
                  <button className="btn-premium w-100">Ajouter au cursus</button>
                </form>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="d-flex flex-column gap-3">
                {chapters.map((ch, i) => (
                  <div key={ch.id} className="glass-card p-4 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{i+1}</div>
                      <div className="fw-bold fs-5 color-primary">{ch.title}</div>
                    </div>
                    <button className="btn btn-link text-danger p-0" onClick={() => handleDelete('chapter', ch.id)}>
                      <Trash size={18} />
                    </button>
                  </div>
                ))}
                {chapters.length === 0 && (
                  <div className="text-center py-5 glass-card">
                    <Layers size={48} className="text-muted mb-3 opacity-50 mx-auto" />
                    <p className="text-secondary">Aucun chapitre défini pour ce cours.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ressources' && (
          <div>
            <div className="glass-card p-5 mb-5">
              <div className="d-flex align-items-center gap-2 mb-4">
                <Sparkles className="text-primary" size={24} />
                <h5 className="fw-bold mb-0">Publier une nouvelle ressource</h5>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.target);
                f.append('course_id', id);
                const res = await uploadResource(f);
                if(!res.error) { e.target.reset(); loadData(); } else setError(res.error);
              }}>
                <div className="row g-4 mb-4">
                  <div className="col-md-4">
                    <label className="text-secondary small fw-bold mb-2">CHAPITRE CIBLE</label>
                    <select name="chapter_id" className="form-select-premium" required>
                      <option value="">Sélectionner...</option>
                      {chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.title}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="text-secondary small fw-bold mb-2">TITRE DE LA RESSOURCE</label>
                    <input name="title" className="form-control-premium" placeholder="Ex: Documentation PDF" required />
                  </div>
                  <div className="col-md-4">
                    <label className="text-secondary small fw-bold mb-2">TYPE DE MÉDIA</label>
                    <select name="type" className="form-select-premium">
                      <option value="pdf">PDF</option>
                      <option value="video">Vidéo</option>
                      <option value="link">Lien externe</option>
                      <option value="document">Autre Document</option>
                    </select>
                  </div>
                  <div className="col-md-12">
                    <div className="p-4 border rounded-3 text-center" style={{ borderColor: 'var(--border-color)', borderStyle: 'dashed' }}>
                      <input type="file" name="file" className="form-control-premium mb-3" />
                      <div className="text-muted small fw-bold mb-2">OU LIEN DIRECT</div>
                      <input name="url" className="form-control-premium" placeholder="https://..." />
                    </div>
                  </div>
                </div>
                <button className="btn-premium px-5">Ajouter la ressource</button>
              </form>
            </div>

            <div className="row g-4">
              {chapters.map(ch => (
                <div key={ch.id} className="col-md-12 mb-4">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <ChevronRight size={18} className="text-primary" />
                    <h5 className="fw-bold mb-0 text-primary">{ch.title}</h5>
                  </div>
                  <div className="row g-3">
                    {resources[ch.id]?.map(r => (
                      <div key={r.id} className="col-md-4">
                        <div className="glass-card p-3 d-flex justify-content-between align-items-center">
                          <div className="d-flex align-items-center gap-3">
                            {getResourceIcon(r.type)}
                            <span className="small fw-bold">{r.title}</span>
                          </div>
                          <button className="btn btn-link text-danger p-0" onClick={() => handleDelete('resource', r.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!resources[ch.id] || resources[ch.id].length === 0) && (
                      <div className="col-12"><p className="text-muted small ps-4">Aucune ressource pour ce chapitre.</p></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'annonces' && (
          <div className="row g-4">
            <div className="col-lg-4">
              <div className="glass-card p-4">
                <h5 className="fw-bold mb-4 text-primary d-flex align-items-center gap-2">
                  <Megaphone size={20} /> Nouvelle Annonce
                </h5>
                <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  const res = await createAnnouncement({course_id:id, title:e.target.atitle.value, content:e.target.acontent.value}); 
                  if(!res.error) { e.target.reset(); loadData(); } 
                }}>
                  <div className="mb-3">
                    <label className="text-secondary small fw-bold mb-2">TITRE</label>
                    <input name="atitle" className="form-control-premium" placeholder="Ex: Rappel examen" required />
                  </div>
                  <div className="mb-4">
                    <label className="text-secondary small fw-bold mb-2">CONTENU</label>
                    <textarea name="acontent" className="form-control-premium" rows="4" placeholder="Votre message..." required></textarea>
                  </div>
                  <button className="btn-premium w-100">Publier l'annonce</button>
                </form>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="d-flex flex-column gap-3">
                {announcements.map(a => (
                  <div key={a.id} className="glass-card p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-2">
                        <Megaphone size={18} className="text-primary" />
                        <h6 className="fw-bold mb-0">{a.title}</h6>
                      </div>
                      <button className="btn btn-link text-danger p-0" onClick={() => handleDelete('announcement', a.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <p className="text-secondary mb-3" style={{ lineHeight: '1.6' }}>{a.content}</p>
                    <div className="text-muted small">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                ))}
                {announcements.length === 0 && (
                  <div className="text-center py-5 glass-card">
                    <Megaphone size={48} className="text-muted mb-3 opacity-50 mx-auto" />
                    <p className="text-secondary">Aucune annonce publiée.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div>
            <div className="d-flex justify-content-between mb-4 align-items-center">
              <h5 className="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                <HelpCircle size={24} /> Évaluations Disponibles
              </h5>
              <button className="btn-premium d-flex align-items-center gap-2" onClick={() => setShowQuizModal(true)}>
                <Plus size={20} /> Créer un Examen
              </button>
            </div>
            <div className="row g-4">
              {quizzes.map(q => (
                <div key={q.id} className="col-md-6">
                  <div className="glass-card p-4 d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                      <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(79, 70, 229, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <HelpCircle className="text-primary" size={24} />
                      </div>
                      <div>
                        <h6 className="fw-bold mb-1">{q.title}</h6>
                        <span className="text-muted small text-uppercase">Quiz de validation</span>
                      </div>
                    </div>
                    <button className="btn btn-link text-danger p-0" onClick={() => handleDelete('quiz', q.id)}>
                      <Trash size={20} />
                    </button>
                  </div>
                </div>
              ))}
              {quizzes.length === 0 && (
                <div className="col-12 text-center py-5 glass-card">
                  <p className="text-secondary mb-0">Aucun examen créé pour ce cours.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="glass-card p-5">
            <div className="d-flex align-items-center justify-content-between mb-5 flex-wrap gap-3">
              <div className="d-flex align-items-center gap-3">
                <Users className="text-primary" size={28} />
                <h5 className="fw-bold mb-0 fs-4">Suivi de la cohorte et Bilan des Examens</h5>
              </div>
              <button 
                className="btn btn-outline-premium btn-sm d-flex align-items-center gap-2 fw-bold px-3 py-2" 
                onClick={loadStudents}
                disabled={isRefreshing}
                title="Actualiser les scores en temps réel"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                {isRefreshing ? 'Actualisation...' : 'Actualiser les résultats'}
              </button>
            </div>
            <div className="table-responsive">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Email</th>
                    <th>Progression Globale</th>
                    <th>Moyenne Examens</th>
                    <th>Bilan Examens</th>
                    <th>Détail par Examen</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td><div className="fw-bold">{s.name}</div></td>
                      <td className="text-secondary">{s.email}</td>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="flex-grow-1" style={{ maxWidth: '100px', height: '6px', backgroundColor: 'var(--surface-light)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${s.progress}%`, backgroundColor: 'var(--secondary-color)', transition: 'width 0.5s' }}></div>
                          </div>
                          <span className="score-badge info" style={{ minWidth: '45px', justifyContent: 'center' }}>{s.progress}%</span>
                        </div>
                      </td>
                      <td>
                        <span className={`score-badge ${s.avg_quiz_score >= 50 ? 'success' : 'warning'}`}>
                          {s.avg_quiz_score != null ? s.avg_quiz_score + '%' : 'N/A'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="badge bg-success bg-opacity-10 text-success px-2 py-1 border border-success border-opacity-25 rounded-pill small">
                            {s.passedCount || 0} réussis
                          </span>
                          <span className="badge bg-danger bg-opacity-10 text-danger px-2 py-1 border border-danger border-opacity-25 rounded-pill small">
                            {s.failedCount || 0} échoués
                          </span>
                          <span className="text-muted small ms-1">/ {s.totalExams || 0} examens</span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '300px' }}>
                          {(!s.examDetails || s.examDetails.length === 0) ? (
                            <span className="text-muted small opacity-75">Aucun examen au programme</span>
                          ) : (
                            s.examDetails.map(ed => (
                              <span 
                                key={ed.id} 
                                className={`badge p-1 px-2 rounded small border ${
                                  ed.status === 'réussi' ? 'bg-success bg-opacity-25 text-success border-success' :
                                  ed.status === 'échoué' ? 'bg-danger bg-opacity-25 text-danger border-danger' :
                                  'bg-secondary bg-opacity-10 text-secondary border-secondary'
                                }`}
                                title={`${ed.title} : ${ed.status === 'réussi' ? 'Réussi (' + ed.percent + '%)' : ed.status === 'échoué' ? 'Échoué (' + ed.percent + '%)' : 'Non passé'}`}
                                style={{ fontSize: '0.75rem', cursor: 'help' }}
                              >
                                {ed.title} ({ed.status === 'réussi' ? ed.percent + '%' : ed.status === 'échoué' ? ed.percent + '%' : '—'})
                              </span>
                            ))
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr><td colSpan="6" className="text-center py-5 text-secondary">Aucun étudiant inscrit à ce cours.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Quiz Creation Modal */}
      {showQuizModal && createPortal(
        <div className="modal-backdrop-custom p-3 p-md-4">
          <div className="modal-dialog modal-lg my-0 mx-auto w-100 animate-fade-up" style={{ maxWidth: '850px' }}>
            <div className="modal-content p-0 border shadow-lg overflow-hidden d-flex flex-column rounded-4" style={{ borderColor: 'var(--border-color)', maxHeight: '90vh', backgroundColor: 'var(--surface-color)' }}>
              
              {/* Modal Header */}
              <div className="p-4 border-bottom d-flex justify-content-between align-items-center flex-shrink-0" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-light)' }}>
                <div className="d-flex align-items-center gap-2">
                  <Sparkles className="text-primary" size={20} />
                  <h4 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Conception d'Examen</h4>
                </div>
                <button className="btn btn-link p-0" style={{ color: 'var(--text-muted)' }} onClick={() => setShowQuizModal(false)}>
                  <X size={24} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="modal-body p-4 p-md-5 overflow-y-auto flex-grow-1">
                <form id="quiz-creation-form" onSubmit={handleQuizSubmit}>
                  <div className="mb-5">
                    <label className="small fw-bold mb-2 text-uppercase letter-spacing-1" style={{ color: 'var(--text-secondary)' }}>Titre de l'évaluation</label>
                    <input 
                      className="form-control-premium fs-5" 
                      placeholder="Ex: Examen Final de Session" 
                      value={newQuiz.title} 
                      onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })} 
                      required 
                    />
                  </div>

                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h6 className="fw-bold mb-0" style={{ color: 'var(--text-primary)' }}>Questions & Barème</h6>
                      <button type="button" className="btn btn-outline-premium btn-sm py-1 px-3 fw-bold" onClick={() => {
                        setNewQuiz({
                          ...newQuiz,
                          questions: [...newQuiz.questions, { question_text: '', options: [{ text: '', is_correct: true }, { text: '', is_correct: false }] }]
                        });
                      }}>+ Ajouter Question</button>
                    </div>

                    {newQuiz.questions.map((q, qIndex) => (
                      <div key={qIndex} className="p-4 mb-4 rounded-4 border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-color)' }}>
                        <div className="d-flex justify-content-between align-items-center mb-4">
                          <span className="score-badge info">Question {qIndex + 1}</span>
                          {newQuiz.questions.length > 1 && (
                            <button type="button" className="btn btn-link text-danger p-0" onClick={() => {
                              const updated = newQuiz.questions.filter((_, i) => i !== qIndex);
                              setNewQuiz({ ...newQuiz, questions: updated });
                            }}><Trash2 size={16} /></button>
                          )}
                        </div>
                        <input 
                          className="form-control-premium mb-4" 
                          placeholder="Énoncé de la question..." 
                          value={q.question_text} 
                          onChange={e => {
                            const updated = [...newQuiz.questions];
                            updated[qIndex].question_text = e.target.value;
                            setNewQuiz({ ...newQuiz, questions: updated });
                          }} 
                          required 
                        />
                        
                        <div className="ms-md-4">
                          <label className="small fw-bold mb-3 d-block" style={{ color: 'var(--text-secondary)' }}>OPTIONS DE RÉPONSE (Cochez la bonne)</label>
                          {q.options.map((opt, optIndex) => (
                            <div key={optIndex} className="d-flex gap-3 mb-3 align-items-center">
                              <input 
                                type="radio" 
                                name={`correct-${qIndex}`} 
                                checked={opt.is_correct} 
                                style={{ transform: 'scale(1.2)', accentColor: 'var(--primary-color)' }}
                                onChange={() => {
                                  const updated = [...newQuiz.questions];
                                  updated[qIndex].options = updated[qIndex].options.map((o, i) => ({ ...o, is_correct: i === optIndex }));
                                  setNewQuiz({ ...newQuiz, questions: updated });
                                }} 
                              />
                              <input 
                                className="form-control-premium py-2" 
                                placeholder={`Réponse ${optIndex + 1}`} 
                                value={opt.text} 
                                onChange={e => {
                                  const updated = [...newQuiz.questions];
                                  updated[qIndex].options[optIndex].text = e.target.value;
                                  setNewQuiz({ ...newQuiz, questions: updated });
                                }} 
                                required 
                              />
                              {q.options.length > 2 && (
                                <button type="button" className="btn btn-link p-0" style={{ color: 'var(--text-muted)' }} onClick={() => {
                                  const updated = [...newQuiz.questions];
                                  updated[qIndex].options = updated[qIndex].options.filter((_, i) => i !== optIndex);
                                  setNewQuiz({ ...newQuiz, questions: updated });
                                }}><X size={16} /></button>
                              )}
                            </div>
                          ))}
                          <button type="button" className="btn btn-link small p-0 mt-2 fw-bold text-decoration-none add-option-btn" onClick={() => {
                            const updatedQuestions = [...newQuiz.questions];
                            updatedQuestions[qIndex].options.push({ text: '', is_correct: false });
                            setNewQuiz({ ...newQuiz, questions: updatedQuestions });
                          }}>+ Ajouter une option de réponse</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="modal-footer p-4 border-top d-flex gap-3 flex-shrink-0 justify-content-end" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--surface-color)' }}>
                <button type="button" className="btn btn-outline-secondary py-2 px-4" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} onClick={() => setShowQuizModal(false)}>Annuler</button>
                <button type="submit" form="quiz-creation-form" className="btn-premium py-2 px-5 d-flex align-items-center justify-content-center gap-2">
                  <Save size={18} /> Valider et Publier l'Examen
                </button>
              </div>

            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default CourseManager;