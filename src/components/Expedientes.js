import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { renderizarTextoConMedios } from '../utils/renderMedios';
import API_BASE_URL from '../config';
import AdSlot from './AdSlot';
import './expedientes.css'; 

const Expedientes = () => {
    const [seccion, setSeccion] = useState('jefe'); // Priorizamos relatos del jefe
    const [datos, setDatos] = useState([]);
    const [relatoAbierto, setRelatoAbierto] = useState(null);
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [nuevoContenido, setNuevoContenido] = useState('');
    const [latitud, setLatitud] = useState('');
    const [longitud, setLongitud] = useState('');
    const [busquedaLugar, setBusquedaLugar] = useState('');
    const [cargando, setCargando] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    const [userAuth, setUserAuth] = useState(null);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const sesion = localStorage.getItem('agente_sesion');
        if (sesion) setUserAuth(JSON.parse(sesion));
    }, []);

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const endpoint = seccion === 'usuarios'
                ? `${API_BASE_URL}/api/expedientes/expedientes-publicos` 
                : `${API_BASE_URL}/api/expedientes/relatos-admin-publicos`;
            
            const res = await axios.get(endpoint);
            if (res.data && Array.isArray(res.data)) {
                setDatos(res.data);
            } else {
                setDatos([]);
            }
        } catch (err) {
            console.error("❌ Error en la aduana de expedientes:", err);
            setDatos([]);
        } finally {
            setCargando(false);
        }
    }, [seccion]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const obtenerUbicacion = () => {
        if (!navigator.geolocation) return alert("GPS NO DISPONIBLE.");
        navigator.geolocation.getCurrentPosition(pos => {
            setLatitud(pos.coords.latitude.toFixed(6));
            setLongitud(pos.coords.longitude.toFixed(6));
        });
    };

    const buscarCoordenadas = async () => {
        if (!busquedaLugar) return;
        setCargando(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${busquedaLugar}`);
            if (res.data && res.data.length > 0) {
                const { lat, lon } = res.data[0];
                setLatitud(parseFloat(lat).toFixed(6));
                setLongitud(parseFloat(lon).toFixed(6));
                alert(`📍 Localización fijada: ${res.data[0].display_name}`);
            } else {
                alert("❌ No se ha detectado el sector en el radar.");
            }
        } catch (err) {
            alert("❌ Fallo en la conexión con el satélite geográfico.");
        } finally {
            setCargando(false);
        }
    };

    const enviarExpediente = async (e) => {
        e.preventDefault();
        if (!userAuth) return alert("Identidad no verificada.");

        const formData = new FormData();
        formData.append('titulo', nuevoTitulo);
        formData.append('contenido', nuevoContenido);
        formData.append('usuario_nombre', userAuth.nombre);
        formData.append('latitud', latitud || 0);
        formData.append('longitud', longitud || 0);
        formData.append('tipo', seccion === 'jefe' ? 'jefe' : 'agente');
        
        const fileInput = document.getElementById('archivo-expediente');
        if (fileInput && fileInput.files[0]) {
            formData.append('imagen', fileInput.files[0]);
        }

        try {
            await axios.post(`${API_BASE_URL}/api/expedientes/subir-expediente`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("🚀 EXPEDIENTE ARCHIVADO CORRECTAMENTE.");
            setNuevoTitulo('');
            setNuevoContenido('');
            setLatitud('');
            setLongitud('');
            if (fileInput) fileInput.value = "";
            cargarDatos();
        } catch (err) {
            console.error("Error al subir expediente:", err);
            alert("❌ Error en la transmisión al Búnker.");
        }
    };

    const aumentarRelevancia = async (e, id) => {
        if (e) e.stopPropagation();
        if (!userAuth) {
            alert("🔒 ACCESO DENEGADO: Necesitas rango de 'Agente' para marcar relevancia.");
            return;
        }

        try {
            const res = await axios.post(`${API_BASE_URL}/api/expedientes/relevancia/${id}`);
            if (res.data && res.data.relevancia !== undefined) {
                // Actualizar localmente el contador
                setDatos(prevDatos => prevDatos.map(item => 
                    item.id === id ? { ...item, relevancia: res.data.relevancia } : item
                ));
                // Si el modal está abierto, actualizarlo también
                if (relatoAbierto && relatoAbierto.id === id) {
                    setRelatoAbierto(prev => ({ ...prev, relevancia: res.data.relevancia }));
                }
            }
        } catch (err) {
            console.error("Error al marcar relevancia:", err);
        }
    };

    const compartirExpediente = async (red) => {
        if (!relatoAbierto) return;
        const url = `${window.location.origin}/leer-historia/${relatoAbierto.id}`;
        const texto = `🛸 ¡AVISTAMIENTO DETECTADO! Mira este expediente en el Búnker de ExpedienteX: "${relatoAbierto.titulo?.toUpperCase()}" @PEPE1318057 @MUFON #UFO #Granada #ExpedienteXGranaino`;
        
        // Prioridad 1: Web Share API (Móviles)
        if (navigator.share && red !== 'copy' && red !== 'instagram') {
            try {
                await navigator.share({
                    title: 'BÚNKER EXPEDIENTE X - INFORME',
                    text: texto,
                    url: url,
                });
                return;
            } catch (err) {
                console.log("Compartir cancelado");
            }
        }

        // Prioridad 2: Fallback (Desktop / Manual)
        let link = '';
        if (red === 'twitter') {
            link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
        } else if (red === 'whatsapp') {
            link = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto + ' ' + url)}`;
        }
        
        if (link) {
            window.open(link, '_blank');
        } else if (red === 'copy' || red === 'twitter' || red === 'whatsapp') {
            try {
                await navigator.clipboard.writeText(`${texto} ${url}`);
                alert("📎 ENLACE COPIADO AL PORTAPAPELES. ¡LISTO PARA DIFUNDIR!");
            } catch (err) {
                alert("❌ ERROR AL COPIAR: Intenta compartir manualmente.");
            }
        }
    };

    const isAdmin = userAuth && (userAuth.rol === 'admin' || userAuth.email === 'archipegv2@gmail.com');

    return (
        <div className="experiencias-page">
            <header className="header-central">
                <h1 className="titulo-principal">EXPEDIENTEXGRANAINO Y MUNDIAL</h1>
            </header>

            <div className="advertencia-expedientes">
                <p>🛡️ <strong>PROTOCOLO DE VERACIDAD:</strong> Priorizamos informes basados en sucesos reales, testimonios directos y evidencias de campo. Aunque permitimos la reconstrucción narrativa, la fidelidad a los hechos es nuestro estandarte. Documenta con responsabilidad.</p>
            </div>

            <div className="botones-superiores">
                <button
                    className={`btn-main ${seccion === 'usuarios' ? 'active' : ''}`}
                    onClick={() => setSeccion('usuarios')}
                >
                    INFORMES DE AGENTES
                </button>
                <button
                    className={`btn-main admin-main ${seccion === 'jefe' ? 'active' : ''}`}
                    onClick={() => setSeccion('jefe')}
                >
                    RELATOS DEL ADMINISTRADOR
                </button>
            </div>


            <div className={`tabla-container-pro ${seccion === 'jefe' ? 'admin-border' : ''}`}>
                {cargando ? (
                    <div className="cargando-expedientes">
                        <div className="scanner-line"></div>
                        <p>DESCRIPTANDO SEÑAL...</p>
                    </div>
                ) : isMobile ? (
                    <div className="grid-expedientes-mobile">
                        {datos.length > 0 ? (
                            datos.map(item => (
                                <div key={item.id} className="card-expediente-mobile" onClick={() => setRelatoAbierto(item)}>
                                    {item.imagen_url && (
                                        <div className="card-img-container">
                                            <img 
                                                src={item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`} 
                                                alt="evidencia" 
                                            />
                                        </div>
                                    )}
                                    <div className="card-body-mobile">
                                        <span className="card-tag">{item.tipo === 'jefe' ? '🛡️ JEFE' : '👤 AGENTE'}</span>
                                        <h3 className="card-title-mobile">{item.titulo?.toUpperCase()}</h3>
                                        <div className="card-footer-mobile">
                                            <div className="relevancia-mini" onClick={(e) => aumentarRelevancia(e, item.id)}>
                                                ⭐ <span className="rel-count">{item.relevancia || 0}</span>
                                            </div>
                                            <small>{item.usuario_nombre || 'ANÓNIMO'}</small>
                                            <button className="btn-leer-pro">ABRIR</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-datos">SIN EXPEDIENTES EN ESTE SECTOR.</p>
                        )}
                    </div>
                ) : (
                    <table className="tabla-pro">
                        <thead>
                            <tr>
                                <th>ESTADO</th>
                                <th>IMAGEN</th>
                                <th>TÍTULO</th>
                                <th>UBICACIÓN</th>
                                <th>ACCIÓN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {datos.length > 0 ? (
                                datos.map((item) => (
                                    <tr key={item.id}>
                                        <td>
                                            <span className="status-badge-pro">
                                                {item.tipo === 'jefe' ? '🛡️ JEFE' : '👤 AGENTE'}
                                            </span>
                                        </td>
                                        <td>
                                            {item.imagen_url ? (
                                                <img 
                                                    src={item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`} 
                                                    className="img-tabla-preview" 
                                                    alt="thumb" 
                                                />
                                            ) : '---'}
                                        </td>
                                        <td className="titulo-celda">{item.titulo ? item.titulo.toUpperCase() : 'SIN TÍTULO'}</td>
                                        <td className="coord-celda">
                                            {item.latitud ? `${item.latitud}, ${item.longitud}` : '---'}
                                        </td>
                                        <td>
                                            <div className="btn-group-tabla">
                                                <button className="btn-relevancia-tabla" onClick={(e) => aumentarRelevancia(e, item.id)}>
                                                    ⭐ {item.relevancia || 0}
                                                </button>
                                                <button className="btn-leer-pro" onClick={() => setRelatoAbierto(item)}>
                                                    ABRIR
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="no-datos">
                                        📡 FRECUENCIA LIMPIA. NINGUNA ACTIVIDAD DETECTADA.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Formulario visible para agentes en su sección o para el Admin en la suya */}
            {(seccion === 'usuarios' || (seccion === 'jefe' && isAdmin)) && (
                <div className="contenedor-envio-expediente">
                    <div style={{ background: 'rgba(255,177,0,0.1)', border: '1px solid #ffb100', padding: '15px', marginBottom: '20px', borderRadius: '5px', textAlign: 'center' }}>
                        <p style={{ color: '#ffb100', fontSize: '0.8rem', fontFamily: 'monospace', margin: 0 }}>
                            📑 <strong>CONTROL DE ARCHIVO:</strong> Los informes enviados serán validados por el Administrador antes de su publicación definitiva.
                        </p>
                    </div>
                    <h2 className="titulo-neon-p">
                        {seccion === 'jefe' ? 'REDACTAR RELATO OFICIAL' : 'REDACTAR NUEVO INFORME'}
                    </h2>
                    <form onSubmit={enviarExpediente} className="form-expediente">
                        <input
                            type="text"
                            className="input-bunker-exp"
                            placeholder="TÍTULO DEL INFORME..."
                            value={nuevoTitulo}
                            onChange={(e) => setNuevoTitulo(e.target.value)}
                            required
                        />
                        <textarea
                            className="textarea-bunker-exp"
                            placeholder="DESCRIPCIÓN DE LOS HECHOS..."
                            value={nuevoContenido}
                            onChange={(e) => setNuevoContenido(e.target.value)}
                            required
                        ></textarea>
                        
                        {/* BUSCADOR DE COORDENADAS */}
                        <div style={{ background: 'rgba(0,255,65,0.05)', padding: '15px', marginBottom: '20px', border: '1px solid #222' }}>
                            <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>RADAR GEOGRÁFICO (BUSCAR CIUDAD/PUEBLO):</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input 
                                    type="text" 
                                    value={busquedaLugar} 
                                    onChange={e => setBusquedaLugar(e.target.value)} 
                                    placeholder="Ej: Granada, Albolote, Maracena..."
                                    className="input-bunker-exp"
                                    style={{ flex: 1, marginBottom: 0 }}
                                />
                                <button type="button" onClick={buscarCoordenadas} style={{ padding: '10px', background: 'var(--color-principal)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                    BUSCAR
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'end', marginBottom: '15px' }}>
                            <div>
                                <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem' }}>LATITUD</label>
                                <input type="number" step="any" className="input-bunker-exp" value={latitud} onChange={e => setLatitud(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem' }}>LONGITUD</label>
                                <input type="number" step="any" className="input-bunker-exp" value={longitud} onChange={e => setLongitud(e.target.value)} />
                            </div>
                            <button type="button" onClick={obtenerUbicacion} style={{
                                padding: '10px', background: 'transparent', border: '1px solid var(--color-principal)', color: 'var(--color-principal)',
                                fontFamily: 'monospace', fontSize: '0.65rem', cursor: 'pointer', marginBottom: '10px'
                            }}>
                                📍 POSICIÓN
                            </button>
                        </div>

                        <div className="form-group-exp">
                            <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem', display: 'block', marginBottom: '5px' }}>IMAGEN DE EVIDENCIA (OPCIONAL)</label>
                            <input type="file" id="archivo-expediente" className="input-file-exp" style={{ color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '15px' }} />
                        </div>

                        <button type="submit" className="btn-enviar-expediente">
                            {seccion === 'jefe' ? 'PUBLICAR RELATO' : 'SUBIR AL ARCHIVO'}
                        </button>
                    </form>
                </div>
            )}

            {/* MODAL PARA LEER EL ARCHIVO */}
            {relatoAbierto && (
                <div className="modal-overlay" onClick={() => setRelatoAbierto(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header-pro">
                            <h2 style={{ color: 'var(--color-principal)' }}>{relatoAbierto.titulo}</h2>
                            <button className="btn-cerrar-x" onClick={() => setRelatoAbierto(null)}>×</button>
                        </div>
                        
                        {relatoAbierto.imagen_url && (
                            <div className="img-relato-full">
                                <img 
                                    src={relatoAbierto.imagen_url.startsWith('http') ? relatoAbierto.imagen_url : `${API_BASE_URL}/imagenes/${relatoAbierto.imagen_url}`} 
                                    alt="evidencia" 
                                />
                            </div>
                        )}

                        <div className="info-meta">
                            <span>ORIGEN: {relatoAbierto.usuario_nombre || 'ADMINISTRADOR'}</span>
                            <span>COORD: {relatoAbierto.latitud || '0'}, {relatoAbierto.longitud || '0'}</span>
                        </div>
                        
                        <hr style={{ borderColor: '#333', margin: '15px 0' }} />
                        
                        <div className="texto-relato-modal">
                            {renderizarTextoConMedios(relatoAbierto.contenido)}
                        </div>
                        
                        <div className="modal-footer-pro">
                            <div className="modal-actions-top">
                                <button onClick={() => setRelatoAbierto(null)} className="btn-volver-atras">
                                    ⬅ VOLVER
                                </button>
                                <button className="btn-marcar-relevante" onClick={(e) => aumentarRelevancia(e, relatoAbierto.id)}>
                                    ⭐ MARCAR COMO RELEVANTE ({relatoAbierto.relevancia || 0})
                                </button>
                            </div>
                            <div className="share-section-modal" style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '15px', width: '100%' }}>
                                <p style={{ color: 'var(--color-principal)', fontSize: '0.7rem', marginBottom: '10px', textAlign: 'center', fontFamily: 'monospace' }}>
                                    📡 DIFUNDIR EN EL RADAR EXTERNO (MUFON/UFO):
                                </p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={() => compartirExpediente('twitter')} className="btn-share-tactico" style={{ background: '#1DA1F2', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>𝕏 TWITTER</button>
                                    <button onClick={() => compartirExpediente('whatsapp')} className="btn-share-tactico" style={{ background: '#25D366', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>WHATSAPP</button>
                                    <button onClick={() => compartirExpediente('copy')} className="btn-share-tactico" style={{ background: '#555', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>COPIAR</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <AdSlot id="expedientes-bottom" />
        </div>
    );
};

export default Expedientes;
