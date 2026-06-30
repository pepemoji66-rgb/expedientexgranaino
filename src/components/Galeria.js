import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './galeria.css';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../config';

const Galeria = ({ userAuth }) => {
    const { language, t } = useLanguage();
    // --- ESTADOS BLINDADOS ---
    const [registros, setRegistros] = useState({
        'noticias': [],
        'relatos': [],
        'misterios': [],
        'truecrime': []
    });

    const [pestanaActiva, setPestanaActiva] = useState('noticias');
    const [paginaActual, setPaginaActual] = useState(1);
    const [fotoExpandida, setFotoExpandida] = useState(null);
    const [cargando, setCargando] = useState(true);

    // --- ESTADOS DE ZOOM Y PAN ---
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const navigate = useNavigate();
    const imagenesPorPagina = 8;

    const config = {
        'noticias': { 
            urlBase: `${API_BASE_URL}/imagenes/`, 
            columna: 'imagen_url', 
            etiqueta: t('galleryTabNews')
        },
        'relatos': {
            urlBase: `${API_BASE_URL}/imagenes/`,
            columna: 'imagen_url',
            etiqueta: t('galleryTabStories')
        },
        'misterios': {
            urlBase: `${API_BASE_URL}/imagenes/`,
            columna: 'imagen_url',
            etiqueta: t('galleryTabMisterios') || 'MISTERIOS'
        },
        'truecrime': {
            urlBase: `${API_BASE_URL}/imagenes/`,
            columna: 'imagen_url',
            etiqueta: t('galleryTabTrueCrime') || 'TRUE CRIME'
        }
    };

    const getBadgeInfo = (img) => {
        if (img.tipo === 'noticia') return { text: t('badgeNews') || '📰 NOTICIA', color: '#00d4ff' };
        if (img.tipo === 'misterio') return { text: t('badgeMystery') || '👽 MISTERIO HISTÓRICO', color: '#ffb100' };
        if (img.tipo === 'caso') return { text: t('badgeTrueCrime') || '🛡️ CASO REAL / TRUE CRIME', color: '#ff4757' };
        if (img.subtipo === 'jefe' || img.tipo === 'jefe') return { text: t('badgeTrueCrime') || '🛡️ CASO REAL / TRUE CRIME', color: '#ff4757' };
        return { text: t('badgeAgentExp') || '👤 EXPEDIENTE AGENTE', color: '#2ed573' };
    };

    const cargarImagenes = useCallback(async () => {
        try {
            setCargando(true);
            const [resN, resE1, resE2, resM, resC] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/galeria/noticias-publicas`),
                axios.get(`${API_BASE_URL}/api/expedientes/expedientes-publicos`),
                axios.get(`${API_BASE_URL}/api/expedientes/relatos-admin-publicos`),
                axios.get(`${API_BASE_URL}/api/misterios-historicos`),
                axios.get(`${API_BASE_URL}/api/casos`)
            ]);

            // Noticias con imagen
            const noticiasData = Array.isArray(resN.data) ? resN.data : (resN.data?.data || []);
            const noticiasConImagen = noticiasData.filter(n => n.imagen_url).map(n => ({
                ...n,
                id: `noticia-${n.id}`,
                tipo: 'noticia'
            }));

            // Relatos con imagen (separando Agentes y Jefe)
            const resE1Data = Array.isArray(resE1.data) ? resE1.data : [];
            const resE2Data = Array.isArray(resE2.data) ? resE2.data : [];
            
            const relatosAgente = resE1Data.filter(e => e.imagen_url).map(e => ({
                ...e,
                id: `exp-${e.id}`,
                tipo: 'expediente',
                subtipo: 'agente',
                esRelato: true
            }));

            const relatosJefe = resE2Data.filter(e => e.imagen_url).map(e => ({
                ...e,
                id: `exp-${e.id}`,
                tipo: 'expediente',
                subtipo: 'jefe',
                esRelato: true
            }));

            const relatosConImagen = [...relatosAgente, ...relatosJefe];

            // Misterios con imagen
            const misteriosData = Array.isArray(resM.data) ? resM.data : [];
            const misteriosConImagen = misteriosData.filter(m => m.imagen_url).map(m => ({
                ...m,
                id: `misterio-${m.id}`,
                tipo: 'misterio'
            }));

            // Casos (True Crime) con imagen
            const casosData = Array.isArray(resC.data) ? resC.data : [];
            const casosConImagen = casosData.filter(c => c.imagen_url).map(c => ({
                ...c,
                id: `caso-${c.id}`,
                tipo: 'caso'
            }));

            setRegistros({
                'noticias': noticiasConImagen,
                'relatos': relatosConImagen,
                'misterios': misteriosConImagen,
                'truecrime': casosConImagen
            });
        } catch (err) {
            console.error("❌ ERROR AL CARGAR GALERÍA:", err);
            setRegistros({ 'noticias': [], 'relatos': [], 'misterios': [], 'truecrime': [] });
        } finally {
            setCargando(false);
        }
    }, [t]);

    useEffect(() => {
        cargarImagenes();
    }, [cargarImagenes]);

    const verEnMapa = (img) => {
        if (!img.latitud || !img.longitud || parseFloat(img.latitud) === 0) {
            alert(t('galleryNoLocation'));
            return;
        }
        const payload = {
            lat: img.latitud,
            lng: img.longitud,
            noticiaId: img.id
        };
        navigate('/lugares', { state: payload });
    };

    const compartirEvidencia = async (img, red) => {
        const url = `${window.location.origin}/galeria`;
        const texto = `🛸 ¡NUEVA EVIDENCIA! "${(img.titulo || img.nombre)?.toUpperCase()}" @PEPE1318057 @MUFON #UFO #Granada #ExpedienteXGranaino`;

        if (navigator.share && red !== 'copy' && red !== 'instagram') {
            try {
                await navigator.share({
                    title: 'BÚNKER EXPEDIENTE X',
                    text: texto,
                    url: url,
                });
                return;
            } catch (err) {}
        }

        let link = '';
        if (red === 'twitter') {
            link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
        } else if (red === 'whatsapp') {
            link = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto + ' ' + url)}`;
        } else if (red === 'instagram') {
            try {
                const fullText = `${texto} ${url}`;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(fullText);
                } else {
                    const input = document.createElement('textarea');
                    input.value = fullText;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                }
                alert(t('galleryCopyAlert'));
                link = `https://www.instagram.com/expedientexgranaino/`;
            } catch (err) {}
        }

        if (link) {
            window.open(link, '_blank');
        } else {
            try {
                const fullText = `${texto} ${url}`;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(fullText);
                } else {
                    const input = document.createElement('textarea');
                    input.value = fullText;
                    document.body.appendChild(input);
                    input.select();
                    document.execCommand('copy');
                    document.body.removeChild(input);
                }
                alert(t('galleryCopyAlert'));
            } catch (err) {}
        }
    };

    const handleImgError = (e) => {
        e.target.onerror = null;
        e.target.src = "https://placehold.co/500x350?text=ARCHIVO+CLASIFICADO";
    };

    const handleWheel = (e) => {
        const delta = e.deltaY * -0.001;
        const newZoom = Math.min(Math.max(1, zoom + delta), 6);
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
            setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const resetZoom = () => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setIsDragging(false);
    };

    const confActual = config[pestanaActiva];
    const listaActual = registros[pestanaActiva] || [];
    const totalPaginas = Math.ceil(listaActual.length / imagenesPorPagina);
    const imagenesActuales = Array.isArray(listaActual) ? listaActual.slice((paginaActual - 1) * imagenesPorPagina, paginaActual * imagenesPorPagina) : [];

    return (
        <div className="galeria-page">
            <header className="galeria-header">
                <div className="linea-neon-superior"></div>
                <h1 className="titulo-neon">{t('galleryTitle')}</h1>
                <p className="subtitle">{t('galleryAccessLevel')} {userAuth?.rol?.toUpperCase() || 'INVITADO'}</p>
                <button className="btn-subir-galeria-top" onClick={() => navigate('/expedientes')}>
                    <span className="icon">📝</span> {t('galleryWriteStory')}
                </button>
            </header>

            <nav className="pestanas-galeria-container">
                <div className="pestanas-galeria-wrapper">
                    <button className={`btn-pestana-moderno ${pestanaActiva === 'noticias' ? 'active' : ''}`} onClick={() => { setPestanaActiva('noticias'); setPaginaActual(1); }}>
                        <span className="icon-folder">📰</span>
                        <span className="text-folder">{t('galleryTabNews')}</span>
                        <div className="indicator-neon"></div>
                    </button>
                    <button className={`btn-pestana-moderno ${pestanaActiva === 'relatos' ? 'active' : ''}`} onClick={() => { setPestanaActiva('relatos'); setPaginaActual(1); }}>
                        <span className="icon-folder">📜</span>
                        <span className="text-folder">{t('galleryTabStories')}</span>
                        <div className="indicator-neon"></div>
                    </button>
                    <button className={`btn-pestana-moderno ${pestanaActiva === 'misterios' ? 'active' : ''}`} onClick={() => { setPestanaActiva('misterios'); setPaginaActual(1); }}>
                        <span className="icon-folder">👽</span>
                        <span className="text-folder">{t('galleryTabMisterios') || 'MISTERIOS'}</span>
                        <div className="indicator-neon"></div>
                    </button>
                    <button className={`btn-pestana-moderno ${pestanaActiva === 'truecrime' ? 'active' : ''}`} onClick={() => { setPestanaActiva('truecrime'); setPaginaActual(1); }}>
                        <span className="icon-folder">💀</span>
                        <span className="text-folder">{t('galleryTabTrueCrime') || 'TRUE CRIME'}</span>
                        <div className="indicator-neon"></div>
                    </button>
                </div>
            </nav>

            <main className="galeria-main-content">
                <div className="galeria-grid">
                    {imagenesActuales.length > 0 ? (
                        imagenesActuales.map((img) => {
                            const nombreArchivo = img[confActual.columna];
                            let rutaImg = nombreArchivo?.startsWith('http') ? nombreArchivo : `${confActual.urlBase}${nombreArchivo}`;
                            return (
                                <article key={img.id} className="card-imagen-completa" onClick={() => { resetZoom(); setFotoExpandida({ ...img, rutaCompleta: rutaImg }); }}>
                                    <div className="contenedor-img-wrapper">
                                        <img src={rutaImg} alt={img.titulo || img.nombre} onError={handleImgError} />
                                        <div className="overlay-card">
                                            <span className="badge-sector-mini" style={{ background: getBadgeInfo(img).color, color: '#000', fontWeight: 'bold' }}>
                                                {getBadgeInfo(img).text}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="info-img-footer">
                                        <h4 className="titulo-popup-neon">{img.nombre || img.titulo || 'SIN TÍTULO'}</h4>
                                        <div className="meta-info">
                                            <span className="agente-tag">👤 {img.agente || img.usuario_nombre || 'SISTEMA'}</span>
                                            <span className="fecha-tag">📅 {img.fecha ? new Date(img.fecha).toLocaleDateString() : '---'}</span>
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="no-data-alert"><p>{t('galleryNoData')}</p></div>
                    )}
                </div>
            </main>

            {totalPaginas > 1 && (
                <footer className="galeria-pagination" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)} className="btn-pag-nav"> ◄ </button>
                    
                    <div className="pag-numbers">
                        {/* Primera página */}
                        {paginaActual > 3 && (
                            <>
                                <button onClick={() => setPaginaActual(1)} className="btn-pag-num">1</button>
                                <span className="pag-dots" style={{ color: '#444', margin: '0 5px', fontFamily: 'monospace' }}>...</span>
                            </>
                        )}

                        {/* Páginas intermedias alrededor de la actual */}
                        {[...Array(totalPaginas)].map((_, i) => {
                            const page = i + 1;
                            if (page === paginaActual || (page >= paginaActual - 2 && page <= paginaActual + 2)) {
                                return (
                                    <button 
                                        key={i} 
                                        onClick={() => setPaginaActual(page)} 
                                        className={`btn-pag-num ${paginaActual === page ? 'active' : ''}`}
                                    >
                                        {page}
                                    </button>
                                );
                            }
                            return null;
                        })}

                        {/* Última página */}
                        {paginaActual < totalPaginas - 2 && (
                            <>
                                <span className="pag-dots" style={{ color: '#444', margin: '0 5px', fontFamily: 'monospace' }}>...</span>
                                <button onClick={() => setPaginaActual(totalPaginas)} className="btn-pag-num">{totalPaginas}</button>
                            </>
                        )}
                    </div>

                    <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(p => p + 1)} className="btn-pag-nav"> ► </button>

                    {/* Saltador de página rápido */}
                    <div className="pag-jumper" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
                        <span style={{ color: '#666', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px' }}>
                            {language === 'en' ? 'JUMP TO:' : 'SALTAR A:'}
                        </span>
                        <input
                            type="number"
                            min="1"
                            max={totalPaginas}
                            value={paginaActual}
                            onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (val >= 1 && val <= totalPaginas) {
                                    setPaginaActual(val);
                                }
                            }}
                            style={{
                                width: '50px',
                                padding: '6px 8px',
                                fontSize: '0.8rem',
                                textAlign: 'center',
                                background: '#050505',
                                border: '1px solid #222',
                                color: 'var(--color-principal)',
                                outline: 'none',
                                transition: '0.3s',
                                borderRadius: '2px',
                                fontFamily: 'monospace'
                            }}
                        />
                        <span style={{ color: '#666', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                            / {totalPaginas}
                        </span>
                    </div>
                </footer>
            )}

            {fotoExpandida && (
                <div className="modal-galeria-abierta fade-in" onClick={() => setFotoExpandida(null)}>
                    <div className="contenido-foto-grande-full" onClick={e => e.stopPropagation()}>
                        <button className="cerrar-modal-neon" onClick={() => setFotoExpandida(null)}>×</button>
                        <div className="modal-split-view">
                            <div className="modal-img-container" 
                                 onWheel={handleWheel}
                                 onMouseDown={handleMouseDown}
                                 onMouseMove={handleMouseMove}
                                 onMouseUp={handleMouseUp}
                                 onMouseLeave={handleMouseUp}
                                 style={{ position: 'relative' }}
                            >
                                <img 
                                    src={fotoExpandida.rutaCompleta} 
                                    alt="Evidencia" 
                                    onError={handleImgError} 
                                    style={{
                                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                        cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
                                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                        maxWidth: '100%',
                                        maxHeight: '90vh',
                                        objectFit: 'contain',
                                        display: 'block'
                                    }}
                                    draggable="false"
                                />
                            </div>
                            <div className="modal-text-content">
                                <header>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <span className="tag-alerta" style={{ background: getBadgeInfo(fotoExpandida).color, color: '#000', fontWeight: 'bold' }}>
                                            {getBadgeInfo(fotoExpandida).text}
                                        </span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => compartirEvidencia(fotoExpandida, 'twitter')} className="btn-social-mini" style={{ background: '#1DA1F2', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>𝕏</button>
                                            <button onClick={() => compartirEvidencia(fotoExpandida, 'instagram')} className="btn-social-mini" style={{ background: '#E1306C', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>IG</button>
                                            <button onClick={() => compartirEvidencia(fotoExpandida, 'whatsapp')} className="btn-social-mini" style={{ background: '#25D366', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>WA</button>
                                            <button onClick={() => compartirEvidencia(fotoExpandida, 'copy')} className="btn-social-mini" style={{ background: '#444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>📎</button>
                                        </div>
                                    </div>
                                    <h2 className="neon-text-blue">{(fotoExpandida.titulo || fotoExpandida.nombre)?.toUpperCase()}</h2>
                                    <div className="contenedor-acciones-rapidas" style={{ margin: '20px 0', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                        {fotoExpandida.tipo === 'expediente' && (
                                            <button className="btn-action-map-v2" onClick={() => navigate(`/leer-historia/${fotoExpandida.id.replace('exp-', '')}`)}>{t('galleryViewFullStory')}</button>
                                        )}
                                        {fotoExpandida.tipo === 'noticia' && (
                                            <button className="btn-action-map-v2" onClick={() => navigate(`/leer-historia/${fotoExpandida.id.replace('noticia-', '')}`)}>{t('galleryViewFullNews')}</button>
                                        )}
                                        {fotoExpandida.tipo === 'misterio' && (
                                            <button className="btn-action-map-v2" onClick={() => navigate(`/leer-historia/${fotoExpandida.id.replace('misterio-', '')}?src=misterios`)}>{t('galleryViewFullMisterio')}</button>
                                        )}
                                        {fotoExpandida.tipo === 'caso' && (
                                            <button className="btn-action-map-v2" onClick={() => navigate(`/casos-abiertos?id=${fotoExpandida.id.replace('caso-', '')}`)}>{t('galleryViewFullCaso')}</button>
                                        )}
                                        {(fotoExpandida.latitud && parseFloat(fotoExpandida.latitud) !== 0) && (
                                            <button className="btn-action-map-v2" style={{ background: 'var(--color-principal)', color: '#000' }} onClick={() => verEnMapa(fotoExpandida)}>{t('galleryRadarLocalize')}</button>
                                        )}
                                    </div>
                                </header>
                                <div className="body-text">
                                    <p className="desc-galeria-full">
                                        {fotoExpandida.esRelato 
                                            ? t('galleryLinkedFile')
                                            : (fotoExpandida.descripcion || fotoExpandida.cuerpo || t('galleryNoNotes'))
                                        }
                                    </p>
                                </div>
                                <footer className="modal-footer-btns">
                                    <div className="data-meta">
                                        <p><strong>REGISTRO:</strong> #{fotoExpandida.id}</p>
                                        <p><strong>ORIGEN:</strong> {fotoExpandida.agente || fotoExpandida.usuario_nombre || 'ARCHIVO CENTRAL'}</p>
                                    </div>
                                </footer>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Galeria;