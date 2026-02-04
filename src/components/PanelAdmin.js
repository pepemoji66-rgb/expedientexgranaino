import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './paneladmin.css';

const PanelAdmin = () => {
    const [tab, setTab] = useState('usuarios');
    const [usuarios, setUsuarios] = useState([]);
    const [videos, setVideos] = useState([]);
    const [expedientes, setExpedientes] = useState([]);
    const [imagenes, setImagenes] = useState([]);
    const [expedienteParaLeer, setExpedienteParaLeer] = useState(null);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const resU = await axios.get('http://localhost:5000/usuarios');
            const resV = await axios.get('http://localhost:5000/admin/todos-los-videos');
            const resE = await axios.get('http://localhost:5000/expedientes');
            const resI = await axios.get('http://localhost:5000/admin/todas-las-imagenes');

            setUsuarios(resU.data || []);
            setVideos(resV.data || []);
            setExpedientes(resE.data || []);
            setImagenes(resI.data || []);
        } catch (err) { 
            console.error("❌ Error cargando búnker", err); 
        }
    };

    const gestionar = async (id, accion, tipo) => {
        if (!window.confirm(`¿Confirmar ${accion} en ${tipo}?`)) return;
        try {
            let url = `http://localhost:5000/`;
            
            if (tipo === 'usuario') {
                url += `usuarios/${id}`;
            } else if (tipo === 'expediente') {
                url += accion === 'aprobar' ? `aprobar-expediente/${id}` : `expedientes/${id}`;
            } else if (tipo === 'video') {
                url += accion === 'aprobar' ? `aprobar-video/${id}` : `borrar-video/${id}`;
            } else if (tipo === 'imagen') {
                url += accion === 'aprobar' ? `aprobar-imagen/${id}` : `borrar-imagen/${id}`;
            }

            if (accion === 'aprobar') {
                await axios.put(url);
            } else {
                await axios.delete(url);
            }

            alert("⚡ REGISTRO ACTUALIZADO EN LA CENTRAL");
            cargarDatos(); // Recarga automática para que el botón desaparezca
        } catch (err) { 
            alert("❌ Error en la operación de búnker. Revisa que el servidor esté encendido."); 
        }
    };

    return (
        <div className="panel-admin-container fade-in">
            <h2 className="titulo-neon">CONTROL DE MANDO UNIFICADO</h2>
            
            <div className="tabs-admin">
                <button className={tab === 'usuarios' ? 'active' : ''} onClick={() => setTab('usuarios')}>
                    USUARIOS ({usuarios.length})
                </button>
                <button className={tab === 'videos' ? 'active' : ''} onClick={() => setTab('videos')}>
                    VÍDEOS ({videos.length})
                </button>
                <button className={tab === 'expedientes' ? 'active' : ''} onClick={() => setTab('expedientes')}>
                    EXPEDIENTES ({expedientes.length})
                </button>
                <button className={tab === 'imagenes' ? 'active' : ''} onClick={() => setTab('imagenes')}>
                    IMÁGENES ({imagenes.length})
                </button>
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
                        {tab === 'usuarios' && usuarios.map(u => (
                            <tr key={u.id}>
                                <td>#{u.id}</td>
                                <td>{u.nombre}</td>
                                <td>{u.ciudad || u.email}</td>
                                <td>
                                    <button className="btn-del" onClick={() => gestionar(u.id, 'borrar', 'usuario')}>EXPULSAR</button>
                                </td>
                            </tr>
                        ))}

                        {tab === 'expedientes' && expedientes.map(e => (
                            <tr key={e.id}>
                                <td className={e.estado === 'publicado' ? 'status-ok' : 'status-pending'}>
                                    {e.estado ? e.estado.toUpperCase() : 'S/E'}
                                </td>
                                <td>{e.titulo}</td>
                                <td>{e.usuario_nombre || 'AGENTE'}</td>
                                <td>
                                    <button className="btn-leer" onClick={() => setExpedienteParaLeer(e)}>LEER</button>
                                    {/* CAMBIO CLAVE: Comparamos con 'publicado' */}
                                    {e.estado !== 'publicado' && (
                                        <button className="btn-ok" onClick={() => gestionar(e.id, 'aprobar', 'expediente')}>APROBAR</button>
                                    )}
                                    <button className="btn-del" onClick={() => gestionar(e.id, 'borrar', 'expediente')}>ELIMINAR</button>
                                </td>
                            </tr>
                        ))}

                        {tab === 'videos' && videos.map(v => (
                            <tr key={v.id}>
                                <td>{v.estado.toUpperCase()}</td>
                                <td>{v.titulo}</td>
                                <td><a href={v.url} target="_blank" rel="noreferrer" className="link-ver">VER PRUEBA</a></td>
                                <td>
                                    {v.estado !== 'aprobado' && <button className="btn-ok" onClick={() => gestionar(v.id, 'aprobar', 'video')}>APROBAR</button>}
                                    <button className="btn-del" onClick={() => gestionar(v.id, 'borrar', 'video')}>ELIMINAR</button>
                                </td>
                            </tr>
                        ))}

                        {tab === 'imagenes' && imagenes.map(i => (
                            <tr key={i.id}>
                                <td>{i.estado.toUpperCase()}</td>
                                <td>{i.titulo}</td>
                                <td>{i.usuario_nombre || 'AGENTE'}</td>
                                <td>
                                    {i.estado !== 'publica' && <button className="btn-ok" onClick={() => gestionar(i.id, 'aprobar', 'imagen')}>APROBAR</button>}
                                    <button className="btn-del" onClick={() => gestionar(i.id, 'borrar', 'imagen')}>ELIMINAR</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
                        <button className="btn-cerrar-modal" onClick={() => setExpedienteParaLeer(null)}>CERRAR ARCHIVO</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelAdmin;