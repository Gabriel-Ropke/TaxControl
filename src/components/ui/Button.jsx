import React from 'react';
import './Button.css';

export function Button({
  children,
  variant = 'primary',
  fullWidth = false,
  disabled = false,
  isLoading = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const classes = ['ui-button', variant, fullWidth ? 'full-width' : '', className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && <span className="spinner" />}
      {children}
    </button>
  );
}
