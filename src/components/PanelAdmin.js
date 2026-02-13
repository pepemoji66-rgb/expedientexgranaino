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

    // NUEVOS ESTADOS PARA SUBIDA
    const [tipoSubida, setTipoSubida] = useState('imagenes_publicas');
    const [tituloSubida, setTituloSubida] = useState('');
    const [archivoSubida, setArchivoSubida] = useState(null);
    const [mensajeSubida, setMensajeSubida] = useState('');

    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 8;

    useEffect(() => {
        cargarDatos();
    }, []);

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
            console.log("✅ Sistema Sincronizado");
        } catch (err) {
            console.error("❌ Fallo en la recepción de datos", err);
        }
    };

    const manejarSubidaAdmin = async (e) => {
        e.preventDefault();
        if (!archivoSubida) return setMensajeSubida("⚠️ Selecciona un archivo, hermano.");
        const formData = new FormData();
        formData.append('archivo', archivoSubida);
        formData.append('titulo', tituloSubida);
        formData.append('seccion', tipoSubida);

        try {
            setCargando(true);
            await axios.post('http://localhost:5000/admin/subir-todo', formData);
            setMensajeSubida("✅ ¡Infiltrado con éxito!");
            setTituloSubida('');
            cargarDatos();
        } catch (err) {
            setMensajeSubida("❌ Error de conexión.");
        } finally {
            setCargando(false);
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
            else if (tipo === 'imagen') url += accion === 'aprobar' ? `admin/aprobar-imagen/${id}` : `admin/borrar-imagen/${id}`;
            else if (tipo === 'lugar') url += accion === 'aprobar' ? `aprobar-lugar/${id}` : `lugares/${id}`;
            else if (tipo === 'chat') url += `borrar-mensaje/${id}`;
            else if (tipo === 'noticia') url += accion === 'aprobar' ? `admin/aprobar-noticia/${id}` : `admin/borrar-noticia/${id}`;

            if (accion === 'aprobar') await axios.put(url);
            else await axios.delete(url);

            await cargarDatos();
            alert(`✅ ACCIÓN COMPLETADA`);
        } catch (err) {
            alert("❌ Error en la operación.");
        } finally {
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
    const itemsPaginados = listaActiva.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina);

    return (
        <div className="panel-admin-container fade-in">
            <h2 className="titulo-neon">CONTROL DE MANDO UNIFICADO</h2>
            {cargando && <div className="loading-overlay">OPERANDO...</div>}

            <div className="tabs-admin">
                <button className={tab === 'usuarios' ? 'active' : ''} onClick={() => setTab('usuarios')}>USUARIOS</button>
                <button className={tab === 'videos' ? 'active' : ''} onClick={() => setTab('videos')}>VÍDEOS</button>
                <button className={tab === 'expedientes' ? 'active' : ''} onClick={() => setTab('expedientes')}>EXPEDIENTES</button>
                <button className={tab === 'mis-relatos' ? 'active' : ''} onClick={() => setTab('mis-relatos')}>MIS RELATOS</button>
                <button className={tab === 'imagenes' ? 'active' : ''} onClick={() => setTab('imagenes')}>IMÁGENES</button>
                <button className={tab === 'lugares' ? 'active' : ''} onClick={() => setTab('lugares')}>MAPA</button>
                <button className={tab === 'noticias' ? 'active' : ''} onClick={() => setTab('noticias')}>NOTICIAS</button>
                <button className={tab === 'chat' ? 'active' : ''} onClick={() => setTab('chat')}>CHAT</button>
                <button className={tab === 'subir' ? 'active' : ''} onClick={() => setTab('subir')} style={{background: '#b18904', color: 'black'}}>+ SUBIR</button>
            </div>

            {tab !== 'subir' ? (
                <div className="table-responsive">
                    <table className="tabla-admin">
                        <thead>
                            <tr>
                                <th>ESTADO</th>
                                <th>TÍTULO / INFO</th>
                                <th>AUTOR / UBICACIÓN / FECHA</th>
                                <th>GESTIÓN</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itemsPaginados.map(item => (
                                <tr key={item.id} className="fila-admin">
                                    {tab === 'usuarios' && (
                                        <>
                                            <td><span className="id-tag">#{item.id}</span></td>
                                            <td>{item.nombre}</td>
                                            <td>{item.email}</td>
                                            <td><button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'usuario')}>EXPULSAR</button></td>
                                        </>
                                    )}
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
                                    {tab === 'expedientes' && (
                                        <>
                                            <td className={item.estado === 'publicado' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase() || 'PENDIENTE'}</td>
                                            <td>{item.titulo}</td>
                                            <td>{item.usuario_nombre}</td>
                                            <td>
                                                {item.estado !== 'publicado' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'expediente')}>APROBAR</button>}
                                                <button className="btn-leer" onClick={() => setExpedienteParaLeer(item)}>LEER</button>
                                                <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'expediente')}>ELIMINAR</button>
                                            </td>
                                        </>
                                    )}
                                    {tab === 'imagenes' && (
                                        <>
                                            <td className={(item.estado === 'publica' || item.estado === 'aprobado') ? 'status-ok' : 'status-pending'}>{(item.estado || 'PENDIENTE').toUpperCase()}</td>
                                            <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {(item.url_imagen || item.imagen) && <img src={`http://localhost:5000/archivos-usuarios/${(item.url_imagen || item.imagen).split('/').pop()}`} alt="hallazgo" onError={handleImgError} style={{ width: '50px', height: '40px', objectFit: 'cover' }} />}
                                                <div><strong>{item.titulo}</strong></div>
                                            </td>
                                            <td><span style={{ color: '#00d4ff' }}>👤 {item.agente || item.nombre_usuario || 'ANÓNIMO'}</span></td>
                                            <td>
                                                {(item.estado !== 'publica' && item.estado !== 'aprobado') && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'imagen')}>APROBAR</button>}
                                                <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'imagen')}>BORRAR</button>
                                            </td>
                                        </>
                                    )}
                                    {tab === 'lugares' && (
                                        <>
                                            <td className={item.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase() || 'PENDIENTE'}</td>
                                            <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                {(item.imagen_url || item.imagen) && <img src={`http://localhost:5000/lugares/${(item.imagen_url || item.imagen).split('/').pop()}`} alt="lugar" onError={handleImgError} style={{ width: '50px', height: '40px', objectFit: 'cover' }} />}
                                                {item.nombre}
                                            </td>
                                            <td>{item.ubicacion}</td>
                                            <td>
                                                {item.estado !== 'aprobado' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'lugar')}>APROBAR</button>}
                                                <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'lugar')}>BORRAR</button>
                                            </td>
                                        </>
                                    )}
                                    {tab === 'noticias' && (
                                        <>
                                            <td className={item.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase() || 'PENDIENTE'}</td>
                                            <td><strong>{item.titulo}</strong></td>
                                            <td>{item.ubicacion} <br /><small>📅 {item.fecha ? new Date(item.fecha).toLocaleDateString() : 'BÚNKER'}</small></td>
                                            <td>
                                                {item.estado !== 'aprobado' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'noticia')}>APROBAR</button>}
                                                <button className="btn-leer" onClick={() => setExpedienteParaLeer(item)}>VER</button>
                                                <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'noticia')}>BORRAR</button>
                                            </td>
                                        </>
                                    )}
                                    {tab === 'videos' && (
                                        <>
                                            <td className={item.estado === 'aprobado' ? 'status-ok' : 'status-pending'}>{item.estado?.toUpperCase() || 'PENDIENTE'}</td>
                                            <td>{item.titulo}</td>
                                            <td><a href={item.url} target="_blank" rel="noreferrer" className="link-ver">LINK</a></td>
                                            <td>
                                                {item.estado !== 'aprobado' && <button className="btn-ok" onClick={() => gestionar(item.id, 'aprobar', 'video')}>APROBAR</button>}
                                                <button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'video')}>BORRAR</button>
                                            </td>
                                        </>
                                    )}
                                    {tab === 'chat' && (
                                        <>
                                            <td><span className="id-tag">#{item.id}</span></td>
                                            <td>{item.mensaje?.substring(0, 30)}...</td>
                                            <td>{item.nombre_usuario}</td>
                                            <td><button className="btn-del" onClick={() => gestionar(item.id, 'borrar', 'chat')}>BORRAR</button></td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="form-subida-admin" style={{padding: '30px', background: '#000', border: '1px solid #b18904', borderRadius: '10px', maxWidth: '500px', margin: '20px auto'}}>
                    <h3 style={{color: '#b18904', textAlign: 'center'}}>NUEVA CARGA TÁCTICA</h3>
                    <form onSubmit={manejarSubidaAdmin}>
                        <label>DESTINO:</label>
                        <select value={tipoSubida} onChange={(e) => setTipoSubida(e.target.value)} style={{width: '100%', padding: '10px', margin: '10px 0', background: '#222', color: '#fff'}}>
                            <option value="imagenes_publicas">IMÁGENES PÚBLICAS</option>
                            <option value="videos">VÍDEOS</option>
                            <option value="noticias">NOTICIAS</option>
                            <option value="audios">AUDIOS / MÚSICA</option>
                            <option value="expedientes">EXPEDIENTES</option>
                        </select>
                        <label>TÍTULO:</label>
                        <input type="text" value={tituloSubida} onChange={(e) => setTituloSubida(e.target.value)} style={{width: '100%', padding: '10px', margin: '10px 0'}} placeholder="Título oficial..." />
                        <label>ARCHIVO:</label>
                        <input type="file" onChange={(e) => setArchivoSubida(e.target.files[0])} style={{margin: '20px 0', color: '#fff'}} />
                        <button type="submit" className="btn-ok" style={{width: '100%', padding: '15px', background: '#b18904', color: '#000'}}>INICIAR CARGA</button>
                        {mensajeSubida && <p style={{textAlign: 'center', marginTop: '10px'}}>{mensajeSubida}</p>}
                    </form>
                </div>
            )}

            {expedienteParaLeer && (
                <div className="modal-admin-overlay" onClick={() => setExpedienteParaLeer(null)}>
                    <div className="modal-admin-content" onClick={e => e.stopPropagation()}>
                        <h3>{expedienteParaLeer.titulo}</h3>
                        <p>De: {expedienteParaLeer.usuario_nombre || expedienteParaLeer.agente || 'Agente / Admin'}</p>
                        <hr />
                        <div className="cuerpo-modal" style={{ whiteSpace: 'pre-wrap' }}>{expedienteParaLeer.contenido || expedienteParaLeer.cuerpo || expedienteParaLeer.descripcion}</div>
                        <button className="btn-del" onClick={() => setExpedienteParaLeer(null)}>CERRAR</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PanelAdmin;