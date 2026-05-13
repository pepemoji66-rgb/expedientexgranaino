import React from 'react';
import './forms.css';

const Forms = ({ title, subtitle, children, onSubmit, onClear }) => {

    // Función de seguridad para limpiar sin romper el sistema
    const handleClear = () => {
        if (onClear) {
            onClear();
        }
    };

    return (
        <div className="forms-overlay fade-in">
            <div className="forms-container">
                <h2 className="forms-title">{title ? title.toUpperCase() : 'FORMULARIO TÁCTICO'}</h2>
                {subtitle && <p className="forms-subtitle">{subtitle}</p>}

                {/* Importante: encType permite que viajen audios/fotos/videos */}
                <form onSubmit={onSubmit} encType="multipart/form-data">

                    <div className="forms-content">
                        {children}
                    </div>

                    <div className="forms-actions">
                        <button type="submit" className="forms-btn-submit">
                            ENVIAR SEÑAL
                        </button>

                        <div className="forms-row">
                            <button
                                type="button"
                                className="forms-btn-clear"
                                onClick={handleClear}
                            >
                                ABORTAR
                            </button>
                            <button
                                type="button"
                                className="forms-btn-home"
                                onClick={() => window.location.href = '/'}
                            >
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