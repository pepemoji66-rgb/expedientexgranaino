import React from 'react';
import { Link } from 'react-router-dom';
import AdSlot from './AdSlot';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css'; 

const Footer = ({ visitasTotales = 0 }) => {
    const { t, language } = useLanguage();
    const añoActual = new Date().getFullYear(); 

    return (
        <footer className="footer-editorial">
            <AdSlot id="footer-top" />
            
            <div className="footer-editorial-container">
                {/* BLOQUE INFORMATIVO Y DIRECTIVAS */}
                <div className="footer-disclaimers-grid">
                    <div className="footer-disclaimer-col">
                        <h4>DIRECTIVA DE INVESTIGACIÓN Y ARCHIVO</h4>
                        <p>
                            Los expedientes, crónicas y misterios documentados en este portal constituyen análisis preliminares y síntesis documentales. Este archivo independiente tiene fines de divulgación e investigación ufológica y periodística. Se recomienda a los investigadores contrastar las fuentes y participar aportando datos contrastados.
                        </p>
                    </div>

                    <div className="footer-disclaimer-col">
                        <h4>DIVULGACIÓN DE AFILIADOS</h4>
                        <p>
                            Las recomendaciones bibliográficas y audiovisuales son sugerencias de lectura para profundizar en los casos. Como participante en programas de afiliados (incluido Amazon), este portal percibe pequeñas comisiones por compras adscritas que ayudan al sostenimiento técnico y alojamiento del servidor, sin coste adicional para el lector.
                        </p>
                    </div>
                </div>

                {/* ENLACES EDITORIALES Y DE UTILIDADES */}
                <div className="footer-links-row">
                    <div className="footer-nav-links">
                        <Link to="/noticias">Noticias</Link>
                        <Link to="/expedientes">Expedientes</Link>
                        <Link to="/casos-abiertos">True Crime</Link>
                        <Link to="/misterios-historicos">Misterios Históricos</Link>
                        <Link to="/sobre-nosotros">Sobre el Proyecto</Link>
                        <Link to="/biblioteca">Biblioteca</Link>
                        <Link to="/colaboradores">Colaboradores</Link>
                    </div>

                    <div className="footer-legal-links">
                        <Link to="/privacidad">{t('navPrivacy')}</Link>
                        <Link to="/cookies">{t('navCookies')}</Link>
                        <Link to="/legal">{t('navLegal')}</Link>
                    </div>
                </div>

                {/* ACCESOS DEL ARCHIVO Y REDES */}
                <div className="footer-bottom-bar">
                    <div className="footer-extras">
                        <span className="extras-title">ARCHIVO GENERAL:</span>
                        <Link to="/la-ruleta">La Ruleta</Link>
                        <Link to="/galeria">Galería</Link>
                        <Link to="/videos">Vídeos</Link>
                        <Link to="/lugares">Mapa de Casos</Link>
                        <Link to="/especial-atarfe">Dossier Atarfe</Link>
                    </div>

                    <div className="footer-social-links">
                        <a href="https://x.com/PEPE1318057" target="_blank" rel="noopener noreferrer" title="X / Twitter">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                        </a>
                        <a href="https://www.youtube.com/@expedientexgranaino" target="_blank" rel="noopener noreferrer" title="YouTube">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                        </a>
                        <a href="https://www.instagram.com/expedientexgranaino/" target="_blank" rel="noopener noreferrer" title="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                        </a>
                    </div>
                </div>

                <div className="footer-copyright">
                    {visitasTotales > 0 && (
                        <p className="footer-visitas">
                            📡 {t('footerVisits') || 'VISITAS AL BÚNKER:'} <strong>{visitasTotales.toLocaleString('es-ES')}</strong>
                        </p>
                    )}
                    <p>&copy; {añoActual} EXPEDIENTE X GRANAÍNO · Todos los derechos reservados · Contacto editorial: <a href="mailto:archipegv2@gmail.com">archipegv2@gmail.com</a></p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;