import React from 'react';

const PoliticaCookies = () => {
    return (
        <div className="legal-container fade-in" style={{
            padding: '120px 20px 60px',
            maxWidth: '900px',
            margin: '0 auto',
            color: '#ccc',
            fontFamily: 'monospace',
            lineHeight: '1.6'
        }}>
            <h1 className="titulo-neon" style={{ color: 'var(--color-principal)', textAlign: 'center', marginBottom: '40px' }}>
                🍪 POLÍTICA DE COOKIES
            </h1>
            
            <section style={{ marginBottom: '30px', border: '1px solid #333', padding: '20px', background: 'rgba(0,0,0,0.5)' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>1. ¿QUÉ SON LAS COOKIES?</h2>
                <p>Una cookie es un fichero que se descarga en su ordenador al acceder a determinadas páginas web. Las cookies permiten a una página web, entre otras cosas, almacenar y recuperar información sobre los hábitos de navegación de un usuario o de su equipo.</p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>2. TIPOS DE COOKIES QUE UTILIZA ESTE SITIO</h2>
                <ul>
                    <li><strong>Cookies Técnicas:</strong> Necesarias para el funcionamiento del búnker y la gestión de sesiones.</li>
                    <li><strong>Cookies de Análisis:</strong> Aquellas que, tratadas por nosotros o por terceros (Google Analytics), nos permiten cuantificar el número de usuarios y realizar la medición y análisis estadístico del uso que hacen los usuarios del servicio ofertado.</li>
                    <li><strong>Cookies Publicitarias:</strong> Aquellas que, tratadas por nosotros o por terceros (Google AdSense), nos permiten gestionar de la forma más eficaz posible la oferta de los espacios publicitarios que hay en la página web.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '30px', border: '1px solid var(--color-principal)', padding: '15px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>3. COOKIES DE TERCEROS</h2>
                <p>Este sitio web utiliza servicios de terceros para recopilar información con fines estadísticos y de publicidad. En particular, utilizamos los servicios de <strong>Google Analytics</strong> y <strong>Google AdSense</strong> para nuestras estadísticas y publicidad.</p>
                <p>Algunas cookies son esenciales para el funcionamiento del sitio, por ejemplo el buscador incorporado o la gestión del acceso táctico.</p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>4. CÓMO DESACTIVAR LAS COOKIES</h2>
                <p>Usted puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones del navegador instalado en su ordenador:</p>
                <ul>
                    <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-principal)' }}>Google Chrome</a></li>
                    <li><a href="https://support.microsoft.com/es-es/windows/eliminar-y-administrar-cookies-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-principal)' }}>Microsoft Edge / Explorer</a></li>
                    <li><a href="https://support.mozilla.org/es/kb/habilitar-y-deshabilitar-cookies-sitios-web-rastrear-preferencias" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-principal)' }}>Mozilla Firefox</a></li>
                    <li><a href="https://support.apple.com/es-es/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-principal)' }}>Safari</a></li>
                    <li><a href="https://help.opera.com/en/latest/web-preferences/#cookies" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-principal)' }}>Opera</a></li>
                </ul>
                <p>Si decide bloquear las cookies, es posible que algunas funciones del búnker no estén disponibles o no funcionen correctamente.</p>
            </section>

            <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '0.7rem', color: '#666' }}>
                [ PROTOCOLO DE COOKIES ACTUALIZADO - MAYO 2026 ]
            </div>
        </div>
    );
};

export default PoliticaCookies;

