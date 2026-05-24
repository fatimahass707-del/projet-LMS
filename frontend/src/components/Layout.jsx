import React, { useState, useEffect } from 'react';
import { Home, BookOpen, Settings, Bell, Search, LogOut, Sun, Moon, PanelLeftClose, PanelLeftOpen, Menu, X, ShieldCheck, GraduationCap, PlusCircle, Compass, Megaphone } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { getNotifications } from '../services/api';
import './Layout.css';

export default function Layout({ children, userRole = 'student' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [collapsed, setCollapsed] = useState(localStorage.getItem('sidebar_collapsed') === 'true');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed);
  }, [collapsed]);

  useEffect(() => {
    const fetchNotifs = async () => {
      const res = await getNotifications();
      if (!res.error && Array.isArray(res)) {
        setNotifications(res);
        setUnreadCount(res.length);
      }
    };
    fetchNotifs();
  }, [location.pathname]); // Rafraîchir lors de la navigation

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : { prenom: localStorage.getItem('name') || 'Utilisateur', nom: '' };
    } catch {
      return { prenom: localStorage.getItem('name') || 'Utilisateur', nom: '' };
    }
  };

  const user = getUserData();
  const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase() || 'U';

  const navLinks = [
    { 
      path: '/admin', 
      icon: <ShieldCheck size={20} />, 
      label: 'Administration',
      roles: ['admin']
    },
    { 
      path: '/teacher', 
      icon: <GraduationCap size={20} />, 
      label: 'Espace Formateur',
      roles: ['teacher']
    },
    { 
      path: '/teacher/create-course', 
      icon: <PlusCircle size={20} />, 
      label: 'Créer un cours',
      roles: ['teacher']
    },
    { 
      path: '/student', 
      icon: <BookOpen size={20} />, 
      label: 'Apprentissage',
      roles: ['student']
    },
    { 
      path: '/profile', 
      icon: <Settings size={20} />, 
      label: 'Mon Profil',
      roles: ['student', 'teacher', 'admin']
    }
  ];

  return (
    <div className={`app-container ${collapsed ? 'collapsed' : ''}`}>
      {/* MOBILE BACKDROP */}
      {mobileOpen && (
        <div className="sidebar-mobile-backdrop" onClick={() => setMobileOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo d-flex justify-content-between align-items-center">
          <Link to="/" className="d-flex align-items-center gap-2 text-decoration-none">
            <div className="logo-icon shadow-sm">L</div>
            <h2 className={`brand-title m-0 ${collapsed ? 'd-none' : ''}`}>LMS</h2>
          </Link>
          <button 
            className="icon-btn d-md-none" 
            onClick={() => setMobileOpen(false)}
            title="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav my-4">
          {navLinks
            .filter(link => link.roles.includes(userRole))
            .map(link => (
            <Link 
              key={link.path}
              to={link.path} 
              className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}
              title={collapsed ? link.label : ''}
              onClick={() => setMobileOpen(false)}
            >
              {link.icon}
              <span className={collapsed ? 'd-none' : ''}>{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="nav-item d-none d-md-flex w-100 mb-2 border-0 bg-transparent text-start cursor-pointer text-muted"
            title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
            <span className={collapsed ? 'd-none' : ''}>Réduire le menu</span>
          </button>

          <button 
            onClick={handleLogout} 
            className="nav-item text-danger w-100 border-0 bg-transparent text-start cursor-pointer mt-2"
            title={collapsed ? "Déconnexion" : ""}
          >
            <LogOut size={20} />
            <span className={collapsed ? 'd-none' : ''}>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="main-wrapper">
        {/* TOPBAR */}
        <header className="topbar">
          <div className="d-flex align-items-center gap-3">
            <button 
              className="icon-btn d-md-none" 
              onClick={() => setMobileOpen(true)}
              title="Ouvrir le menu"
            >
              <Menu size={24} />
            </button>

            <div className="search-bar d-none d-sm-block">
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input type="text" placeholder="Rechercher..." className="input-modern" />
              </div>
            </div>
          </div>
          
          <div className="topbar-actions">
            <button className="icon-btn" onClick={toggleTheme} title="Basculer le thème">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {/* NOTIFICATION BELL & DROPDOWN */}
            <div style={{ position: 'relative' }}>
              <button 
                className="icon-btn" 
                onClick={() => { setShowNotifMenu(!showNotifMenu); setUnreadCount(0); }}
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-dot" style={{ width: '10px', height: '10px' }}></span>}
              </button>

              {showNotifMenu && (
                <div className="notif-dropdown shadow-lg glass-card p-3 border">
                  <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                    <h6 className="fw-bold mb-0">Centre de notifications</h6>
                    <button className="btn btn-sm text-muted p-0" onClick={() => setShowNotifMenu(false)}>
                      <X size={18} />
                    </button>
                  </div>

                  <div className="notif-list overflow-y-auto pe-1" style={{ maxHeight: '350px' }}>
                    {notifications.length === 0 ? (
                      <p className="text-muted text-center my-4 small">Aucune notification récente.</p>
                    ) : (
                      notifications.map((n, i) => (
                        <div 
                          key={`${n.type}-${n.id || i}`} 
                          className="notif-item p-2 mb-2 rounded border-bottom pb-3" 
                          style={{ borderColor: 'var(--border-color)' }}
                          onClick={() => { setShowNotifMenu(false); navigate(`/course/${n.course_id}`); }}
                        >
                          <div className="d-flex align-items-start gap-3">
                            <div className="mt-1" style={{ padding: '8px', borderRadius: '8px', background: n.type === 'announcement' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: n.type === 'announcement' ? 'var(--warning-color)' : 'var(--success-color)' }}>
                              {n.type === 'announcement' ? <Megaphone size={18} /> : <BookOpen size={18} />}
                            </div>
                            <div className="flex-grow-1 text-start" style={{ minWidth: 0 }}>
                              <div className="fw-bold small text-truncate" style={{ color: 'var(--text-primary)' }}>
                                {n.type === 'announcement' ? `Annonce : ${n.title}` : `Nouveau cours : ${n.title}`}
                              </div>
                              <div className="text-muted small">
                                {n.course_title} • <span className="text-primary">{n.author_name}</span>
                              </div>
                              <div className="text-secondary small mt-1" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.3' }}>
                                {n.content}
                              </div>
                              <div className="text-muted mt-2" style={{ fontSize: '0.75rem' }}>
                                {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="user-profile" onClick={() => navigate('/profile')}>
              <div className="avatar shadow-sm">{initials}</div>
              <span className="fw-bold d-none d-md-block small ms-1">
                {user.prenom} {user.nom}
              </span>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
