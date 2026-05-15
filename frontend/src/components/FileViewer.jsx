function FileViewer({ resource, onView }) {
  const handleClick = () => {
    if (onView) onView(); // Marquer comme vu
    
    // Ouvrir selon le type
    if (resource.type === 'link') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } else if (resource.type === 'video') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } else if (resource.type === 'pdf') {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } else {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getIcon = (type) => {
    const icons = {
      pdf: '📄',
      video: '🎬',
      link: '🔗',
      document: '📁'
    };
    return icons[type] || '📎';
  };

  return (
    <button 
      className="btn-view-resource"
      onClick={handleClick}
      title={`Ouvrir: ${resource.title}`}
      style={{ border: 'none', cursor: 'pointer' }}
    >
      {getIcon(resource.type)} Ouvrir
    </button>
  );
}

export default FileViewer;