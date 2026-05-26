import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import './AtarfeDossier.css';

const AtarfeDossier = () => {
    const { t } = useLanguage();
    const [evidencias, setEvidencias] = useState({ videos: [], imagenes: [] });
    const [cargando, setCargando] = useState(true);
    const [expandida, setExpandida] = useState(null);

    // --- ESTADOS DE ZOOM Y PAN PARA EL DOSSIER ---
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const handleWheel = (e) => {
        const delta = e.deltaY * -0.001;
        const newZoom = Math.min(Math.max(1, zoom + delta), 8);
        setZoom(newZoom);
        if (newZoom === 1) setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setIsDragging(true);
            setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const resetZoom = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setIsDragging(false);
    };

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const [resV, resI] = await Promise.all([
                    axios.get(`${API_BASE_URL}/api/videos/publicos`),
                    axios.get(`${API_BASE_URL}/api/galeria/imagenes-publicas`)
                ]);

                const videosAtarfe = resV.data.filter(v =>
                    (v.titulo && v.titulo.toLowerCase().includes('atarfe')) ||
                    ['1.mp4', '2.mp4', '3.mp4', '4.mp4'].includes(v.url)
                );

                const imagenesAtarfe = resI.data.filter(img => {
                    if (img.es_atarfe === 1) return true;
                    const textoBusqueda = `${img.url_imagen || ''} ${img.titulo || ''} ${img.descripcion || ''}`.toLowerCase();
                    return textoBusqueda.includes('atarfe') ||
                           textoBusqueda.includes('sierra elvira') ||
                           textoBusqueda.includes('albolote') ||
                           (textoBusqueda.includes('captura') && textoBusqueda.includes('objeto'));
                });

                setEvidencias({ videos: videosAtarfe, imagenes: imagenesAtarfe });
            } catch (err) {
                console.error("Error al cargar el Dossier Atarfe:", err);
            } finally {
                setCargando(false);
            }
        };
        cargarDatos();
    }, []);

    if (cargando) return <div className="dossier-loader">{t('dossierAtarfeLoading')}</div>;

    return (
        <div className="atarfe-dossier-container">
            <header className="dossier-header">
                <div className="stamped-declassified">CONFIDENCIAL / NIVEL 4</div>
                <h1 className="dossier-title">🛸 Caso OVNI en Granada: El Incidente Atarfe y Albolote</h1>
                <div className="dossier-meta">
                    <span><strong>Nivel de Acceso:</strong> 4 - Archivero Central</span>
                    <span><strong>Estado de la Investigación:</strong> En análisis internacional por MUFON (Mutual UFO Network).</span>
                </div>
            </header>

            <section className="dossier-intro-section">
                <div className="warning-box">
                    <p>⚠️ <strong>Aviso del Búnker:</strong> El siguiente material contiene grabaciones y evidencias originales sin editar. La calidad de los archivos de audio y vídeo responde estrictamente a las condiciones de campo en el momento del avistamiento.</p>
                </div>
                
                <div className="relato-full-content">
                    <h2 className="relato-title">📅 Crónica del Incidente: El Testimonio Real</h2>
                    <p>¿Qué ocurrió realmente en el cielo de Granada? Compartimos de forma íntegra el impactante testimonio directo de los testigos que presenciaron este fenómeno anómalo en la provincia.</p>
                    
                    <h3 className="section-title-neon" style={{ marginTop: '30px' }}>📍 Fase 1: Agosto 2021 | El avistamiento en Sierra Elvira</h3>
                    <div className="relato-text-block">
                        <blockquote style={{ borderLeft: '4px solid #b18904', paddingLeft: '15px', color: '#ccc', fontStyle: 'italic', margin: '15px 0' }}>
                            "Nos encontrábamos mi pareja y yo en la terraza de mi piso, era agosto del 2021. Estábamos tomando una copa de vino cuando observé una especie de avión que me llamó mucho la atención. Estamos acostumbrados a ver aviones por el aeropuerto cercano, pero este era muy raro."
                        </blockquote>
                        <blockquote style={{ borderLeft: '4px solid #b18904', paddingLeft: '15px', color: '#ccc', fontStyle: 'italic', margin: '15px 0' }}>
                            "Al llegar a la altura de Sierra Elvira, se paró en seco. Cambió de dirección, como si fuese marcha atrás, cambió de altura... Fui a por el móvil corriendo, un Huawei, y así grabé el primer vídeo donde se ve un solo objeto."
                        </blockquote>
                        <blockquote style={{ borderLeft: '4px solid #b18904', paddingLeft: '15px', color: '#ccc', fontStyle: 'italic', margin: '15px 0' }}>
                            "Lo analicé en una televisión grande y me quedé alucinado: no se apagó, salió disparado dejando una estela. No había ningún sonido anormal."
                        </blockquote>
                    </div>
                </div>
            </section>

            <div className="dossier-grid">
                {/* FASE 1 */}
                <div className="dossier-section-block phase-1">
                    <h2 className="section-title-neon">📁 Evidencias de la Fase 1: El Encuentro Inicial</h2>
                    <p className="phase-desc">A continuación, mostramos el registro de audio crítico y el debate en caliente sobre la naturaleza de las luces sobre Sierra Elvira. En la grabación se aprecia la sorpresa de los testigos al descartar explicaciones convencionales: "Un dron, los cojones...".</p>
                    <ul style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>
                        <li><strong>Archivo de Vídeo:</strong> FILE: 4.mp4 (ID: #7)</li>
                        <li><strong>Origen:</strong> Video original de la comunidad de ExpedienteXGranaino.</li>
                        <li><strong>Análisis de Capturas:</strong> Extracciones de vídeo analizadas en pantalla de gran formato. En el análisis visual se observa con claridad la estela de propulsión y maniobras imposibles para la tecnología aeronáutica conocida.</li>
                    </ul>
                    
                    <div className="videos-atarfe-grid">
                        {evidencias.videos.filter(v => v.url === '4.mp4').map(vid => (
                            <div key={vid.id} className="atarfe-video-card priority-high">
                                <div className="video-header-technical">
                                    <span>FILE: {vid.url}</span>
                                    <span>ID: #{vid.id}</span>
                                    <span className="status-tag">AUDIO CAPTURED</span>
                                </div>
                                <div className="video-player-container" onContextMenu={e => e.preventDefault()}>
                                    <video controls preload="metadata">
                                        <source src={`${API_BASE_URL}/videos/${vid.url}`} type="video/mp4" />
                                    </video>
                                    <div className="watermark-overlay top-left">EXPEDIENTEXGRANAINO</div>
                                    <div className="watermark-overlay bottom-right">© ARCHIVO CONFIDENCIAL</div>
                                </div>
                                <div className="video-footer-technical">
                                    <h4>{vid.titulo.toUpperCase()}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GALERÍA DE CAPTURAS */}
                <div className="dossier-section-block">
                    <h3 className="section-title-neon">{t('dossierAtarfeCapturesTitle')}</h3>
                    <p className="phase-desc">{t('dossierAtarfeCapturesDesc')}</p>
                    <div className="capturas-atarfe-grid">
                        {evidencias.imagenes.map(img => (
                            <div key={img.id} className="atarfe-img-card" onClick={() => { resetZoom(); setExpandida(img); }} onContextMenu={e => e.preventDefault()}>
                                <img
                                    src={img.url_imagen.startsWith('http') ? img.url_imagen : "/" + img.url_imagen}
                                    alt={img.titulo}
                                    onContextMenu={e => e.preventDefault()}
                                    onDragStart={e => e.preventDefault()}
                                />
                                <div className="img-overlay-technical">
                                    <span>{t('dossierAtarfeEnlarge')}</span>
                                </div>
                                <div className="img-security-overlay-mini"></div>
                                <div className="img-watermark-mini">© EXPEDIENTEXGRANAINO</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FASE 2 */}
                <div className="dossier-section-block phase-2">
                    <h3 className="section-title-neon">📍 Fase 2: Junio 2022 | El Retorno sobre la vertical de Albolote</h3>
                    <p className="phase-desc">La obsesión lógica tras el primer encuentro llevó a mantener la vigilancia en el cielo granadino. Un año después, el fenómeno volvió a manifestarse de forma múltiple.</p>
                    <div className="relato-text-block">
                        <blockquote style={{ borderLeft: '4px solid #b18904', paddingLeft: '15px', color: '#ccc', fontStyle: 'italic', margin: '15px 0' }}>
                            "Me quedé obsesionado, lo mandé a Cuarto Milenio por WhatsApp y nadie me escuchó. Un año después, en junio de 2022, salí a la terraza a fumar y, como siempre desde el primer incidente, miré al cielo."
                        </blockquote>
                        <blockquote style={{ borderLeft: '4px solid #b18904', paddingLeft: '15px', color: '#ccc', fontStyle: 'italic', margin: '15px 0' }}>
                            "Sobre la vertical de Albolote aparecieron dos objetos similares al primero. Grabé todo lo que pude; se ven los tejados de los bloques de enfrente como referencia. De nuevo, silencio absoluto, solo el tráfico de la calle."
                        </blockquote>
                    </div>

                    <h2 className="section-title-neon" style={{ marginTop: '40px' }}>📁 Evidencias de la Fase 2: Avistamiento Dual y Coordinado</h2>
                    <p className="phase-desc">El segundo encuentro no dejó lugar a dudas. No era un objeto aislado, sino un fenómeno coordinado sobre los bloques de viviendas.</p>
                    <ul style={{ color: '#ccc', marginBottom: '20px', lineHeight: '1.6' }}>
                        <li><strong>Registro Visual Coordenado:</strong> Dos esferas luminosas en formación coordinada realizando movimientos anómalos en absoluto silencio.</li>
                        <li><strong>Archivo de Vídeo Principal:</strong> FILE: 3.mp4 (ID: #6)</li>
                        <li><strong>Archivos de Respaldo y Referencia:</strong> Registros adicionales en formato de vídeo digital correspondientes a las secuencias FILE: 2.mp4 (ID: #5), FILE: 3.mp4 (ID: #3), FILE: 2.mp4 (ID: #2) y FILE: 1.mp4 (ID: #1). En estos registros visuales de objetos luminosos se utilizaron los tejados de los bloques frontales como referencia métrica y de posición.</li>
                    </ul>

                    <div className="videos-atarfe-grid">
                        {evidencias.videos.filter(v => v.url !== '4.mp4').map(vid => (
                            <div key={vid.id} className="atarfe-video-card">
                                <div className="video-header-technical">
                                    <span>FILE: {vid.url}</span>
                                    <span>ID: #{vid.id}</span>
                                </div>
                                <div className="video-player-container" onContextMenu={e => e.preventDefault()}>
                                    <video controls preload="metadata">
                                        <source src={`${API_BASE_URL}/videos/${vid.url}`} type="video/mp4" />
                                    </video>
                                    <div className="watermark-overlay top-left">EXPEDIENTEXGRANAINO</div>
                                    <div className="watermark-overlay bottom-right">© ARCHIVO CONFIDENCIAL</div>
                                </div>
                                <div className="video-footer-technical">
                                    <h4>{vid.titulo.toUpperCase()}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <footer className="dossier-footer-personal">
                <div className="mission-statement">
                    <h2 className="neon-text-blue">🔍 Conclusión de la Investigación en el Búnker</h2>
                    <p>El Incidente Atarfe se consolida como uno de los expedientes de contacto y avistamiento OVNI más documentados de los últimos años en Andalucía. La ausencia de sonido, las paradas en seco y los cambios de dirección descartan aviación comercial o drones convencionales. Actualmente, el caso sigue abierto bajo el escrutinio de analistas de la red internacional MUFON.</p>
                    <p className="signature">`© INVESTIGACIÓN ATARFE - PROPIEDAD EXCLUSIVA DEL BÚNKER (EXPEDIENTEXGRANAINO)`</p>
                </div>
            </footer>

            {expandida && (
                <div className="dossier-overlay-full" onClick={() => setExpandida(null)} onContextMenu={e => e.preventDefault()}>
                    <div className="modal-dossier-content" onClick={e => e.stopPropagation()}>
                        <button className="close-dossier" onClick={() => setExpandida(null)}>×</button>
                        <div className="protected-img-wrapper"
                             style={{
                                 position: 'relative',
                                 overflow: 'hidden',
                                 background: '#000',
                                 cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                                 minHeight: '400px',
                                 display: 'flex',
                                 alignItems: 'center',
                                 justifyContent: 'center'
                             }}
                             onWheel={handleWheel}
                             onMouseDown={handleMouseDown}
                             onMouseMove={handleMouseMove}
                             onMouseUp={handleMouseUp}
                             onMouseLeave={handleMouseUp}
                        >
                            {expandida.tipo === 'video' ? (
                                <video
                                    src={`${API_BASE_URL}/videos/${expandida.url}`}
                                    controls
                                    autoPlay
                                    loop
                                    onContextMenu={e => e.preventDefault()}
                                    controlsList="nodownload"
                                    disablePictureInPicture
                                    style={{
                                        width: '100%',
                                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                        pointerEvents: zoom > 1 ? 'none' : 'auto'
                                    }}
                                />
                            ) : (
                                <img
                                    src={expandida.url_imagen.startsWith('http') ? expandida.url_imagen : "/" + expandida.url_imagen}
                                    alt={expandida.titulo}
                                    onContextMenu={e => e.preventDefault()}
                                    onDragStart={e => e.preventDefault()}
                                    style={{
                                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                        pointerEvents: 'auto',
                                        userSelect: 'none',
                                        maxWidth: '100%',
                                        maxHeight: '80vh',
                                        objectFit: 'contain',
                                        display: 'block'
                                    }}
                                />
                            )}
                            {/* Capa de seguridad anti-descarga */}
                            <div className="img-security-overlay" style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 10,
                                pointerEvents: zoom > 1 ? 'none' : 'auto'
                            }}></div>

                            {/* Marca de agua modal */}
                            <div className="modal-security-watermark">
                                <span>{t('dossierAtarfeModalWatermark1')}</span>
                                <span>{t('dossierAtarfeModalWatermark2')}</span>
                            </div>
                        </div>
                        <div className="modal-data-technical">
                            <h3>{expandida.titulo.toUpperCase()}</h3>
                            <p>{expandida.descripcion}</p>
                            <div className="technical-specs">
                                <span>{t('dossierAtarfeSensorLabel')}</span>
                                <span>{t('dossierAtarfeSectorLabel')}</span>
                                <span>{t('dossierAtarfeCoordLabel')} {expandida.latitud}, {expandida.longitud}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AtarfeDossier;
