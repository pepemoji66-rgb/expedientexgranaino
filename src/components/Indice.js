import React from 'react';
import { Link } from 'react-router-dom'; // <--- ESTA LÍNEA FALTABA, HERMANO
import './Indice.css';

const Indice = ({ userAuth }) => {
    return (
        <div className="indice-container">
            <h1 className="titulo-principal">EXPEDIENTEX GRANAINO</h1>
            
            <div className="radar-scanner">
                <div className="radar-line"></div>
                <div className="radar-circle c1"></div>
                <div className="radar-circle c2"></div>
                <div className="radar-circle c3"></div>
                <div className="radar-dot"></div>
            </div>

            {/* Mensaje de estado táctico (Elegante y funcional) */}
            {!userAuth ? (
                <div className="aviso-seguridad-radar" style={{
                    border: '1px solid var(--color-principal)',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '12px 20px',
                    borderRadius: '4px',
                    marginTop: '15px',
                    fontSize: '0.9rem',
                    color: '#fff',
                    letterSpacing: '1px'
                }}>
                    <span style={{ 
                        color: 'var(--color-principal)', 
                        fontWeight: 'bold' 
                    }}>🛰️ SISTEMA:</span> ACCESO LIMITADO. ES NECESARIO EL {' '}
                    <Link to="/acceso" style={{ 
                        color: 'var(--color-principal)', 
                        fontWeight: 'bold', 
                        textDecoration: 'underline' 
                    }}>
                        REGISTRO
                    </Link> PARA DESBLOQUEAR SECCIONES TÁCTICAS.
                </div>
            ) : (
                <p className="radar-status" style={{ 
                    color: 'var(--color-principal)',
                    marginTop: '15px',
                    fontWeight: 'bold'
                }}>
                    AGENTE {userAuth.nombre?.toUpperCase()} IDENTIFICADO. ESCÁNEO EN CURSO...
                </p>
            )}
            
            {!userAuth && (
                <p className="radar-status" style={{ 
                    opacity: 0.6, 
                    fontSize: '0.75rem', 
                    marginTop: '10px',
                    fontStyle: 'italic' 
                }}>
                    ESCÁNEO DE ACTIVIDAD PARANORMAL EN CURSO...
                </p>
            )}
        </div>
    );
};

export default Indice;