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
    LogOut
} from 'lucide-react';
import ControlMusica from './ControlMusica';
import logoBunker from '../assets/logo_bunker.jpeg';
import { ADMIN_EMAIL } from '../config';
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

    const menuItems = [
        { path: "/", label: "INICIO", icon: <Home size={16} /> },
        { path: "/galeria", label: "GALERÍA", icon: <Image size={16} /> },
        { path: "/videos", label: "VÍDEOS", icon: <Video size={16} /> },
        { path: "/noticias", label: "NOTICIAS", icon: <Newspaper size={16} /> },
        { path: "/audios", label: "AUDIOS", icon: <Mic size={16} /> },
        { path: "/expedientes", label: "EXPEDIENTES", icon: <FileText size={16} /> },
        { path: "/lugares", label: "MAPA", icon: <Map size={16} /> },
    ];

    if (userAuth) {
        menuItems.push(
            { path: "/horoscopo", label: "HORÓSCOPO", icon: <Sparkles size={16} /> },
            { path: "/tarot", label: "TAROT", icon: <Sparkles size={16} /> },
            { path: "/carta-astral", label: "ASTRAL", icon: <Sparkles size={16} /> }
        );
    }

    menuItems.push({ path: "/chat", label: "CHAT", icon: <MessageSquare size={16} /> });

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
                        <div className="tool-item translator-tool skiptranslate">
                            <Languages size={14} className="tool-icon" />
                            <GoogleTranslator />
                        </div>
                        <div className="tool-item music-tool desktop-only">
                            <ControlMusica />
                        </div>
                    </div>

                    <div className="user-area desktop-only">
                        {userAuth ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {(userAuth.rol === 'admin' || userAuth.email?.toLowerCase() === ADMIN_EMAIL?.toLowerCase()) && (
                                    <Link to="/panel-mando" className="btn-access-tactical" style={{ borderColor: 'var(--color-principal)', color: 'var(--color-principal)', height: '32px', display: 'flex', alignItems: 'center' }}>
                                        PANEL
                                    </Link>
                                )}
                                <Link to="/acceso" className="btn-access-tactical" style={{ height: '32px', display: 'flex', alignItems: 'center' }}>MI PERFIL</Link>
                                <button onClick={cerrarSesion} className="btn-logout-mini" title="DESCONECTAR AGENTE">
                                    <LogOut size={14} />
                                    <span className="desktop-only">SALIR</span>
                                </button>
                            </div>
                        ) : (
                            <Link to="/acceso" className="btn-access-tactical">ACCESO</Link>
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
