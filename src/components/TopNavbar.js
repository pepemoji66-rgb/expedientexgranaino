import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Image,
    Video,
    Newspaper,
    Mic,
    FileText,
    Map,
    MessageSquare,
    Sparkles,
    Languages,
    Menu,
    X,
    LogOut,
    Eye,
    Monitor
} from 'lucide-react';
import ControlMusica from './ControlMusica';
import logoBunker from '../assets/logo_bunker.jpeg';
import { ADMIN_EMAIL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import './TopNavbar.css';


const TopNavbar = ({ userAuth, toggleMenu, isOpen, cerrarSesion }) => {
    const location = useLocation();
    const { language, toggleLanguage, t } = useLanguage();

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const evidenceMenuItems = [
        { path: "/galeria", label: "🖼️ " + t('navGallery') },
        { path: "/videos", label: "📼 " + t('navVideos') },
        { path: "/noticias", label: "📰 " + t('navNews') },
        { path: "/expedientes", label: "📁 " + t('navFiles') },
        { path: "/casos-abiertos", label: "💀 TRUE CRIME" },
        { path: "/misterios-historicos", label: "👁️ " + t('navMysteries') },
    ];

    const otherMenuItems = [
        { path: "/lugares", label: t('navMap') },
        { path: "/sobre-nosotros", label: "🕵️ " + (language === 'en' ? 'ABOUT ME' : 'SOBRE MÍ') },
        { path: "/biblioteca", label: "📚 " + (language === 'en' ? 'LIBRARY' : 'BIBLIOTECA') },
        { path: "/archipeg", label: language === 'en' ? "💻 SOFTWARE" : "💻 SOFTWARE" }
    ];

    if (userAuth) {
        otherMenuItems.push(
            { path: "/horoscopo", label: t('navHoroscope') }
        );
    }

    return (
        <nav className={`top-navbar ${isOpen ? 'menu-activo' : ''}`}>
            <div className="top-navbar-container">
                {/* LOGO SECTOR */}
                <div className="top-navbar-logo">
                    <Link to="/" className="logo-link">
                        <img src={logoBunker} alt="Expediente X Granaino" className="logo-image" />
                    </Link>
                </div>

                {/* CENTRAL NAVIGATION (DESKTOP) */}
                <ul className="top-navbar-links">
                    <li>
                        <Link to="/" className={`top-nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                            <span className="label">{t('navHome')}</span>
                            <div className="nav-underline"></div>
                        </Link>
                    </li>

                    {/* DESPLEGABLE DE EVIDENCIAS */}
                    <li 
                        className={`nav-dropdown-wrapper ${dropdownOpen ? 'open' : ''}`}
                        onMouseEnter={() => setDropdownOpen(true)}
                        onMouseLeave={() => setDropdownOpen(false)}
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                    >
                        <span className={`top-nav-link dropdown-trigger ${evidenceMenuItems.some(x => location.pathname === x.path) ? 'active' : ''}`} style={{ cursor: 'pointer' }}>
                            <span className="label">📂 {language === 'en' ? 'EVIDENCES' : 'EVIDENCIAS'} <span className="dropdown-arrow">▼</span></span>
                            <div className="nav-underline"></div>
                        </span>
                        
                        <ul className="dropdown-submenu">
                            {evidenceMenuItems.map((sub) => (
                                <li key={sub.path}>
                                    <Link to={sub.path} className={`dropdown-sub-link ${location.pathname === sub.path ? 'active' : ''}`}>
                                        {sub.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>

                    {/* OTRAS SECCIONES */}
                    {otherMenuItems.map((item) => (
                        <li key={item.path}>
                            <Link
                                to={item.path}
                                className={`top-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                <span className="label">{item.label}</span>
                                <div className="nav-underline"></div>
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* TACTICAL TOOLS & USER AREA */}
                <div className="top-navbar-actions">
                    <div className="tactical-tools">
                        <div className="language-selector-bunker skiptranslate">
                            <button 
                                onClick={() => language !== 'es' && toggleLanguage()} 
                                className={`lang-text-btn ${language === 'es' ? 'active' : ''}`}
                                title="Español"
                            >
                                ESP
                            </button>
                            <div className="lang-separator"></div>
                            <button 
                                onClick={() => language !== 'en' && toggleLanguage()} 
                                className={`lang-text-btn ${language === 'en' ? 'active' : ''}`}
                                title="English"
                            >
                                ENG
                            </button>
                        </div>
                        <div className="tool-item music-tool">
                            <ControlMusica />
                        </div>
                    </div>

                    <div className="user-area desktop-only">
                        {userAuth ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Link to="/acceso" className="btn-access-tactical" style={{ height: '32px', display: 'flex', alignItems: 'center' }}>{t('navProfile')}</Link>
                                <button onClick={cerrarSesion} className="btn-logout-mini" title={t('sysLogoutBtn')}>
                                    <LogOut size={14} />
                                    <span className="desktop-only">{t('navLogout')}</span>
                                </button>
                            </div>
                        ) : null}
                    </div>

                    {/* BOTÓN HAMBURGUESA (MÓVIL) */}
                    <button className="mobile-menu-btn" onClick={toggleMenu} aria-label="Toggle Menu">
                        {isOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>
            <div className="navbar-glow-line"></div>
        </nav>
    );
};

export default TopNavbar;
