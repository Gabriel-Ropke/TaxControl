import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import './Toast.css';

export function Toast({ toast, onClose }) {
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Inicia o fade-out visual após 8 segundos
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, 8000);

    // Remove logicamente o componente após 10 segundos
    const removeTimer = setTimeout(() => {
      onClose();
    }, 10000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onClose]);

  const Icon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle className="toast-icon success" />;
      case 'error': return <AlertCircle className="toast-icon error" />;
      case 'warning': return <AlertTriangle className="toast-icon warning" />;
      case 'info':
      default: return <Info className="toast-icon info" />;
    }
  };

  return (
    <div className={`toast-message ${toast.type} ${isFading ? 'fading-out' : ''}`}>
      <div className="toast-content">
        <Icon />
        <div className="toast-text">
          {toast.title && <div className="toast-title">{toast.title}</div>}
          <div>{toast.message}</div>
        </div>
        <button className="toast-close" onClick={onClose} aria-label="Fechar notificação">
          <X size={16} />
        </button>
      </div>
      <div className="toast-progress">
        <div className="toast-progress-bar" />
      </div>
    </div>
  );
}
