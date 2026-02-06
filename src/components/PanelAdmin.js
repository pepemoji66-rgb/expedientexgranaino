import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './paneladmin.css';

const PanelAdmin = () => {
    const [tab, setTab] = useState('usuarios');
    const [usuarios, setUsuarios] = useState([]);
    const [videos, setVideos] = useState([]);
    const [expedientes, setExpedientes] = useState([]);
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
        // Sincronización automática cada 30 segundos por si el radar detecta algo nuevo
        const intervalo = setInterval(cargarDatos, 30000);
        return () => clearInterval(intervalo);
    }, []);

    const cargarDatos = async () => {
        try {
            // No reseteamos los estados a [] aquí para evitar que el contador marque 0
            const [resU, resV, resE, resI, resL, resC, resN] = await Promise.all([
                axios.get('http://localhost:5000/usuarios'),
                axios.get('http://localhost:5000/admin/todos-los-videos'),
                axios.get('http://localhost:5000/expedientes'),
                axios.get('http://localhost:5000/admin/todas-las-imagenes'),
                axios.get('http://localhost:5000/lugares'),
                axios.get('http://localhost:5000/chat-historial'),
                axios.get('http://localhost:5000/admin/todas-noticias') 
            ]);

            setUsuarios(Array.isArray(resU.data) ? resU.data : []);
            setVideos(Array.isArray(resV.data) ? resV.data : []);
            setExpedientes(Array.isArray(resE.data) ? resE.data : []);
            setImagenes(Array.isArray(resI.data) ? resI.data : []);
            setLugares(Array.isArray(resL.data) ? resL.data : []);
            setMensajes(Array.isArray(resC.data) ? [...resC.data].reverse() : []);
            setNoticias(Array.isArray(resN.data) ? resN.data : []); 
            
            console.log("✅ DATOS SINCRONIZADOS");
        } catch (err) { 
            console.error("❌ ERROR EN EL RADAR:", err); 
        }
    };

    const gestionar = async (id, accion, tipo) => {
        if (!window.confirm(`¿Ejecutar orden de ${accion.toUpperCase()}?`)) return;
        
        setCargando(true);
        try {
            let url = `http://localhost:5000/`;
            
            if (tipo === 'usuario') url += `usuarios/${id}`;
            else if (tipo === 'expediente') url += accion === 'aprobar' ? `aprobar-expediente/${id}` : `expedientes/${id}`;
            else if (tipo === 'video') url += accion === 'aprobar' ? `aprobar-video/${id}` : `borrar-video/${id}`;
            else if (tipo === 'imagen') url += accion === 'aprobar' ? `aprobar-imagen/${id}` : `borrar-imagen/${id}`;
            else if (tipo === 'lugar') url += accion === 'aprobar' ? `aprobar-lugar/${id}` : `lugares/${id}`;
            else if (tipo === 'chat') url += `borrar-mensaje/${id}`;
            else if (tipo === 'noticia') url += accion === 'aprobar' ? `admin/aprobar-noticia/${id}` : `borrar-noticia/${id}`;

            if (accion === 'aprobar') {
                await axios.put(url);
            } else {
                await axios.delete(url);
            }

            // Espera táctica de 300ms para que la DB procese antes de pedir los datos de nuevo
            setTimeout(async () => {
                await cargarDatos();
                setCargando(false);
            }, 300);

        } catch (err) { 
            console.error("❌ ERROR OPERATIVO:", err);
            alert("El sistema ha rechazado la orden."); 
            setCargando(false);
        }
    };

    const obtenerListaActiva = () => {
        switch(tab) {
            case 'usuarios': return usuarios;
            case 'videos': return videos;
            case 'expedientes': return expedientes;
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
            {cargando && <div className="loading-overlay">ACTUALIZANDO SISTEMA...</div>}
            
            <div className="tabs-admin">
                <button className={tab === 'usuarios' ? 'active' : ''} onClick={() => cambiarTab('usuarios')}>USUARIOS ({usuarios.length})</button>
                <button className={tab === 'videos' ? 'active' : ''} onClick={() => cambiarTab('videos')}>VÍDEOS ({videos.length})</button>
                <button className={tab === 'expedientes' ? 'active' : ''} onClick={() => cambiarTab('expedientes')}>EXPEDIENTES ({expedientes.length})</button>
                <button className={tab === 'imagenes' ? 'active' : ''} onClick={() => cambiarTab('imagenes')}>IMÁGENES ({imagenes.length})</button>
                <button className={tab === 'lugares' ? 'active' : ''} onClick={() => cambiarTab('lugares')}>MAPA ({lugares.length})</button>
                <button className={tab === 'noticias' ? 'active' : ''} onClick={() => cambiarTab('noticias')}>NOTICIAS ({noticias.length})</button>
                <button className={tab === 'chat' ? 'active' : ''} onClick={() => cambiarTab('chat')}>CHAT ({mensajes.length})</button>
            </div>

            <div className="table-responsive">
                <table className="tabla-admin">
                    <thead>
                        <tr>
                            <th>ESTADO / ID</th>
                            <th>TÍTULO / NOMBRE</th>
                            <th>AUTOR / INFO</th>
                            <th>GESTIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsPaginados.length > 0 ? (
                            itemsPaginados.map(item => (
                                <tr key={item.id} className="fila-admin">
                                    {tab === 'usuarios' && (
                                        <>
                                            <td><span className="id-tag">#{item.id}</span></td>
                                            <td>{item.nombre}</td>
                                            <td>{item.email}</td>
                                            <td><button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'usuario')}>EXPULSAR</button></td>
                                        </>
                                    )}
                                    {tab === 'expedientes' && (
                                        <>
                                            <td className={item.estado === 'publicado' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase()}</td>
                                            <td>{item.titulo}</td>
                                            <td>{item.usuario_nombre || 'AGENTE'}</td>
                                            <td>
                                                <button className="btn-leer" onClick={() => setExpedienteParaLeer(item)}>LEER</button>
                                                {item.estado !== 'publicado' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'expediente')}>APROBAR</button>}
                                                <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'expediente')}>ELIMINAR</button>
                                            </td>
                                        </>
                                    )}
                                    {tab === 'noticias' && (
                                        <>
                                            <td className={item.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase()}</td>
                                            <td>{item.titulo}</td>
                                            <td>{item.ubicacion}</td>
                                            <td>
                                                <button className="btn-leer" onClick={() => setExpedienteParaLeer({titulo: item.titulo, contenido: item.cuerpo, usuario_nombre: 'REPORTE CIUDADANO'})}>VER</button>
                                                {item.estado !== 'aprobado' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'noticia')}>PUBLICAR</button>}
                                                <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'noticia')}>BORRAR</button>
                                            </td>
                                        </>
                                    )}
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
                                    {tab === 'lugares' && (
                                        <>
                                            <td className={item.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase()}</td>
                                            <td>{item.nombre}</td>
                                            <td>{item.ubicacion}</td>
                                            <td>
                                                {item.estado !== 'aprobado' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'lugar')}>APROBAR</button>}
                                                <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'lugar')}>BORRAR</button>
                                            </td>
                                        </>
                                    )}
                                    {tab === 'chat' && (
                                        <>
                                            <td><span className="id-tag">#{item.id}</span></td>
                                            <td className="msg-preview">"{item.mensaje?.substring(0, 30)}..."</td>
                                            <td style={{color: '#ffd700'}}>{item.nombre_usuario}</td>
                                            <td><button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'chat')}>BORRAR</button></td>
                                        </>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="4" className="no-data">SIN DATOS</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="paginacion-admin">
                <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)} className="btn-pagi">◀</button>
                <span className="pagi-info">PÁG {paginaActual}</span>
                <button disabled={ultimoItem >= listaActiva.length} onClick={() => setPaginaActual(p => p + 1)} className="btn-pagi">▶</button>
            </div>

            {expedienteParaLeer && (
                <div className="modal-admin-overlay" onClick={() => setExpedienteParaLeer(null)}>
                    <div className="modal-admin-content" onClick={e => e.stopPropagation()}>
                        <h3>{expedienteParaLeer.titulo}</h3>
                        <p>De: {expedienteParaLeer.usuario_nombre}</p>
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