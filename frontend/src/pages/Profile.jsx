import { useState, useEffect } from 'react';
import { getProfile, updateProfile, updatePassword } from '../services/api';
import Navbar from '../components/Navbar';
import { User, Mail, Lock, Save, Key } from 'lucide-react';

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
    else setProfile({ name: res.name, email: res.email });
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

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="page-wrapper">
      <Navbar />
      <main className="main-content">
        <div className="container" style={{maxWidth: '900px'}}>
          <div className="section-header animate-fade-up mb-5 text-center">
            <h2 className="text-gold fw-bold mb-2" style={{ fontSize: '3rem' }}>Mon Profil</h2>
            <p className="text-secondary fs-5">Gérez vos informations personnelles et sécurisez votre compte.</p>
          </div>

          {error && <div className="alert alert-danger mb-4 animate-fade-up text-center">{error}</div>}
          {success && <div className="alert alert-success mb-4 animate-fade-up text-center">{success}</div>}

          <div className="row g-5 animate-fade-up">
            <div className="col-md-6">
              <div className="glass-card h-100 p-5">
                <div className="d-flex align-items-center gap-3 mb-5">
                  <User className="text-gold" size={24} />
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
              <div className="glass-card h-100 p-5">
                <div className="d-flex align-items-center gap-3 mb-5">
                  <Key className="text-gold" size={24} />
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
      </main>
    </div>
  );
}

export default Profile;

