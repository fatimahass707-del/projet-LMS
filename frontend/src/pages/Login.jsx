import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { login } from '../services/api';
import { ShieldCheck, Mail, Lock, LogIn, Loader2 } from 'lucide-react';

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const successMessage = location.state?.message;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      localStorage.setItem('token', result.token);
      localStorage.setItem('role', result.role);
      localStorage.setItem('name', result.name);
      localStorage.setItem('id', result.id);

      if (result.role === 'admin') {
        navigate('/admin');
      } else if (result.role === 'teacher') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="form-card animate-fade-up">
        
        <div className="text-center mb-5">
          <div className="auth-logo-container">
            <img src="/logo_lms.png" alt="LMS Logo" className="auth-logo-img" />
          </div>
          <h2 className="auth-title">LMS</h2>
          <p className="auth-subtitle">Plateforme d'apprentissage professionnelle</p>
        </div>

        {successMessage && (
          <div className="alert alert-success bg-opacity-10 border-success text-success mb-4 text-center py-2" style={{ fontSize: '0.9rem' }}>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="alert alert-danger bg-opacity-10 border-danger text-danger mb-4 text-center py-2" style={{ fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-secondary small fw-bold mb-2 d-flex align-items-center gap-2">
              <Mail size={14} /> ADRESSE EMAIL
            </label>
            <input
              type="email"
              name="email"
              className="form-control-premium"
              placeholder="votre@email.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-5">
            <label className="text-secondary small fw-bold mb-2 d-flex align-items-center gap-2">
              <Lock size={14} /> MOT DE PASSE
            </label>
            <input
              type="password"
              name="password"
              className="form-control-premium"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-premium w-100 py-3 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Vérification...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Se connecter
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-5">
          <p className="text-secondary small mb-0">
            Nouveau sur la plateforme ?{' '}
            <Link to="/register" className="text-gold fw-bold text-decoration-none">
              Créer un compte
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Login;