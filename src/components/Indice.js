import React from 'react';
import { Link } from 'react-router-dom';
import Comentarios from './Comentarios';
import Efemerides from './Efemerides';
import NoticiasExternas from './NoticiasExternas';
import { useLanguage } from '../context/LanguageContext';
import './Indice.css';


const Indice = ({ userAuth, stats, setTema }) => {
    const { t, language } = useLanguage();
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
                    {t('systemActive')}
                </div>
                <div className="system-clock">
                    {new Date().toLocaleDateString()} | GMT+1
                </div>
            </div>

            <Efemerides />

            {/* --- SECCIÓN REUBICADA: PROTOCOLOS Y SOBRE MÍ (AHORA AL PRINCIPIO) --- */}
            <div className="bunker-protocols-top">
                <div className="protocol-links-grid">
                    <Link to="/privacidad" className="protocol-link">{t('navPrivacy')}</Link>
                    <Link to="/cookies" className="protocol-link">{t('navCookies')}</Link>
                    <Link to="/legal" className="protocol-link">{t('navLegal')}</Link>
                    <Link to="/sobre-nosotros" className="protocol-link">{t('navAboutProject')}</Link>
                </div>
                
                <div className="dossier-section-top">
                    <button 
                        className={`btn-dossier-tech ${showDossier ? 'open' : ''}`}
                        onClick={() => setShowDossier(!showDossier)}
                    >
                        {showDossier ? t('dossierClose') : t('dossierOpen')}
                    </button>

                    {showDossier && (
                        <div className="dossier-content-tech fade-in">
                            <h3>{t('dossierTitle')}</h3>
                            <p>
                                {t('dossierDesc1')}
                            </p>
                            <p>
                                {t('dossierDesc2')}
                            </p>
                            <div className="dossier-actions-personal">
                                <Link to="/especial-atarfe" className="btn-technical-link highlight">
                                    {t('dossierViewAtarfe')}
                                </Link>
                                <Link to="/sobre-nosotros" className="btn-technical-link">
                                    {t('dossierFullProtocols')}
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
                        <span className="intel-status-label">{t('systemStatusLabel')}</span>
                        <span className="intel-status-value">{t('systemStatusValue')}</span>
                    </div>
                    <div className="intel-item">
                        <span className="intel-status-label">{t('sectorLabel')}</span>
                        <span className="intel-status-value">{t('sectorValue')}</span>
                    </div>
                    <div className="intel-item">
                        <span className="intel-status-label">{t('accessLevelLabel')}</span>
                        <span className="intel-status-value">{userAuth ? t('accessLevelAgent') : t('accessLevelVisitor')}</span>
                    </div>
                </div>
            </div>


            {/* TELETIPO DE INTELIGENCIA (MODERNO) */}
            <div className="intel-ticker">
                <div className="ticker-label">{t('recentIntel')}</div>
                <div className="ticker-wrapper">
                    <div className="ticker-content">
                        {t('tickerText')}
                    </div>
                </div>
            </div>

            {/* CALIBRACIÓN DE FRECUENCIA (SELECTOR DE TEMAS SUTIL) */}
            <div className="frequency-calibration">
                <span className="calib-label">{t('visualCalibration')}</span>
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
                <h3 style={{ color: 'var(--color-principal)', margin: '0 0 10px 0', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 5px var(--color-principal)' }}>{t('rankSystemTitle')}</h3>
                <p style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 10px 0' }}>
                    {t('rankSystemDesc')}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#ccc' }}>
                    {t('rankLevels')}
                </div>
            </div>

            {/* ACCIONES TÁCTICAS - BOTONES RECOBRADOS */}
            <div className="tactical-actions-grid">
                <Link to="/lugares" className="btn-tactical map">
                    <span className="btn-icon">🗺️</span>
                    <span className="btn-text">{t('accessWorldRadar')}</span>
                </Link>
                <Link to="/expedientes" className="btn-tactical report">
                    <span className="btn-icon">📝</span>
                    <span className="btn-text">{t('reportExperience')}</span>
                </Link>
                <Link to="/acceso" className="btn-tactical register">
                    <span className="btn-icon">🔑</span>
                    <span className="btn-text">{t('freeAgentRegister')}</span>
                </Link>
                <Link to="/videos" className="btn-tactical media">
                    <span className="btn-icon">📷</span>
                    <span className="btn-text">{t('contributeMedia')}</span>
                </Link>
            </div>

            {/* === RADAR DE INTELIGENCIA EXTERNA (RSS EN VIVO) === */}
            <NoticiasExternas />

            {/* PROMOCIÓN DE ADQUISICIÓN DE ARCHIPEG V3 (STRIPE) */}
            <div style={{ textAlign: 'center', margin: '30px 0', opacity: 0.9 }}>
                <Link to="/archipeg" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    backgroundColor: 'rgba(99, 91, 255, 0.1)', border: '1px solid rgba(99, 91, 255, 0.3)',
                    color: '#635bff', padding: '10px 22px', borderRadius: '20px',
                    textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.3s ease',
                    fontFamily: 'Outfit, sans-serif'
                }} 
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(99, 91, 255, 0.2)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(99, 91, 255, 0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.backgroundColor = 'rgba(99, 91, 255, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                    💻 <span>{language === 'en' ? 'Get Archipeg V3 - Sovereign Offline Software' : 'Adquirir Archipeg V3 - Software Offline Soberano'}</span>
                </Link>
            </div>

            <Comentarios userAuth={userAuth} />
        </div>
    );
};

export default Indice;