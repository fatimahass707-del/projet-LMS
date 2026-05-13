import { useState } from 'react';
import { uploadResource } from '../services/api';

function FileUploader({ chapterId, onUploadSuccess }) {
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    type: 'document',
    url: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.url) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    setUploading(true);
    try {
      // Pour les uploads de fichiers réels, utiliser FormData
      // Ici on suppose que l'URL est déjà hébergée ou on utilise un service cloud
      await uploadResource({
        chapter_id: chapterId,
        ...formData
      });
      
      // Reset form
      setFormData({ title: '', type: 'document', url: '' });
      if (onUploadSuccess) onUploadSuccess();
      alert('✅ Ressource ajoutée !');
    } catch (err) {
      alert('❌ Échec de l\'upload.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Pour upload de fichier physique (optionnel - nécessite backend multipart)
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append('chapter_id', chapterId);
    uploadFormData.append('title', file.name);
    uploadFormData.append('type', file.type.split('/')[1] || 'document');
    uploadFormData.append('file', file);

    setUploading(true);
    try {
      // Note: adapter l'API pour accepter FormData avec multer
      const res = await fetch('http://localhost:5000/api/resources/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: uploadFormData
      });
      const data = await res.json();
      if (onUploadSuccess) onUploadSuccess();
      alert('✅ Fichier uploadé !');
    } catch (err) {
      alert('❌ Échec de l\'upload du fichier.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-3 p-3 border rounded">
      <h6 className="mb-3">➕ Ajouter une ressource</h6>
      
      <div className="mb-2">
        <label className="form-label small">Titre</label>
        <input
          type="text"
          name="title"
          className="form-control form-control-sm"
          value={formData.title}
          onChange={handleChange}
          placeholder="Ex: Introduction PDF"
          required
        />
      </div>

      <div className="mb-2">
        <label className="form-label small">Type</label>
        <select
          name="type"
          className="form-select form-select-sm"
          value={formData.type}
          onChange={handleChange}
        >
          <option value="pdf">📄 PDF</option>
          <option value="video">🎬 Vidéo</option>
          <option value="link">🔗 Lien externe</option>
          <option value="document">📁 Document</option>
        </select>
      </div>

      <div className="mb-3">
        <label className="form-label small">URL / Chemin</label>
        <input
          type="url"
          name="url"
          className="form-control form-control-sm"
          value={formData.url}
          onChange={handleChange}
          placeholder="https://..."
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label small">Ou uploader un fichier</label>
        <input
          type="file"
          className="form-control form-control-sm"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </div>

      <button 
        type="submit" 
        className="btn btn-primary btn-sm"
        disabled={uploading}
      >
        {uploading ? 'Ajout...' : 'Ajouter la ressource'}
      </button>
    </form>
  );
}

export default FileUploader;