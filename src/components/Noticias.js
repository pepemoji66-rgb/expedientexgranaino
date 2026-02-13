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
    }, [obtenerNoticias]);

    // --- LÓGICA DE BÚSQUEDA DE SATÉLITE ---
    const buscarDireccion = async (texto) => {
        setNuevaNoticia(prev => ({ ...prev, ubicacion: texto }));
        if (texto.length > 4) {
            setBuscandoLoc(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto)}&limit=1`,
                    { headers: { 'User-Agent': 'ExpedienteX_Bunker' } }
                );
                const data = await response.json();
                if (data && data.length > 0) {
                    setNuevaNoticia(prev => ({
                        ...prev,
                        latitud: parseFloat(data[0].lat),
                        longitud: parseFloat(data[0].lon)
                    }));
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
            await axios.post('http://localhost:5000/proponer-noticia', formData);
            alert("📡 REPORTE ENVIADO AL BÚNKER");
            setNuevaNoticia({ titulo: '', cuerpo: '', nivel_alerta: 'Bajo', ubicacion: '', latitud: null, longitud: null });
            setImagen(null);
            obtenerNoticias();
        } catch (err) {
            alert("❌ Error en la transmisión.");
        }
    };

    const indiceUltimoItem = paginaActual * noticiasPorPagina;
    const indicePrimerItem = indiceUltimoItem - noticiasPorPagina;
    const noticiasPaginadas = noticias.slice(indicePrimerItem, indiceUltimoItem);
    const totalPaginas = Math.ceil(noticias.length / noticiasPorPagina);

    if (cargando) return <div className="cargando-bunker">SINTONIZANDO FRECUENCIAS...</div>;

    return (
        <section className="noticias-page">
            <header className="header-noticias">
                <h1 className="titulo-noticias">📡 TELETIPO SECTOR X</h1>
                <div className="linea-decorativa"></div>
            </header>

            <div className="noticias-grid">
                {noticiasPaginadas.map((item) => (
                    <div key={item.id} className="card-noticia fade-in" onClick={() => setNoticiaSeleccionada(item)}>
                        <div className="noticia-img-container" style={{ background: '#000', minHeight: '150px' }}>
                            <img
                                src={item.imagen_url ? `http://localhost:5000/imagenes/${item.imagen_url}` : "/img-default.jpg"}
                                alt={item.titulo}
                                className="noticia-miniatura"
                                onError={(e) => { e.target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8Xw8AAoMBX928o1oAAAAASUVORK5CYII="; }}
                            />
                        </div>
                        <div className="noticia-contenido">
                            <div className="noticia-meta">
                                <span className={`noticia-alerta alerta-${item.nivel_alerta?.toLowerCase()}`}>{item.nivel_alerta}</span>
                            </div>
                            <h3 className="noticia-titulo">{item.titulo}</h3>
                            <div className="noticia-footer">📍 {item.ubicacion}</div>
                        </div>
                    </div>
                ))}
            </div>

            {totalPaginas > 1 && (
                <div className="paginacion-bunker">
                    <button disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)}>ATRÁS</button>
                    <span className="pagi-info">{paginaActual} / {totalPaginas}</span>
                    <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(paginaActual + 1)}>SIGUIENTE</button>
                </div>
            )}

            {userAuth && (
                <div className="contenedor-form-noticia">
                    <Forms title="REPORTAR SUCESO" onSubmit={enviarPropuesta} onClear={() => { }}>
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
                        <input type="file" onChange={e => setImagen(e.target.files[0])} />
                        <textarea placeholder="DESCRIPCIÓN..." value={nuevaNoticia.cuerpo} onChange={e => setNuevaNoticia({ ...nuevaNoticia, cuerpo: e.target.value })} required />
                    </Forms>
                </div>
            )}

            {noticiaSeleccionada && (
                <div className="modal-noticia-overlay" onClick={() => setNoticiaSeleccionada(null)}>
                    <div className="modal-noticia-content" onClick={(e) => e.stopPropagation()}>
                        <button className="btn-cerrar-modal" onClick={() => setNoticiaSeleccionada(null)}>✕</button>
                        <div className="noticia-cuerpo-modal-contenedor">
                            <h2 className="noticia-titulo-modal">{noticiaSeleccionada.titulo}</h2>
                            <img
                                src={noticiaSeleccionada.imagen_url ? `http://localhost:5000/imagenes/${noticiaSeleccionada.imagen_url}` : "/img-default.jpg"}
                                className="img-modal-expandida"
                                alt="Evidencia"
                            />
                            <p className="noticia-texto-completo">{noticiaSeleccionada.cuerpo}</p>
                            <button className="btn-ver-en-mapa" onClick={() => navigate('/lugares', { state: { lat: noticiaSeleccionada.latitud, lng: noticiaSeleccionada.longitud, noticiaId: noticiaSeleccionada.id } })}>
                                📡 LOCALIZAR EN RADAR
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Noticias;