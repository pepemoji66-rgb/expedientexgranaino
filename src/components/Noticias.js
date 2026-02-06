import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './noticias.css';

const Noticias = ({ userAuth }) => {
    const [noticias, setNoticias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
    const navigate = useNavigate();
    
    const [nuevaNoticia, setNuevaNoticia] = useState({ 
        titulo: '', 
        cuerpo: '', 
        nivel_alerta: 'Bajo',
        ubicacion: '',
        latitud: null,
        longitud: null
    });

    const [buscandoLoc, setBuscandoLoc] = useState(false);

    useEffect(() => {
        obtenerNoticias();
    }, [userAuth]);

    const obtenerNoticias = async () => {
        try {
            const res = await axios.get('http://localhost:5000/noticias-publicas');
            setNoticias(res.data || []);
            setCargando(false);
        } catch (err) {
            console.error("❌ ERROR AL CARGAR TELETIPO:", err);
            setCargando(false);
        }
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
                    setNuevaNoticia(prev => ({
                        ...prev,
                        latitud: data[0].lat,
                        longitud: data[0].lon
                    }));
                }
            } catch (error) {
                console.warn("⚠️ Error satélite:", error);
            } finally {
                setBuscandoLoc(false);
            }
        }
    };

    const verEnMapa = (item) => {
        console.log("🚀 ENVIANDO AL MAPA:", { lat: item.latitud, lng: item.longitud });
        
        if (!item.latitud || !item.longitud) {
            // Si no hay coordenadas grabadas en la DB, el mapa buscará por texto
            navigate('/lugares', { state: { buscarUbicacion: item.ubicacion } });
        } else {
            // Convertimos a número por si acaso vienen como texto de la DB
            navigate('/lugares', { 
                state: { 
                    lat: parseFloat(item.latitud), 
                    lng: parseFloat(item.longitud), 
                    nombre: item.titulo 
                } 
            });
        }
    };

    const enviarPropuesta = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/proponer-noticia', {
                ...nuevaNoticia,
                usuario_id: userAuth?.id || 0
            });
            alert("📡 REPORTE RECIBIDO. Procesando en el búnker...");
            setNuevaNoticia({ 
                titulo: '', cuerpo: '', nivel_alerta: 'Bajo', 
                ubicacion: '', latitud: null, longitud: null 
            });
            obtenerNoticias();
        } catch (err) {
            alert("❌ Error en la transmisión.");
        }
    };

    if (cargando) return <div className="cargando-bunker">SINTONIZANDO FRECUENCIAS...</div>;

    return (
        <div className="noticias-page">
            <header className="header-noticias">
                <h1 className="titulo-noticias">📡 TELETIPO DE ALERTA SECTOR X</h1>
                <div className="linea-decorativa"></div>
            </header>
            
            <div className="noticias-grid">
                {noticias.length > 0 ? noticias.map((item) => (
                    <div key={item.id} className="card-noticia">
                        <div className="card-header">
                            <span className={`alerta-tag ${item.nivel_alerta === 'CRÍTICO' ? 'alerta-critica' : ''}`}>
                                [{item.nivel_alerta.toUpperCase()}]
                            </span>
                            <span className="fecha-noticia">{new Date(item.fecha).toLocaleDateString()}</span>
                        </div>
                        <h2 className="noticia-titulo">{item.titulo}</h2>
                        {item.ubicacion && <div className="noticia-loc-badge">📍 {item.ubicacion}</div>}
                        <p className="noticia-resumen">{item.cuerpo.substring(0, 120)}...</p>
                        <div className="noticia-footer-btns" style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button className="btn-leer-noticia" onClick={() => setNoticiaSeleccionada(item)} style={{ flex: 1 }}>👁️ INFORME</button>
                            {item.ubicacion && (
                                <button className="btn-ver-mapa" onClick={() => verEnMapa(item)} style={{ flex: 1 }}>📍 MAPA</button>
                            )}
                        </div>
                    </div>
                )) : (
                    <p className="sin-noticias">No hay alertas activas en este sector.</p>
                )}
            </div>

            {userAuth ? (
                <div className="contenedor-form-noticia">
                    <div className="form-noticia-card">
                        <h3>📢 {userAuth.rol === 'admin' ? 'CREAR COMUNICADO OFICIAL' : 'INFORMAR DE UN SUCESO'}</h3>
                        <form onSubmit={enviarPropuesta} className="grid-form">
                            <input 
                                type="text" 
                                placeholder="TITULAR" 
                                value={nuevaNoticia.titulo} 
                                onChange={e => setNuevaNoticia({...nuevaNoticia, titulo: e.target.value})} 
                                required 
                            />

                            <div className="grupo-input-geo" style={{ position: 'relative' }}>
                                <input 
                                    type="text" 
                                    placeholder="DIRECCIÓN (Ej: Calle Real, Albolote)" 
                                    value={nuevaNoticia.ubicacion} 
                                    onChange={e => buscarDireccion(e.target.value)} 
                                    required
                                />
                                {buscandoLoc && <span className="loader-geo">🛰️</span>}
                                {nuevaNoticia.latitud && !buscandoLoc && (
                                    <span style={{ color: '#00ff41', fontSize: '0.7rem', display: 'block', marginTop: '5px' }}>
                                        ✅ COORDENADAS: {String(nuevaNoticia.latitud).substring(0,7)}, {String(nuevaNoticia.longitud).substring(0,7)}
                                    </span>
                                )}
                            </div>

                            <select 
                                value={nuevaNoticia.nivel_alerta} 
                                onChange={e => setNuevaNoticia({...nuevaNoticia, nivel_alerta: e.target.value})}
                            >
                                <option value="Bajo">Nivel: BAJO</option>
                                <option value="Medio">Nivel: MEDIO</option>
                                <option value="Alto">Nivel: ALTO</option>
                                <option value="CRÍTICO">Nivel: CRÍTICO</option>
                            </select>

                            <textarea 
                                placeholder="CONTENIDO..." 
                                value={nuevaNoticia.cuerpo} 
                                onChange={e => setNuevaNoticia({...nuevaNoticia, cuerpo: e.target.value})} 
                                required 
                            />
                            <button type="submit" className="btn-enviar-noticia">PUBLICAR</button>
                        </form>
                    </div>
                </div>
            ) : null}

            {noticiaSeleccionada && (
                <div className="modal-noticia-overlay" onClick={() => setNoticiaSeleccionada(null)}>
                    <div className="modal-noticia-content" onClick={e => e.stopPropagation()}>
                        <h2>{noticiaSeleccionada.titulo}</h2>
                        <hr />
                        <div className="modal-cuerpo">{noticiaSeleccionada.cuerpo}</div>
                        <button className="btn-cerrar-archivo" onClick={() => setNoticiaSeleccionada(null)}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Noticias;