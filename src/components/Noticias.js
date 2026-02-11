import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Forms from './Forms';
import './noticias.css';

const Noticias = ({ userAuth }) => {
    const [noticias, setNoticias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
    const navigate = useNavigate();

    // --- LÓGICA DE PAGINACIÓN ---
    const [paginaActual, setPaginaActual] = useState(1);
    const noticiasPorPagina = 6;

    const [nuevaNoticia, setNuevaNoticia] = useState({
        titulo: '',
        cuerpo: '',
        nivel_alerta: 'Bajo',
        ubicacion: '',
        latitud: null,
        longitud: null
    });

    const [imagen, setImagen] = useState(null);
    const [buscandoLoc, setBuscandoLoc] = useState(false);

    const obtenerNoticias = useCallback(async () => {
        try {
            const res = await axios.get('http://localhost:5000/noticias-publicas');
            setNoticias(res.data || []);
            setCargando(false);
        } catch (err) {
            console.error("❌ ERROR AL CARGAR TELETIPO:", err);
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        obtenerNoticias();
    }, [obtenerNoticias, userAuth]);

    const indiceUltimoItem = paginaActual * noticiasPorPagina;
    const indicePrimerItem = indiceUltimoItem - noticiasPorPagina;
    const noticiasPaginadas = noticias.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(noticias.length / noticiasPorPagina);

    const cambiarPagina = (numero) => {
        setPaginaActual(numero);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const buscarDireccion = async (texto) => {
        setNuevaNoticia({ ...nuevaNoticia, ubicacion: texto });
        if (texto.length > 4) {
            setBuscandoLoc(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}&limit=1`,
                    { headers: { 'User-Agent': 'ExpedienteX_Bunker' } }
                );
                const data = await response.json();
                if (data && data.length > 0) {
                    setNuevaNoticia(prev => ({ ...prev, latitud: data[0].lat, longitud: data[0].lon }));
                }
            } catch (error) {
                console.warn("⚠️ Error satélite:", error);
            } finally {
                setBuscandoLoc(false);
            }
        }
    };

    const enviarPropuesta = async (e) => {
        if (e) e.preventDefault();
        const formData = new FormData();
        formData.append('titulo', nuevaNoticia.titulo);
        formData.append('cuerpo', nuevaNoticia.cuerpo);
        formData.append('nivel_alerta', nuevaNoticia.nivel_alerta);
        formData.append('ubicacion', nuevaNoticia.ubicacion);
        formData.append('latitud', nuevaNoticia.latitud || '');
        formData.append('longitud', nuevaNoticia.longitud || '');
        formData.append('usuario_id', userAuth?.id || 0);
        if (imagen) formData.append('imagen', imagen);

        try {
            await axios.post('http://localhost:5000/proponer-noticia', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("📡 REPORTE ENVIADO AL BÚNKER PARA REVISIÓN");
            limpiarFormulario();
            obtenerNoticias();
        } catch (err) {
            alert("❌ Error en la transmisión.");
        }
    };

    const limpiarFormulario = () => {
        setNuevaNoticia({ titulo: '', cuerpo: '', nivel_alerta: 'Bajo', ubicacion: '', latitud: null, longitud: null });
        setImagen(null);
        const inputImg = document.getElementById('input-imagen-noticia');
        if (inputImg) inputImg.value = "";
    };

    if (cargando) return <div className="cargando-bunker">SINTONIZANDO FRECUENCIAS...</div>;

    return (
        <div className="noticias-page">
            <header className="header-noticias">
                <h1 className="titulo-noticias">📡 TELETIPO DE ALERTA SECTOR X</h1>
                <div className="linea-decorativa"></div>
            </header>

            <div className="noticias-grid">
                {noticiasPaginadas.map((item) => {
                    const nombreImagen = item.imagen || item.imagen_url;
                    return (
                        <div key={item.id} className="card-noticia fade-in" onClick={() => setNoticiaSeleccionada(item)}>
                            <div className="noticia-img-container" style={{ position: 'relative', minHeight: '150px', background: '#000' }}>
                                {nombreImagen && (
                                    <span style={{
                                        position: 'absolute', top: 0, left: 0, background: 'rgba(0,0,0,0.8)',
                                        color: '#00ff41', fontSize: '10px', zIndex: 10, padding: '4px', borderBottomRightRadius: '5px'
                                    }}>
                                        FILE: {nombreImagen}
                                    </span>
                                )}

                                {nombreImagen ? (
                                    <img
                                        src={`http://localhost:5000/imagenes/${nombreImagen}`}
                                        alt={item.titulo}
                                        className="noticia-miniatura"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            // Imagen transparente 1x1 para cortar el bucle de raíz
                                            e.target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8Xw8AAoMBX928o1oAAAAASUVORK5CYII=";
                                            e.target.classList.add('img-error');
                                        }}
                                    />
                                ) : (
                                    <div className="sin-evidencia-visual">⚠️ SIN CAPTURA</div>
                                )}
                            </div>

                            <div className="noticia-contenido">
                                <div className="noticia-meta">
                                    <span className={`noticia-alerta alerta-${item.nivel_alerta?.toLowerCase()}`}>
                                        {item.nivel_alerta}
                                    </span>
                                    <span className="noticia-fecha">
                                        {item.fecha ? new Date(item.fecha).toLocaleDateString() : 'PENDIENTE'}
                                    </span>
                                </div>
                                <h3 className="noticia-titulo">{item.titulo}</h3>
                                <p className="noticia-cuerpo-resumen">
                                    {item.cuerpo?.substring(0, 100)}...
                                </p>
                                <div className="noticia-footer">
                                    📍 {item.ubicacion}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {totalPaginas > 1 && (
                <div className="paginacion-bunker">
                    <button disabled={paginaActual === 1} onClick={() => cambiarPagina(paginaActual - 1)}>ATRÁS</button>
                    <span className="pagi-info">{paginaActual} / {totalPaginas}</span>
                    <button disabled={paginaActual === totalPaginas} onClick={() => cambiarPagina(paginaActual + 1)}>SIGUIENTE</button>
                </div>
            )}

            {userAuth && (
                <div className="contenedor-form-noticia">
                    <Forms
                        title={userAuth.rol === 'admin' ? 'COMUNICADO OFICIAL' : 'REPORTAR SUCESO'}
                        onSubmit={enviarPropuesta}
                        onClear={limpiarFormulario}
                    >
                        <input type="text" placeholder="TITULAR" value={nuevaNoticia.titulo} onChange={e => setNuevaNoticia({ ...nuevaNoticia, titulo: e.target.value })} required />
                        <div style={{ position: 'relative' }}>
                            <input type="text" placeholder="UBICACIÓN" value={nuevaNoticia.ubicacion} onChange={e => buscarDireccion(e.target.value)} required />
                            {buscandoLoc && <span className="loader-satelite">🛰️</span>}
                        </div>
                        <select value={nuevaNoticia.nivel_alerta} onChange={e => setNuevaNoticia({ ...nuevaNoticia, nivel_alerta: e.target.value })}>
                            <option value="Bajo">Nivel: BAJO</option>
                            <option value="Medio">Nivel: MEDIO</option>
                            <option value="Alto">Nivel: ALTO</option>
                            <option value="CRÍTICO">Nivel: CRÍTICO</option>
                        </select>
                        <div className="input-file-bunker">
                            <label>📷 EVIDENCIA VISUAL:</label>
                            <input id="input-imagen-noticia" type="file" accept="image/*" onChange={e => setImagen(e.target.files[0])} />
                        </div>
                        <textarea placeholder="DESCRIPCIÓN DEL SUCESO..." value={nuevaNoticia.cuerpo} onChange={e => setNuevaNoticia({ ...nuevaNoticia, cuerpo: e.target.value })} required />
                    </Forms>
                </div>
            )}
/* ... resto del código ... */
            {/* --- MODAL DE DETALLE --- */}
            {noticiaSeleccionada && (
                <div className="modal-noticia-overlay" onClick={() => setNoticiaSeleccionada(null)}>
                    <div className="modal-noticia-content" onClick={(e) => e.stopPropagation()}>

                        {/* BOTÓN DE CIERRE */}
                        <button
                            className="btn-cerrar-modal"
                            onClick={() => setNoticiaSeleccionada(null)}
                            title="Cerrar Informe"
                        >
                            X
                        </button>

                        <h2 className="noticia-titulo-modal" style={{ color: 'var(--color-critico)', textAlign: 'center' }}>
                            INCÓGNITA
                        </h2>

                        <p className="noticia-meta-modal">
                            <span style={{ color: 'var(--color-principal)' }}>{noticiaSeleccionada.titulo}</span><br />
                            {/* Protección contra undefined en toUpperCase */}
                            Nivel: {(noticiaSeleccionada.nivel_alerta || noticiaSeleccionada.alerta || "desconocido").toUpperCase()} | {noticiaSeleccionada.ubicacion}
                        </p>

                        <hr className="linea-decorativa" />

                        <img
                            src={noticiaSeleccionada.imagen
                                ? `http://localhost:5000/imagenes/${noticiaSeleccionada.imagen}`
                                : noticiaSeleccionada.imagen_url
                            }
                            alt="Evidencia"
                            className="img-modal-expandida"
                            onError={(e) => {
                                e.target.src = "https://via.placeholder.com/400x220?text=ARCHIVO+CLASIFICADO";
                                e.target.onerror = null;
                            }}
                        />

                        <div className="noticia-cuerpo-modal" style={{ whiteSpace: 'pre-wrap' }}>
                            {noticiaSeleccionada.cuerpo}
                        </div>
                    </div>
                </div>
            )}
            {/* Fin del Modal */}

        </div> /* Fin de noticias-page */
    );
};

export default Noticias;