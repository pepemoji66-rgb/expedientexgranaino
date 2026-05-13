import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './AtarfeDossier.css';

const AtarfeDossier = () => {
    const [evidencias, setEvidencias] = useState({ videos: [], imagenes: [] });
    const [cargando, setCargando] = useState(true);
    const [expandida, setExpandida] = useState(null);

    // --- ESTADOS DE ZOOM Y PAN PARA EL DOSSIER ---
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const handleWheel = (e) => {
        // Zoom con la rueda del ratón
        const delta = e.deltaY * -0.001;
        const newZoom = Math.min(Math.max(1, zoom + delta), 8); // Hasta 8x de zoom táctico
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

                // Filtramos por Atarfe o por los nombres de archivo que sabemos que son de allí
                const videosAtarfe = resV.data.filter(v => 
                    (v.titulo && v.titulo.toLowerCase().includes('atarfe')) || 
                    ['1.mp4', '2.mp4', '3.mp4', '4.mp4'].includes(v.url)
                );

                const imagenesAtarfe = resI.data.filter(img => {
                    // Prioridad 1: Marcado manual en Admin
                    if (img.es_atarfe === 1) return true;
                    
                    // Prioridad 2: Palabras clave (por si acaso)
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

    if (cargando) return <div className="dossier-loader">📡 DESCLASIFICANDO ARCHIVO...</div>;

    return (
        <div className="atarfe-dossier-container">
            <header className="dossier-header">
                <div className="stamped-declassified">TOP SECRET / UNCLASSIFIED</div>
                <h1 className="dossier-title">INFORME TÉCNICO: INCIDENTE ATARFE</h1>
                <p className="dossier-subtitle">TECHNICAL REPORT: ATARFE INCIDENT (GRANADA, SPAIN)</p>
                <div className="dossier-meta">
                    <span><strong>NIVEL DE ACCESO:</strong> 4 - ARCHIVERO CENTRAL</span>
                    <span><strong>ESTADO:</strong> EN ANÁLISIS INTERNACIONAL (MUFON)</span>
                </div>
            </header>

            <section className="dossier-intro-section">
                <div className="warning-box">
                    <p>⚠️ <strong>AVISO:</strong> El siguiente material contiene grabaciones originales sin editar. La calidad del audio y vídeo responde a las condiciones de campo en el momento del avistamiento.</p>
                </div>
                <div className="relato-full-content">
                    <h2 className="relato-title">CRÓNICA DEL INCIDENTE: EL TESTIMONIO</h2>
                    <div className="relato-text-block">
                        <p><strong>FASE 1: AGOSTO 2021 (SIERRA ELVIRA)</strong></p>
                        <p>
                            "Nos encontrábamos mi pareja y yo en la terraza de mi piso, era agosto del 2021. Estábamos tomando una copa de vino cuando observé una especie de avión que me llamó mucho la atención. Estamos acostumbrados a ver aviones por el aeropuerto cercano, pero este era muy raro. Al llegar a la altura de <strong>Sierra Elvira</strong>, se paró en seco. Cambió de dirección, como si fuese marcha atrás, cambió de altura... Fui a por el móvil corriendo, un Huawei, y así grabé el primer vídeo donde se ve un solo objeto."
                        </p>
                        <p>
                            <em>"Lo analicé en una televisión grande y me quedé alucinado: no se apagó, salió disparado dejando una estela. No había ningún sonido anormal."</em>
                        </p>
                        <hr className="dossier-divider" />
                        <p><strong>FASE 2: JUNIO 2022 (ALBOLOTE)</strong></p>
                        <p>
                            "Me quedé obsesionado, lo mandé a Cuarto Milenio por WhatsApp y nadie me escuchó. Un año después, en junio de 2022, salí a la terraza a fumar y, como siempre desde el primer incidente, miré al cielo. Sobre la vertical de <strong>Albolote</strong> aparecieron dos objetos similares al primero. Grabé todo lo que pude; se ven los tejados de los bloques de enfrente como referencia. De nuevo, silencio absoluto, solo el tráfico de la calle."
                        </p>
                    </div>
                </div>
            </section>

            <div className="dossier-grid">
                {/* FASE 1: EL INCIDENTE DEL "DRON" (AGOSTO 2021) */}
                <div className="dossier-section-block phase-1">
                    <h3 className="section-title-neon">FASE 1: EL ENCUENTRO INICIAL (AGOSTO 2021)</h3>
                    <p className="phase-desc">Registro de audio crítico. Debate sobre la naturaleza del objeto: "Un dron, los cojones..."</p>
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
                                    <div className="watermark-overlay top-left">VIDEO ORIGINAL EXPEDIENTEXGRANAINO</div>
                                    <div className="watermark-overlay bottom-right">© INVESTIGACIÓN ATARFE - PROPIEDAD DEL BÚNKER</div>
                                </div>
                                <div className="video-footer-technical">
                                    <h4>{vid.titulo.toUpperCase()}</h4>
                                    <p>Evidencia de objeto único con maniobras imposibles sobre Sierra Elvira.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* GALERÍA DE CAPTURAS DE ANÁLISIS (INTEGRADA) */}
                <div className="dossier-section-block">
                    <h3 className="section-title-neon">ANÁLISIS DE CAPTURAS (EXTRACCIONES DE VÍDEO)</h3>
                    <p className="phase-desc">Capturas extraídas del análisis en pantalla de gran formato. Se observa la estela de propulsión.</p>
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
                                    <span>AMPLIAR EVIDENCIA / ENLARGE</span>
                                </div>
                                <div className="img-security-overlay-mini"></div>
                                <div className="img-watermark-mini">© EXPEDIENTEXGRANAINO</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FASE 2: EL RETORNO (JUNIO 2022) */}
                <div className="dossier-section-block phase-2">
                    <h3 className="section-title-neon">FASE 2: EL RETORNO (JUNIO 2022)</h3>
                    <p className="phase-desc">Avistamiento dual sobre la vertical de Albolote. Dos esferas en formación coordinada.</p>
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
                                    <div className="watermark-overlay top-left">VIDEO ORIGINAL EXPEDIENTEXGRANAINO</div>
                                    <div className="watermark-overlay bottom-right">© INVESTIGACIÓN ATARFE - PROPIEDAD DEL BÚNKER</div>
                                </div>
                                <div className="video-footer-technical">
                                    <h4>{vid.titulo.toUpperCase()}</h4>
                                    <p>Registro visual de dos objetos luminosos. Referencia visual: Tejado de bloques frontales.</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <footer className="dossier-footer-personal">
                <div className="mission-statement">
                    <h3 className="neon-text-blue">EL PROPÓSITO DE ESTE ARCHIVO</h3>
                    <p>
                        "A consecuencia de estos avistamientos, realicé un curso de confección y publicación de páginas web. 
                        El motivo principal de este Búnker es dar a conocer estos vídeos y capturas al mundo entero. 
                        Mi único objetivo es que, si algún experto llega a ver este material, pueda explicarme qué fue lo que vi esa noche. 
                        Solo entonces podré quedarme tranquilo."
                    </p>
                    <p className="signature">— El Investigador</p>
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
                            {/* Capa invisible para evitar guardar imagen con botón derecho */}
                            <div className="img-security-overlay" style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 10,
                                pointerEvents: zoom > 1 ? 'none' : 'auto' 
                            }}></div>

                            {/* MARCA DE AGUA FIJA PARA PROTECCIÓN DE GRABACIÓN DE PANTALLA */}
                            <div className="modal-security-watermark">
                                <span>ARCHIVO ORIGINAL: EXPEDIENTEXGRANAINO.COM</span>
                                <span>INVESTIGACIÓN ATARFE - PROPIEDAD EXCLUSIVA</span>
                            </div>
                        </div>
                        <div className="modal-data-technical">
                            <h3>{expandida.titulo.toUpperCase()}</h3>
                            <p>{expandida.descripcion}</p>
                            <div className="technical-specs">
                                <span>SENSOR: OPTICAL FIELD UNIT</span>
                                <span>SECTOR: ATARFE (GRANADA)</span>
                                <span>COORDINATES: {expandida.latitud}, {expandida.longitud}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AtarfeDossier;
