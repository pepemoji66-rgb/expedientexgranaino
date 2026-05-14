import React from 'react';
import { Link } from 'react-router-dom';
import Comentarios from './Comentarios';
import Efemerides from './Efemerides';
import NoticiasExternas from './NoticiasExternas';
import './Indice.css';


const Indice = ({ userAuth, stats, setTema }) => {
    const [showDossier, setShowDossier] = React.useState(false);

    const coloresDisponibles = [
        { hex: '#00d4ff', label: 'CIAN' },
        { hex: '#00ff41', label: 'VERDE' },
        { hex: '#ff4444', label: 'ROJO' },
        { hex: '#ffb100', label: 'ORO' },
        { hex: '#ff00ff', label: 'ACENTO' }
    ];

    return (
        <div className="indice-container">
            {/* CABECERA TÉCNICA DE MONITORIZACIÓN */}
            <div className="monitoring-header">
                <div className="radar-status-mini">
                    <span className="pulse-dot"></span>
                    SISTEMA DE VIGILANCIA ACTIVO - SECTOR GRANADA/GLOBAL
                </div>
                <div className="system-clock">
                    {new Date().toLocaleDateString()} | GMT+1
                </div>
            </div>

            <Efemerides />

            {/* --- SECCIÓN REUBICADA: PROTOCOLOS Y SOBRE MÍ (AHORA AL PRINCIPIO) --- */}
            <div className="bunker-protocols-top">
                <div className="protocol-links-grid">
                    <Link to="/privacidad" className="protocol-link">POLÍTICA DE PRIVACIDAD</Link>
                    <Link to="/cookies" className="protocol-link">POLÍTICA DE COOKIES</Link>
                    <Link to="/legal" className="protocol-link">AVISO LEGAL</Link>
                    <Link to="/sobre-nosotros" className="protocol-link">SOBRE EL PROYECTO</Link>
                </div>
                
                <div className="dossier-section-top">
                    <button 
                        className={`btn-dossier-tech ${showDossier ? 'open' : ''}`}
                        onClick={() => setShowDossier(!showDossier)}
                    >
                        {showDossier ? '[-] CERRAR ARCHIVO PERSONAL' : '[+] DESCLASIFICAR ORIGEN DEL BÚNKER (SOBRE MÍ)'}
                    </button>

                    {showDossier && (
                        <div className="dossier-content-tech fade-in">
                            <h3>JOSE MORENO JIMÉNEZ - INVESTIGADOR AL MANDO</h3>
                            <p>
                                Detrás de este búnker se encuentra una historia real. Mi curiosidad por lo inexplicable se disparó tras grabar personalmente unos objetos anómalos en <strong>Atarfe (Granada)</strong>, un suceso que cambió mi forma de ver el cielo y que fue el motor para fundar esta plataforma.
                            </p>
                            <p>
                                <strong>EXPEDIENTEXGRANAINO</strong> nació de la necesidad de centralizar evidencias y testimonios de todo el mundo para compararlos y buscar respuestas. Aquí no buscamos imponer verdades, sino compartir preguntas y proteger la historia oculta de nuestro planeta.
                            </p>
                            <div className="dossier-actions-personal">
                                <Link to="/especial-atarfe" className="btn-technical-link highlight">
                                    📹 VER GRABACIÓN DE ATARFE
                                </Link>
                                <Link to="/sobre-nosotros" className="btn-technical-link">
                                    CONSULTAR PROTOCOLOS COMPLETOS
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="radar-section">
                <div className="radar-scanner technical">
                    <div className="radar-line"></div>
                    <div className="radar-circle c1"></div>
                    <div className="radar-circle c2"></div>
                    <div className="radar-circle c3"></div>
                </div>
                
                <div className="intel-summary-technical">
                    <div className="intel-item">
                        <span className="intel-status-label">ESTADO DEL SISTEMA:</span>
                        <span className="intel-status-value">OPERATIVO / VIGILANCIA ACTIVA</span>
                    </div>
                    <div className="intel-item">
                        <span className="intel-status-label">SECTOR:</span>
                        <span className="intel-status-value">GRANADA - GLOBAL</span>
                    </div>
                    <div className="intel-item">
                        <span className="intel-status-label">NIVEL DE ACCESO:</span>
                        <span className="intel-status-value">{userAuth ? 'AGENTE AUTORIZADO' : 'VISITANTE NO IDENTIFICADO'}</span>
                    </div>
                </div>
            </div>


            {/* TELETIPO DE INTELIGENCIA (MODERNO) */}
            <div className="intel-ticker">
                <div className="ticker-label">INTELIGENCIA RECIENTE:</div>
                <div className="ticker-wrapper">
                    <div className="ticker-content">
                        +++ MONITOREO UAP EN TIEMPO REAL +++ NUEVOS ARCHIVOS DESCLASIFICADOS DISPONIBLES +++ COLABORACIÓN INTERNACIONAL ACTIVA +++ 
                    </div>
                </div>
            </div>

            {/* CALIBRACIÓN DE FRECUENCIA (SELECTOR DE TEMAS SUTIL) */}
            <div className="frequency-calibration">
                <span className="calib-label">CALIBRACIÓN VISUAL:</span>
                <div className="calib-dots">
                    {coloresDisponibles.map(c => (
                        <div 
                            key={c.hex}
                            onClick={() => setTema(c.hex)}
                            className={`calib-dot ${c.hex === stats.tema ? 'active' : ''}`}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                        ></div>
                    ))}
                </div>
            </div>

            {/* GAMIFICACIÓN DE RANGOS */}
            <div className="gamification-banner" style={{ background: 'rgba(0, 212, 255, 0.05)', border: '1px solid var(--color-principal)', padding: '15px', marginBottom: '20px', textAlign: 'center', borderRadius: '5px' }}>
                <h3 style={{ color: 'var(--color-principal)', margin: '0 0 10px 0', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 5px var(--color-principal)' }}>🎖️ SISTEMA DE RANGOS ACTIVADO 🎖️</h3>
                <p style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 10px 0' }}>
                    El Alto Mando premia la lealtad. Inicia sesión en el Búnker y acumula "Visitas" para ascender automáticamente en la jerarquía militar táctica.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#ccc' }}>
                    <span>🔰 Prácticas</span> ➔ <span style={{color: '#fff'}}>🎖️ Cabo (3)</span> ➔ <span style={{color: '#fff'}}>🎖️🎖️ Cabo 1º (10)</span> ➔ <span style={{color: '#ffb100'}}>⭐ Sargento (20)</span> ➔ <span style={{color: '#ffb100'}}>⭐⭐ Teniente (50)</span> ➔ <span style={{color: '#00d4ff'}}>⭐⭐⭐ Capitán (100)</span>
                </div>
            </div>

            {/* ACCIONES TÁCTICAS - BOTONES RECOBRADOS */}
            <div className="tactical-actions-grid">
                <Link to="/lugares" className="btn-tactical map">
                    <span className="btn-icon">🗺️</span>
                    <span className="btn-text">ACCEDER AL RADAR MUNDIAL (MAPA)</span>
                </Link>
                <Link to="/expedientes" className="btn-tactical report">
                    <span className="btn-icon">📝</span>
                    <span className="btn-text">REPORTAR EXPERIENCIA / SUCESO</span>
                </Link>
                <Link to="/acceso" className="btn-tactical register">
                    <span className="btn-icon">🔑</span>
                    <span className="btn-text">REGISTRO GRATUITO DE AGENTE</span>
                </Link>
                <Link to="/videos" className="btn-tactical media">
                    <span className="btn-icon">📷</span>
                    <span className="btn-text">APORTAR EVIDENCIA MULTIMEDIA</span>
                </Link>
            </div>

            {/* === RADAR DE INTELIGENCIA EXTERNA (RSS EN VIVO) === */}
            <NoticiasExternas />

            <Comentarios userAuth={userAuth} />
        </div>
    );
};

export default Indice;