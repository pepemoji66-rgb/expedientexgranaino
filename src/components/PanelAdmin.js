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
    const [expedienteParaLeer, setExpedienteParaLeer] = useState(null);

    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 8; 

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            // Usamos Promise.all para que todos los datos lleguen a la vez y no haya parpadeos
            const [resU, resV, resE, resI, resL] = await Promise.all([
                axios.get('http://localhost:5000/usuarios'),
                axios.get('http://localhost:5000/admin/todos-los-videos'),
                axios.get('http://localhost:5000/expedientes'),
                axios.get('http://localhost:5000/admin/todas-las-imagenes'),
                axios.get('http://localhost:5000/lugares')
            ]);

            setUsuarios(resU.data || []);
            setVideos(resV.data || []);
            setExpedientes(resE.data || []);
            setImagenes(resI.data || []);
            setLugares(resL.data || []);
        } catch (err) { 
            console.error("❌ Error cargando búnker", err); 
        }
    };

    const gestionar = async (id, accion, tipo) => {
        if (!window.confirm(`¿Confirmar ${accion} en ${tipo}?`)) return;
        try {
            let url = `http://localhost:5000/`;
            if (tipo === 'usuario') url += `usuarios/${id}`;
            else if (tipo === 'expediente') url += accion === 'aprobar' ? `aprobar-expediente/${id}` : `expedientes/${id}`;
            else if (tipo === 'video') url += accion === 'aprobar' ? `aprobar-video/${id}` : `borrar-video/${id}`;
            else if (tipo === 'imagen') url += accion === 'aprobar' ? `aprobar-imagen/${id}` : `borrar-imagen/${id}`;
            else if (tipo === 'lugar') url += accion === 'aprobar' ? `aprobar-lugar/${id}` : `lugares/${id}`;

            if (accion === 'aprobar') await axios.put(url);
            else await axios.delete(url);

            alert("⚡ REGISTRO ACTUALIZADO EN LA CENTRAL");
            await cargarDatos(); // Recargamos todo para actualizar contadores
        } catch (err) { 
            alert("❌ Error en la operación. Revisa el servidor."); 
        }
    };

    // --- Lógica de Paginación Mejorada ---
    const obtenerListaActiva = () => {
        if (tab === 'usuarios') return usuarios;
        if (tab === 'videos') return videos;
        if (tab === 'expedientes') return expedientes;
        if (tab === 'imagenes') return imagenes;
        if (tab === 'lugares') return lugares;
        return [];
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
            
            <div className="tabs-admin">
                <button className={tab === 'usuarios' ? 'active' : ''} onClick={() => cambiarTab('usuarios')}>USUARIOS ({usuarios.length})</button>
                <button className={tab === 'videos' ? 'active' : ''} onClick={() => cambiarTab('videos')}>VÍDEOS ({videos.length})</button>
                <button className={tab === 'expedientes' ? 'active' : ''} onClick={() => cambiarTab('expedientes')}>EXPEDIENTES ({expedientes.length})</button>
                <button className={tab === 'imagenes' ? 'active' : ''} onClick={() => cambiarTab('imagenes')}>IMÁGENES ({imagenes.length})</button>
                <button className={tab === 'lugares' ? 'active' : ''} onClick={() => cambiarTab('lugares')}>MAPA ({lugares.length})</button>
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
                        {itemsPaginados.map(item => (
                            <tr key={item.id}>
                                {tab === 'usuarios' && (
                                    <>
                                        <td>#{item.id}</td>
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
                                {tab === 'videos' && (
                                    <>
                                        <td className={item.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase()}</td>
                                        <td>{item.titulo}</td>
                                        <td><a href={item.url} target="_blank" rel="noreferrer" className="link-ver">VER PRUEBA</a></td>
                                        <td>
                                            {item.estado !== 'aprobado' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'video')}>APROBAR</button>}
                                            <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'video')}>ELIMINAR</button>
                                        </td>
                                    </>
                                )}
                                {tab === 'imagenes' && (
                                    <>
                                        <td className={item.estado === 'publica' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase()}</td>
                                        <td>{item.titulo}</td>
                                        <td>{item.usuario_nombre || 'AGENTE'}</td>
                                        <td>
                                            {item.estado !== 'publica' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'imagen')}>APROBAR</button>}
                                            <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'imagen')}>ELIMINAR</button>
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
                                            <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'lugar')}>ELIMINAR</button>
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
                <span className="pagi-info">PÁGINA {paginaActual}</span>
                <button 
                    disabled={ultimoItem >= listaActiva.length} 
                    onClick={() => setPaginaActual(p => p + 1)} className="btn-pagi">▶</button>
            </div>

            {expedienteParaLeer && (
                <div className="modal-admin-overlay" onClick={() => setExpedienteParaLeer(null)}>
                    <div className="modal-admin-content" onClick={e => e.stopPropagation()}>
                        <h3 className="modal-titulo">{expedienteParaLeer.titulo}</h3>
                        <p className="modal-agente">Agente: {expedienteParaLeer.usuario_nombre}</p>
                        <hr className="modal-hr" />
                        <div className="cuerpo-expediente">{expedienteParaLeer.contenido}</div>
                        <button className="btn-cerrar-modal" onClick={() => setExpedienteParaLeer(null)}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelAdmin;