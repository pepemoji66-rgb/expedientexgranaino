import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './paneladmin.css';

const PanelAdmin = () => {
    const [tab, setTab] = useState('usuarios');
    const [usuarios, setUsuarios] = useState([]);
    const [videos, setVideos] = useState([]);
    const [expedientes, setExpedientes] = useState([]);

    // Estado para el lector modal
    const [expedienteParaLeer, setExpedienteParaLeer] = useState(null);

    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 5;

    useEffect(() => {
        cargarTodo();
    }, []);

    const cargarTodo = async () => {
        try {
            const resUser = await axios.get('http://localhost:5000/usuarios');
            const resVid = await axios.get('http://localhost:5000/admin/todos-los-videos');
            const resExp = await axios.get('http://localhost:5000/historias');

            setUsuarios(resUser.data);
            setVideos(resVid.data);
            setExpedientes(resExp.data);
        } catch (err) {
            console.error("❌ ERROR DE CONEXIÓN AL BÚNKER:", err);
        }
    };

    const gestionarAccion = async (id, accion, tipo) => {
        const mensaje = accion === 'aprobar' ? `¿Dar el visto bueno a este ${tipo}?` : `¿Eliminar permanentemente este ${tipo}?`;
        if (!window.confirm(mensaje)) return;

        try {
            if (tipo === 'usuario') {
                await axios.delete(`http://localhost:5000/usuarios/${id}`);
            }
            else if (tipo === 'video') {
                if (accion === 'aprobar') {
                    await axios.put(`http://localhost:5000/aprobar-video/${id}`);
                } else {
                    await axios.delete(`http://localhost:5000/borrar-video/${id}`);
                }
            }
            else if (tipo === 'expediente') {
                if (accion === 'aprobar') {
                    // Ruta corregida para aprobar historias
                    await axios.put(`http://localhost:5000/aprobar-historia/${id}`);
                } else {
                    await axios.delete(`http://localhost:5000/historias/${id}`);
                }
            }

            alert("CENTRAL ACTUALIZADA: Archivo modificado con éxito.");
            cargarTodo();
        } catch (err) {
            alert("❌ Error: La base de datos no responde a la orden.");
        }
    };

    const obtenerDatosTab = () => {
        if (tab === 'usuarios') return usuarios;
        if (tab === 'videos') return videos;
        return expedientes;
    };

    const datosAMostrar = obtenerDatosTab();
    const ultimoItem = paginaActual * itemsPorPagina;
    const primerItem = ultimoItem - itemsPorPagina;
    const itemsActuales = datosAMostrar.slice(primerItem, ultimoItem);
    const totalPaginas = Math.ceil(datosAMostrar.length / itemsPorPagina);

    return (
        <div className="panel-admin-container">
            <h2 className="titulo-neon">SISTEMA DE CONTROL TOTAL</h2>

            <div className="tabs-admin">
                <button className={tab === 'usuarios' ? 'active' : ''} onClick={() => { setTab('usuarios'); setPaginaActual(1); }}>
                    AGENTES ({usuarios.length})
                </button>
                <button className={tab === 'videos' ? 'active' : ''} onClick={() => { setTab('videos'); setPaginaActual(1); }}>
                    VIGILANCIA VÍDEO ({videos.length})
                </button>
                <button className={tab === 'expedientes' ? 'active' : ''} onClick={() => { setTab('expedientes'); setPaginaActual(1); }}>
                    EXPEDIENTES ({expedientes.length})
                </button>
            </div>

            <div className="table-responsive">
                <table className="tabla-admin">
                    <thead>
                        {tab === 'usuarios' && (
                            <tr><th>ID</th><th>NOMBRE</th><th>EMAIL</th><th>CIUDAD</th><th>ACCIÓN</th></tr>
                        )}
                        {tab === 'videos' && (
                            <tr><th>ESTADO</th><th>TÍTULO</th><th>PRUEBA</th><th>GESTIÓN</th></tr>
                        )}
                        {tab === 'expedientes' && (
                            <tr><th>ESTADO</th><th>TÍTULO</th><th>AUTOR</th><th>GESTIÓN</th></tr>
                        )}
                    </thead>
                    <tbody>
                        {itemsActuales.length > 0 ? itemsActuales.map(item => (
                            <tr key={item.id}>
                                {tab === 'usuarios' && (
                                    <>
                                        <td>#{item.id}</td>
                                        <td>{item.nombre}</td>
                                        <td>{item.email}</td>
                                        <td>{item.ciudad}</td>
                                        <td>
                                            <button className="btn-del" onClick={() => gestionarAccion(item.id, 'borrar', 'usuario')}>BAJA</button>
                                        </td>
                                    </>
                                )}
                                {tab === 'videos' && (
                                    <>
                                        <td><span className={`status-pill ${item.estado}`}>{item.estado === 'aprobado' ? '✅ OK' : '⏳ PEND'}</span></td>
                                        <td>{item.titulo}</td>
                                        <td><a href={item.url} target="_blank" rel="noreferrer" className="link-video">VER VÍDEO 📽️</a></td>
                                        <td>
                                            <div className="botones-accion-row">
                                                {item.estado === 'pendiente' && (
                                                    <button className="btn-ok" onClick={() => gestionarAccion(item.id, 'aprobar', 'video')}>APROBAR</button>
                                                )}
                                                <button className="btn-del" onClick={() => gestionarAccion(item.id, 'eliminar', 'video')}>X</button>
                                            </div>
                                        </td>
                                    </>
                                )}
                                {tab === 'expedientes' && (
                                    <>
                                        <td><span className={`status-pill ${item.estado}`}>{item.estado === 'pendiente' ? '⏳ PEND' : '📜 OK'}</span></td>
                                        <td>{item.titulo}</td>
                                        <td>{item.agente}</td>
                                        <td>
                                            <div className="botones-accion-row">
                                                {/* CAMBIO CLAVE: Ahora no te vas de la página, abres el modal */}
                                                <button className="btn-leer" onClick={() => setExpedienteParaLeer(item)}>LEER</button>

                                                {item.estado === 'pendiente' && (
                                                    <button className="btn-ok" onClick={() => gestionarAccion(item.id, 'aprobar', 'expediente')}>APROBAR</button>
                                                )}
                                                <button className="btn-del" onClick={() => gestionarAccion(item.id, 'borrar', 'expediente')}>X</button>
                                            </div>
                                        </td>
                                    </>
                                )}
                            </tr>
                        )) : <tr><td colSpan="5" style={{ textAlign: 'center' }}>CENTRAL VACÍA</td></tr>}
                    </tbody>
                </table>
            </div>

            {totalPaginas > 1 && (
                <div className="paginacion-bunker">
                    <button disabled={paginaActual === 1} onClick={() => setPaginaActual(paginaActual - 1)}>ANTERIOR</button>
                    <span>{paginaActual} / {totalPaginas}</span>
                    <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(paginaActual + 1)}>SIGUIENTE</button>
                </div>
            )}

            {/* LECTOR MODAL PARA EL ADMIN */}
            {expedienteParaLeer && (
                <div className="modal-admin-overlay" onClick={() => setExpedienteParaLeer(null)}>
                    <div className="modal-admin-content" onClick={e => e.stopPropagation()}>
                        <h3>REVISANDO: {expedienteParaLeer.titulo}</h3>
                        <p className="meta-info">Enviado por: {expedienteParaLeer.agente}</p>
                        <hr />
                        <div className="cuerpo-relato">
                            {expedienteParaLeer.contenido}
                        </div>
                        <button className="btn-cerrar-lector" onClick={() => setExpedienteParaLeer(null)}>CERRAR REVISIÓN</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelAdmin;