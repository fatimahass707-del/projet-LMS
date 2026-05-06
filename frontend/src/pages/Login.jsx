import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData);

      if (result.token) {
        // Stocker les infos dans localStorage
        localStorage.setItem('token', result.token);
        localStorage.setItem('role', result.role);
        localStorage.setItem('name', result.name);
        localStorage.setItem('id', result.id);

        // Rediriger selon le rôle
        if (result.role === 'teacher' || result.role === 'admin') {
          navigate('/teacher');
        } else {
          navigate('/student');
        }
      } else {
        setError(result.message || 'Email ou mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur de connexion. Vérifiez votre réseau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ background: '#f4f6f9' }}>
      <div className="form-card shadow-sm">
        
        {/* Logo / Titre */}
        <div className="text-center mb-4">
          <div className="mb-2" style={{ fontSize: '2rem' }}>🎓</div>
          <h2 className="fw-bold" style={{ color: '#0d6efd' }}>LMS Platform</h2>
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Connectez-vous à votre espace</p>
        </div>

        {/* Message d'erreur */}
        {error && (
          <div className="alert alert-danger py-2" style={{ fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label fw-medium">Email</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-medium">Mot de passe</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Lien inscription */}
        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.9rem' }}>
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-primary fw-medium">
            S'inscrire
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Login;