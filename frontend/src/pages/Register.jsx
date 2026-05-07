import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
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
      const result = await register(formData);

      if (result.userId) {
        // Inscription réussie → rediriger vers login
        navigate('/login');
      } else {
        setError(result.message || "Erreur lors de l'inscription");
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
          <p className="text-muted" style={{ fontSize: '0.9rem' }}>Créez votre compte</p>
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
            <label className="form-label fw-medium">Nom complet</label>
            <input
              type="text"
              name="name"
              className="form-control"
              placeholder="Votre nom"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

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

          <div className="mb-3">
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

          <div className="mb-4">
            <label className="form-label fw-medium">Je suis</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">Étudiant</option>
              <option value="teacher">Enseignant</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Inscription...
              </>
            ) : (
              "S'inscrire"
            )}
          </button>
        </form>

        {/* Lien login */}
        <p className="text-center mt-3 mb-0" style={{ fontSize: '0.9rem' }}>
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary fw-medium">
            Se connecter
          </Link>
        </p>

      </div>
    </div>
  );
}

export default Register;