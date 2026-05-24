import { useState, useEffect } from 'react';
import { getProfile, updateProfile, updatePassword } from '../services/api';
import { User, Lock, Save, Key, Loader2 } from 'lucide-react';

function Profile() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const res = await getProfile();
    if (res.error) setError(res.error);
    else setProfile({ name: res.name || res.prenom || '', email: res.email || '' });
    setLoading(false);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const res = await updateProfile(profile);
    if (res.error) setError(res.error);
    else {
      setSuccess('Profil mis à jour avec succès');
      localStorage.setItem('name', profile.name);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setError('Les mots de passe ne correspondent pas');
    }
    const res = await updatePassword(passwords);
    if (res.error) setError(res.error);
    else {
      setSuccess('Mot de passe mis à jour avec succès');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="animate-fade-up" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div className="mb-5 text-center">
        <h1 className="fw-bold text-primary mb-2">Mon Profil</h1>
        <p className="text-secondary fs-5">Gérez vos informations personnelles et sécurisez votre compte.</p>
      </div>

      {error && <div className="alert alert-danger mb-4 text-center">{error}</div>}
      {success && <div className="alert alert-success mb-4 text-center">{success}</div>}

      <div className="row g-4">
        <div className="col-md-6">
          <div className="glass-card h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <User className="text-primary" size={24} />
              <h4 className="fw-bold mb-0">Informations</h4>
            </div>
            <form onSubmit={handleProfileUpdate}>
              <div className="mb-4">
                <label className="text-secondary small fw-bold mb-2">NOM COMPLET</label>
                <input type="text" className="form-control-premium" value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} required />
              </div>
              <div className="mb-5">
                <label className="text-secondary small fw-bold mb-2">ADRESSE EMAIL</label>
                <input type="email" className="form-control-premium" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} required />
              </div>
              <button type="submit" className="btn-premium w-100 d-flex align-items-center justify-content-center gap-2">
                <Save size={18} /> Enregistrer
              </button>
            </form>
          </div>
        </div>

        <div className="col-md-6">
          <div className="glass-card h-100 p-4">
            <div className="d-flex align-items-center gap-3 mb-4">
              <Key className="text-primary" size={24} />
              <h4 className="fw-bold mb-0">Sécurité</h4>
            </div>
            <form onSubmit={handlePasswordUpdate}>
              <div className="mb-3">
                <label className="text-secondary small fw-bold mb-2">MOT DE PASSE ACTUEL</label>
                <input type="password" className="form-control-premium" value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} required />
              </div>
              <div className="mb-3">
                <label className="text-secondary small fw-bold mb-2">NOUVEAU MOT DE PASSE</label>
                <input type="password" className="form-control-premium" value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} required />
              </div>
              <div className="mb-5">
                <label className="text-secondary small fw-bold mb-2">CONFIRMATION</label>
                <input type="password" className="form-control-premium" value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} required />
              </div>
              <button type="submit" className="btn-outline-premium w-100 d-flex align-items-center justify-content-center gap-2">
                <Lock size={18} /> Mettre à jour
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
