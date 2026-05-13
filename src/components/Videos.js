import React, { useState, useEffect } from 'react';
import axios from 'axios';
// import Zoom from 'react-medium-image-zoom';
// import 'react-medium-image-zoom/dist/styles.css';
import Forms from './Forms';
import AdSlot from './AdSlot';
import './videos.css';
import API_BASE_URL, { ADMIN_EMAIL } from '../config';

const Videos = ({ userAuth }) => {
    const isAdmin = userAuth && (userAuth.rol === 'admin' || (userAuth.email && userAuth.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()));
    // API_BASE_URL is handled via config.js (process.env or Render fallback)

    // Estado inicial
    const [videos, setVideos] = useState([]);
    const [titulo, setTitulo] = useState('');
    const [nuevaRuta, setNuevaRuta] = useState('');
    const [capturas, setCapturas] = useState('');
    const [latitud, setLatitud] = useState('');
    const [longitud, setLongitud] = useState('');
    const [cargando, setCargando] = useState(false);
    const [capturaExpandida, setCapturaExpandida] = useState(null);

    // --- ESTADOS DE ZOOM Y PAN ---
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

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
        if (!navigator.geolocation) return alert("El búnker no detecta tu señal GPS.");
        navigator.geolocation.getCurrentPosition((pos) => {
            setLatitud(pos.coords.latitude.toFixed(6));
            setLongitud(pos.coords.longitude.toFixed(6));
        }, (err) => {
            alert("❌ FALLO AL ESCANEAR SECTOR: " + err.message);
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
        }
    };

    const handleSubirVideo = async (e) => {
        if (e) e.preventDefault();
        
        if (!userAuth) return alert("Identifícate como agente.");

        setCargando(true);

        try {
            await axios.post(`${API_BASE_URL}/api/videos`, {
                titulo: titulo,
                url: nuevaRuta,
                usuario_nombre: userAuth.nombre || 'AGENTE',
                latitud: latitud || 0,
                longitud: longitud || 0,
                capturas: capturas
            });

            alert("✅ VÍDEO ENVIADO: La central revisará el material antes de publicarlo.");
            setTitulo('');
            setNuevaRuta('');
            setCapturas('');
            setLatitud('');
            setLongitud('');
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
                await navigator.clipboard.writeText(`${texto} ${url}`);
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
                await navigator.clipboard.writeText(`${texto} ${url}`);
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
                                <video 
                                    controls 
                                    playsInline 
                                    preload="metadata" 
                                    crossOrigin="anonymous"
                                    controlsList={isAdmin ? undefined : "nodownload"}
                                    onContextMenu={(e) => { if (!isAdmin) e.preventDefault(); }}
                                >
                                    <source src={`${API_BASE_URL}/videos/${vid.url}`} type="video/mp4" />
                                </video>
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

            <div className="grid-videos-pro">
                {Array.isArray(videos) && videos.length > 0 ? (
                    videos.filter(v => !v.url.match(/^[1234]\.mp4$/)).map((vid) => (
                        <div key={vid.id} id={`video-${vid.id}`} className="video-card-dossier">
                            <div className="video-frame-wrapper">
                                {vid.url && !vid.url.includes('http') ? (
                                    <video 
                                        controls 
                                        playsInline 
                                        preload="metadata" 
                                        crossOrigin="anonymous" 
                                        key={vid.url}
                                        controlsList={isAdmin ? undefined : "nodownload"}
                                        onContextMenu={(e) => { if (!isAdmin) e.preventDefault(); }}
                                    >
                                        <source src={`${API_BASE_URL}/videos/${vid.url}`} type="video/mp4" />
                                    </video>
                                ) : vid.url && (vid.url.includes('youtube.com') || vid.url.includes('youtu.be')) ? (
                                    <iframe
                                        src={vid.url.replace("watch?v=", "embed/").split("&")[0]}
                                        title={vid.titulo}
                                        allowFullScreen
                                    ></iframe>
                                ) : (
                                    <div className="video-placeholder-dossier" style={{ backgroundImage: `url(${API_BASE_URL}/imagenes/video_default.png)` }}>
                                        <div className="placeholder-overlay">
                                            <p style={{ color: '#fff', fontSize: '0.7rem', marginBottom: '15px', fontFamily: 'monospace', borderBottom: '1px solid #333' }}>📡 TRANSMISIÓN EXTERNA</p>
                                            <a href={vid.url} target="_blank" rel="noreferrer" className="btn-mando-pro btn-primary-pro">ABRIR ARCHIVO</a>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="video-info-pro">
                                <div className="video-meta-pro">
                                    <span>📍 {vid.latitud ? 'COORDENADAS FIJADAS' : 'ARCHIVO CENTRAL'}</span>
                                    <span>#{vid.id}</span>
                                </div>
                                <h3>{vid.titulo ? vid.titulo.toUpperCase() : 'REGISTRO CLASIFICADO'}</h3>

                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                                    <button onClick={() => compartirVideo(vid, 'twitter')} className="btn-mando-pro btn-secondary-pro" style={{ flex: 1 }}>𝕏 TWITTER</button>
                                    <button onClick={() => compartirVideo(vid, 'whatsapp')} className="btn-mando-pro btn-secondary-pro" style={{ flex: 1 }}>WHATSAPP</button>
                                    <button onClick={() => compartirVideo(vid, 'instagram')} className="btn-mando-pro btn-secondary-pro" style={{ flex: 1, background: '#e1306c', borderColor: '#e1306c' }}>INSTAGRAM</button>
                                    <button onClick={() => compartirVideo(vid, 'copy')} className="btn-mando-pro btn-secondary-pro" style={{ width: '40px' }}>📎</button>
                                </div>

                                {vid.capturas && vid.capturas.trim() !== '' && (
                                    <div style={{ marginTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                                        <p style={{ fontSize: '0.55rem', color: '#888', marginBottom: '8px', fontFamily: 'monospace' }}>🔍 EVIDENCIAS ADJUNTAS:</p>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            {vid.capturas.split(',').map((url, idx) => (
                                                <div key={idx} onClick={() => abrirCaptura(url.trim())}
                                                     style={{ width: '50px', height: '50px', overflow: 'hidden', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}>
                                                    <img src={url.trim()} alt="Evidencia" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-hay-datos">
                        <p>[ SISTEMA: No hay registros audiovisuales disponibles ]</p>
                    </div>
                )}
            </div>

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
                        <Forms title="CARGAR EVIDENCIA" onSubmit={handleSubirVideo}>
                            <label style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontFamily: 'monospace' }}>NOMBRE DEL REGISTRO:</label>
                            <input
                                type="text" placeholder="Ej: Avistamiento en el Genil" value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                style={{
                                    width: '100%', marginBottom: '20px', padding: '12px',
                                    background: '#000', color: 'var(--color-principal)', border: '1px solid #333',
                                    fontFamily: 'monospace'
                                }} required
                            />

                             <label style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontFamily: 'monospace' }}>URL O NOMBRE DE ARCHIVO:</label>
                            <input
                                type="text" placeholder="URL de YouTube o nombre del archivo local" value={nuevaRuta}
                                onChange={(e) => setNuevaRuta(e.target.value)}
                                style={{
                                    width: '100%', marginBottom: '20px', padding: '12px',
                                    background: '#000', color: 'var(--color-principal)', border: '1px solid #333',
                                    fontFamily: 'monospace'
                                }} required
                            />

                            <label style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontFamily: 'monospace' }}>URLS DE CAPTURAS (Separadas por comas):</label>
                            <textarea
                                placeholder="https://imagen1.jpg, https://imagen2.jpg..." value={capturas}
                                onChange={(e) => setCapturas(e.target.value)}
                                style={{
                                    width: '100%', marginBottom: '20px', padding: '12px',
                                    background: '#000', color: 'var(--color-principal)', border: '1px solid #333',
                                    fontFamily: 'monospace', minHeight: '60px', resize: 'vertical'
                                }}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontFamily: 'monospace' }}>LATITUD:</label>
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
                                    <label style={{ color: 'var(--color-principal)', fontSize: '0.8rem', fontFamily: 'monospace' }}>LONGITUD:</label>
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
                                🛰️ ACTIVAR RADAR GPS (LOCALIZACIÓN ACTUAL)
                            </button>

                            <button type="submit" disabled={cargando} className="btn-ok-subir" style={{
                                width: '100%', padding: '15px', background: 'var(--color-principal)',
                                color: '#000', fontWeight: 'bold', cursor: 'pointer',
                                border: 'none', textTransform: 'uppercase', letterSpacing: '2px'
                            }}>
                                {cargando ? "CIFRANDO DATOS..." : "ENVIAR AL ARCHIVO CENTRAL"}
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
        </div>
    );
};

export default Videos;
