import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './galeria.css';
import Forms from './Forms'; 
import { API_BASE_URL, ADMIN_EMAIL } from '../config';

const Galeria = ({ userAuth }) => {
    // --- ESTADOS BLINDADOS ---
    const [registros, setRegistros] = useState({
        'lugares': [],
        'imagenes': []
    });

    const [pestanaActiva, setPestanaActiva] = useState('imagenes');
    const [paginaActual, setPaginaActual] = useState(1);
    const [fotoExpandida, setFotoExpandida] = useState(null);
    
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
    const [nuevaDesc, setNuevaDesc] = useState('');
    const [latitud, setLatitud] = useState('');
    const [longitud, setLongitud] = useState('');
    const [busquedaCiudad, setBusquedaCiudad] = useState('');
    const [subiendo, setSubiendo] = useState(false);
    const [mostrarFormSubida, setMostrarFormSubida] = useState(false);

    // --- ESTADOS DE ZOOM Y PAN ---
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const navigate = useNavigate();
    const imagenesPorPagina = 8; // Ajustado a 8 para llenar 2 filas completas de 4 columnas

    const config = {
        'imagenes': { 
            urlBase: `${API_BASE_URL}/imagenes/`, 
            columna: 'imagen_url', 
            etiqueta: 'FOTO'
        },
        'relatos': {
            urlBase: `${API_BASE_URL}/imagenes/`,
            columna: 'imagen_url',
            etiqueta: 'RELATO'
        }
    };

    const cargarImagenes = useCallback(async () => {
        try {
            const isAdmin = userAuth && (userAuth.rol === 'admin' || userAuth.email === ADMIN_EMAIL);
            
            const [resA, resL, resE1, resE2] = await Promise.all([
                axios.get(isAdmin ? `${API_BASE_URL}/api/galeria/admin/todas-las-imagenes` : `${API_BASE_URL}/api/galeria/imagenes-publicas`),
                axios.get(`${API_BASE_URL}/api/lugares`),
                axios.get(`${API_BASE_URL}/api/expedientes/expedientes-publicos`),
                axios.get(`${API_BASE_URL}/api/expedientes/relatos-admin-publicos`)
            ]);

            // Transformamos los lugares
            const lugaresTransformados = (Array.isArray(resL.data) ? resL.data : []).map(l => ({
                id: `lugar-${l.id}`,
                titulo: l.nombre || l.titulo,
                imagen_url: l.imagen_url || l.imagenes || l.imagen,
                descripcion: l.descripcion,
                latitud: l.latitud,
                longitud: l.longitud,
                agente: 'ARCHIVO MAPA',
                fecha: l.fecha || null,
                esDeLugar: true
            }));

            // Galería normal
            const GaleriaNormal = (Array.isArray(resA.data) ? resA.data : []).map(img => ({
                ...img,
                id: `foto-${img.id}`,
                imagen_url: img.imagen_url || img.url_imagen
            }));

            // Relatos con imagen
            const resE1Data = Array.isArray(resE1.data) ? resE1.data : [];
            const resE2Data = Array.isArray(resE2.data) ? resE2.data : [];
            const todosExp = [...resE1Data, ...resE2Data];
            const relatosConImagen = todosExp.filter(e => e.imagen_url).map(e => ({
                ...e,
                esRelato: true
            }));

            setRegistros({
                'imagenes': [...GaleriaNormal, ...lugaresTransformados],
                'relatos': relatosConImagen
            });
            console.log("✅ GALERÍA Y RELATOS CARGADOS");
        } catch (err) {
            console.error("❌ ERROR AL CARGAR GALERÍA:", err);
            setRegistros({ 'imagenes': [], 'relatos': [] });
        }
    }, [userAuth]);

    useEffect(() => {
        cargarImagenes();
    }, [cargarImagenes]);

    const obtenerPosicion = () => {
        if (!navigator.geolocation) return alert("HOUSTON, NO TENEMOS GPS.");
        navigator.geolocation.getCurrentPosition(pos => {
            setLatitud(pos.coords.latitude.toFixed(6));
            setLongitud(pos.coords.longitude.toFixed(6));
        });
    };

    const buscarCoordenadas = async () => {
        if (!busquedaCiudad.trim()) return alert("Introduce una ciudad o lugar, hermano.");
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${busquedaCiudad}`);
            if (res.data && res.data.length > 0) {
                const { lat, lon } = res.data[0];
                setLatitud(parseFloat(lat).toFixed(6));
                setLongitud(parseFloat(lon).toFixed(6));
                alert(`📍 Localizado: ${res.data[0].display_name}`);
            } else {
                alert("❌ No he podido triangular esa posición.");
            }
        } catch (err) {
            alert("⚠️ Error en la conexión con el satélite Nominatim.");
        }
    };

    const subirImagen = async (e) => {
        if (e) e.preventDefault(); 
        if (!userAuth) { alert("Acceso denegado."); return; }
        if (!archivoSeleccionado) { alert("Hermano, selecciona un archivo."); return; }

        setSubiendo(true);
        const formData = new FormData();
        formData.append('titulo', nuevoTitulo);
        formData.append('imagen', archivoSeleccionado); 
        formData.append('agente', userAuth.nombre || 'Agente Anónimo');
        formData.append('descripcion', nuevaDesc); 
        formData.append('latitud', latitud || 0);
        formData.append('longitud', longitud || 0);

        try {
            await axios.post(`${API_BASE_URL}/api/galeria/subir-imagen`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("🚀 EVIDENCIA ENVIADA Y EN ESPERA DE VALIDACIÓN.");
            setNuevoTitulo(''); setArchivoSeleccionado(null); setNuevaDesc(''); setLatitud(''); setLongitud('');
            cargarImagenes();
        } catch (err) {
            console.error("Error en la subida:", err);
            alert("❌ FALLO EN LA CONEXIÓN.");
        } finally {
            setSubiendo(false);
        }
    };
    const verEnMapa = (img) => {
        if (!img.latitud || !img.longitud || parseFloat(img.latitud) === 0) {
            alert("🔒 COORDENADAS CLASIFICADAS: Este registro no dispone de ubicación geográfica precisa en el radar.");
            return;
        }
        const payload = {
            lat: img.latitud,
            lng: img.longitud,
            noticiaId: img.id
        };
        console.log("📡 RADAR: Enviando coordenadas desde galería...", payload);
        navigate('/lugares', { state: payload });
    };

    const compartirEvidencia = async (img, red) => {
        const url = `${window.location.origin}/galeria`;
        const texto = `🛸 ¡NUEVA EVIDENCIA! Observa este registro en el Búnker de ExpedienteX: "${(img.titulo || img.nombre)?.toUpperCase()}" @PEPE1318057 @MUFON #UFO #Granada #ExpedienteXGranaino`;

        if (navigator.share && red !== 'copy' && red !== 'instagram') {
            try {
                await navigator.share({
                    title: 'BÚNKER EXPEDIENTE X - EVIDENCIA',
                    text: texto,
                    url: url,
                });
                return;
            } catch (err) {
                console.log("Compartir cancelado");
            }
        }

        let link = '';
        if (red === 'twitter') {
            link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
        } else if (red === 'whatsapp') {
            link = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto + ' ' + url)}`;
        } else if (red === 'instagram') {
            // Instagram no permite pre-rellenar texto por URL, así que copiamos y abrimos
            try {
                await navigator.clipboard.writeText(`${texto} ${url}`);
                alert("📸 TEXTO COPIADO. Abre Instagram y pega tu mensaje.");
                link = `https://www.instagram.com/expedientexgranaino/`;
            } catch (err) {
                alert("❌ ERROR AL COPIAR.");
            }
        }

        if (link) {
            window.open(link, '_blank');
        } else {
            try {
                await navigator.clipboard.writeText(`${texto} ${url}`);
                alert("📎 ENLACE COPIADO AL PORTAPAPELES.");
            } catch (err) {
                alert("❌ ERROR AL COPIAR.");
            }
        }
    };

    const handleImgError = (e) => {
        e.target.onerror = null;
        e.target.src = "https://placehold.co/500x350?text=ARCHIVO+CLASIFICADO";
    };

    // --- MANEJADORES DE ZOOM Y PAN ---
    const handleWheel = (e) => {
        // Zoom con la rueda del ratón
        const delta = e.deltaY * -0.001;
        const newZoom = Math.min(Math.max(1, zoom + delta), 6);
        setZoom(newZoom);
        if (newZoom === 1) {
            setPosition({ x: 0, y: 0 });
        }
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

    const confActual = config[pestanaActiva];
    const listaActual = registros[pestanaActiva] || [];

    const totalPaginas = Math.ceil(listaActual.length / imagenesPorPagina);
    const indiceUltima = paginaActual * imagenesPorPagina;
    const indicePrimera = indiceUltima - imagenesPorPagina;
    const imagenesActuales = Array.isArray(listaActual) ? listaActual.slice(indicePrimera, indiceUltima) : [];



    return (
        <div className="galeria-page">
            <header className="galeria-header">
                <div className="linea-neon-superior"></div>
                <h1 className="titulo-neon">GALERÍA DE EVIDENCIAS</h1>
                <p className="subtitle">NIVEL DE ACCESO: {userAuth?.rol?.toUpperCase() || 'INVITADO'}</p>
                
                <button className="btn-subir-galeria-top" onClick={() => {
                    if (userAuth) {
                        setMostrarFormSubida(true);
                    } else {
                        if (window.confirm("🕵️ ACCESO RESTRINGIDO: Debes identificarte como Agente para registrar evidencias en el Búnker. ¿Ir a la terminal de acceso?")) {
                            navigate('/acceso');
                        }
                    }
                }}>
                    <span className="icon">📤</span> SUBIR EVIDENCIA
                </button>
            </header>

            <nav className="pestanas-galeria-container">
                <div className="pestanas-galeria-wrapper">
                    <button
                        className={`btn-pestana-moderno ${pestanaActiva === 'imagenes' ? 'active' : ''}`}
                        onClick={() => { setPestanaActiva('imagenes'); setPaginaActual(1); }}
                    >
                        <span className="icon-folder">📁</span>
                        <span className="text-folder">FOTOS</span>
                        <div className="indicator-neon"></div>
                    </button>
                    <button
                        className={`btn-pestana-moderno ${pestanaActiva === 'relatos' ? 'active' : ''}`}
                        onClick={() => { setPestanaActiva('relatos'); setPaginaActual(1); }}
                    >
                        <span className="icon-folder">🛡️</span>
                        <span className="text-folder">RELATOS</span>
                        <div className="indicator-neon"></div>
                    </button>
                </div>
            </nav>

            <main className="galeria-main-content">
                <div className="galeria-grid">
                    {Array.isArray(imagenesActuales) && imagenesActuales.length > 0 ? (
                        imagenesActuales.map((img) => {
                            const nombreArchivo = img[confActual.columna];
                            // Si ya es una URL completa (Cloudinary), la usamos
                            let rutaImg = nombreArchivo?.startsWith('http') ? nombreArchivo : null;
                            
                            // Si no es URL, construimos la ruta local según el origen
                            if (!rutaImg && nombreArchivo) {
                                const base = img.esDeLugar ? `${API_BASE_URL}/lugares/` : `${confActual.urlBase}`;
                                rutaImg = `${base}${nombreArchivo}`;
                            }

                            return (
                                <article
                                    key={img.id}
                                    className="card-imagen-completa"
                                    onClick={() => {
                                        if (rutaImg) {
                                            resetZoom();
                                            setFotoExpandida({ ...img, rutaCompleta: rutaImg });
                                        }
                                    }}
                                >
                                    <div className="contenedor-img-wrapper">
                                        {rutaImg ? (
                                            <img src={rutaImg} alt={img.titulo || img.nombre} onError={handleImgError} />
                                        ) : (
                                            <div className="placeholder-vacio-box">⚠️ SECTOR SIN IMAGEN</div>
                                        )}
                                        <div className="overlay-card">
                                            <span className="badge-sector-mini">{confActual.etiqueta}</span>
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
                        <div className="no-data-alert">
                            <div className="radar-loader"></div>
                            <p>📡 ESCANEANDO SECTOR... NO SE DETECTAN REGISTROS.</p>
                        </div>
                    )}
                </div>
            </main>

            {totalPaginas > 1 && (
                <footer className="galeria-pagination">
                    <button disabled={paginaActual === 1} onClick={() => { setPaginaActual(p => p - 1); window.scrollTo(0, 0); }} className="btn-pag-nav"> ◄ </button>
                    <div className="pag-numbers">
                        {[...Array(totalPaginas)].map((_, i) => (
                            <button key={i} onClick={() => { setPaginaActual(i + 1); window.scrollTo(0, 0); }} className={`btn-pag-num ${paginaActual === i + 1 ? 'active' : ''}`}>{i + 1}</button>
                        ))}
                    </div>
                    <button disabled={paginaActual === totalPaginas} onClick={() => { setPaginaActual(p => p + 1); window.scrollTo(0, 0); }} className="btn-pag-nav"> ► </button>
                </footer>
            )}

            {/* MODAL DE SUBIDA DE EVIDENCIA */}
            {mostrarFormSubida && (
                <div className="modal-galeria-abierta fade-in" onClick={() => setMostrarFormSubida(false)}>
                    <div className="contenido-modal-subida" onClick={e => e.stopPropagation()}>
                        <button className="cerrar-modal-neon" onClick={() => setMostrarFormSubida(false)}>×</button>
                        <Forms title="REPORTE DE EVIDENCIA VISUAL" onSubmit={(e) => { subirImagen(e); setMostrarFormSubida(false); }}>
                            <div className="grid-form-bunker">
                                <div className="form-group-full">
                                    <label>TÍTULO DEL HALLAZGO:</label>
                                    <input
                                        type="text" value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)}
                                        placeholder="Ej: Luces sobre la Alhambra..." required
                                    />
                                </div>

                                <div className="form-group-full">
                                    <label>DESCRIPCIÓN TÁCTICA:</label>
                                    <textarea
                                        value={nuevaDesc} onChange={e => setNuevaDesc(e.target.value)}
                                        placeholder="Describe lo que viste con detalle..."
                                    ></textarea>
                                </div>

                                <div className="form-row-coords">
                                    <div className="coord-field">
                                        <label>LATITUD:</label>
                                        <input type="number" step="any" value={latitud} onChange={e => setLatitud(e.target.value)} />
                                    </div>
                                    <div className="coord-field">
                                        <label>LONGITUD:</label>
                                        <input type="number" step="any" value={longitud} onChange={e => setLongitud(e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-row-search">
                                    <input 
                                        type="text" value={busquedaCiudad} onChange={e => setBusquedaCiudad(e.target.value)}
                                        placeholder="Buscar ubicación..." 
                                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), buscarCoordenadas())}
                                    />
                                    <button type="button" className="btn-tactico-mini" onClick={buscarCoordenadas}>🔍 BUSCAR</button>
                                    <button type="button" className="btn-tactico-mini" onClick={obtenerPosicion}>📡 GPS</button>
                                </div>

                                <div className="form-group-full">
                                    <label>ARCHIVO DE EVIDENCIA:</label>
                                    <input type="file" onChange={e => setArchivoSeleccionado(e.target.files[0])} required />
                                </div>

                                <button type="submit" disabled={subiendo} className="btn-submit-bunker">
                                    {subiendo ? 'TRANSMITIENDO...' : 'REGISTRAR EVIDENCIA EN EL BÚNKER'}
                                </button>
                            </div>
                        </Forms>
                    </div>
                </div>
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
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const indexActual = listaActual.findIndex(img => img.id === fotoExpandida.id);
                                        if (indexActual !== -1) {
                                            let nuevoIndex = indexActual === 0 ? listaActual.length - 1 : indexActual - 1;
                                            const imgNext = listaActual[nuevoIndex];
                                            const nombreArchivo = imgNext[confActual.columna];
                                            let rutaImg = nombreArchivo?.startsWith('http') ? nombreArchivo : null;
                                            if (!rutaImg && nombreArchivo) {
                                                const base = imgNext.esDeLugar ? `${API_BASE_URL}/lugares/` : `${confActual.urlBase}`;
                                                rutaImg = `${base}${nombreArchivo}`;
                                            }
                                            resetZoom();
                                            setFotoExpandida({ ...imgNext, rutaCompleta: rutaImg });
                                        }
                                    }}
                                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.8)', color: 'var(--color-principal)', border: '1px solid var(--color-principal)', borderRadius: '50%', width: '40px', height: '40px', zIndex: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 0 5px #00ff41' }}
                                >
                                    ◀
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const indexActual = listaActual.findIndex(img => img.id === fotoExpandida.id);
                                        if (indexActual !== -1) {
                                            let nuevoIndex = (indexActual + 1) % listaActual.length;
                                            const imgNext = listaActual[nuevoIndex];
                                            const nombreArchivo = imgNext[confActual.columna];
                                            let rutaImg = nombreArchivo?.startsWith('http') ? nombreArchivo : null;
                                            if (!rutaImg && nombreArchivo) {
                                                const base = imgNext.esDeLugar ? `${API_BASE_URL}/lugares/` : `${confActual.urlBase}`;
                                                rutaImg = `${base}${nombreArchivo}`;
                                            }
                                            resetZoom();
                                            setFotoExpandida({ ...imgNext, rutaCompleta: rutaImg });
                                        }
                                    }}
                                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.8)', color: 'var(--color-principal)', border: '1px solid var(--color-principal)', borderRadius: '50%', width: '40px', height: '40px', zIndex: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', boxShadow: '0 0 5px #00ff41' }}
                                >
                                    ▶
                                </button>
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
                                        <span className="tag-alerta">{confActual.etiqueta}</span>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => compartirEvidencia(fotoExpandida, 'twitter')} className="btn-social-mini" style={{ background: '#1DA1F2', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>𝕏</button>
                                            <button onClick={() => compartirEvidencia(fotoExpandida, 'instagram')} className="btn-social-mini" style={{ background: '#E1306C', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>IG</button>
                                            <button onClick={() => compartirEvidencia(fotoExpandida, 'whatsapp')} className="btn-social-mini" style={{ background: '#25D366', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>WA</button>
                                            <button onClick={() => compartirEvidencia(fotoExpandida, 'copy')} className="btn-social-mini" style={{ background: '#444', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.65rem' }}>📎</button>
                                        </div>
                                    </div>
                                    <h2 className="neon-text-blue">{(fotoExpandida.titulo || fotoExpandida.nombre)?.toUpperCase()}</h2>
                                    
                                    <div className="contenedor-acciones-rapidas" style={{ margin: '20px 0' }}>
                                        {fotoExpandida.esRelato ? (
                                            <button className="btn-action-map-v2" onClick={() => navigate('/expedientes')}>📖 LEER RELATO COMPLETO</button>
                                        ) : (
                                            <button className="btn-action-map-v2" onClick={() => verEnMapa(fotoExpandida)}>📍 LOCALIZAR EN EL RADAR</button>
                                        )}
                                    </div>
                                </header>
                                <div className="body-text">
                                    <p className="desc-galeria-full">
                                        {fotoExpandida.esRelato 
                                            ? "🔒 ARCHIVO VINCULADO: Esta evidencia gráfica forma parte de una crónica detallada en el archivo central. Pulsa el botón superior para desclasificar el relato completo."
                                            : (fotoExpandida.descripcion || fotoExpandida.cuerpo || "Sin notas adicionales en el informe.")
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