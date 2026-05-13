import React from 'react';
import { Link } from 'react-router-dom';
import AdSlot from './AdSlot';
import './Footer.css'; 

const Footer = ({ visitasTotales = 0 }) => {
    const añoActual = new Date().getFullYear(); 

    // Formatear el contador (ej: 000123)
    const contadorFormateado = visitasTotales.toString().padStart(6, '0');

    return (
        <footer className="footer-container" style={{ paddingTop: '20px' }}>
            <AdSlot id="footer-top" />
            <div className="footer-content">
                <p>
                    &copy; {añoActual} EXPEDIENTEXGRANAINO Y MUNDIAL. Autor: José Moreno Jiménez. 
                    <span className="footer-extra"> Prohibida la reproducción no autorizada.</span>
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
                    VISITAS AL BÚNKER: <span style={{ fontWeight: 'bold', color: '#fff' }}>{contadorFormateado}</span>
                </div>
                
                {/* REDES SOCIALES */}
                <div className="footer-social-links" style={{ margin: '15px 0', display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <a href="https://x.com/PEPE1318057" target="_blank" rel="noopener noreferrer" className="social-link-bunker" style={{ color: 'var(--color-principal)', fontSize: '1.5rem', transition: '0.3s' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                    </a>
                    <a href="https://www.instagram.com/expedientexgranaino/" target="_blank" rel="noopener noreferrer" className="social-link-bunker" style={{ color: 'var(--color-principal)', fontSize: '1.5rem', transition: '0.3s' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                    </a>
                </div>

                <div className="footer-legal-links" style={{ margin: '10px 0', fontSize: '0.7rem' }}>
                    <Link to="/privacidad" style={{ color: '#888', marginRight: '15px', textDecoration: 'none' }}>PRIVACIDAD</Link>
                    <Link to="/cookies" style={{ color: '#888', marginRight: '15px', textDecoration: 'none' }}>COOKIES</Link>
                    <Link to="/legal" style={{ color: '#888', marginRight: '15px', textDecoration: 'none' }}>AVISO LEGAL</Link>
                    <Link to="/sobre-nosotros" style={{ color: '#888', textDecoration: 'none' }}>SOBRE EL PROYECTO</Link>

                </div>
                <div className="footer-contact">
                    <span className="contact-label">CONTACTO ALTO MANDO:</span>
                    <a href="mailto:archipegv2@gmail.com" className="contact-link">archipegv2@gmail.com</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;