import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { 
  getUsers, deleteUser, createUser, updateAdminUser, resetUserPassword,
  getAllCourses, deleteCourse, updateAdminCourse, createCourse,
  getAdminStats, getAdminEnrollments, adminUnenrollStudent
} from '../services/api';
import { 
  Users, BookOpen, UserPlus, 
  PieChart, Database, ShieldCheck, 
  BarChart3, Key, Trash2, Edit3, X, Save, Plus, Loader2
} from 'lucide-react';

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalCourses: 0, totalEnrollments: 0, totalTeachers: 0, avgQuizScore: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adminUser, setAdminUser] = useState(null);

  const [searchParams] = useSearchParams();
  const searchTerm = (searchParams.get('search') || '').toLowerCase();

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchTerm) || 
    u.email?.toLowerCase().includes(searchTerm) || 
    u.role?.toLowerCase().includes(searchTerm)
  );

  const filteredCourses = courses.filter(c => 
    c.title?.toLowerCase().includes(searchTerm) || 
    c.teacher_name?.toLowerCase().includes(searchTerm)
  );

  const filteredEnrollments = enrollments.filter(e => 
    e.student_name?.toLowerCase().includes(searchTerm) || 
    e.course_title?.toLowerCase().includes(searchTerm)
  );

  // Modals state
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'student' });

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({ title: '', description: '', teacher_id: '', is_published: true });

  const [showPassModal, setShowPassModal] = useState(false);
  const [passTargetId, setPassTargetId] = useState(null);
  const [newPass, setNewPass] = useState('');

  useEffect(() => { 
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setAdminUser(storedUser);
    loadData(); 
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, s, c, e] = await Promise.all([getUsers(), getAdminStats(), getAllCourses(), getAdminEnrollments()]);
      setUsers(u || []); setStats(s || {}); setCourses(c || []); setEnrollments(e || []);
    } catch (err) { setError('Erreur de chargement des données.'); }
    finally { setLoading(false); }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const res = editingUser ? await updateAdminUser(editingUser.id, userForm) : await createUser(userForm);
    if (res.error) setError(res.error); else { 
      setSuccess('Utilisateur mis à jour avec succès'); 
      setShowUserModal(false); 
      loadData(); 
    }
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    const res = editingCourse 
      ? await updateAdminCourse(editingCourse.id, courseForm) 
      : await createCourse(courseForm);
      
    if (res.error) setError(res.error); 
    else { 
      setSuccess(editingCourse ? 'Formation mise à jour' : 'Formation créée avec succès'); 
      setShowCourseModal(false); 
      loadData(); 
    }
  };

  const handleResetPass = async (e) => {
    e.preventDefault();
    const res = await resetUserPassword(passTargetId, newPass);
    if (res.error) setError(res.error); 
    else { 
      setSuccess('Mot de passe réinitialisé'); 
      setShowPassModal(false); 
      setNewPass('');
    }
  };

  if (loading && users.length === 0) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="animate-fade-up">
      <header className="mb-5">
        <h1 className="fw-bold text-primary mb-2">
          Panneau de <span className="text-primary">Contrôle</span>
        </h1>
        <p className="text-secondary fs-5">Gestion centralisée des accès et des ressources système.</p>
      </header>

      {error && <div className="alert alert-danger mb-4 reveal">{error}</div>}
      {success && <div className="alert alert-success mb-4 reveal">{success}</div>}

      {/* Tabs Menu */}
      <div className="d-flex gap-2 mb-5 border-bottom pb-2 overflow-auto" style={{ borderColor: 'var(--border-color)' }}>
        <button 
          className={`tab-btn-modern d-flex align-items-center gap-2 ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <PieChart size={18} /> Vue d'ensemble
        </button>
        <button 
          className={`tab-btn-modern d-flex align-items-center gap-2 ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} /> Utilisateurs
        </button>
        <button 
          className={`tab-btn-modern d-flex align-items-center gap-2 ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          <BookOpen size={18} /> Formations
        </button>
        <button 
          className={`tab-btn-modern d-flex align-items-center gap-2 ${activeTab === 'enrollments' ? 'active' : ''}`}
          onClick={() => setActiveTab('enrollments')}
        >
          <UserPlus size={18} /> Inscriptions
        </button>
      </div>

      {/* Stats Section */}
      {activeTab === 'stats' && (
        <div>
          <div className="row g-4 mb-5">
            <div className="col-md-3">
              <div className="glass-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={24} /></div>
                  <span className="score-badge info">Membres</span>
                </div>
                <h2 className="fw-bold mb-1">{stats.totalUsers}</h2>
                <p className="text-secondary small mb-0">Utilisateurs inscrits</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="glass-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--info-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Database size={24} /></div>
                  <span className="score-badge info">Syllabus</span>
                </div>
                <h2 className="fw-bold mb-1">{stats.totalCourses}</h2>
                <p className="text-secondary small mb-0">Cours déployés</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="glass-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserPlus size={24} /></div>
                  <span className="score-badge warning">Flux</span>
                </div>
                <h2 className="fw-bold mb-1">{stats.totalEnrollments}</h2>
                <p className="text-secondary small mb-0">Inscriptions totales</p>
              </div>
            </div>
            <div className="col-md-3">
              <div className="glass-card p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={24} /></div>
                  <span className="score-badge success">Qualité</span>
                </div>
                <h2 className="fw-bold mb-1">{stats.avgQuizScore}%</h2>
                <p className="text-secondary small mb-0">Performance globale</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="d-flex align-items-center gap-4">
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={32} />
              </div>
              <div>
                <h4 className="fw-bold mb-2">Sécurité du Système</h4>
                <p className="text-secondary mb-0">Tous les serveurs sont opérationnels. Aucune intrusion détectée ces dernières 24h.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Section */}
      {activeTab === 'users' && (
        <div className="animate-fade-up">
          <div className="d-flex justify-content-between mb-5 align-items-center">
            <h4 className="fw-bold mb-0">Base de Données Utilisateurs</h4>
            <button className="btn-premium d-flex align-items-center gap-2" onClick={() => { setEditingUser(null); setUserForm({name:'',email:'',password:'',role:'student'}); setShowUserModal(true); }}>
              <UserPlus size={18} /> Nouvel Utilisateur
            </button>
          </div>
          <div className="glass-card p-0 overflow-hidden">
            <table className="table-modern mb-0">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th className="text-end">Opérations</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-4 text-muted">Aucun utilisateur trouvé.</td></tr>
                ) : (
                  filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td><div className="fw-bold">{u.name}</div></td>
                    <td className="text-secondary">{u.email}</td>
                    <td><span className={`score-badge ${u.role==='admin'?'danger':u.role==='teacher'?'success':'info'}`}>{u.role}</span></td>
                    <td>
                      <button 
                        className={`score-badge ${u.status==='active'?'success':'danger'} border-0 cursor-pointer`} 
                        onClick={async ()=>{await updateAdminUser(u.id,{...u, status:u.status==='active'?'blocked':'active'}); loadData();}}
                      >
                        {u.status}
                      </button>
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-sm btn-outline-primary p-1 border-0" onClick={()=>{setEditingUser(u); setUserForm({name:u.name, email:u.email, role:u.role}); setShowUserModal(true);}}>
                          <Edit3 size={16} />
                        </button>
                        <button className="btn btn-sm btn-outline-warning p-1 border-0" onClick={()=>{setPassTargetId(u.id); setShowPassModal(true);}}>
                          <Key size={16} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger p-1 border-0" onClick={async ()=>{if(window.confirm('Supprimer définitivement ?')){await deleteUser(u.id); loadData();}}} disabled={u.role==='admin'}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Courses Section */}
      {activeTab === 'courses' && (
        <div className="animate-fade-up">
          <div className="d-flex justify-content-between mb-5 align-items-center">
            <h4 className="fw-bold mb-0">Gestion du Catalogue</h4>
            <button className="btn-premium d-flex align-items-center gap-2" onClick={() => { setEditingCourse(null); setCourseForm({title:'', description:'', teacher_id:'', is_published:true}); setShowCourseModal(true); }}>
              <Plus size={18} /> Nouvelle Formation
            </button>
          </div>
          <div className="glass-card p-0 overflow-hidden">
            <table className="table-modern mb-0">
              <thead>
                <tr>
                  <th>Programme</th>
                  <th>Responsable</th>
                  <th>Visibilité</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-4 text-muted">Aucune formation trouvée.</td></tr>
                ) : (
                  filteredCourses.map(c => (
                  <tr key={c.id}>
                    <td><div className="fw-bold">{c.title}</div></td>
                    <td className="text-secondary">{c.teacher_name}</td>
                    <td>
                      <button 
                        className={`score-badge ${c.is_published?'success':'info'} border-0 cursor-pointer`} 
                        onClick={async ()=>{await updateAdminCourse(c.id,{...c, is_published:!c.is_published}); loadData();}}
                      >
                        {c.is_published?'PUBLIÉ':'MASQUÉ'}
                      </button>
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button className="btn btn-sm btn-outline-primary p-1 border-0" onClick={()=>{setEditingCourse(c); setCourseForm({title:c.title, description:c.description, teacher_id:c.teacher_id, is_published:c.is_published}); setShowCourseModal(true);}}>
                          <Edit3 size={16} />
                        </button>
                        <button className="btn btn-sm btn-outline-danger p-1 border-0" onClick={async ()=>{if(window.confirm('Supprimer ce cours ?')){await deleteCourse(c.id); loadData();}}}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enrollments Section */}
      {activeTab === 'enrollments' && (
        <div className="animate-fade-up">
          <h4 className="fw-bold mb-5">Registre des Inscriptions</h4>
          <div className="glass-card p-0 overflow-hidden">
            <table className="table-modern mb-0">
              <thead>
                <tr>
                  <th>Étudiant</th>
                  <th>Cours Ciblé</th>
                  <th className="text-end">Opération</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnrollments.length === 0 ? (
                  <tr><td colSpan="3" className="text-center py-4 text-muted">Aucune inscription trouvée.</td></tr>
                ) : (
                  filteredEnrollments.map(e => (
                  <tr key={e.id}>
                    <td className="text-secondary">{e.student_name}</td>
                    <td><div className="fw-bold">{e.course_title}</div></td>
                    <td className="text-end">
                      <button className="btn btn-outline-danger btn-sm px-3" onClick={async ()=>{if(window.confirm('Désinscrire l\'étudiant ?')){await adminUnenrollStudent(e.student_id, e.course_id); loadData();}}}>
                        Désinscrire
                      </button>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showUserModal && createPortal(
        <div className="modal-backdrop-custom p-4">
          <div className="modal-dialog modal-dialog-centered w-100 my-0 mx-auto" style={{ maxWidth: '500px' }}>
            <div className="glass-card p-5 modal-content border w-100">
              <h4 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>{editingUser ? 'Éditer l\'accès' : 'Nouvel Accès'}</h4>
              <form onSubmit={handleUserSubmit}>
                <div className="mb-4"><label className="small fw-bold text-muted mb-2 uppercase">Identité</label><input className="form-control-premium" value={userForm.name} onChange={e=>setUserForm({...userForm, name:e.target.value})} required /></div>
                <div className="mb-4"><label className="small fw-bold text-muted mb-2 uppercase">Email</label><input className="form-control-premium" type="email" value={userForm.email} onChange={e=>setUserForm({...userForm, email:e.target.value})} required /></div>
                {!editingUser && <div className="mb-4"><label className="small fw-bold text-muted mb-2 uppercase">Clé d'accès</label><input className="form-control-premium" type="password" onChange={e=>setUserForm({...userForm, password:e.target.value})} required /></div>}
                <div className="mb-5"><label className="small fw-bold text-muted mb-2 uppercase">Privilèges</label><select className="form-select-premium" value={userForm.role} onChange={e=>setUserForm({...userForm, role:e.target.value})}><option value="student">Étudiant</option><option value="teacher">Enseignant</option><option value="admin">Administrateur</option></select></div>
                <div className="d-flex gap-3"><button className="btn-premium flex-grow-1">Enregistrer</button><button className="btn btn-outline-secondary px-4" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} type="button" onClick={()=>setShowUserModal(false)}>Annuler</button></div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Course Modal */}
      {showCourseModal && createPortal(
        <div className="modal-backdrop-custom p-4">
          <div className="modal-dialog modal-dialog-centered w-100 my-0 mx-auto" style={{ maxWidth: '600px' }}>
            <div className="glass-card p-5 modal-content border w-100">
              <h4 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Configuration Programme</h4>
              <form onSubmit={handleCourseSubmit}>
                <div className="mb-4"><label className="small fw-bold text-muted mb-2 uppercase">Titre</label><input className="form-control-premium" value={courseForm.title} onChange={e=>setCourseForm({...courseForm, title:e.target.value})} required /></div>
                <div className="mb-5"><label className="small fw-bold text-muted mb-2 uppercase">Synopsis</label><textarea className="form-control-premium" rows="3" value={courseForm.description} onChange={e=>setCourseForm({...courseForm, description:e.target.value})} /></div>
                <div className="d-flex gap-3"><button className="btn-premium flex-grow-1">{editingCourse ? 'Actualiser' : 'Déployer'}</button><button className="btn btn-outline-secondary px-4" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} type="button" onClick={()=>setShowCourseModal(false)}>Fermer</button></div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Password Modal */}
      {showPassModal && createPortal(
        <div className="modal-backdrop-custom p-4">
          <div className="modal-dialog modal-dialog-centered w-100 my-0 mx-auto" style={{ maxWidth: '500px' }}>
            <div className="glass-card p-5 modal-content border w-100">
              <h4 className="fw-bold mb-4" style={{ color: 'var(--text-primary)' }}>Sécurité</h4>
              <form onSubmit={handleResetPass}>
                <div className="mb-5"><label className="small fw-bold text-muted mb-2 uppercase">Nouvelle Clé</label><input className="form-control-premium" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} required autoFocus /></div>
                <div className="d-flex gap-3"><button className="btn-premium flex-grow-1">Réinitialiser</button><button className="btn btn-outline-secondary px-4" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }} type="button" onClick={()=>{setShowPassModal(false); setNewPass('');}}>Annuler</button></div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default AdminDashboard;
