import React from 'react';
import { Link } from 'react-router-dom';
import AdSlot from './AdSlot';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css'; 

const Footer = ({ visitasTotales = 0 }) => {
    const { t } = useLanguage();
    const añoActual = new Date().getFullYear(); 

    // Formatear el contador (ej: 000123)
    const contadorFormateado = visitasTotales.toString().padStart(6, '0');

    return (
        <footer className="footer-container" style={{ paddingTop: '20px' }}>
            <AdSlot id="footer-top" />
            <div className="footer-content">
                <p>
                    &copy; {añoActual} EXPEDIENTEXGRANAINO Y MUNDIAL. {t('footerAuthor')} 
                    <span className="footer-extra"> {t('footerRights')}</span>
                </p>
                
                {/* CONTADOR DE VISITAS RETRO */}
                <div style={{
                    margin: '15px auto',
                    padding: '8px 15px',
                    background: '#0a0a0a',
                    border: '1px solid var(--color-principal)',
                    display: 'inline-block',
                    fontFamily: 'monospace',
                    color: 'var(--color-principal)',
                    fontSize: '1.2rem',
                    letterSpacing: '3px',
                    boxShadow: '0 0 10px rgba(var(--rgb-principal), 0.2)'
                }}>
                    {t('footerVisits')} <span style={{ fontWeight: 'bold', color: '#fff' }}>{contadorFormateado}</span>
                </div>
                
                {/* REDES SOCIALES */}
                <div className="footer-social-links" style={{ margin: '15px 0', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <a href="https://x.com/PEPE1318057" target="_blank" rel="noopener noreferrer" className="social-link-bunker" style={{ color: 'var(--color-principal)', fontSize: '1.5rem', transition: '0.3s' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                    </a>
                    <a href="https://www.instagram.com/expedientexgranaino/" target="_blank" rel="noopener noreferrer" className="social-link-bunker" style={{ color: 'var(--color-principal)', fontSize: '1.5rem', transition: '0.3s' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    </a>
                    <a href="https://www.youtube.com/@expedientexgranaino" target="_blank" rel="noopener noreferrer" className="social-link-bunker" style={{ color: 'var(--color-principal)', fontSize: '1.5rem', transition: '0.3s' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
                    </a>
                    <a href="https://es.pinterest.com/ExpedienteXGranaino/" target="_blank" rel="noopener noreferrer" className="social-link-bunker" style={{ color: 'var(--color-principal)', fontSize: '1.5rem', transition: '0.3s' }} title="Pinterest">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 0-3.16 19.49c-.08-.86-.15-2.18.03-3.12l1.1-4.66s-.28-.56-.28-1.39c0-1.3.75-2.27 1.69-2.27.8 0 1.18.6 1.18 1.32 0 .8-.51 2-.78 3.11-.22.93.46 1.69 1.38 1.69 1.65 0 2.92-1.74 2.92-4.25 0-2.22-1.6-3.78-3.88-3.78-2.65 0-4.2 1.98-4.2 4.03 0 .8.31 1.66.7 2.13a.34.34 0 0 1 .08.33c-.09.37-.29 1.18-.33 1.34a.34.34 0 0 1-.47.24c-1.42-.66-2.31-2.73-2.31-4.39 0-3.57 2.6-6.85 7.48-6.85 3.93 0 6.98 2.8 6.98 6.54 0 3.9-2.46 7.04-5.88 7.04-1.15 0-2.23-.6-2.6-1.3l-.7 2.68c-.26.98-.95 2.21-1.42 2.96A10 10 0 1 0 12 2z"/></svg>
                    </a>
                </div>

                <div className="footer-legal-links" style={{ margin: '10px 0', fontSize: '0.7rem' }}>
                    <Link to="/privacidad" style={{ color: '#888', marginRight: '15px', textDecoration: 'none' }}>{t('navPrivacy')}</Link>
                    <Link to="/cookies" style={{ color: '#888', marginRight: '15px', textDecoration: 'none' }}>{t('navCookies')}</Link>
                    <Link to="/legal" style={{ color: '#888', marginRight: '15px', textDecoration: 'none' }}>{t('navLegal')}</Link>
                    <Link to="/sobre-nosotros" style={{ color: '#888', textDecoration: 'none' }}>{t('navAboutProject')}</Link>
                </div>
                <div className="footer-contact">
                    <span className="contact-label">{t('footerContact')}</span>
                    <a href="mailto:archipegv2@gmail.com" className="contact-link">archipegv2@gmail.com</a>
                </div>
                <p style={{ fontSize: '0.62rem', color: '#666', marginTop: '15px', letterSpacing: '0.5px' }}>
                    Como afiliado de Amazon, obtengo ingresos por las compras adscritas que cumplen los requisitos aplicables.
                </p>
            </div>
        </footer>
    );
};

export default Footer;