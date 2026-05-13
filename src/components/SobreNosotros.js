import React from 'react';
import './SobreNosotros.css';

const SobreNosotros = () => {
    return (
        <div className="sobre-nosotros-container fade-in">
            <h1 className="titulo-neon">📂 DOSSIER DEL PROYECTO</h1>
            
            <section className="sobre-seccion">
                <h2 className="subtitulo-bunker">¿QUÉ ES EXPEDIENTEX GRANAINO?</h2>
                <p>
                    <strong>Expediente X Granaino</strong> no es solo una página web; es un repositorio digital táctico 
                    diseñado para centralizar y documentar el fenómeno paranormal, anómalo y ufológico, nacido en las tierras de Granada pero con un radar abierto a todo el mundo.
                </p>
                <p>
                    Desde el año 2024, nuestro objetivo ha sido proporcionar una plataforma segura para que investigadores, 
                    testigos y entusiastas de cualquier país puedan compartir sus experiencias sin temor al juicio, fomentando un <strong>intercambio cultural y de investigación</strong> que nos ayude a preservar la historia oculta de nuestro planeta.
                </p>

            </section>

            <div className="decor-line"></div>

            <section className="sobre-seccion">
                <h2 className="subtitulo-bunker">EL ORIGEN DEL BÚNKER</h2>
                <div className="perfil-investigador">
                    <div className="perfil-info">
                        <p>
                            Detrás de este búnker se encuentra <strong>José Moreno Jiménez</strong>, un aficionado al misterio cuya curiosidad se disparó tras grabar personalmente unos objetos a los que no encontró ninguna explicación (puedes ver la grabación original en nuestra sección de vídeos).
                        </p>
                        <p>
                            Ese suceso fue el motor que impulsó la creación de esta página. La idea nació con la necesidad de comparar aquel avistamiento con otros sucesos similares, al mismo tiempo que se recogen testimonios, leyendas y evidencias tanto de Granada como de cualquier parte del mundo. Aquí no buscamos imponer verdades, sino compartir preguntas.
                        </p>
                    </div>
                </div>
            </section>

            <section className="sobre-seccion">
                <h2 className="subtitulo-bunker">METODOLOGÍA DE ANÁLISIS</h2>
                <p>
                    En el Búnker de <strong>EXPEDIENTEXGRANAINO</strong>, seguimos un protocolo de validación para cada evidencia recibida. Nuestra metodología se basa en la triangulación de datos: combinamos testimonios directos de testigos con análisis visual y geolocalización precisa a través de nuestro radar interactivo.
                </p>
                <p>
                    Colaboramos con una red creciente de observadores independientes para verificar la veracidad de los reportes, asegurando que el material publicado mantenga un estándar de interés para la comunidad de investigación técnica de fenómenos UAP.
                </p>
            </section>


            <section className="sobre-seccion stats-bunker">
                <div className="stat-card">
                    <h3>MISIÓN</h3>
                    <p>Documentar lo inexplicable con rigor táctico internacional.</p>
                </div>
                <div className="stat-card">
                    <h3>VISIÓN</h3>
                    <p>Convertirse en un referente mundial en el archivo de fenomenología anómala.</p>
                </div>

                <div className="stat-card">
                    <h3>VALORES</h3>
                    <p>Veracidad, Neutralidad y Comunidad.</p>
                </div>
            </section>

            <div className="contacto-directo">
                <p>¿TIENES INFORMACIÓN CLASIFICADA? O SÍGUENOS EN REDES:</p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' }}>
                    <a href="mailto:archipegv2@gmail.com" className="btn-contacto-pro">EMAIL</a>
                    <a href="https://x.com/PEPE1318057" target="_blank" rel="noopener noreferrer" className="btn-contacto-pro" style={{ background: '#000', borderColor: '#333' }}>X (TWITTER)</a>
                    <a href="https://www.instagram.com/expedientexgranaino/" target="_blank" rel="noopener noreferrer" className="btn-contacto-pro" style={{ background: '#e1306c', borderColor: '#c13584' }}>INSTAGRAM</a>
                </div>
            </div>
        </div>
    );
};

export default SobreNosotros;
