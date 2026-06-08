import React, { memo } from 'react';
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
    Eye
} from 'lucide-react';
import ControlMusica from './ControlMusica';
import logoBunker from '../assets/logo_bunker.jpeg';
import { ADMIN_EMAIL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import './TopNavbar.css';

// Componente blindado para el traductor para evitar re-renders innecesarios
const GoogleTranslator = memo(() => {
    React.useEffect(() => {
        const loadTranslate = () => {
            if (window.google && window.google.translate && window.google.translate.TranslateElement) {
                const element = document.getElementById('google_translate_element');
                if (element && element.innerHTML === "") {
                    new window.google.translate.TranslateElement({
                        pageLanguage: 'es',
                        includedLanguages: 'en,es,fr,de,it,pt',
                        autoDisplay: false,
                        layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
                    }, 'google_translate_element');
                }
            }
        };

        // Vigilar y reponer si desaparece
        const interval = setInterval(loadTranslate, 2000);
        const timeout = setTimeout(loadTranslate, 1000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

    return <div id="google_translate_element"></div>;
});

const TopNavbar = ({ userAuth, toggleMenu, isOpen, cerrarSesion }) => {
    const location = useLocation();
    const { language, toggleLanguage, t } = useLanguage();

    const menuItems = [
        { path: "/", label: t('navHome'), icon: <Home size={16} /> },
        { path: "/galeria", label: t('navGallery'), icon: <Image size={16} /> },
        { path: "/videos", label: t('navVideos'), icon: <Video size={16} /> },
        { path: "/noticias", label: t('navNews'), icon: <Newspaper size={16} /> },
        { path: "/expedientes", label: t('navFiles'), icon: <FileText size={16} /> },
        { path: "/lugares", label: t('navMap'), icon: <Map size={16} /> },
    ];

    if (userAuth) {
        menuItems.push(
            { path: "/horoscopo", label: t('navHoroscope'), icon: <Sparkles size={16} /> },
            { path: "/tarot", label: t('navTarot'), icon: <Sparkles size={16} /> },
            { path: "/carta-astral", label: t('navAstral'), icon: <Sparkles size={16} /> }
        );
    }
    menuItems.push({ path: "/casos-abiertos", label: "💀 TRUE CRIME", icon: <FileText size={16} /> });
    menuItems.push({ path: "/misterios-historicos", label: "👁️ " + t('navMysteries'), icon: <Eye size={16} /> });

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
                    {menuItems.map((item) => (
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
                                {(userAuth.rol === 'admin' || userAuth.email?.toLowerCase() === ADMIN_EMAIL?.toLowerCase()) && (
                                    <Link to="/panel-mando" className="btn-access-tactical" style={{ borderColor: 'var(--color-principal)', color: 'var(--color-principal)', height: '32px', display: 'flex', alignItems: 'center' }}>
                                        {t('sysControlPanel').replace('⚡ ', '')}
                                    </Link>
                                )}
                                <Link to="/acceso" className="btn-access-tactical" style={{ height: '32px', display: 'flex', alignItems: 'center' }}>{t('navProfile')}</Link>
                                <button onClick={cerrarSesion} className="btn-logout-mini" title={t('sysLogoutBtn')}>
                                    <LogOut size={14} />
                                    <span className="desktop-only">{t('navLogout')}</span>
                                </button>
                            </div>
                        ) : (
                            <Link to="/acceso" className="btn-access-tactical">{t('navLogin')}</Link>
                        )}
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
