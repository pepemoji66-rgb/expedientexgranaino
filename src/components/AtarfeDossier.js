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
                <div className="stamped-declassified">{t('dossierAtarfeStamp')}</div>
                <h1 className="dossier-title">{t('dossierAtarfeTitle')}</h1>
                <p className="dossier-subtitle">{t('dossierAtarfeSubtitle')}</p>
                <div className="dossier-meta">
                    <span><strong>{t('dossierAtarfeAccessLabel')}</strong> {t('dossierAtarfeAccessValue')}</span>
                    <span><strong>{t('dossierAtarfeStatusLabel')}</strong> {t('dossierAtarfeStatusValue')}</span>
                </div>
            </header>

            <section className="dossier-intro-section">
                <div className="warning-box">
                    <p>{t('dossierAtarfeWarning')} <strong>{t('dossierAtarfeWarningBold')}</strong> {t('dossierAtarfeWarningText')}</p>
                </div>
                <div className="relato-full-content">
                    <h2 className="relato-title">{t('dossierAtarfeChronicleTitle')}</h2>
                    <div className="relato-text-block">
                        <p><strong>{t('dossierAtarfePhase1Label')}</strong></p>
                        <p>
                            {t('dossierAtarfePhase1Quote1')} <strong>{t('dossierAtarfePhase1SierraElvira')}</strong>{t('dossierAtarfePhase1Quote1End')}
                        </p>
                        <p>
                            <em>{t('dossierAtarfePhase1Quote2')}</em>
                        </p>
                        <hr className="dossier-divider" />
                        <p><strong>{t('dossierAtarfePhase2Label')}</strong></p>
                        <p>
                            {t('dossierAtarfePhase2Quote')} <strong>{t('dossierAtarfePhase2Albolote')}</strong> {t('dossierAtarfePhase2QuoteEnd')}
                        </p>
                    </div>
                </div>
            </section>

            <div className="dossier-grid">
                {/* FASE 1 */}
                <div className="dossier-section-block phase-1">
                    <h3 className="section-title-neon">{t('dossierAtarfePhase1Title')}</h3>
                    <p className="phase-desc">{t('dossierAtarfePhase1Desc')}</p>
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
                                    <div className="watermark-overlay top-left">{t('dossierAtarfeWatermarkTitle')}</div>
                                    <div className="watermark-overlay bottom-right">{t('dossierAtarfeWatermarkCopyright')}</div>
                                </div>
                                <div className="video-footer-technical">
                                    <h4>{vid.titulo.toUpperCase()}</h4>
                                    <p>{t('dossierAtarfePhase1EvidenceDesc')}</p>
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
                    <h3 className="section-title-neon">{t('dossierAtarfePhase2Title')}</h3>
                    <p className="phase-desc">{t('dossierAtarfePhase2Desc')}</p>
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
                                    <div className="watermark-overlay top-left">{t('dossierAtarfeWatermarkTitle')}</div>
                                    <div className="watermark-overlay bottom-right">{t('dossierAtarfeWatermarkCopyright')}</div>
                                </div>
                                <div className="video-footer-technical">
                                    <h4>{vid.titulo.toUpperCase()}</h4>
                                    <p>{t('dossierAtarfePhase2EvidenceDesc')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <footer className="dossier-footer-personal">
                <div className="mission-statement">
                    <h3 className="neon-text-blue">{t('dossierAtarfePurposeTitle')}</h3>
                    <p>{t('dossierAtarfePurposeText')}</p>
                    <p className="signature">{t('dossierAtarfeSignature')}</p>
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
