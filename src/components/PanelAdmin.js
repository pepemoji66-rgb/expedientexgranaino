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

    // LÓGICA DE PAGINACIÓN
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 8; 

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const resU = await axios.get('http://localhost:5000/usuarios');
            const resV = await axios.get('http://localhost:5000/admin/todos-los-videos');
            const resE = await axios.get('http://localhost:5000/expedientes');
            const resI = await axios.get('http://localhost:5000/admin/todas-las-imagenes');
            const resL = await axios.get('http://localhost:5000/lugares');

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
            cargarDatos();
        } catch (err) { 
            alert("❌ Error en la operación. Revisa el servidor."); 
        }
    };

    const obtenerItemsPaginados = (lista) => {
        const ultimoItem = paginaActual * itemsPorPagina;
        const primerItem = ultimoItem - itemsPorPagina;
        return lista.slice(primerItem, ultimoItem);
    };

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
                        {tab === 'usuarios' && obtenerItemsPaginados(usuarios).map(u => (
                            <tr key={u.id}>
                                <td>#{u.id}</td>
                                <td>{u.nombre}</td>
                                <td>{u.ciudad || u.email}</td>
                                <td><button className="btn-del" onClick={() => gestionar(u.id, 'borrar', 'usuario')}>EXPULSAR</button></td>
                            </tr>
                        ))}

                        {tab === 'expedientes' && obtenerItemsPaginados(expedientes).map(e => (
                            <tr key={e.id}>
                                <td className={e.estado === 'publicado' ? 'status-ok' : 'status-pending'}>{e.estado?.toUpperCase()}</td>
                                <td>{e.titulo}</td>
                                <td>{e.usuario_nombre || 'AGENTE'}</td>
                                <td>
                                    <button className="btn-leer" onClick={() => setExpedienteParaLeer(e)}>LEER</button>
                                    {e.estado !== 'publicado' && <button className="btn-ok" onClick={() => gestionar(e.id, 'aprobar', 'expediente')}>APROBAR</button>}
                                    <button className="btn-del" onClick={() => gestionar(e.id, 'borrar', 'expediente')}>ELIMINAR</button>
                                </td>
                            </tr>
                        ))}

                        {tab === 'videos' && obtenerItemsPaginados(videos).map(v => (
                            <tr key={v.id}>
                                <td className={v.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>{v.estado.toUpperCase()}</td>
                                <td>{v.titulo}</td>
                                <td><a href={v.url} target="_blank" rel="noreferrer" className="link-ver">VER PRUEBA</a></td>
                                <td>
                                    {v.estado !== 'aprobado' && <button className="btn-ok" onClick={() => gestionar(v.id, 'aprobar', 'video')}>APROBAR</button>}
                                    <button className="btn-del" onClick={() => gestionar(v.id, 'borrar', 'video')}>ELIMINAR</button>
                                </td>
                            </tr>
                        ))}

                        {tab === 'imagenes' && obtenerItemsPaginados(imagenes).map(i => (
                            <tr key={i.id}>
                                <td className={i.estado === 'publica' ? 'status-ok' : 'status-pending'}>{i.estado.toUpperCase()}</td>
                                <td>{i.titulo}</td>
                                <td>{i.usuario_nombre || 'AGENTE'}</td>
                                <td>
                                    {i.estado !== 'publica' && <button className="btn-ok" onClick={() => gestionar(i.id, 'aprobar', 'imagen')}>APROBAR</button>}
                                    <button className="btn-del" onClick={() => gestionar(i.id, 'borrar', 'imagen')}>ELIMINAR</button>
                                </td>
                            </tr>
                        ))}

                        {tab === 'lugares' && obtenerItemsPaginados(lugares).map(l => (
                            <tr key={l.id}>
                                <td>
                                    <span className={l.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>
                                        {l.estado ? l.estado.toUpperCase() : 'PENDIENTE'}
                                    </span>
                                </td>
                                <td>{l.nombre}</td>
                                <td>
                                    <img src={`http://localhost:5000${l.imagen_url}`} alt="pico" style={{width:'40px', borderRadius:'4px'}} onError={(e)=>e.target.style.display='none'}/>
                                    <br/><small>{l.ubicacion}</small>
                                </td>
                                <td>
                                    {l.estado !== 'aprobado' && <button className="btn-ok" onClick={() => gestionar(l.id, 'aprobar', 'lugar')}>APROBAR</button>}
                                    <button className="btn-del" onClick={() => gestionar(l.id, 'borrar', 'lugar')}>ELIMINAR</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="paginacion-admin" style={{textAlign: 'center', marginTop: '20px'}}>
                <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)} className="btn-pagi">◀</button>
                <span style={{margin: '0 15px', color: '#00ff41'}}>PÁGINA {paginaActual}</span>
                <button 
                    disabled={obtenerItemsPaginados(tab==='usuarios'?usuarios:tab==='videos'?videos:tab==='expedientes'?expedientes:tab==='imagenes'?imagenes:lugares).length < itemsPorPagina} 
                    onClick={() => setPaginaActual(p => p + 1)} className="btn-pagi">▶</button>
            </div>

            {expedienteParaLeer && (
                <div className="modal-admin-overlay" onClick={() => setExpedienteParaLeer(null)}>
                    <div className="modal-admin-content" onClick={e => e.stopPropagation()}>
                        <h3 style={{color: '#00ff41'}}>{expedienteParaLeer.titulo}</h3>
                        <p style={{fontSize: '0.8rem', color: '#888'}}>Agente: {expedienteParaLeer.usuario_nombre}</p>
                        <hr />
                        <div className="cuerpo-expediente" style={{whiteSpace: 'pre-wrap', padding: '10px 0'}}>
                            {expedienteParaLeer.contenido}
                        </div>
                        <button className="btn-cerrar-modal" onClick={() => setExpedienteParaLeer(null)}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelAdmin;