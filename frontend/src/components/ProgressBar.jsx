function ProgressBar({ value, className = '' }) {
  // value: 0-100
  const safeValue = Math.min(100, Math.max(0, value || 0));
  
  const getBarColor = (val) => {
    if (val >= 80) return 'bg-success';
    if (val >= 50) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div className={`progress ${className}`} style={{ height: '8px' }}>
      <div 
        className={`progress-bar ${getBarColor(safeValue)}`} 
        role="progressbar"
        style={{ width: `${safeValue}%` }}
        aria-valuenow={safeValue}
        aria-valuemin="0"
        aria-valuemax="100"
      />
    </div>
  );
}

export default ProgressBar;