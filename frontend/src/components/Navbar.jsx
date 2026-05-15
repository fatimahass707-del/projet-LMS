import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, User, LayoutDashboard, GraduationCap, 
  BookOpen, Sun, Moon, ShieldCheck 
} from 'lucide-react';

function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    navigate('/login');
  };

  return (
    <nav className="navbar-premium">
      <div className="container d-flex justify-content-between align-items-center">
        <Link className="navbar-brand text-gold fw-bold fs-3 mb-0 d-flex align-items-center gap-2" to="/" style={{ textDecoration: 'none' }}>
          <ShieldCheck size={32} />
          <span style={{ fontFamily: "'Playfair Display', serif" }}>ProLMS</span>
        </Link>
        
        <div className="d-flex align-items-center gap-2 gap-md-4">
          <div className="navbar-nav d-flex flex-row align-items-center gap-1 gap-md-3">
            {role === 'admin' && (
              <Link className="nav-link d-flex align-items-center gap-2" to="/admin">
                <LayoutDashboard size={18} /> <span className="d-none d-md-inline">Admin</span>
              </Link>
            )}
            {(role === 'teacher' || role === 'admin') && (
              <Link className="nav-link d-flex align-items-center gap-2" to="/teacher">
                <GraduationCap size={18} /> <span className="d-none d-md-inline">Enseignant</span>
              </Link>
            )}
            {(role === 'student' || role === 'admin') && (
              <Link className="nav-link d-flex align-items-center gap-2" to="/student">
                <BookOpen size={18} /> <span className="d-none d-md-inline">Apprendre</span>
              </Link>
            )}
            <Link className="nav-link d-flex align-items-center gap-2" to="/profile">
              <User size={18} /> <span className="d-none d-md-inline">Profil</span>
            </Link>
          </div>

          <div className="d-flex align-items-center gap-3 ms-2 border-start ps-4 border-white border-opacity-10">
            <button onClick={toggleTheme} className="btn btn-link text-decoration-none p-0" style={{ color: 'var(--text-secondary)' }}>
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <div className="text-end d-none d-lg-block">
              <div className="fw-bold small text-primary-light">{name}</div>
              <div className="text-muted" style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>{role}</div>
            </div>
            <button className="btn-outline-premium d-flex align-items-center gap-2 py-2 px-3" onClick={handleLogout}>
              <LogOut size={16} /> <span>Quitter</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

