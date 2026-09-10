import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown } from 'lucide-react';
import logoBunker from '../assets/logo_bunker.jpeg';
import { ADMIN_EMAIL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import './TopNavbar.css';

const TopNavbar = ({ userAuth, toggleMenu, isOpen, cerrarSesion }) => {
    const location = useLocation();
    const { language, toggleLanguage, t } = useLanguage();
    const [otrasOpen, setOtrasOpen] = useState(false);

    const mainSections = [
        { path: "/noticias", label: language === 'en' ? "NEWS" : "NOTICIAS" },
        { path: "/expedientes", label: language === 'en' ? "DOSSIERS" : "EXPEDIENTES" },
        { path: "/casos-abiertos", label: "TRUE CRIME" },
        { path: "/misterios-historicos", label: language === 'en' ? "HISTORICAL MYSTERIES" : "MISTERIOS HISTÓRICOS" },
        { path: "/sobre-nosotros", label: language === 'en' ? "ABOUT ME" : "SOBRE MÍ" }
    ];

    const extraSections = [
        { path: "/la-ruleta", label: language === 'en' ? "Bunker Roulette" : "La Ruleta del Búnker" },
        { path: "/biblioteca", label: language === 'en' ? "Library" : "Biblioteca" },
        { path: "/lugares", label: language === 'en' ? "Radar Map" : "Mapa de Avistamientos" },
        { path: "/videos", label: language === 'en' ? "Videos" : "Vídeos" },
        { path: "/galeria", label: language === 'en' ? "Evidence Gallery" : "Galería de Evidencias" }
    ];

    const isAdmin = userAuth && (
        (userAuth.email && userAuth.email.toLowerCase() === (ADMIN_EMAIL || 'archipegv2@gmail.com').toLowerCase()) ||
        (userAuth.email && userAuth.email.toLowerCase() === 'pepemoji66@gmail.com') ||
        userAuth.rol === 'admin'
    );

    const todayFormatted = new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date());

    return (
        <header className="editorial-header">
            {/* FILA 1: UTILIDADES, LOGO Y METADATOS */}
            <div className="header-top-bar">
                <div className="header-top-container">
                    <div className="header-date">
                        <span>{todayFormatted}</span>
                        <span className="header-location">Granada · Edición Global</span>
                    </div>

                    <div className="header-branding">
                        <Link to="/" className="brand-link">
                            <img src={logoBunker} alt="Expediente X Granaíno" className="brand-logo-img" />
                            <div className="brand-titles">
                                <span className="brand-title">EXPEDIENTE X GRANAÍNO</span>
                                <span className="brand-tagline">DIARIO INDEPENDIENTE DE INVESTIGACIÓN, ENIGMAS Y CASOS CLASIFICADOS</span>
                            </div>
                        </Link>
                    </div>

                    <div className="header-top-actions">
                        <div className="editorial-lang-switch skiptranslate">
                            <button 
                                onClick={() => language !== 'es' && toggleLanguage()} 
                                className={`lang-btn ${language === 'es' ? 'active' : ''}`}
                            >
                                ES
                            </button>
                            <span className="lang-divider">/</span>
                            <button 
                                onClick={() => language !== 'en' && toggleLanguage()} 
                                className={`lang-btn ${language === 'en' ? 'active' : ''}`}
                            >
                                EN
                            </button>
                        </div>

                        {userAuth ? (
                            <div className="header-user-controls">
                                {isAdmin && (
                                    <Link to="/panel-mando" className="btn-admin-header">
                                        PANEL
                                    </Link>
                                )}
                                <Link to="/acceso" className="btn-account-header">
                                    {userAuth.nombre?.split(' ')[0].toUpperCase() || 'MI CUENTA'}
                                </Link>
                                <button onClick={cerrarSesion} className="btn-logout-header" title="Cerrar Sesión">
                                    <LogOut size={14} />
                                </button>
                            </div>
                        ) : (
                            <Link to="/acceso" className="btn-login-header">
                                ACCESO
                            </Link>
                        )}

                        <button className="editorial-hamburger" onClick={toggleMenu} aria-label="Menú">
                            {isOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* FILA 2: BARRA DE NAVEGACIÓN PRINCIPAL */}
            <nav className="header-nav-bar">
                <div className="header-nav-container">
                    <ul className="nav-items-list">
                        <li>
                            <Link to="/" className={`nav-item-link ${location.pathname === '/' ? 'active' : ''}`}>
                                INICIO
                            </Link>
                        </li>

                        {mainSections.map((sec) => (
                            <li key={sec.path}>
                                <Link 
                                    to={sec.path} 
                                    className={`nav-item-link ${location.pathname === sec.path ? 'active' : ''}`}
                                >
                                    {sec.label}
                                </Link>
                            </li>
                        ))}

                        {/* DESPLEGABLE OTRAS SECCIONES */}
                        <li 
                            className="nav-item-dropdown"
                            onMouseEnter={() => setOtrasOpen(true)}
                            onMouseLeave={() => setOtrasOpen(false)}
                        >
                            <button 
                                className={`dropdown-btn ${extraSections.some(x => location.pathname === x.path) ? 'active' : ''}`}
                                onClick={() => setOtrasOpen(!otrasOpen)}
                            >
                                {language === 'en' ? "OTHER SECTIONS" : "OTRAS SECCIONES"}
                                <ChevronDown size={14} className={`arrow-icon ${otrasOpen ? 'open' : ''}`} />
                            </button>
                            {otrasOpen && (
                                <ul className="dropdown-menu-box">
                                    {extraSections.map((extra) => (
                                        <li key={extra.path}>
                                            <Link 
                                                to={extra.path} 
                                                className={`dropdown-link ${location.pathname === extra.path ? 'active' : ''}`}
                                                onClick={() => setOtrasOpen(false)}
                                            >
                                                {extra.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    );
};

export default TopNavbar;
