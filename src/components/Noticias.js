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

    const verEnMapa = (item) => {
        const payload = {
            id: item.id,
            latitud: item.latitud,
            longitud: item.longitud,
            tipo: 'noticia'
        };
        localStorage.setItem('lugar_a_resaltar', JSON.stringify(payload));
        navigate('/lugares');
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
            alert("📡 REPORTE RECIBIDO");
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
                    const nombreImagen = item.imagen_url || item.imagen;
                    return (
                        <div key={item.id} className="card-noticia fade-in">
                            {nombreImagen && (
                                <div className="noticia-img-container">
                                    <img 
                                        src={`http://localhost:5000/imagenes/${nombreImagen}`} 
                                        alt={item.titulo} 
                                        className="noticia-miniatura" 
                                    />
                                </div>
                            )}
                            <div className="card-header">
                                <span className={`alerta-tag ${item.nivel_alerta === 'CRÍTICO' ? 'alerta-critica' : ''}`}>
                                    [{item.nivel_alerta.toUpperCase()}]
                                </span>
                                <span className="fecha-noticia">{new Date(item.fecha).toLocaleDateString()}</span>
                            </div>
                            <h2 className="noticia-titulo">{item.titulo}</h2>
                            {item.ubicacion && <div className="noticia-loc-badge">📍 {item.ubicacion}</div>}
                            <p className="noticia-resumen">{item.cuerpo.substring(0, 100)}...</p>
                            <div className="noticia-footer-btns">
                                <button className="btn-leer-noticia" onClick={() => setNoticiaSeleccionada(item)}>👁️ INFORME</button>
                                {item.ubicacion && <button className="btn-ver-mapa" onClick={() => verEnMapa(item)}>📍 MAPA</button>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {totalPaginas > 1 && (
                <div className="paginacion-bunker" style={{ textAlign: 'center', margin: '30px 0' }}>
                    <button disabled={paginaActual === 1} onClick={() => cambiarPagina(paginaActual - 1)}>ATRÁS</button>
                    <span style={{ color: '#00ff41', margin: '0 15px' }}>{paginaActual} / {totalPaginas}</span>
                    <button disabled={paginaActual === totalPaginas} onClick={() => cambiarPagina(paginaActual + 1)}>SIGUIENTE</button>
                </div>
            )}

            {userAuth && (
                <div className="contenedor-form-noticia" style={{ marginTop: '50px' }}>
                    <Forms 
                        title={userAuth.rol === 'admin' ? 'COMUNICADO OFICIAL' : 'REPORTAR SUCESO'}
                        onSubmit={enviarPropuesta}
                        onClear={limpiarFormulario}
                    >
                        <input type="text" placeholder="TITULAR" value={nuevaNoticia.titulo} onChange={e => setNuevaNoticia({...nuevaNoticia, titulo: e.target.value})} required />
                        <div style={{ position: 'relative' }}>
                            <input type="text" placeholder="UBICACIÓN" value={nuevaNoticia.ubicacion} onChange={e => buscarDireccion(e.target.value)} required />
                            {buscandoLoc && <span style={{ position: 'absolute', right: '10px', top: '10px' }}>🛰️</span>}
                        </div>
                        <select value={nuevaNoticia.nivel_alerta} onChange={e => setNuevaNoticia({...nuevaNoticia, nivel_alerta: e.target.value})}>
                            <option value="Bajo">Nivel: BAJO</option>
                            <option value="Medio">Nivel: MEDIO</option>
                            <option value="Alto">Nivel: ALTO</option>
                            <option value="CRÍTICO">Nivel: CRÍTICO</option>
                        </select>
                        <div className="input-file-bunker" style={{ border: '1px solid #00ff41', padding: '10px', margin: '10px 0' }}>
                            <label style={{ color: '#00ff41', fontSize: '12px', display: 'block' }}>📷 IMAGEN:</label>
                            <input id="input-imagen-noticia" type="file" accept="image/*" onChange={e => setImagen(e.target.files[0])} />
                        </div>
                        <textarea placeholder="DESCRIPCIÓN..." value={nuevaNoticia.cuerpo} onChange={e => setNuevaNoticia({...nuevaNoticia, cuerpo: e.target.value})} required />
                    </Forms>
                </div>
            )}

            {noticiaSeleccionada && (
                <div className="modal-noticia-overlay" onClick={() => setNoticiaSeleccionada(null)}>
                    <div className="modal-noticia-content" onClick={e => e.stopPropagation()}>
                        <h2>{noticiaSeleccionada.titulo}</h2>
                        {(noticiaSeleccionada.imagen_url || noticiaSeleccionada.imagen) && (
                            <img 
                                src={`http://localhost:5000/imagenes/${noticiaSeleccionada.imagen_url || noticiaSeleccionada.imagen}`} 
                                alt="Evidencia" 
                                style={{ width: '100%', borderRadius: '8px' }} 
                            />
                        )}
                        <div className="modal-cuerpo" style={{ whiteSpace: 'pre-wrap', marginTop: '15px' }}>{noticiaSeleccionada.cuerpo}</div>
                        <button className="btn-cerrar-archivo" onClick={() => setNoticiaSeleccionada(null)}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Noticias;