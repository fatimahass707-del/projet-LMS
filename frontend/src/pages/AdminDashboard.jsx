import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getUsers, deleteUser, createUser, updateAdminUser, resetUserPassword,
  getAllCourses, deleteCourse, updateAdminCourse, createCourse,
  getAdminStats, getAdminEnrollments, adminUnenrollStudent
} from '../services/api';
import { 
  Shield, Users, BookOpen, UserPlus, 
  LogOut, PieChart, Database, ShieldAlert, 
  ShieldCheck, Search, Bell, Settings,
  Sparkles, BarChart3, Key, Trash2, Edit3, X, Save, Plus
} from 'lucide-react';

function AdminDashboard() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalCourses: 0, totalEnrollments: 0, totalTeachers: 0, avgQuizScore: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('stats');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [adminUser, setAdminUser] = useState(null);

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
    } catch (err) { setError('Erreur chargement.'); }
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

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading && users.length === 0) return (
    <div className="page-wrapper d-flex align-items-center justify-content-center">
      <Sparkles className="animate-pulse text-gold" size={48} />
    </div>
  );

  return (
    <div className="dashboard-container-v2">
      {/* Premium Top Navbar */}
      <nav className="dash-nav-top">
        <div className="dash-nav-container">
          <div className="d-flex align-items-center gap-4">
            <div className="nav-logo" onClick={() => navigate('/')}>
              <Shield size={28} className="text-gold" />
              <span className="logo-text">Shield <span className="text-gold">Admin</span></span>
            </div>
            
            <div className="nav-links-group">
              <button 
                className={`nav-item-v2 ${activeTab === 'stats' ? 'active' : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                <PieChart size={18} /> Vue d'ensemble
              </button>
              <button 
                className={`nav-item-v2 ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                <Users size={18} /> Utilisateurs
              </button>
              <button 
                className={`nav-item-v2 ${activeTab === 'courses' ? 'active' : ''}`}
                onClick={() => setActiveTab('courses')}
              >
                <BookOpen size={18} /> Formations
              </button>
              <button 
                className={`nav-item-v2 ${activeTab === 'enrollments' ? 'active' : ''}`}
                onClick={() => setActiveTab('enrollments')}
              >
                <UserPlus size={18} /> Inscriptions
              </button>
            </div>
          </div>

          <div className="d-flex align-items-center gap-3">
            <div className="nav-icon-btn">
              <Search size={20} />
            </div>
            
            <div className="nav-user-profile">
              <div className="user-avatar-mini" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)' }}>
                {adminUser?.name?.charAt(0)}
              </div>
              <div className="user-info-mini d-none d-md-block">
                <p className="user-name">{adminUser?.name || 'Admin'}</p>
                <p className="user-role" style={{ color: 'var(--danger-text)' }}>Root Privileges</p>
              </div>
              <button onClick={handleLogout} className="logout-btn-mini" title="Déconnexion">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="main-content-v2 animate-fade-up">
        <header className="content-header-v2 mb-5">
          <div>
            <h1 className="display-4 fw-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
              Panneau de <span className="text-gold">Contrôle</span>
            </h1>
            <p className="text-secondary fs-5">Gestion centralisée des accès et des ressources système.</p>
          </div>
        </header>

        {error && <div className="alert alert-danger mb-4 reveal">{error}</div>}
        {success && <div className="alert alert-success mb-4 reveal">{success}</div>}

        {/* Stats Section */}
        {activeTab === 'stats' && (
          <div className="tab-content-v2">
            <div className="row g-4 mb-5">
              <div className="col-md-3">
                <div className="stat-card-premium">
                  <div className="stat-card-glow"></div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="stat-icon-v2"><Users size={24} /></div>
                    <span className="stat-badge">Membres</span>
                  </div>
                  <h2 className="stat-value">{stats.totalUsers}</h2>
                  <p className="stat-label-v2">Utilisateurs inscrits</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card-premium">
                  <div className="stat-card-glow"></div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="stat-icon-v2 text-info"><Database size={24} /></div>
                    <span className="stat-badge info">Syllabus</span>
                  </div>
                  <h2 className="stat-value">{stats.totalCourses}</h2>
                  <p className="stat-label-v2">Cours déployés</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card-premium">
                  <div className="stat-card-glow"></div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="stat-icon-v2 text-warning"><UserPlus size={24} /></div>
                    <span className="stat-badge warning">Flux</span>
                  </div>
                  <h2 className="stat-value">{stats.totalEnrollments}</h2>
                  <p className="stat-label-v2">Inscriptions totales</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="stat-card-premium">
                  <div className="stat-card-glow"></div>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="stat-icon-v2 text-success"><BarChart3 size={24} /></div>
                    <span className="stat-badge success">Qualité</span>
                  </div>
                  <h2 className="stat-value">{stats.avgQuizScore}%</h2>
                  <p className="stat-label-v2">Performance globale</p>
                </div>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="d-flex align-items-center gap-4">
                <div className="stat-icon-v2" style={{ width: '64px', height: '64px' }}><ShieldCheck size={32} className="text-success" /></div>
                <div>
                  <h4 className="fw-bold text-white mb-2">Sécurité du Système</h4>
                  <p className="text-secondary mb-0">Tous les serveurs sont opérationnels. Aucune intrusion détectée ces dernières 24h.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Section */}
        {activeTab === 'users' && (
          <div className="tab-content-v2 animate-fade-up">
            <div className="d-flex justify-content-between mb-5 align-items-center">
              <h4 className="fw-bold text-white mb-0">Base de Données Utilisateurs</h4>
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
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><div className="fw-bold text-white">{u.name}</div></td>
                      <td>{u.email}</td>
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
                          <button className="nav-icon-btn small" onClick={()=>{setEditingUser(u); setUserForm({name:u.name, email:u.email, role:u.role}); setShowUserModal(true);}}>
                            <Edit3 size={16} className="text-gold" />
                          </button>
                          <button className="nav-icon-btn small" onClick={()=>{setPassTargetId(u.id); setShowPassModal(true);}}>
                            <Key size={16} className="text-warning" />
                          </button>
                          <button className="nav-icon-btn small" onClick={async ()=>{if(window.confirm('Supprimer définitivement ?')){await deleteUser(u.id); loadData();}}} disabled={u.role==='admin'}>
                            <Trash2 size={16} className="text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Courses Section */}
        {activeTab === 'courses' && (
          <div className="tab-content-v2 animate-fade-up">
            <div className="d-flex justify-content-between mb-5 align-items-center">
              <h4 className="fw-bold text-white mb-0">Gestion du Catalogue</h4>
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
                  {courses.map(c => (
                    <tr key={c.id}>
                      <td><div className="fw-bold text-white">{c.title}</div></td>
                      <td>{c.teacher_name}</td>
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
                          <button className="nav-icon-btn small" onClick={()=>{setEditingCourse(c); setCourseForm({title:c.title, description:c.description, teacher_id:c.teacher_id, is_published:c.is_published}); setShowCourseModal(true);}}>
                            <Edit3 size={16} className="text-gold" />
                          </button>
                          <button className="nav-icon-btn small" onClick={async ()=>{if(window.confirm('Supprimer ce cours ?')){await deleteCourse(c.id); loadData();}}}>
                            <Trash2 size={16} className="text-danger" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Enrollments Section */}
        {activeTab === 'enrollments' && (
          <div className="tab-content-v2 animate-fade-up">
            <h4 className="fw-bold text-white mb-5">Registre des Inscriptions</h4>
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
                  {enrollments.map(e => (
                    <tr key={e.id}>
                      <td>{e.student_name}</td>
                      <td><div className="fw-bold text-white">{e.course_title}</div></td>
                      <td className="text-end">
                        <button className="btn btn-outline-danger btn-sm px-3" onClick={async ()=>{if(window.confirm('Désinscrire l\'étudiant ?')){await adminUnenrollStudent(e.student_id, e.course_id); loadData();}}}>
                          Désinscrire
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals - Simplified for the new layout */}
      {showUserModal && (
        <div className="modal d-block" style={{background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', zIndex: 3000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="glass-card p-5 modal-content border-0">
              <h4 className="fw-bold mb-4 text-gold">{editingUser ? 'Éditer l\'accès' : 'Nouvel Accès'}</h4>
              <form onSubmit={handleUserSubmit}>
                <div className="mb-4"><label className="small fw-bold text-muted mb-2 uppercase">Identité</label><input className="form-control-premium" value={userForm.name} onChange={e=>setUserForm({...userForm, name:e.target.value})} required /></div>
                <div className="mb-4"><label className="small fw-bold text-muted mb-2 uppercase">Email</label><input className="form-control-premium" type="email" value={userForm.email} onChange={e=>setUserForm({...userForm, email:e.target.value})} required /></div>
                {!editingUser && <div className="mb-4"><label className="small fw-bold text-muted mb-2 uppercase">Clé d'accès</label><input className="form-control-premium" type="password" onChange={e=>setUserForm({...userForm, password:e.target.value})} required /></div>}
                <div className="mb-5"><label className="small fw-bold text-muted mb-2 uppercase">Privilèges</label><select className="form-control-premium" value={userForm.role} onChange={e=>setUserForm({...userForm, role:e.target.value})}><option value="student">Étudiant</option><option value="teacher">Enseignant</option><option value="admin">Administrateur</option></select></div>
                <div className="d-flex gap-3"><button className="btn-premium w-100">Enregistrer</button><button className="btn btn-outline-secondary w-100" type="button" onClick={()=>setShowUserModal(false)}>Annuler</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="modal d-block" style={{background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', zIndex: 3000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="glass-card p-5 modal-content border-0">
              <h4 className="fw-bold mb-4 text-gold">Configuration Programme</h4>
              <form onSubmit={handleCourseSubmit}>
                <div className="mb-4"><label className="small fw-bold text-muted mb-2 uppercase">Titre</label><input className="form-control-premium" value={courseForm.title} onChange={e=>setCourseForm({...courseForm, title:e.target.value})} required /></div>
                <div className="mb-4"><label className="small fw-bold text-muted mb-2 uppercase">Synopsis</label><textarea className="form-control-premium" rows="3" value={courseForm.description} onChange={e=>setCourseForm({...courseForm, description:e.target.value})} /></div>
                <div className="d-flex gap-3"><button className="btn-premium w-100">{editingCourse ? 'Actualiser' : 'Déployer'}</button><button className="btn btn-outline-secondary w-100" type="button" onClick={()=>setShowCourseModal(false)}>Fermer</button></div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPassModal && (
        <div className="modal d-block" style={{background:'rgba(0,0,0,0.85)', backdropFilter:'blur(10px)', zIndex: 3000 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="glass-card p-5 modal-content border-0">
              <h4 className="fw-bold mb-4 text-gold">Sécurité</h4>
              <form onSubmit={handleResetPass}>
                <div className="mb-5"><label className="small fw-bold text-muted mb-2 uppercase">Nouvelle Clé</label><input className="form-control-premium" type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} required autoFocus /></div>
                <div className="d-flex gap-3"><button className="btn-premium w-100">Réinitialiser</button><button className="btn btn-outline-secondary w-100" type="button" onClick={()=>{setShowPassModal(false); setNewPass('');}}>Annuler</button></div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
