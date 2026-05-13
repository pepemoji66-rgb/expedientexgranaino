import React from 'react';

const PoliticaPrivacidad = () => {
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
                🛡️ POLÍTICA DE PRIVACIDAD
            </h1>
            
            <section style={{ marginBottom: '30px', border: '1px solid #333', padding: '20px', background: 'rgba(0,0,0,0.5)' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>1. INFORMACIÓN AL USUARIO</h2>
                <p><strong>Expediente X Granaino</strong> (en adelante, el Sitio Web), de conformidad con lo dispuesto en el Reglamento (UE) 2016/679 (GDPR) y la Ley Orgánica 3/2018 (LOPDGDD), le informa de que los datos personales que nos facilite serán tratados con la máxima confidencialidad y seguridad.</p>
                <p>Responsable del tratamiento: <strong>José Moreno Jiménez</strong>. Email: <strong>archipegv2@gmail.com</strong>.</p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>2. FINALIDAD Y LEGITIMACIÓN</h2>
                <p>Tratamos sus datos para:</p>
                <ul>
                    <li>Gestionar su registro como agente/colaborador.</li>
                    <li>Mantener la seguridad del búnker digital y prevenir accesos no autorizados.</li>
                    <li>Analizar el tráfico y la experiencia de usuario mediante herramientas estadísticas.</li>
                    <li>Mostrar publicidad personalizada basada en sus intereses (Google AdSense).</li>
                </ul>
                <p>La base legal para el tratamiento es el consentimiento expreso otorgado al aceptar esta política y el uso de cookies.</p>
            </section>

            <section style={{ marginBottom: '30px', border: '1px solid var(--color-principal)', padding: '15px', background: 'rgba(var(--rgb-principal), 0.05)' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>3. PUBLICIDAD DE TERCEROS (GOOGLE ADSENSE)</h2>
                <p>Este sitio web utiliza <strong>Google AdSense</strong> para mostrar anuncios. Google utiliza cookies para mostrar anuncios basados en las visitas anteriores de un usuario a este sitio web o a otros sitios web de Internet.</p>
                <p><strong>Cookies de publicidad:</strong> El uso de cookies de publicidad permite a Google y a sus socios mostrar anuncios basados en las visitas de los usuarios a sus sitios o a otros sitios de Internet.</p>
                <p>Usted puede inhabilitar la publicidad personalizada visitando <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-principal)' }}>Configuración de anuncios</a>. Alternativamente, puede inhabilitar el uso de cookies de un tercero para la publicidad personalizada visitando <a href="http://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-principal)' }}>www.aboutads.info</a>.</p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>4. ANÁLISIS DE DATOS (GOOGLE ANALYTICS)</h2>
                <p>Utilizamos <strong>Google Analytics</strong> para entender cómo interactúan los usuarios con el búnker. Esta herramienta utiliza cookies para recopilar información de forma anónima y elaborar informes de tendencias del sitio web sin identificar a usuarios individuales.</p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>5. DERECHOS ARCO</h2>
                <p>Usted tiene derecho a:</p>
                <ul>
                    <li><strong>Acceso:</strong> Saber qué datos estamos tratando.</li>
                    <li><strong>Rectificación:</strong> Corregir datos inexactos.</li>
                    <li><strong>Supresión:</strong> Solicitar el borrado de sus datos ("derecho al olvido").</li>
                    <li><strong>Oposición y Limitación:</strong> Oponerse al tratamiento o solicitar su limitación.</li>
                </ul>
                <p>Para ejercer estos derechos, contacte con <strong>archipegv2@gmail.com</strong> indicando su nombre y el derecho que desea ejercer.</p>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h2 style={{ color: 'var(--color-principal)', fontSize: '1.2rem' }}>6. CONSERVACIÓN DE DATOS</h2>
                <p>Los datos se conservarán mientras exista un interés mutuo para mantener el fin del tratamiento o cuando sea necesario por obligaciones legales. Cuando ya no sea necesario, se suprimirán con medidas de seguridad adecuadas para garantizar la seudonimización de los datos o la destrucción total de los mismos.</p>
            </section>

            <div style={{ textAlign: 'center', marginTop: '50px', fontSize: '0.7rem', color: '#666' }}>
                [ PROTOCOLO DE PRIVACIDAD ACTUALIZADO - MAYO 2026 ]
            </div>
        </div>
    );
};

export default PoliticaPrivacidad;

