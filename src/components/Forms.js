import React from 'react';
import { useNavigate } from 'react-router-dom';
import './forms.css';

const Forms = ({ title, subtitle, children, onSubmit, onClear }) => {
  const navigate = useNavigate();

  return (
    <div className="forms-overlay">
      <div className="forms-container">
        <h2 className="forms-title">{title}</h2>
        {subtitle && <p className="forms-subtitle">{subtitle}</p>}
        
        <form onSubmit={onSubmit} autoComplete="off">
          {children}
          
          <div className="forms-actions">
            <button type="submit" className="forms-btn-submit">
              EJECUTAR ACCIÓN
            </button>
            
            <div className="forms-row">
              {onClear && (
                <button type="button" onClick={onClear} className="forms-btn-clear">
                  LIMPIAR
                </button>
              )}
              <button type="button" onClick={() => navigate('/')} className="forms-btn-home">
                INICIO
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Forms;