import React from 'react';
import './Input.css';

export function Input({
  label,
  error,
  id,
  className = '',
  fullWidth = true,
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  
  return (
    <div className={`ui-input-container ${fullWidth ? 'full-width' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="ui-input-label">{label}</label>}
      <input
        id={inputId}
        className={`ui-input ${error ? 'error' : ''}`}
        {...props}
      />
      {error && <span className="ui-input-error-msg">{error}</span>}
    </div>
  );
}
