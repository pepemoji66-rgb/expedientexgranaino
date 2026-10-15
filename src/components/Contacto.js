import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const EMAIL_CONTACTO = 'archipegv2@gmail.com';

const Contacto = () => {
    const { language } = useLanguage();
    const en = language === 'en';

    useEffect(() => {
        const tituloAnterior = document.title;
        document.title = (en ? 'Contact' : 'Contacto') + ' | Expediente X Granaíno';
        return () => { document.title = tituloAnterior; };
    }, [en]);

    const tarjeta = {
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
        padding: '24px 26px',
        marginBottom: '20px'
    };
    const h2 = {
        fontFamily: "'Playfair Display', Georgia, serif",
        color: '#1e3a2b',
        fontSize: '1.25rem',
        margin: '0 0 10px 0'
    };
    const p = {
        fontFamily: "'Merriweather', Georgia, serif",
        color: '#1A1A1A',
        fontSize: '0.95rem',
        lineHeight: 1.75,
        margin: '0 0 10px 0'
    };
    const enlace = { color: '#1e3a2b', fontWeight: 700, textDecoration: 'underline' };

    return (
        <div className="fade-in" style={{ padding: '120px 20px 60px', maxWidth: '820px', margin: '0 auto' }}>
            <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#1A1A1A',
                fontSize: '2.2rem',
                textAlign: 'center',
                margin: '0 0 8px 0'
            }}>
                {en ? 'Contact' : 'Contacto'}
            </h1>
            <p style={{ ...p, textAlign: 'center', color: '#4A5568', marginBottom: '30px' }}>
                {en
                    ? 'Expediente X Granaíno is an independent research archive run from Atarfe (Granada).'
                    : 'Expediente X Granaíno es un archivo de investigación independiente, mantenido desde Atarfe (Granada).'}
            </p>

            <section style={{ ...tarjeta, borderLeft: '4px solid #1e3a2b' }}>
                <h2 style={h2}>{en ? 'Editorial e-mail' : 'Correo editorial'}</h2>
                <p style={p}>
                    {en
                        ? 'For any enquiry, correction, collaboration or request, write to us at:'
                        : 'Para cualquier consulta, corrección, colaboración o solicitud, escríbenos a:'}
                </p>
                <p style={{ ...p, fontSize: '1.1rem' }}>
                    <a href={`mailto:${EMAIL_CONTACTO}`} style={enlace}>{EMAIL_CONTACTO}</a>
                </p>
                <p style={{ ...p, color: '#4A5568', fontSize: '0.85rem' }}>
                    {en ? 'Responsible: ' : 'Responsable: '}<strong>José Moreno Jiménez</strong>
                </p>
            </section>

            <section style={tarjeta}>
                <h2 style={h2}>{en ? 'What you can write to us about' : 'Sobre qué puedes escribirnos'}</h2>
                <ul style={{ ...p, paddingLeft: '20px' }}>
                    <li>{en ? 'Corrections or additional information on a case or article.' : 'Correcciones o información adicional sobre un caso o artículo.'}</li>
                    <li>{en ? 'Testimonies, documents or leads for new case files.' : 'Testimonios, documentos o pistas para nuevos expedientes.'}</li>
                    <li>{en ? 'Collaborations and mentions of the project.' : 'Colaboraciones y menciones del proyecto.'}</li>
                    <li>{en ? 'Copyright or content removal requests.' : 'Solicitudes de derechos de autor o retirada de contenido.'}</li>
                    <li>{en ? 'Exercising your data protection rights (access, rectification, erasure).' : 'Ejercicio de tus derechos de protección de datos (acceso, rectificación, supresión).'}</li>
                </ul>
            </section>

            <section style={tarjeta}>
                <h2 style={h2}>{en ? 'Follow the archive' : 'Síguenos'}</h2>
                <p style={p}>
                    <a href="https://www.youtube.com/@expedientexgranaino" target="_blank" rel="noopener noreferrer" style={enlace}>YouTube</a>{' · '}
                    <a href="https://www.tiktok.com/@expedientexgranaino" target="_blank" rel="noopener noreferrer" style={enlace}>TikTok</a>{' · '}
                    <a href="https://www.instagram.com/expedientexgranaino/" target="_blank" rel="noopener noreferrer" style={enlace}>Instagram</a>{' · '}
                    <a href="https://x.com/PEPE1318057" target="_blank" rel="noopener noreferrer" style={enlace}>X</a>
                </p>
                <p style={{ ...p, fontSize: '0.85rem', color: '#4A5568' }}>
                    {en ? 'See also: ' : 'Consulta también: '}
                    <Link to="/sobre-nosotros" style={enlace}>{en ? 'About the project' : 'Sobre el proyecto'}</Link>{' · '}
                    <Link to="/privacidad" style={enlace}>{en ? 'Privacy' : 'Privacidad'}</Link>{' · '}
                    <Link to="/cookies" style={enlace}>Cookies</Link>{' · '}
                    <Link to="/aviso-legal" style={enlace}>{en ? 'Legal notice' : 'Aviso legal'}</Link>
                </p>
            </section>
        </div>
    );
};

export default Contacto;
