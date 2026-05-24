import React from 'react';
import { PlayCircle, Plus, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CourseCard.css';

export default function CourseCard({ id, title, instructor, progress, category, imageUrl, isCatalog, isEnrolled, onEnroll }) {
  const navigate = useNavigate();

  return (
    <div className="course-card">
      <div className="card-image-wrapper">
        <img 
          src={imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80'} 
          alt={title} 
          className="card-image" 
        />
        {category && <span className="badge category-badge">{category}</span>}
      </div>
      
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-instructor">Par {instructor || 'Formateur'}</p>
        
        {!isCatalog && (
          <div className="progress-section">
            <div className="progress-header">
              <span className="progress-text">Progression</span>
              <span className="progress-percent">{progress || 0}%</span>
            </div>
            <div className="progress-track">
              <div 
                className="progress-fill" 
                style={{ width: `${progress || 0}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {isCatalog ? (
          isEnrolled ? (
            <button 
              className="btn btn-outline-premium w-100 py-2 d-flex align-items-center justify-content-center gap-2 fw-bold mt-3" 
              onClick={() => navigate(`/course/${id}`)}
            >
              <Check size={18} /> Inscrit — Accéder au cours
            </button>
          ) : (
            <button 
              className="btn-premium w-100 py-2 d-flex align-items-center justify-content-center gap-2 mt-3" 
              onClick={() => onEnroll(id)}
            >
              <Plus size={18} /> S'inscrire à la formation
            </button>
          )
        ) : (
          <button 
            className="btn-premium btn-full-width mt-2" 
            onClick={() => navigate(`/course/${id}`)}
          >
            <PlayCircle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            {progress > 0 ? "Continuer" : "Commencer"}
          </button>
        )}
      </div>
    </div>
  );
}
