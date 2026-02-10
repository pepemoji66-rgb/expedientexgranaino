import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './paneladmin.css';

const PanelAdmin = () => {
    const [tab, setTab] = useState('usuarios');
    const [usuarios, setUsuarios] = useState([]);
    const [videos, setVideos] = useState([]);
    const [expedientes, setExpedientes] = useState([]);
    const [misRelatos, setMisRelatos] = useState([]);
    const [imagenes, setImagenes] = useState([]);
    const [lugares, setLugares] = useState([]);
    const [mensajes, setMensajes] = useState([]);
    const [noticias, setNoticias] = useState([]);
    const [expedienteParaLeer, setExpedienteParaLeer] = useState(null);
    const [cargando, setCargando] = useState(false);

    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 8;

    useEffect(() => {
        cargarDatos();
    }, []);

    // --- FUNCIÓN DE SEGURIDAD PARA IMÁGENES ROTAS ---
    const handleImgError = (e) => {
        e.target.onerror = null;
        e.target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8Xw8AAoMBX928o1oAAAAASUVORK5CYII=";
    };

    const cargarDatos = async () => {
        try {
            const [resU, resV, resE, resI, resL, resC, resN, resMR] = await Promise.all([
                axios.get('http://localhost:5000/usuarios'),
                axios.get('http://localhost:5000/admin/todos-los-videos'),
                axios.get('http://localhost:5000/expedientes'),
                axios.get('http://localhost:5000/admin/todas-las-imagenes'),
                axios.get('http://localhost:5000/lugares'),
                axios.get('http://localhost:5000/chat-historial'),
                axios.get('http://localhost:5000/admin/todas-noticias'),
                axios.get('http://localhost:5000/relatos-admin-publicos')
            ]);

            setUsuarios(Array.isArray(resU.data) ? resU.data : []);
            setVideos(Array.isArray(resV.data) ? resV.data : []);
            setExpedientes(Array.isArray(resE.data) ? resE.data : []);
            setImagenes(Array.isArray(resI.data) ? resI.data : []);
            setLugares(Array.isArray(resL.data) ? resL.data : []);
            setNoticias(Array.isArray(resN.data) ? resN.data : []);
            setMensajes(Array.isArray(resC.data) ? [...resC.data].reverse() : []);
            setMisRelatos(Array.isArray(resMR.data) ? resMR.data : []);

            console.log("✅ Radar sincronizado: Sistema de archivos integrado.");
        } catch (err) {
            console.error("❌ Fallo en la recepción de datos");
        }
    };

    const gestionar = async (id, accion, tipo) => {
        if (!window.confirm(`¿Ejecutar orden de ${accion.toUpperCase()}?`)) return;
        setCargando(true);
        try {
            let url = `http://localhost:5000/`;
            if (tipo === 'usuario') url += `usuarios/${id}`;
            else if (tipo === 'expediente') url += accion === 'aprobar' ? `aprobar-expediente/${id}` : `expedientes/${id}`;
            else if (tipo === 'mis-relatos') url += `borrar-relato-admin/${id}`;
            else if (tipo === 'video') url += accion === 'aprobar' ? `aprobar-video/${id}` : `borrar-video/${id}`;
            else if (tipo === 'imagen') url += accion === 'aprobar' ? `admin/aprobar-imagen/${id}` : `borrar-imagen/${id}`;
            else if (tipo === 'lugar') url += accion === 'aprobar' ? `aprobar-lugar/${id}` : `lugares/${id}`;
            else if (tipo === 'chat') url += `borrar-mensaje/${id}`;
            else if (tipo === 'noticia') url += accion === 'aprobar' ? `admin/aprobar-noticia/${id}` : `borrar-noticia/${id}`;

            if (accion === 'aprobar') {
                await axios.put(url);
            } else {
                await axios.delete(url);
            }

            await cargarDatos();
            setCargando(false);
            alert(`✅ REGISTRO ${accion === 'aprobar' ? 'PUBLICADO' : 'ELIMINADO'}`);
        } catch (err) {
            console.error(err);
            alert("❌ Error en la operación");
            setCargando(false);
        }
    };

    const obtenerListaActiva = () => {
        switch (tab) {
            case 'usuarios': return usuarios;
            case 'videos': return videos;
            case 'expedientes': return expedientes;
            case 'mis-relatos': return misRelatos;
            case 'imagenes': return imagenes;
            case 'lugares': return lugares;
            case 'chat': return mensajes;
            case 'noticias': return noticias;
            default: return [];
        }
    };

    const listaActiva = obtenerListaActiva();
    const ultimoItem = paginaActual * itemsPorPagina;
    const primerItem = ultimoItem - itemsPorPagina;
    const itemsPaginados = listaActiva.slice(primerItem, ultimoItem);

    const cambiarTab = (t) => {
        setTab(t);
        setPaginaActual(1);
    };

    return (
        <div className="panel-admin-container fade-in">
            <h2 className="titulo-neon">CONTROL DE MANDO UNIFICADO</h2>
            {cargando && <div className="loading-overlay">OPERANDO...</div>}

            <div className="tabs-admin">
                <button className={tab === 'usuarios' ? 'active' : ''} onClick={() => cambiarTab('usuarios')}>USUARIOS</button>
                <button className={tab === 'videos' ? 'active' : ''} onClick={() => cambiarTab('videos')}>VÍDEOS</button>
                <button className={tab === 'expedientes' ? 'active' : ''} onClick={() => cambiarTab('expedientes')}>EXPEDIENTES</button>
                <button className={tab === 'mis-relatos' ? 'active' : ''} onClick={() => cambiarTab('mis-relatos')}>MIS RELATOS</button>
                <button className={tab === 'imagenes' ? 'active' : ''} onClick={() => cambiarTab('imagenes')}>IMÁGENES/ARCHIVOS</button>
                <button className={tab === 'lugares' ? 'active' : ''} onClick={() => cambiarTab('lugares')}>MAPA</button>
                <button className={tab === 'noticias' ? 'active' : ''} onClick={() => cambiarTab('noticias')}>NOTICIAS</button>
                <button className={tab === 'chat' ? 'active' : ''} onClick={() => cambiarTab('chat')}>CHAT</button>
            </div>

            <div className="table-responsive">
                <table className="tabla-admin">
                    <thead>
                        <tr>
                            <th>ESTADO</th>
                            <th>TÍTULO / INFO</th>
                            <th>AUTOR / UBICACIÓN</th>
                            <th>GESTIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsPaginados.map(item => (
                            <tr key={item.id} className="fila-admin">
                                {/* USUARIOS */}
                                {tab === 'usuarios' && (
                                    <>
                                        <td><span className="id-tag">#{item.id}</span></td>
                                        <td>{item.nombre}</td>
                                        <td>{item.email}</td>
                                        <td><button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'usuario')}>EXPULSAR</button></td>
                                    </>
                                )}

                                {/* MIS RELATOS */}
                                {tab === 'mis-relatos' && (
                                    <>
                                        <td className="status-ok">ADMIN</td>
                                        <td>{item.titulo}</td>
                                        <td>{item.fecha ? new Date(item.fecha).toLocaleDateString() : 'BÚNKER'}</td>
                                        <td>
                                            <button className="btn-leer" onClick={() => setExpedienteParaLeer(item)}>LEER</button>
                                            <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'mis-relatos')}>ELIMINAR</button>
                                        </td>
                                    </>
                                )}

                                {/* EXPEDIENTES */}
                                {tab === 'expedientes' && (
                                    <>
                                        <td className={item.estado === 'publicado' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase()}</td>
                                        <td>{item.titulo}</td>
                                        <td>{item.usuario_nombre}</td>
                                        <td>
                                            {item.estado !== 'publicado' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'expediente')}>APROBAR</button>}
                                            <button className="btn-leer" onClick={() => setExpedienteParaLeer(item)}>LEER</button>
                                            <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'expediente')}>ELIMINAR</button>
                                        </td>
                                    </>
                                )}

                                {/* IMÁGENES / ARCHIVOS (HALLAZGOS) - CORREGIDO */}
                                {tab === 'imagenes' && (
                                    <>
                                        <td className={item.estado === 'publica' || item.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>
                                            {item.estado?.toUpperCase()}
                                        </td>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {item.url_imagen && (
                                                <img
                                                    src={`http://localhost:5000/archivos-usuarios/${item.url_imagen.split('/').pop()}`}
                                                    alt="hallazgo"
                                                    onError={handleImgError}
                                                    style={{ width: '50px', height: '40px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #00ff41' }}
                                                />
                                            )}
                                            <div style={{ textAlign: 'left' }}>
                                                <strong>{item.titulo}</strong>
                                                <br /><small style={{ color: '#888' }}>{item.descripcion?.substring(0, 20)}...</small>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{ color: '#00d4ff' }}>👤 {item.agente || 'ANÓNIMO'}</span>
                                            <br /><small>📍 {item.latitud}, {item.longitud}</small>
                                        </td>
                                        <td>
                                            {(item.estado !== 'publica' && item.estado !== 'aprobado') && (
                                                <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'imagen')}>APROBAR</button>
                                            )}
                                            <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'imagen')}>BORRAR</button>
                                        </td>
                                    </>
                                )}

                                {/* MAPA / LUGARES - CORREGIDO */}
                                {tab === 'lugares' && (
                                    <>
                                        <td className={item.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase()}</td>
                                        <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {(item.imagen_url || item.imagen) && (
                                                <img
                                                    src={`http://localhost:5000/lugares/${(item.imagen_url || item.imagen).split('/').pop()}`}
                                                    alt="lugar"
                                                    onError={handleImgError}
                                                    style={{ width: '50px', height: '40px', borderRadius: '4px', objectFit: 'cover' }}
                                                />
                                            )}
                                            {item.nombre}
                                        </td>
                                        <td>{item.ubicacion}</td>
                                        <td>
                                            {item.estado !== 'aprobado' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'lugar')}>APROBAR</button>}
                                            <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'lugar')}>BORRAR</button>
                                        </td>
                                    </>
                                )}

                                {/* CHAT */}
                                {tab === 'chat' && (
                                    <>
                                        <td><span className="id-tag">#{item.id}</span></td>
                                        <td>{item.mensaje?.substring(0, 30)}...</td>
                                        <td>{item.nombre_usuario}</td>
                                        <td><button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'chat')}>BORRAR</button></td>
                                    </>
                                )}

                                {/* NOTICIAS */}
                                {tab === 'noticias' && (
                                    <>
                                        <td className={item.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>
                                            {item.estado?.toUpperCase()}
                                        </td>
                                        <td>{item.titulo}</td>
                                        <td>{item.ubicacion}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                {item.estado === 'pendiente' && (
                                                    <button
                                                        className="btn-approve"
                                                        onClick={() => gestionar(item.id, 'aprobar', 'noticia')}
                                                        style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        APROBAR
                                                    </button>
                                                )}
                                                <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'noticia')}>BORRAR</button>
                                            </div>
                                        </td>
                                    </>
                                )}

                                {/* VIDEOS */}
                                {tab === 'videos' && (
                                    <>
                                        <td className={item.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase()}</td>
                                        <td>{item.titulo}</td>
                                        <td><a href={item.url} target="_blank" rel="noreferrer" className="link-ver">LINK</a></td>
                                        <td>
                                            {item.estado !== 'aprobado' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'video')}>APROBAR</button>}
                                            <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'video')}>BORRAR</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="paginacion-admin">
                <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)} className="btn-pagi">◀</button>
                <span className="pagi-info">PÁG {paginaActual} DE {Math.ceil(listaActiva.length / itemsPorPagina) || 1}</span>
                <button disabled={ultimoItem >= listaActiva.length} onClick={() => setPaginaActual(p => p + 1)} className="btn-pagi">▶</button>
            </div>

            {/* MODAL DE LECTURA */}
            {expedienteParaLeer && (
                <div className="modal-admin-overlay" onClick={() => setExpedienteParaLeer(null)}>
                    <div className="modal-admin-content" onClick={e => e.stopPropagation()}>
                        <h3>{expedienteParaLeer.titulo}</h3>
                        <p>De: {expedienteParaLeer.usuario_nombre || 'Administrador'}</p>
                        <hr />
                        <div className="cuerpo-modal">{expedienteParaLeer.contenido || expedienteParaLeer.cuerpo}</div>
                        <button className="btn-del" onClick={() => setExpedienteParaLeer(null)}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelAdmin;