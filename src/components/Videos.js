import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import Zoom from 'react-medium-image-zoom';
// import 'react-medium-image-zoom/dist/styles.css';
import Forms from './Forms';
import { useLanguage } from '../context/LanguageContext';
import AdSlot from './AdSlot';
import './videos.css';
import API_BASE_URL, { ADMIN_EMAIL } from '../config';

const Videos = ({ userAuth }) => {
    const { t, forceTranslationUpdate } = useLanguage();
    const isAdmin = userAuth && (userAuth.rol === 'admin' || (userAuth.email && userAuth.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()));
    // API_BASE_URL is handled via config.js (process.env or Render fallback)

    // Estado inicial
    const [videos, setVideos] = useState([]);
    const [titulo, setTitulo] = useState('');
    const [nuevaRuta, setNuevaRuta] = useState('');
    const [capturas, setCapturas] = useState('');
    const [latitud, setLatitud] = useState('');
    const [longitud, setLongitud] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [cargando, setCargando] = useState(false);
    const [capturaExpandida, setCapturaExpandida] = useState(null);
    const [videoAbierto, setVideoAbierto] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const videosPorPagina = 12;

    // --- ESTADOS DE ZOOM Y PAN ---
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const getYoutubeId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    useEffect(() => {
        cargarVideos();
    }, []);

    // Desplazamiento automático si hay un ID en la URL
    useEffect(() => {
        if (videos.length > 0) {
            const urlParams = new URLSearchParams(window.location.search);
            const videoId = urlParams.get('id');
            if (videoId) {
                const element = document.getElementById(`video-${videoId}`);
                if (element) {
                    setTimeout(() => {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.style.boxShadow = '0 0 30px var(--color-principal)';
                        setTimeout(() => element.style.boxShadow = '', 3000);
                    }, 500);
                }
            }
        }
    }, [videos]);

    const obtenerCoordenadas = () => {
        if (!navigator.geolocation) return alert(t('videoNoGps'));
        navigator.geolocation.getCurrentPosition((pos) => {
            setLatitud(pos.coords.latitude.toFixed(6));
            setLongitud(pos.coords.longitude.toFixed(6));
        }, (err) => {
            alert(t('videoGpsError') + err.message);
        });
    };

    const cargarVideos = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/videos/publicos`);
            if (Array.isArray(res.data)) {
                setVideos(res.data);
            } else {
                setVideos([]);
            }
        } catch (err) {
            console.error("❌ Error al cargar vídeos del búnker:", err);
            setVideos([]);
        } finally {
            if (forceTranslationUpdate) forceTranslationUpdate();
        }
    };

    const handleSubirVideo = async (e) => {
        if (e) e.preventDefault();
        
        if (!userAuth) return alert(t('videoIdentify'));

        setCargando(true);

        try {
            await axios.post(`${API_BASE_URL}/api/videos`, {
                titulo: titulo,
                url: nuevaRuta,
                usuario_nombre: userAuth.nombre || 'AGENTE',
                latitud: latitud || 0,
                longitud: longitud || 0,
                capturas: capturas,
                descripcion: descripcion
            });

            alert(t('videoSent'));
            setTitulo('');
            setNuevaRuta('');
            setCapturas('');
            setLatitud('');
            setLongitud('');
            setDescripcion('');
            cargarVideos(); 
        } catch (err) {
            console.error("Error al subir:", err);
            alert("❌ FALLO EN LA TRANSMISIÓN: Verifica la conexión con el búnker.");
        } finally {
            setCargando(false);
        }
    };

    const compartirVideo = async (vid, red) => {
        const url = `${window.location.origin}/videos?id=${vid.id}`;
        const texto = `🛸 ¡EVIDENCIA EN VÍDEO! Mira este avistamiento en el Búnker de ExpedienteX: "${vid.titulo?.toUpperCase()}" @PEPE1318057 @MUFON #UFO #Granada #ExpedienteXGranaino`;
        
        // Prioridad 1: Web Share API (Nativo en móviles)
        if (navigator.share && red !== 'copy' && red !== 'instagram') {
            try {
                await navigator.share({
                    title: 'BÚNKER EXPEDIENTE X - EVIDENCIA',
                    text: texto,
                    url: url,
                });
                return;
            } catch (err) {
                console.log("Compartir cancelado o no soportado");
            }
        }

        // Prioridad 2: Links directos (Fallback o Desktop)
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
                alert("📸 TEXTO Y ENLACE COPIADOS. Abre Instagram y pega tu mensaje en una Historia o Post.");
                link = `https://www.instagram.com/expedientexgranaino/`;
            } catch (err) {
                alert("❌ ERROR AL COPIAR.");
            }
        }
        
        if (link) {
            window.open(link, '_blank');
        } else if (red === 'copy' || red === 'twitter' || red === 'whatsapp' || red === 'instagram') {
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
                alert("📎 ENLACE COPIADO AL PORTAPAPELES. ¡LISTO PARA DIFUNDIR!");
            } catch (err) {
                alert("❌ ERROR AL COPIAR: Intenta compartir manualmente.");
            }
        }
    };

    // --- MANEJADORES DE ZOOM Y PAN ---
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
            setPosition({
                x: e.clientX - startPos.x,
                y: e.clientY - startPos.y
            });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const abrirCaptura = (url) => {
        setZoom(1);
        setPosition({ x: 0, y: 0 });
        setCapturaExpandida(url);
    };

    const videosRadar = Array.isArray(videos) ? videos.filter(v => !v.url.match(/^[1234]\.mp4$/)) : [];
    const indexOfLastVideo = paginaActual * videosPorPagina;
    const indexOfFirstVideo = indexOfLastVideo - videosPorPagina;
    const videosPaginados = videosRadar.slice(indexOfFirstVideo, indexOfLastVideo);
    const totalPaginas = Math.ceil(videosRadar.length / videosPorPagina);

    return (
        <div className="videos-container fade-in" style={{
            display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '20px'
        }}>
            <h1 style={{
                textAlign: 'center', color: '#fff', 
                fontFamily: 'Inter, sans-serif', textTransform: 'uppercase',
                letterSpacing: '8px', fontWeight: '900', margin: '40px 0'
            }}>
                VÍDEOS
            </h1>

            <AdSlot id="videos-top" />

            {userAuth && (
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <a href="#formulario-subida" style={{
                        textDecoration: 'none', fontSize: '0.75rem', color: 'var(--color-principal)',
                        border: '1px solid var(--color-principal)', padding: '10px 20px', borderRadius: '5px',
                        background: 'rgba(var(--rgb-principal), 0.05)', fontFamily: 'monospace',
                        letterSpacing: '2px'
                    }}>
                        ⬇️ APORTAR NUEVO MATERIAL
                    </a>
                </div>
            )}

            {/* SECCIÓN DE EVIDENCIAS ORIGINALES (ZONA ESPECIAL) */}
            <div className="evidencias-originales-section" style={{ marginBottom: '60px' }}>
                <div className="titulo-seccion-pro" style={{ fontSize: '1rem', marginBottom: '30px', color: '#fff', borderLeft: '3px solid #fff', paddingLeft: '15px' }}>
                    EVIDENCIAS DE ALTA PRIORIDAD
                </div>
                
                <div className="grid-videos-pro">
                    {Array.isArray(videos) && videos.filter(v => v.url.match(/^[1234]\.mp4$/)).map((vid) => (
                        <div key={vid.id} id={`video-${vid.id}`} className="video-card-dossier original-dossier-card">
                            <div className="badge-prioridad">NIVEL 4</div>
                            <div className="video-frame-wrapper">
                                {(() => {
                                    const primerCaptura = vid.capturas && vid.capturas.trim() !== '' ? vid.capturas.split(',')[0].trim() : '';
                                    const posterUrl = primerCaptura 
                                        ? (primerCaptura.startsWith('http') ? primerCaptura : `${API_BASE_URL}/imagenes/${primerCaptura}`)
                                        : undefined;
                                    return (
                                        <video 
                                            controls 
                                            playsInline 
                                            preload="metadata" 
                                            crossOrigin="anonymous"
                                            poster={posterUrl}
                                            controlsList={isAdmin ? undefined : "nodownload"}
                                            onContextMenu={(e) => { if (!isAdmin) e.preventDefault(); }}
                                        >
                                            <source src={`${API_BASE_URL}/videos/${vid.url}`} type="video/mp4" />
                                        </video>
                                    );
                                })()}
                            </div>
                            <div className="video-info-pro">
                                <div className="video-meta-pro">
                                    <span>📂 DOSSIER: ORIG-00{vid.url.split('.')[0]}</span>
                                    <span>📍 GRANADA</span>
                                </div>
                                <h3>{vid.titulo?.toUpperCase()}</h3>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                                    <button onClick={() => compartirVideo(vid, 'twitter')} className="btn-mando-pro btn-primary-pro" style={{ flex: 1 }}>📡 MUFON</button>
                                    <button onClick={() => compartirVideo(vid, 'twitter')} className="btn-mando-pro btn-secondary-pro" style={{ flex: 1 }}>🎙️ NAVE</button>
                                </div>
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                    <button onClick={() => compartirVideo(vid, 'whatsapp')} className="btn-mando-pro btn-secondary-pro" style={{ flex: 1, padding: '5px' }}>WA</button>
                                    <button onClick={() => compartirVideo(vid, 'instagram')} className="btn-mando-pro btn-secondary-pro" style={{ flex: 1, padding: '5px', background: '#e1306c', borderColor: '#e1306c' }}>IG</button>
                                    <button onClick={() => setVideoAbierto(vid)} className="btn-mando-pro btn-primary-pro" style={{ width: '40px' }}>📁</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* RESTO DEL ARCHIVO (RADAR PÚBLICO) */}
            <div className="titulo-seccion-pro" style={{ fontSize: '1.2rem', marginBottom: '40px' }}>
                📡 REGISTROS DESCLASIFICADOS DEL RADAR
            </div>

            <div className="grid-videos-pro-premium">
                {videosRadar.length > 0 ? (
                    videosPaginados.map((vid) => (
                        <div key={vid.id} id={`video-${vid.id}`} className="video-card-premium-bunker">
                            <div className="video-premium-header">
                                <span className="technical-code">// DECLASS-PR0{vid.id}</span>
                                <span className="technical-status-tag blinking-red">DESCLASIFICADO</span>
                            </div>
                            
                            <div className="video-premium-body">
                                <div className="video-premium-player-col">
                                    <div className="video-frame-wrapper">
                                        {(() => {
                                            const primerCaptura = vid.capturas && vid.capturas.trim() !== '' ? vid.capturas.split(',')[0].trim() : '';
                                            let bgUrl = '';
                                            let isYoutube = vid.url && (vid.url.includes('youtube.com') || vid.url.includes('youtu.be'));
                                            let isLocal = vid.url && !vid.url.includes('http');
                                            
                                            if (isYoutube) {
                                                const ytId = getYoutubeId(vid.url);
                                                bgUrl = ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : `${API_BASE_URL}/imagenes/video_default.png`;
                                            } else if (primerCaptura) {
                                                bgUrl = primerCaptura.startsWith('http') ? primerCaptura : `${API_BASE_URL}/imagenes/${primerCaptura}`;
                                            } else {
                                                bgUrl = `${API_BASE_URL}/imagenes/video_default.png`;
                                            }

                                            if (isLocal || isYoutube) {
                                                return (
                                                    <div 
                                                        className="video-preview-interactive" 
                                                        style={{ backgroundImage: `url(${bgUrl})` }}
                                                        onClick={() => setVideoAbierto(vid)}
                                                    >
                                                        <div className="video-preview-overlay">
                                                            <div className="play-button-tactical">
                                                                <div className="play-triangle"></div>
                                                            </div>
                                                            <span className="video-type-tag">
                                                                {isLocal ? "📂 ARCHIVO LOCAL" : "📡 CANAL YOUTUBE"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                return (
                                                    <div className="video-placeholder-dossier" style={{ backgroundImage: `url(${bgUrl})` }}>
                                                        <div className="placeholder-overlay">
                                                            <p style={{ color: '#fff', fontSize: '0.7rem', marginBottom: '15px', fontFamily: 'monospace', borderBottom: '1px solid #333' }}>📡 TRANSMISIÓN EXTERNA</p>
                                                            <a href={vid.url} target="_blank" rel="noreferrer" className="btn-mando-pro btn-primary-pro">ABRIR ARCHIVO</a>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                </div>
                                
                                <div className="video-premium-info-col">
                                    <h3 className="video-premium-title">{vid.titulo ? vid.titulo.toUpperCase() : 'REGISTRO CLASIFICADO'}</h3>
                                    
                                    <div className="video-premium-description">
                                        <span className="desc-label">DESCRIPCIÓN DEL EXPEDIENTE:</span>
                                        <p className="desc-text">
                                            {vid.descripcion && vid.descripcion.trim() !== '' 
                                                ? vid.descripcion 
                                                : '⚠️ ADVERTENCIA DEL BÚNKER: Pendiente de transcripción y descripción oficial por el analista jefe.'}
                                        </p>
                                    </div>
                                    
                                    <div className="technical-specs-table">
                                        <div className="spec-row">
                                            <span className="spec-name">FECHA REGISTRO:</span>
                                            <span className="spec-value">[{vid.fecha ? new Date(vid.fecha).toLocaleDateString('es-ES') : 'N/A'}]</span>
                                        </div>
                                        <div className="spec-row">
                                            <span className="spec-name">UBICACIÓN GPS:</span>
                                            <span className="spec-value">
                                                {vid.latitud && vid.longitud && (parseFloat(vid.latitud) !== 0 || parseFloat(vid.longitud) !== 0) 
                                                    ? `[LAT: ${parseFloat(vid.latitud).toFixed(4)}, LON: ${parseFloat(vid.longitud).toFixed(4)}]`
                                                    : <span style={{ color: '#ff4444' }}>[SIN SEÑAL GPS / EN RASTREO]</span>}
                                            </span>
                                        </div>
                                        <div className="spec-row">
                                            <span className="spec-name">AGENTE REGISTRADOR:</span>
                                            <span className="spec-value">[{vid.usuario ? vid.usuario.toUpperCase() : 'AGENTE ANÓNIMO'}]</span>
                                        </div>
                                        <div className="spec-row">
                                            <span className="spec-name">NIVEL ACCESO:</span>
                                            <span className="spec-value" style={{ color: 'var(--color-principal)', fontWeight: 'bold' }}>[NIVEL 3 - CENTRAL]</span>
                                        </div>
                                    </div>

                                    {vid.capturas && vid.capturas.trim() !== '' && (
                                        <div className="video-premium-evidences">
                                            <span className="evidences-label">EVIDENCIAS DIGITALES ADJUNTAS:</span>
                                            <div className="evidences-grid-mini">
                                                {vid.capturas.split(',').map((url, idx) => (
                                                    <div key={idx} onClick={() => abrirCaptura(url.trim())} className="evidence-thumb-wrapper">
                                                        <img src={url.trim()} alt="Evidencia" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="video-premium-actions">
                                        <button onClick={() => compartirVideo(vid, 'twitter')} className="btn-premium-dock">𝕏 TWITTER</button>
                                        <button onClick={() => compartirVideo(vid, 'whatsapp')} className="btn-premium-dock">WHATSAPP</button>
                                        <button onClick={() => compartirVideo(vid, 'instagram')} className="btn-premium-dock btn-dock-ig">INSTAGRAM</button>
                                        <button onClick={() => compartirVideo(vid, 'copy')} className="btn-premium-dock btn-dock-copy">📎 COPIAR</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-hay-datos">
                        <p>[ SISTEMA: No hay registros audiovisuales disponibles ]</p>
                    </div>
                )}
            </div>

            {totalPaginas > 1 && (
                <div className="paginacion-radar" style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '40px', marginBottom: '20px' }}>
                    <button 
                        onClick={() => { setPaginaActual(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={paginaActual === 1}
                        className="btn-mando-pro btn-secondary-pro"
                        style={{ opacity: paginaActual === 1 ? 0.5 : 1, cursor: paginaActual === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        ANTERIOR
                    </button>
                    <span style={{ color: 'var(--color-principal)', alignSelf: 'center', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        PÁG {paginaActual} / {totalPaginas}
                    </span>
                    <button 
                        onClick={() => { setPaginaActual(p => Math.min(totalPaginas, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={paginaActual === totalPaginas}
                        className="btn-mando-pro btn-secondary-pro"
                        style={{ opacity: paginaActual === totalPaginas ? 0.5 : 1, cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer' }}
                    >
                        SIGUIENTE
                    </button>
                </div>
            )}

            {/* FORMULARIO DE CARGA */}
            <div id="formulario-subida" style={{
                marginTop: '100px', padding: '50px 20px', background: 'rgba(0,255,65,0.02)',
                borderRadius: '15px', borderTop: '1px dashed var(--color-principal)'
            }}>
                {userAuth ? (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ background: 'rgba(255,177,0,0.1)', border: '1px solid #ffb100', padding: '15px', marginBottom: '30px', borderRadius: '5px' }}>
                            <p style={{ color: '#ffb100', fontSize: '0.8rem', fontFamily: 'monospace', margin: 0 }}>
                                🛡️ <strong>SISTEMA DE VERIFICACIÓN:</strong> Todo el material audiovisual será analizado por el Administrador antes de ser desclasificado al radar público.
                            </p>
                        </div>
                        <Forms title={t('reportEvidence')} onSubmit={handleSubirVideo}>
                            <label style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{t('videoRegister')}</label>
                            <input
                                type="text" placeholder={t('videoRegisterPlaceholder')} value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                style={{
                                    width: '100%', marginBottom: '20px', padding: '12px',
                                    background: '#000', color: 'var(--color-principal)', border: '1px solid #333',
                                    fontFamily: 'monospace'
                                }} required
                            />

                             <label style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{t('videoUrl')}</label>
                            <input
                                type="text" placeholder={t('videoUrlPlaceholder')} value={nuevaRuta}
                                onChange={(e) => setNuevaRuta(e.target.value)}
                                style={{
                                    width: '100%', marginBottom: '20px', padding: '12px',
                                    background: '#000', color: 'var(--color-principal)', border: '1px solid #333',
                                    fontFamily: 'monospace'
                                }} required
                            />

                            <label style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{t('videoCaptures')}</label>
                            <textarea
                                placeholder={t('videoCapturesPlaceholder')} value={capturas}
                                onChange={(e) => setCapturas(e.target.value)}
                                style={{
                                    width: '100%', marginBottom: '20px', padding: '12px',
                                    background: '#000', color: 'var(--color-principal)', border: '1px solid #333',
                                    fontFamily: 'monospace', minHeight: '60px', resize: 'vertical'
                                }}
                            />

                            <label style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontFamily: 'monospace' }}>DESCRIPCIÓN DEL VÍDEO (OPCIONAL):</label>
                            <textarea
                                placeholder="Escribe aquí una descripción o transcripción de lo que se observa en el vídeo..."
                                value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)}
                                style={{
                                    width: '100%', marginBottom: '20px', padding: '12px',
                                    background: '#000', color: 'var(--color-principal)', border: '1px solid #333',
                                    fontFamily: 'monospace', minHeight: '80px', resize: 'vertical'
                                }}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{t('latLong')}</label>
                                    <input
                                        type="number" step="any" placeholder="37.1773" value={latitud}
                                        onChange={(e) => setLatitud(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px',
                                            background: '#000', color: 'var(--color-principal)', border: '1px solid #333',
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontFamily: 'monospace' }}>{t('latLong')}</label>
                                    <input
                                        type="number" step="any" placeholder="-3.5985" value={longitud}
                                        onChange={(e) => setLongitud(e.target.value)}
                                        style={{
                                            width: '100%', padding: '12px',
                                            background: '#000', color: 'var(--color-principal)', border: '1px solid #333',
                                            fontFamily: 'monospace'
                                        }}
                                    />
                                </div>
                            </div>

                            <button type="button" onClick={obtenerCoordenadas} style={{
                                width: '100%', marginBottom: '25px', padding: '10px',
                                border: '1px solid var(--color-principal)', color: 'var(--color-principal)', background: 'transparent',
                                cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.7rem'
                            }}>
                                {t('videoGps')}
                            </button>
                        </Forms>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '30px' }}>
                        <p style={{ color: '#ff4444', fontFamily: 'monospace', border: '1px solid #ff4444', padding: '15px', display: 'inline-block' }}>
                            ⚠ [ ACCESO DENEGADO: Identifíquese como agente para aportar material ]
                        </p>
                    </div>
                )}
            </div>
            {/* MODAL DE ZOOM TÁCTICO */}
            {capturaExpandida && (
                <div className="modal-galeria-abierta fade-in" onClick={() => setCapturaExpandida(null)} style={{
                    position: 'fixed', 
                    top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.98)', 
                    zIndex: 999999,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '20px', 
                    backdropFilter: 'blur(15px)'
                }}>
                    <div className="contenido-zoom-pro" onClick={e => e.stopPropagation()} style={{
                        position: 'relative', width: '90%', height: '90%', background: '#000',
                        border: '1px solid var(--color-principal)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}>
                        <button onClick={() => setCapturaExpandida(null)} style={{
                            position: 'absolute', top: '15px', right: '15px', background: '#ff4444', border: 'none',
                            color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 10002
                        }}>✖</button>
                        
                        <div className="zoom-container-main" 
                             onWheel={handleWheel}
                             onMouseDown={handleMouseDown}
                             onMouseMove={handleMouseMove}
                             onMouseUp={handleMouseUp}
                             onMouseLeave={handleMouseUp}
                             style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in' }}>
                            <img 
                                src={capturaExpandida} 
                                alt="Evidencia Ampliada" 
                                draggable="false"
                                style={{
                                    maxWidth: '100%', maxHeight: '100%', objectFit: 'contain',
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                                    transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                    userSelect: 'none'
                                }}
                            />
                        </div>
                        <div style={{ background: '#050505', padding: '10px', textAlign: 'center', borderTop: '1px solid #111' }}>
                            <p style={{ color: 'var(--color-principal)', fontSize: '0.7rem', margin: 0, fontFamily: 'monospace' }}>
                                [ RUEDA: ZOOM ] [ CLIC + ARRASTRAR: PAN ] [ ESC: CERRAR ]
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE VÍDEO ABIERTO (TACTICAL OVERLAY CON BOTÓN DE CIERRE COORDENADO) */}
            {videoAbierto && (
                <div className="modal-galeria-abierta fade-in" onClick={() => setVideoAbierto(null)} style={{
                    position: 'fixed', 
                    top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.98)', 
                    zIndex: 999999,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '20px', 
                    backdropFilter: 'blur(15px)'
                }}>
                    <div className="contenido-zoom-pro" onClick={e => e.stopPropagation()} style={{
                        position: 'relative', width: '90%', height: '90%', background: '#000',
                        border: '1px solid var(--color-principal)', display: 'flex', flexDirection: 'column', overflow: 'hidden'
                    }}>
                        <button onClick={() => setVideoAbierto(null)} style={{
                            position: 'absolute', top: '15px', right: '15px', background: '#ff4444', border: 'none',
                            color: '#fff', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', zIndex: 10002,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem'
                        }}>✖</button>
                        
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
                            {videoAbierto.url && (videoAbierto.url.includes('youtube.com') || videoAbierto.url.includes('youtu.be')) ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${getYoutubeId(videoAbierto.url)}?autoplay=1`}
                                    title={videoAbierto.titulo}
                                    allow="autoplay; encrypted-media"
                                    allowFullScreen
                                    style={{ width: '100%', height: '80vh', border: 'none' }}
                                ></iframe>
                            ) : (
                                <video 
                                    src={videoAbierto.url.startsWith('http') ? videoAbierto.url : `${API_BASE_URL}/videos/${videoAbierto.url}`} 
                                    controls 
                                    autoPlay
                                    style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                                />
                            )}
                        </div>
                        <div style={{ background: '#050505', padding: '15px', textAlign: 'center', borderTop: '1px solid #111' }}>
                            <h3 style={{ color: '#fff', margin: '0 0 5px 0', fontSize: '1rem', fontFamily: 'monospace' }}>
                                {videoAbierto.titulo?.toUpperCase()}
                            </h3>
                            <p style={{ color: 'var(--color-principal)', fontSize: '0.75rem', margin: 0, fontFamily: 'monospace' }}>
                                [ CLIC EN LA ✖ O FUERA DEL REPRODUCTOR PARA CERRAR ]
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Videos;
