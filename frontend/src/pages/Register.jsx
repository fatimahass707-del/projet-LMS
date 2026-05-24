import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api';
import { ShieldCheck, User, Mail, Lock, UserPlus, Loader2 } from 'lucide-react';

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

    const result = await register(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      navigate('/login', { state: { message: 'Compte créé avec succès ! Connectez-vous maintenant.' } });
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="form-card animate-fade-up">
        
        <div className="text-center mb-4">
          <div className="auth-logo-container">
            <img src="/logo_lms.png" alt="LMS Logo" className="auth-logo-img" />
          </div>
          <h2 className="auth-title">LMS</h2>
          <p className="auth-subtitle">Créez votre profil professionnel</p>
        </div>

        {error && (
          <div className="alert alert-danger bg-opacity-10 border-danger text-danger mb-4 text-center py-2">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="text-secondary small fw-bold mb-2 d-flex align-items-center gap-2">
              <User size={14} /> NOM COMPLET
            </label>
            <input
              type="text"
              name="name"
              className="form-control-premium"
              placeholder="Votre nom"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
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

          <div className="mb-3">
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

          <div className="mb-5">
            <label className="text-secondary small fw-bold mb-2 d-flex align-items-center gap-2">
              <UserPlus size={14} /> JE SUIS UN(E)
            </label>
            <select
              name="role"
              className="form-control-premium"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">Étudiant</option>
              <option value="teacher">Enseignant</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn-premium w-100 py-3 d-flex align-items-center justify-content-center gap-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Création...
              </>
            ) : (
              <>
                <UserPlus size={20} />
                S'inscrire
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-5">
          <p className="text-secondary small mb-0">
            Déjà inscrit ?{' '}
            <Link to="/login" className="text-gold fw-bold text-decoration-none">
              Se connecter
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;