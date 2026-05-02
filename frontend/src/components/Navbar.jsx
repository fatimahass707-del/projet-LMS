import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('name');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container">
        <Link className="navbar-brand" to="/">LMS Platform</Link>

        <div className="navbar-nav ms-auto d-flex align-items-center gap-3">
          {role === 'teacher' && (
            <Link className="nav-link text-white" to="/teacher">
              Dashboard Enseignant
            </Link>
          )}
          {role === 'student' && (
            <Link className="nav-link text-white" to="/student">
              Mes Cours
            </Link>
          )}

          <span className="text-white-50" style={{ fontSize: '14px' }}>
            {name} ({role})
          </span>

          <button
            className="btn btn-outline-light btn-sm"
            onClick={handleLogout}
          >
            Déconnexion
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
