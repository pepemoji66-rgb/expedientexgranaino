import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './paneladmin.css';
import { API_BASE_URL, ADMIN_EMAIL } from '../config';

const PanelAdmin = () => {
    const [tab, setTab] = useState('usuarios');
    const [datos, setDatos] = useState({
        usuarios: [],
        noticias: [],
        imagenes: [],
        videos: [],
        audios: [],
        expedientes: [],
        lugares: [],
        casos_abiertos: [],
        comentarios: [],
        archipeg: []
    });

    const [cargando, setCargando] = useState(false);
    const [itemParaLeer, setItemParaLeer] = useState(null);
    const [itemParaEditar, setItemParaEditar] = useState(null);
    const [editForm, setEditForm] = useState({
        titulo: '',
        contenido: '',
        latitud: '',
        longitud: '',
        capturas: '',
        url: '',
        fuente_url: '',
        tipo: '',
        es_atarfe: 0
    });
    const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
    const [archivoEdit, setArchivoEdit] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;
    const [filtroBusqueda, setFiltroBusqueda] = useState('');

    // ESTADOS DE FORMULARIO DE SUBIDA
    const [tipoSubida, setTipoSubida] = useState('imagenes');
    const [tituloSubida, setTituloSubida] = useState('');
    const [tituloEnSubida, setTituloEnSubida] = useState('');
    const [contenidoSubida, setContenidoSubida] = useState('');
    const [contenidoEnSubida, setContenidoEnSubida] = useState('');
    const [archivoSubida, setArchivoSubida] = useState(null);
    const [mensajeSubida, setMensajeSubida] = useState('');
    const [busquedaLugar, setBusquedaLugar] = useState('');
    const [archivosCapturas, setArchivosCapturas] = useState([]);
    const [urlExternaAdmin, setUrlExternaAdmin] = useState('');
    const [esAtarfeSubida, setEsAtarfeSubida] = useState(false);
    const [tipoRelatoSubida, setTipoRelatoSubida] = useState('jefe');

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const [resU, resV, resE, resI, resL, resN, resA, resC, resCOM, resARCH] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/api/usuarios`),
                axios.get(`${API_BASE_URL}/api/videos/todos`),
                axios.get(`${API_BASE_URL}/api/expedientes/todos`),
                axios.get(`${API_BASE_URL}/api/galeria/admin/todas-las-imagenes`),
                axios.get(`${API_BASE_URL}/api/lugares`),
                axios.get(`${API_BASE_URL}/api/galeria/admin/todas-noticias`),
                axios.get(`${API_BASE_URL}/api/audios`),
                axios.get(`${API_BASE_URL}/api/casos`),
                axios.get(`${API_BASE_URL}/api/admin/todos-comentarios`),
                axios.get(`${API_BASE_URL}/api/archipeg/solicitudes`)
            ]);

            const parse = (res) => {
                if (res.status !== 'fulfilled') return [];
                const d = res.value.data;
                if (Array.isArray(d)) return d;
                if (d && Array.isArray(d.data)) return d.data; // Soporte para audios paginados
                return [];
            };

            setDatos({
                usuarios: parse(resU),
                videos: parse(resV),
                expedientes: parse(resE),
                imagenes: parse(resI),
                lugares: parse(resL),
                noticias: parse(resN),
                audios: parse(resA),
                casos_abiertos: parse(resC),
                comentarios: parse(resCOM),
                archipeg: parse(resARCH)
            });
        } catch (err) {
            console.error("❌ Error en la recepción de datos", err);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        // SEGURIDAD NIVEL 5: Verificación interna de sesión
        const sesion = localStorage.getItem('agente_sesion');
        if (!sesion) {
            window.location.href = '/';
            return;
        }
        const user = JSON.parse(sesion);
        if (user.rol !== 'admin' && user.email?.toLowerCase() !== ADMIN_EMAIL?.toLowerCase()) {
            window.location.href = '/';
            return;
        }

        cargarDatos();
        setPaginaActual(1);
    }, [tab, cargarDatos]);

    const gestionar = async (id, accion, tipo) => {
        if (!window.confirm(`¿Confirmar orden de ${accion.toUpperCase()} para el ID #${id}?`)) return;
        setCargando(true);
        try {
            let url = `${API_BASE_URL}/api`;

            const mapping = {
                usuarios: { base: '/usuarios', approve: '/usuarios/aprobar' },
                expedientes: { base: '/expedientes/borrar-expediente', approve: '/expedientes/aprobar-expediente' },
                videos: { base: '/videos', approve: '/videos/aprobar' },
                imagenes: { base: '/galeria/borrar-imagen', approve: '/galeria/admin/aprobar-imagen' },
                noticias: { base: '/galeria/borrar-noticia', approve: '/galeria/admin/aprobar-noticia' },
                lugares: { base: '/expedientes/borrar-lugar', approve: '/expedientes/aprobar' },
                audios: { base: '/audios', approve: '/audios/aprobar' }, 
                chat: { base: '/borrar-mensaje' },
                comentarios: { base: '/comentarios' },
                archipeg: { base: '/archipeg/solicitudes', approve: '/archipeg/solicitudes' }
            };

            const route = mapping[tipo];
            if (!route) throw new Error("Tipo de sector no reconocido");

            let finalUrl = '';
            if (tipo === 'archipeg') {
                finalUrl = accion === 'aprobar' 
                    ? `${url}/archipeg/solicitudes/${id}/aprobar` 
                    : `${url}/archipeg/solicitudes/${id}`;
            } else {
                finalUrl = accion === 'aprobar' ? `${url}${route.approve}/${id}` : `${url}${route.base}/${id}`;
            }

            if (accion === 'aprobar') {
                await axios.put(finalUrl);
            } else {
                await axios.delete(finalUrl);
            }

            alert(`✅ REGISTRO ${accion === 'aprobar' ? 'APROBADO / PROCESADO' : 'ELIMINADO'}`);
            cargarDatos();
        } catch (err) {
            console.error("❌ Error en la operación:", err);
            alert("❌ Error en el búnker. Revisa la consola.");
        } finally {
            setCargando(false);
        }
    };

    const actualizarRango = async (id, rango) => {
        try {
            await axios.put(`${API_BASE_URL}/api/usuarios/${id}/rango`, { rango });
            alert(`✅ RANGO ACTUALIZADO A ${rango.toUpperCase()}`);
            cargarDatos();
        } catch (err) {
            console.error("Error actualizando rango:", err);
            alert("❌ Fallo al actualizar el rango del agente.");
        }
    };

    const handleEditar = (item) => {
        setItemParaEditar(item);
        setEditForm({
            titulo: item.titulo || item.nombre || '',
            titulo_en: item.titulo_en || '',
            contenido: item.contenido || item.descripcion || item.cuerpo || '',
            contenido_en: item.contenido_en || '',
            latitud: item.latitud || 0,
            longitud: item.longitud || 0,
            capturas: item.capturas || '',
            url: item.url || '',
            fuente_url: item.fuente_url || '',
            estado: item.estado || item.aprobado || '',
            tipo: item.tipo || '',
            ubicacion: item.ubicacion || '',
            nivel_alerta: item.nivel_alerta || 'Bajo',
            es_atarfe: item.es_atarfe || 0,
            imagen_url: item.imagen_url || item.url_imagen || item.imagen || '',
            ruta: item.ruta || item.url_audio || ''
        });
        setArchivoEdit(null);
    };

    const guardarEdicion = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            const id = itemParaEditar.id || itemParaEditar._id;
            let endpoint = `${API_BASE_URL}/api/videos/${id}`;
            
            if (tab === 'expedientes') endpoint = `${API_BASE_URL}/api/expedientes/${id}`;
            if (tab === 'noticias') endpoint = `${API_BASE_URL}/api/galeria/noticias/${id}`;
            if (tab === 'imagenes') endpoint = `${API_BASE_URL}/api/galeria/imagenes/${id}`;
            if (tab === 'lugares') endpoint = `${API_BASE_URL}/api/expedientes/lugares/${id}`;
            if (tab === 'casos_abiertos') endpoint = `${API_BASE_URL}/api/casos/${id}`;
            if (tab === 'audios') endpoint = `${API_BASE_URL}/api/audios/${id}`;
            
            let payload;
            let config = {};

            // Mapeo dinámico para el backend (lugares/imagenes usan nombre/descripcion, otros titulo/contenido)
            const finalData = { ...editForm };
            if (tab === 'lugares' || tab === 'imagenes' || tab === 'noticias' || tab === 'videos') {
                if (tab === 'lugares') finalData.nombre = finalData.titulo;
                if (tab === 'noticias') finalData.cuerpo = finalData.contenido;
                
                finalData.descripcion = finalData.contenido;
                // Asegurar que las coordenadas sean números o nulos, no strings vacíos
                finalData.latitud = finalData.latitud ? parseFloat(finalData.latitud) : 0;
                finalData.longitud = finalData.longitud ? parseFloat(finalData.longitud) : 0;
            }

            if (archivoEdit) {
                const formData = new FormData();
                Object.keys(finalData).forEach(key => {
                    if (finalData[key] !== null && finalData[key] !== undefined) {
                        formData.append(key, finalData[key]);
                    }
                });
                formData.append('imagen', archivoEdit);
                payload = formData;
                config = { headers: { 'Content-Type': 'multipart/form-data' } };
            } else {
                payload = finalData;
            }

            await axios.put(endpoint, payload, config);
            alert("✅ REGISTRO ACTUALIZADO CORRECTAMENTE");
            setItemParaEditar(null);
            setArchivoEdit(null);
            cargarDatos();
        } catch (err) {
            console.error("Error al guardar:", err);
            alert("❌ FALLO AL ACTUALIZAR EL REGISTRO");
        } finally {
            setCargando(false);
        }
    };

    const buscarCoordenadas = async () => {
        if (!busquedaLugar) return;
        setCargando(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${busquedaLugar}`);
            if (res.data && res.data.length > 0) {
                const { lat, lon, display_name } = res.data[0];
                setEditForm(prev => ({ 
                    ...prev, 
                    latitud: parseFloat(lat), 
                    longitud: parseFloat(lon),
                    ubicacion: display_name.split(',')[0] // Sugerir ciudad
                }));
                alert(`📍 Localización fijada: ${display_name}`);
            } else {
                alert("❌ No se ha detectado el sector en el radar.");
            }
        } catch (err) {
            alert("❌ Fallo en la conexión con el satélite geográfico.");
        } finally {
            setCargando(false);
        }
    };

    const subirCapturasAdicionales = async () => {
        if (archivosCapturas.length === 0) return;
        setCargando(true);
        try {
            const formData = new FormData();
            Array.from(archivosCapturas).forEach(file => {
                formData.append('capturas', file);
            });

            const id = itemParaEditar.id || itemParaEditar._id;
            const res = await axios.post(`${API_BASE_URL}/api/videos/${id}/capturas`, formData);
            
            setEditForm(prev => ({ ...prev, capturas: res.data.urls }));
            setArchivosCapturas([]);
            alert("✅ Evidencias fotográficas añadidas al registro.");
        } catch (err) {
            alert("❌ Fallo al transmitir las capturas.");
        } finally {
            setCargando(false);
        }
    };

    const manejarSubidaAdmin = async (e) => {
        e.preventDefault();
        
        if (!tituloSubida) {
            setMensajeSubida("⚠️ Título requerido.");
            return;
        }

        const esTexto = tipoSubida === 'expedientes' || tipoSubida === 'casos_abiertos';

        // PROTOCOLO DE VALIDACIÓN REFORZADO
        if (esTexto) {
            if (!contenidoSubida) {
                setMensajeSubida("⚠️ Contenido del relato requerido.");
                return;
            }
        } else {
            if (!archivoSubida && !urlExternaAdmin) {
                setMensajeSubida("⚠️ Archivo adjunto o URL externa requerida.");
                return;
            }
        }

        const formData = new FormData();
        if (archivoSubida) formData.append('archivo', archivoSubida);
        if (urlExternaAdmin) formData.append('url_externa', urlExternaAdmin);
        formData.append('titulo', tituloSubida);
        formData.append('tipo', tipoSubida);
        if (contenidoSubida) formData.append('contenido', contenidoSubida);
        if (tipoSubida === 'casos_abiertos') {
            if (tituloEnSubida) formData.append('titulo_en', tituloEnSubida);
            if (contenidoEnSubida) formData.append('contenido_en', contenidoEnSubida);
        }
        if (tipoSubida === 'noticias' && editForm.fuente_url) formData.append('fuente_url', editForm.fuente_url);
        
        // Coordenadas para Lugares, Relatos, Noticias y Vídeos
        if (tipoSubida === 'lugares' || tipoSubida === 'expedientes' || tipoSubida === 'noticias' || tipoSubida === 'casos_abiertos' || tipoSubida === 'videos') {
            formData.append('latitud', editForm.latitud || 0);
            formData.append('longitud', editForm.longitud || 0);
            formData.append('ubicacion', editForm.ubicacion || '');
        }
        
        if (tipoSubida === 'imagenes') {
            formData.append('es_atarfe', esAtarfeSubida ? 1 : 0);
        }
        
        if (tipoSubida === 'expedientes') {
            formData.append('tipo_relato', tipoRelatoSubida);
        }
        
        if (tipoSubida === 'audios' && editForm.imagen_url) {
            formData.append('imagen_url', editForm.imagen_url);
        }


        try {
            setCargando(true);
            setMensajeSubida("🛰️ Transmitiendo al búnker...");
            await axios.post(`${API_BASE_URL}/api/admin/admin/upload`, formData);
            setMensajeSubida("✅ REGISTRO CLASIFICADO");
            setTituloSubida('');
            setTituloEnSubida('');
            setArchivoSubida(null);
            setContenidoSubida('');
            setContenidoEnSubida('');
            setUrlExternaAdmin('');
            cargarDatos();
        } catch (err) {
            setMensajeSubida("❌ FALLO EN LA CARGA");
        } finally {
            setCargando(false);
        }
    };

    const listaBase = datos[tab] || [];
    const listaActiva = listaBase.filter(item => {
        if (!filtroBusqueda) return true;
        const query = filtroBusqueda.toLowerCase();
        return (
            (item.titulo && item.titulo.toLowerCase().includes(query)) ||
            (item.nombre && item.nombre.toLowerCase().includes(query)) ||
            (item.email && item.email.toLowerCase().includes(query)) ||
            (item.mensaje && item.mensaje.toLowerCase().includes(query)) ||
            (item.nombre_usuario && item.nombre_usuario.toLowerCase().includes(query)) ||
            (item.contenido && item.contenido.toLowerCase().includes(query)) ||
            (item.descripcion && item.descripcion.toLowerCase().includes(query))
        );
    });
    
    const itemsPaginados = listaActiva.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina);
    const totalPaginas = Math.ceil(listaActiva.length / itemsPorPagina);

    return (
        <div className="panel-admin-container fade-in">
            <h2 className="titulo-neon">CONTROL DE MANDO UNIFICADO</h2>

            <div className="tabs-admin">
                {Object.keys(datos).map(t => {
                    let label = t.toUpperCase();
                    if (t === 'imagenes') label = 'FOTOS';
                    if (t === 'noticias') label = 'NOTICIAS';
                    if (t === 'expedientes') label = 'RELATOS';
                    if (t === 'casos_abiertos') label = '💀 CASOS ABIERTOS';
                    if (t === 'archipeg') label = '💻 ARCHIPEG';
                    
                    return (
                        <button key={t} className={tab === t ? 'active' : ''} onClick={() => { setTab(t); setPaginaActual(1); }}>
                            {label}
                        </button>
                    );
                })}
                <button className={tab === 'subir' ? 'active' : ''} onClick={() => setTab('subir')} style={{ background: '#b18904', color: 'black' }}>
                    + SUBIR
                </button>
            </div>

            {tab !== 'subir' ? (
                <>
                    <div className="admin-actions-bar">
                        <div className="buscador-admin">
                            <span className="search-icon">🔍</span>
                            <input 
                                type="text" 
                                placeholder={`Buscar en ${tab}...`} 
                                value={filtroBusqueda}
                                onChange={(e) => {
                                    setFiltroBusqueda(e.target.value);
                                    setPaginaActual(1);
                                }}
                                className="input-busqueda-admin"
                            />
                            {filtroBusqueda && (
                                <button className="btn-clear-search" onClick={() => { setFiltroBusqueda(''); setPaginaActual(1); }}>✕</button>
                            )}
                        </div>
                        {filtroBusqueda && <div className="conteo-resultados">Detectados: {listaActiva.length} registros</div>}
                    </div>
                    
                    <div className="table-responsive">
                        <table className="tabla-admin">
                            <thead>
                                <tr>
                                    <th>ESTADO</th>
                                    <th>RESUMEN</th>
                                    <th>DETALLES</th>
                                    <th>MANDO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {itemsPaginados.map(item => {
                                    const id = item.id || item._id;
                                    // REGLA DE VALIDACIÓN UNIFICADA: Cada sección usa campos distintos
                                    // - Usuarios: aprobado = 1
                                    // - Noticias: estado = 'aprobado' y/o aprobado = 1
                                    // - Imágenes: estado = 'publica'
                                    // - Videos/Expedientes/Lugares: aprobado = 1
                                    const esAprobado = (
                                        item.aprobado === 1 || 
                                        item.estado === 'publica' || 
                                        item.estado === 'aprobado' ||
                                        item.estado === 'publico' ||
                                        item.estado === 'enviado'
                                    );
                                    
                                    return (
                                        <tr key={id} className="fila-admin">
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <span className={esAprobado ? 'status-ok' : 'status-pending'}>
                                                        {esAprobado ? 'ACTIVO' : 'PENDIENTE'}
                                                    </span>
                                                    {tab === 'expedientes' && (
                                                        <span style={{ 
                                                            fontSize: '0.6rem', 
                                                            padding: '2px 5px', 
                                                            background: item.tipo === 'jefe' ? 'var(--color-principal)' : '#ffb100', 
                                                            color: '#000',
                                                            fontWeight: 'bold',
                                                            textAlign: 'center',
                                                            borderRadius: '3px'
                                                        }}>
                                                            {item.tipo === 'jefe' ? '🛡️ JEFE' : '👤 AGENTE'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="texto-verde">{item.titulo || item.nombre || item.nombre_usuario || "Sin título"}</div>
                                                <small className="id-tag">ID: #{id}</small>
                                            </td>
                                            <td>
                                                {tab === 'usuarios' && (
                                                    <div>
                                                        {item.email} <br />
                                                        📍 {item.ciudad} <br />
                                                        👁️ Visitas: {item.visitas || 0} <br />
                                                        <select
                                                            value={item.rango || 'Agente en Prácticas'}
                                                            onChange={(e) => actualizarRango(id, e.target.value)}
                                                            style={{ marginTop: '5px', padding: '2px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333' }}
                                                        >
                                                            {['Agente en Prácticas', 'Cabo', 'Cabo 1º', 'Sargento', 'Teniente', 'Capitán', 'Comandante'].map(r => (
                                                                <option key={r} value={r}>{r}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                                {tab === 'expedientes' && (
                                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                        {item.imagen_url && (
                                                            <img 
                                                                src={item.imagen_url.startsWith('http') 
                                                                    ? item.imagen_url 
                                                                    : `${API_BASE_URL}/imagenes/${item.imagen_url}`} 
                                                                className="img-admin-mini-preview" 
                                                                alt="preview"
                                                                onClick={() => setImagenSeleccionada(item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`)}
                                                            />
                                                        )}
                                                        <button className="btn-leer-mini" onClick={() => setItemParaLeer(item)}>👁️ LEER</button>
                                                        <button className="btn-edit-mini" onClick={() => handleEditar(item)}>📝 EDITAR</button>
                                                    </div>
                                                )}
                                                {tab === 'videos' && <a href={item.url?.startsWith('http') ? item.url : `${API_BASE_URL}/videos/${item.url}`} target="_blank" rel="noreferrer" className="link-ver">ABRIR LINK</a>}
                                                {tab === 'imagenes' && (item.url_imagen || item.imagen) && (
                                                    (item.url_imagen || item.imagen).toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) ? (
                                                        <div className="video-placeholder-admin">📹 VÍDEO</div>
                                                    ) : (
                                                        <img 
                                                            src={(item.url_imagen || item.imagen).startsWith('http') 
                                                                ? (item.url_imagen || item.imagen) 
                                                                : `${API_BASE_URL}/uploads/${item.agente ? 'archivos' : 'imagenes'}/${item.url_imagen || item.imagen}`}
                                                            className="img-admin-preview" 
                                                            alt="evidencia" 
                                                            onClick={() => setImagenSeleccionada((item.url_imagen || item.imagen).startsWith('http') ? (item.url_imagen || item.imagen) : `${API_BASE_URL}/uploads/${item.agente ? 'archivos' : 'imagenes'}/${item.url_imagen || item.imagen}`)}
                                                            onError={(e) => { 
                                                                if (!(item.url_imagen || item.imagen).startsWith('http')) {
                                                                    e.target.src = `${API_BASE_URL}/imagenes/${item.url_imagen || item.imagen}`; 
                                                                }
                                                            }}
                                                        />
                                                    )
                                                )}
                                                {tab === 'lugares' && (item.imagen_url || item.imagenes) && (
                                                    <img 
                                                        src={(item.imagen_url || item.imagenes).startsWith('http') 
                                                            ? (item.imagen_url || item.imagenes) 
                                                            : `${API_BASE_URL}/lugares/${item.imagen_url || item.imagenes}`} 
                                                        className="img-admin-preview" 
                                                        alt="lugar" 
                                                        onClick={() => setImagenSeleccionada((item.imagen_url || item.imagenes).startsWith('http') ? (item.imagen_url || item.imagenes) : `${API_BASE_URL}/lugares/${item.imagen_url || item.imagenes}`)}
                                                    />
                                                )}
                                                {tab === 'noticias' && (
                                                    (item.imagen_url || item.imagen) ? (
                                                        <img 
                                                            src={(item.imagen_url || item.imagen).startsWith('http') 
                                                                ? (item.imagen_url || item.imagen) 
                                                                : `${API_BASE_URL}/imagenes/${item.imagen_url || item.imagen}`} 
                                                            className="img-admin-preview" 
                                                            alt="noticia" 
                                                            onClick={() => setImagenSeleccionada((item.imagen_url || item.imagen).startsWith('http') ? (item.imagen_url || item.imagen) : `${API_BASE_URL}/imagenes/${item.imagen_url || item.imagen}`)}
                                                        />
                                                    ) : (
                                                        <div className="texto-verde" style={{fontSize: '0.75rem', maxWidth: '200px'}}>{item.cuerpo?.substring(0, 80)}...</div>
                                                    )
                                                )}
                                                {tab === 'audios' && (item.ruta || item.url_audio) && (
                                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                        {item.imagen_url && (
                                                            <img 
                                                                src={item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`} 
                                                                className="img-admin-mini-preview" 
                                                                alt="audio-thumb"
                                                                onClick={() => setImagenSeleccionada(item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`)}
                                                            />
                                                        )}
                                                        {(item.ruta || item.url_audio).includes('<iframe') ? (
                                                            <div style={{ width: '150px', overflow: 'hidden' }}>
                                                                <span style={{fontSize: '0.7rem', color: '#00d4ff'}}>📡 IFRAME AUDIO</span>
                                                            </div>
                                                        ) : (item.ruta || item.url_audio).startsWith('http') && !(item.ruta || item.url_audio).toLowerCase().endsWith('.mp3') && !(item.ruta || item.url_audio).toLowerCase().endsWith('.wav') ? (
                                                            <a href={item.ruta || item.url_audio} target="_blank" rel="noreferrer" style={{color: '#00d4ff', fontSize: '0.7rem', textDecoration: 'none', border: '1px solid #00d4ff', padding: '2px 5px', borderRadius: '3px'}}>🎧 ENLACE</a>
                                                        ) : (
                                                            <audio controls crossOrigin="anonymous" style={{ height: '30px', width: '150px' }}>
                                                                <source src={(item.ruta || item.url_audio).startsWith('http') 
                                                                    ? (item.ruta || item.url_audio) 
                                                                    : `${API_BASE_URL}/audios/${item.ruta || item.url_audio}`} type="audio/mpeg" />
                                                            </audio>
                                                        )}
                                                    </div>
                                                )}
                                                {tab === 'chat' && <div className="msg-preview">"{item.mensaje}"</div>}
                                                {tab === 'comentarios' && <div className="msg-preview">"{item.mensaje}" <br/><small>Por: {item.agente}</small></div>}
                                                {tab === 'archipeg' && (
                                                    <div style={{ textAlign: 'left', lineHeight: '1.6' }}>
                                                        <strong>📧 Email:</strong> {item.email} <br />
                                                        <strong>💻 Versión:</strong> <span style={{
                                                            padding: '2px 6px',
                                                            borderRadius: '3px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 'bold',
                                                            backgroundColor: item.tipo === 'pro' ? '#ffb100' : '#00d4ff',
                                                            color: '#000'
                                                        }}>{item.tipo.toUpperCase()}</span> <br />
                                                        <strong>📅 Solicitado:</strong> {new Date(item.fecha).toLocaleString()} <br />
                                                        {item.fecha_envio && (
                                                            <>
                                                                <strong>🚀 Enviado:</strong> {new Date(item.fecha_envio).toLocaleString()}
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                            </td>
                                            <td>
                                                <div className="acciones-mando">
                                                    {!esAprobado && tab !== 'chat' && (
                                                        <button className="btn-ok" onClick={() => gestionar(id, 'aprobar', tab)}>OK</button>
                                                    )}
                                                    {(tab === 'expedientes' || tab === 'videos' || tab === 'noticias' || tab === 'imagenes' || tab === 'lugares' || tab === 'casos_abiertos' || tab === 'audios') && (
                                                        <button className="btn-edit" onClick={() => handleEditar(item)}>EDIT</button>
                                                    )}
                                                    {esAprobado && (tab === 'expedientes' || tab === 'noticias' || tab === 'imagenes') && (
                                                        <button 
                                                            className="btn-social-share" 
                                                            onClick={() => {
                                                                const text = `${(item.titulo || item.nombre || "Nuevo Expediente").toUpperCase()}\n\n${(item.contenido || item.descripcion || item.cuerpo || "").substring(0, 200)}...\n\nDescubre más en: https://expedientexgranaino.com\n\n#Granada #Misterio #ExpedienteX`;
                                                                const imageUrl = item.imagen_url || item.url_imagen || item.imagen;
                                                                const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${API_BASE_URL}/imagenes/${imageUrl}`;
                                                                
                                                                if (navigator.share) {
                                                                    navigator.share({
                                                                        title: item.titulo || item.nombre,
                                                                        text: text,
                                                                        url: window.location.origin
                                                                    }).catch(console.error);
                                                                } else {
                                                                    alert("📋 CONTENIDO PREPARADO PARA INSTAGRAM:\n\n1. La imagen se ha resaltado.\n2. Copia el texto que aparecerá ahora.\n3. Abre Instagram y pega.");
                                                                    navigator.clipboard.writeText(text);
                                                                    alert("✅ Texto copiado al portapapeles. ¡Ya puedes pegarlo en Instagram!");
                                                                }
                                                            }}
                                                            style={{ background: '#e1306c', color: 'white', border: 'none', padding: '5px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.7rem' }}
                                                        >
                                                            📱 REDES
                                                        </button>
                                                    )}
                                                    <button className="btn-del" onClick={() => gestionar(id, 'borrar', tab)}>DEL</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {totalPaginas > 1 && (
                            <div className="paginacion-admin">
                                <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)}>ATRÁS</button>
                                <span>PÁG {paginaActual} / {totalPaginas}</span>
                                <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(p => p + 1)}>SIGUIENTE</button>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div className="form-subida-admin glass-card">
                    <form onSubmit={manejarSubidaAdmin} className="form-interior">
                        <h3 style={{ color: '#b18904', borderBottom: '1px solid #b18904', paddingBottom: '10px' }}>ALMACENAMIENTO ESTRATÉGICO</h3>
                        
                        <div className="form-grid-admin">
                            <div className="form-group-admin">
                                <label>DESTINO:</label>
                                <select value={tipoSubida} onChange={e => setTipoSubida(e.target.value)}>
                                    <option value="imagenes">FOTOS</option>
                                    <option value="noticias">NOTICIAS</option>
                                    <option value="videos">VÍDEOS</option>
                                    <option value="audios">AUDIOS (PODCAST)</option>
                                    <option value="lugares">LUGARES (MAPA)</option>
                                    <option value="expedientes">RELATOS</option>
                                    <option value="casos_abiertos">💀 CASOS ABIERTOS</option>
                                </select>
                            </div>

                            {tipoSubida === 'expedientes' && (
                                <div className="form-group-admin">
                                    <label>TIPO DE RELATO:</label>
                                    <select value={tipoRelatoSubida} onChange={e => setTipoRelatoSubida(e.target.value)} style={{ border: '1px solid var(--color-principal)', color: 'var(--color-principal)' }}>
                                        <option value="jefe">🛡️ RELATO DEL JEFE (ADMIN)</option>
                                        <option value="agente">👤 INFORME DE AGENTE (USUARIO)</option>
                                    </select>
                                </div>
                            )}
                            
                            <div className="form-group-admin">
                                <label>TÍTULO:</label>
                                <input type="text" value={tituloSubida} onChange={e => setTituloSubida(e.target.value)} placeholder="Título del registro..." />
                            </div>
                            
                            {tipoSubida === 'casos_abiertos' && (
                                <div className="form-group-admin">
                                    <label style={{ color: '#00d4ff' }}>TÍTULO (INGLÉS):</label>
                                    <input type="text" value={tituloEnSubida} onChange={e => setTituloEnSubida(e.target.value)} placeholder="Title in English..." style={{ background: '#000', color: '#00d4ff', border: '1px solid #333' }} />
                                </div>
                            )}
                        </div>
                        
                            {tipoSubida === 'noticias' && (
                                <div className="form-group-admin" style={{ marginBottom: '15px' }}>
                                     <label style={{ color: '#00d4ff' }}>🌐 ENLACE A FUENTE (OPCIONAL):</label>
                                     <input 
                                         type="url" value={editForm.fuente_url} 
                                         onChange={e => setEditForm({...editForm, fuente_url: e.target.value})} 
                                         placeholder="https://..." 
                                         style={{ width: '100%', padding: '10px', background: '#000', color: '#00d4ff', border: '1px solid #333' }}
                                     />
                                 </div>
                            )}

                            {tipoSubida === 'audios' && (
                                <div className="form-group-admin" style={{ marginBottom: '15px' }}>
                                    <label style={{ color: '#ff00ff' }}>🖼️ URL DE IMAGEN PARA EL AUDIO (OPCIONAL):</label>
                                    <input 
                                        type="url" value={editForm.imagen_url} 
                                        onChange={e => setEditForm({...editForm, imagen_url: e.target.value})} 
                                        placeholder="https://imagen-del-podcast.jpg..." 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: '#ff00ff', border: '1px solid #333' }}
                                     />
                                </div>
                            )}

                        {tipoSubida === 'expedientes' || tipoSubida === 'noticias' || tipoSubida === 'casos_abiertos' || tipoSubida === 'videos' ? (
                            <>
                                <div className="form-group-admin">
                                    <label>CONTENIDO / DESCRIPCIÓN:</label>
                                    <textarea 
                                        className="textarea-bunker-admin"
                                        value={contenidoSubida} 
                                        onChange={e => setContenidoSubida(e.target.value)} 
                                        placeholder="Redacta el informe..."
                                        style={{ width: '100%', minHeight: '100px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', padding: '10px' }}
                                    ></textarea>
                                </div>
                                {tipoSubida === 'casos_abiertos' && (
                                    <div className="form-group-admin" style={{ marginTop: '10px' }}>
                                        <label style={{ color: '#00d4ff' }}>CONTENIDO (INGLÉS):</label>
                                        <textarea 
                                            className="textarea-bunker-admin"
                                            value={contenidoEnSubida} 
                                            onChange={e => setContenidoEnSubida(e.target.value)} 
                                            placeholder="Translate the content to English..."
                                            style={{ width: '100%', minHeight: '100px', background: '#000', color: '#00d4ff', border: '1px solid #333', padding: '10px' }}
                                        ></textarea>
                                    </div>
                                )}
                            </>
                        ) : null}

                        <div className="form-group-admin">
                            <label>ARCHIVO ADJUNTO {(tipoSubida === 'expedientes' || tipoSubida === 'casos_abiertos') ? '(OPCIONAL)' : ''}:</label>
                            <input type="file" onChange={e => setArchivoSubida(e.target.files[0])} />
                        </div>

                        {tipoSubida === 'imagenes' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: 'rgba(0,255,65,0.05)', border: '1px solid var(--color-principal)', marginTop: '10px', marginBottom: '10px' }}>
                                <input 
                                    type="checkbox" 
                                    checked={esAtarfeSubida} 
                                    onChange={e => setEsAtarfeSubida(e.target.checked)} 
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <label style={{ color: 'var(--color-principal)', fontWeight: 'bold', cursor: 'pointer' }}>🚀 CLASIFICAR PARA DOSSIER ATARFE</label>
                            </div>
                        )}
                        
                        <div className="form-group-admin" style={{marginTop: '10px'}}>
                            <label style={{ color: '#00d4ff' }}>🌐 ENLACE EXTERNO O IFRAME (Opcional):</label>
                            <textarea 
                                className="input-bunker" 
                                value={urlExternaAdmin} 
                                onChange={e => setUrlExternaAdmin(e.target.value)}
                                placeholder="Pega aquí el enlace de otra página, código de inserción (iframe), YouTube, etc."
                                style={{ width: '100%', minHeight: '60px', padding: '10px', background: '#000', color: '#00d4ff', border: '1px solid #333' }}
                            />
                        </div>
                        
                        {(tipoSubida === 'lugares' || tipoSubida === 'expedientes' || tipoSubida === 'imagenes' || tipoSubida === 'noticias' || tipoSubida === 'casos_abiertos' || tipoSubida === 'videos') && (
                            <div style={{ background: 'rgba(177,137,4,0.1)', padding: '15px', marginBottom: '15px', border: '1px solid #b18904' }}>
                                <label style={{ display: 'block', color: '#b18904', fontSize: '0.8rem', marginBottom: '10px' }}>🛰️ RASTREO GPS:</label>
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                    <input 
                                        type="text" value={busquedaLugar} 
                                        onChange={e => setBusquedaLugar(e.target.value)} 
                                        placeholder="Buscar ciudad o zona..."
                                        style={{ flex: 1, padding: '8px', background: '#000', color: '#fff', border: '1px solid #333' }}
                                    />
                                    <button type="button" onClick={buscarCoordenadas} style={{ padding: '8px', background: '#b18904', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>RASTREAR</button>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <div>
                                        <label style={{ color: 'var(--color-principal)', fontSize: '0.6rem' }}>LATITUD:</label>
                                        <input type="number" step="any" value={editForm.latitud} onChange={e => setEditForm({...editForm, latitud: e.target.value})} placeholder="Latitud" style={{ width: '100%', padding: '5px', background: '#000', color: 'var(--color-principal)' }} />
                                    </div>
                                    <div>
                                        <label style={{ color: 'var(--color-principal)', fontSize: '0.6rem' }}>LONGITUD:</label>
                                        <input type="number" step="any" value={editForm.longitud} onChange={e => setEditForm({...editForm, longitud: e.target.value})} placeholder="Longitud" style={{ width: '100%', padding: '5px', background: '#000', color: 'var(--color-principal)' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <button type="submit" className="btn-ok-subir" style={{ marginTop: '20px' }}>SUBIR AL BÚNKER</button>

                        {mensajeSubida && <div className="mensaje-status">{mensajeSubida}</div>}
                    </form>
                </div>
            )}

            {itemParaLeer && (
                <div className="modal-admin-overlay" onClick={() => setItemParaLeer(null)}>
                    <div className="modal-admin-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-admin-header">
                            <h3>{itemParaLeer.titulo}</h3>
                            <button className="btn-cerrar-modal" onClick={() => setItemParaLeer(null)}>X</button>
                        </div>
                        <div className="modal-body-text">
                            {itemParaLeer.contenido || itemParaLeer.descripcion}
                        </div>
                        <div className="modal-admin-footer">
                            <small>Enviado por: {itemParaLeer.usuario_nombre || itemParaLeer.agente || "Agente Anónimo"}</small>
                        </div>
                    </div>
                </div>
            )}

            {itemParaEditar && (
                <div className="modal-admin-overlay" onClick={() => setItemParaEditar(null)}>
                    <div className="modal-admin-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="modal-admin-header">
                            <h3 style={{ color: 'var(--color-principal)' }}>MODIFICAR REGISTRO #{itemParaEditar.id}</h3>
                            <button className="btn-cerrar-modal" onClick={() => setItemParaEditar(null)}>X</button>
                        </div>
                        <form onSubmit={guardarEdicion} style={{ padding: '20px' }}>
                            <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>TÍTULO:</label>
                            <input 
                                type="text" value={editForm.titulo} 
                                onChange={e => setEditForm({...editForm, titulo: e.target.value})} 
                                style={{ width: '100%', padding: '10px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', marginBottom: '15px' }}
                            />

                            {tab === 'casos_abiertos' && (
                                <>
                                    <label style={{ display: 'block', color: '#00d4ff', fontSize: '0.8rem', marginBottom: '5px' }}>TÍTULO (INGLÉS):</label>
                                    <input 
                                        type="text" value={editForm.titulo_en} 
                                        onChange={e => setEditForm({...editForm, titulo_en: e.target.value})} 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: '#00d4ff', border: '1px solid #333', marginBottom: '15px' }}
                                    />
                                </>
                            )}

                            {(tab === 'expedientes') && (
                                <>
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>TIPO DE RELATO:</label>
                                    <select 
                                        value={editForm.tipo} 
                                        onChange={e => setEditForm({...editForm, tipo: e.target.value})}
                                        style={{ width: '100%', padding: '10px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', marginBottom: '15px' }}
                                    >
                                        <option value="agente">👤 AGENTE (USUARIO)</option>
                                        <option value="jefe">🛡️ JEFE (ADMINISTRADOR)</option>
                                    </select>

                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>CONTENIDO:</label>
                                    <textarea 
                                        value={editForm.contenido} 
                                        onChange={e => setEditForm({...editForm, contenido: e.target.value})} 
                                        style={{ width: '100%', minHeight: '150px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', padding: '10px', marginBottom: '15px' }}
                                    />
                                    
                                    {tab === 'casos_abiertos' && (
                                        <>
                                            <label style={{ display: 'block', color: '#00d4ff', fontSize: '0.8rem', marginBottom: '5px' }}>CONTENIDO (INGLÉS):</label>
                                            <textarea 
                                                value={editForm.contenido_en} 
                                                onChange={e => setEditForm({...editForm, contenido_en: e.target.value})} 
                                                style={{ width: '100%', minHeight: '150px', background: '#000', color: '#00d4ff', border: '1px solid #333', padding: '10px', marginBottom: '15px' }}
                                            />
                                        </>
                                    )}
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>IMAGEN (OPCIONAL):</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => setArchivoEdit(e.target.files[0])} 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', marginBottom: '15px' }}
                                    />

                                    {/* BUSCADOR DE COORDENADAS PARA EDICIÓN DE RELATOS */}
                                    <div style={{ background: 'rgba(0,255,65,0.05)', padding: '15px', marginBottom: '20px', border: '1px solid #222' }}>
                                        <label style={{ display: 'block', color: '#b18904', fontSize: '0.8rem', marginBottom: '10px', fontWeight: 'bold' }}>🛰️ RASTREO GPS:</label>
                                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                            <input 
                                                type="text" value={busquedaLugar} 
                                                onChange={e => setBusquedaLugar(e.target.value)} 
                                                placeholder="Buscar ciudad o zona..."
                                                style={{ flex: 1, padding: '10px', background: '#000', color: '#fff', border: '1px solid #333' }}
                                            />
                                            <button type="button" onClick={buscarCoordenadas} style={{ padding: '10px', background: '#b18904', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>RASTREAR</button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div>
                                                <label style={{ color: 'var(--color-principal)', fontSize: '0.6rem' }}>LATITUD:</label>
                                                <input type="number" step="any" value={editForm.latitud} onChange={e => setEditForm({...editForm, latitud: e.target.value})} style={{ width: '100%', padding: '8px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', fontSize: '0.75rem' }} />
                                            </div>
                                            <div>
                                                <label style={{ color: 'var(--color-principal)', fontSize: '0.6rem' }}>LONGITUD:</label>
                                                <input type="number" step="any" value={editForm.longitud} onChange={e => setEditForm({...editForm, longitud: e.target.value})} style={{ width: '100%', padding: '8px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', fontSize: '0.75rem' }} />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {tab === 'videos' && (
                                <>
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>URL VÍDEO:</label>
                                    <input 
                                        type="text" value={editForm.url} 
                                        onChange={e => setEditForm({...editForm, url: e.target.value})} 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', marginBottom: '15px' }}
                                    />
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>CONTENIDO / DESCRIPCIÓN:</label>
                                    <textarea 
                                        value={editForm.contenido} 
                                        onChange={e => setEditForm({...editForm, contenido: e.target.value})} 
                                        style={{ width: '100%', minHeight: '100px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', padding: '10px', marginBottom: '15px' }}
                                    />
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>CAPTURAS (URLs):</label>
                                    <textarea 
                                        value={editForm.capturas} 
                                        onChange={e => setEditForm({...editForm, capturas: e.target.value})} 
                                        style={{ width: '100%', minHeight: '60px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', padding: '10px', marginBottom: '10px' }}
                                    />
                                    <div style={{ marginBottom: '15px', padding: '10px', border: '1px dashed #333' }}>
                                        <label style={{ display: 'block', color: '#b18904', fontSize: '0.7rem', marginBottom: '5px' }}>SUBIR NUEVAS EVIDENCIAS:</label>
                                        <input type="file" multiple onChange={e => setArchivosCapturas(e.target.files)} style={{ fontSize: '0.7rem', color: '#ccc' }} />
                                        <button type="button" onClick={subirCapturasAdicionales} style={{ marginTop: '10px', padding: '5px 10px', fontSize: '0.7rem', background: '#333', color: '#fff', border: '1px solid #555' }}>
                                            CARGAR ARCHIVOS
                                        </button>
                                    </div>
                                </>
                            )}

                            {tab === 'audios' && (
                                <>
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>RUTA O ENLACE (AUDIO):</label>
                                    <input 
                                        type="text" value={editForm.ruta} 
                                        onChange={e => setEditForm({...editForm, ruta: e.target.value})} 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', marginBottom: '15px' }}
                                    />
                                    <label style={{ display: 'block', color: '#ff00ff', fontSize: '0.8rem', marginBottom: '5px' }}>IMAGEN (URL) PARA PODCAST:</label>
                                    <input 
                                        type="text" value={editForm.imagen_url} 
                                        onChange={e => setEditForm({...editForm, imagen_url: e.target.value})} 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: '#ff00ff', border: '1px solid #333', marginBottom: '15px' }}
                                    />
                                </>
                            )}

                            {tab === 'noticias' && (
                                <>
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>CUERPO NOTICIA:</label>
                                    <textarea 
                                        value={editForm.contenido} 
                                        onChange={e => setEditForm({...editForm, contenido: e.target.value})} 
                                        style={{ width: '100%', minHeight: '100px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', padding: '10px', marginBottom: '15px' }}
                                    />
                                    <label style={{ display: 'block', color: '#ffeb3b', fontSize: '0.8rem', marginBottom: '5px' }}>🚨 NIVEL DE ALERTA:</label>
                                    <select 
                                        value={editForm.nivel_alerta} 
                                        onChange={e => setEditForm({...editForm, nivel_alerta: e.target.value})}
                                        style={{ width: '100%', padding: '10px', background: '#000', color: '#ffeb3b', border: '1px solid #333', marginBottom: '15px' }}
                                    >
                                        <option value="Bajo">BAJO</option>
                                        <option value="Medio">MEDIO</option>
                                        <option value="Alto">ALTO</option>
                                        <option value="Crítico">CRÍTICO</option>
                                    </select>
                                    <label style={{ display: 'block', color: '#00d4ff', fontSize: '0.8rem', marginBottom: '5px' }}>🌐 URL FUENTE ORIGINAL:</label>
                                    <input 
                                        type="url" value={editForm.fuente_url} 
                                        onChange={e => setEditForm({...editForm, fuente_url: e.target.value})} 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: '#00d4ff', border: '1px solid #333', marginBottom: '15px' }}
                                    />
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>CAMBIAR IMAGEN (OPCIONAL):</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => setArchivoEdit(e.target.files[0])} 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', marginBottom: '15px' }}
                                    />
                                </>
                            )}

                            {(tab === 'imagenes' || tab === 'lugares') && (
                                <>
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>{tab === 'lugares' ? 'IDENTIFICACIÓN DEL LUGAR:' : 'TÍTULO DE LA FOTO:'}</label>
                                    <input 
                                        type="text" value={editForm.titulo} 
                                        onChange={e => setEditForm({...editForm, titulo: e.target.value})} 
                                        placeholder="Nombre del objetivo..."
                                        style={{ width: '100%', padding: '10px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', marginBottom: '15px' }}
                                    />
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>ANÁLISIS / DESCRIPCIÓN:</label>
                                    <textarea 
                                        value={editForm.contenido} 
                                        onChange={e => setEditForm({...editForm, contenido: e.target.value})} 
                                        placeholder="Detalles del hallazgo..."
                                        style={{ width: '100%', minHeight: '80px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', padding: '10px', marginBottom: '15px' }}
                                    />
                                    
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => setArchivoEdit(e.target.files[0])} 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', marginBottom: '15px' }}
                                    />

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'rgba(0,212,255,0.1)', border: '1px solid #00d4ff', marginBottom: '15px' }}>
                                        <input 
                                            type="checkbox" 
                                            checked={editForm.es_atarfe === 1} 
                                            onChange={e => setEditForm({...editForm, es_atarfe: e.target.checked ? 1 : 0})} 
                                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                        />
                                        <label style={{ color: '#00d4ff', fontWeight: 'bold', cursor: 'pointer' }}>🚀 INCLUIR EN DOSSIER TÉCNICO ATARFE</label>
                                    </div>
                                </>
                            )}

                            {(tab === 'imagenes' || tab === 'lugares' || tab === 'expedientes' || tab === 'noticias' || tab === 'videos') && (
                                <div style={{ background: 'rgba(0,255,65,0.05)', padding: '15px', marginBottom: '20px', border: '1px solid #222' }}>
                                    <label style={{ display: 'block', color: '#b18904', fontSize: '0.8rem', marginBottom: '10px', fontWeight: 'bold' }}>🛰️ GEOLOCALIZACIÓN ESTRATÉGICA</label>
                                    
                                    <div style={{ marginBottom: '15px' }}>
                                        <label style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '5px' }}>CIUDAD / ZONA:</label>
                                        <input 
                                            type="text" value={editForm.ubicacion || ''} 
                                            onChange={e => setEditForm({...editForm, ubicacion: e.target.value})} 
                                            placeholder="Ej: Granada..."
                                            style={{ width: '100%', padding: '8px', background: '#000', color: '#fff', border: '1px solid #444' }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                        <input 
                                            type="text" value={busquedaLugar} 
                                            onChange={e => setBusquedaLugar(e.target.value)} 
                                            placeholder="Buscar en el radar..."
                                            style={{ flex: 1, padding: '10px', background: '#000', color: '#fff', border: '1px solid #333' }}
                                        />
                                        <button type="button" onClick={buscarCoordenadas} style={{ padding: '10px', background: '#b18904', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                            RASTREAR
                                        </button>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label style={{ color: 'var(--color-principal)', fontSize: '0.6rem' }}>LATITUD:</label>
                                            <input type="number" step="any" value={editForm.latitud} onChange={e => setEditForm({...editForm, latitud: e.target.value})} style={{ width: '100%', padding: '8px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', fontSize: '0.75rem' }} />
                                        </div>
                                        <div>
                                            <label style={{ color: 'var(--color-principal)', fontSize: '0.6rem' }}>LONGITUD:</label>
                                            <input type="number" step="any" value={editForm.longitud} onChange={e => setEditForm({...editForm, longitud: e.target.value})} style={{ width: '100%', padding: '8px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', fontSize: '0.75rem' }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn-ok" style={{ width: '100%', padding: '15px' }}>GUARDAR CAMBIOS EN EL ARCHIVO</button>
                        </form>
                    </div>
                </div>
            )}

            {imagenSeleccionada && (
                <div className="modal-admin-overlay zoom-overlay" onClick={() => setImagenSeleccionada(null)}>
                    <div className="modal-zoom-content fade-in" onClick={e => e.stopPropagation()}>
                        <button className="btn-cerrar-zoom" onClick={() => setImagenSeleccionada(null)}>✖</button>
                        <img src={imagenSeleccionada} alt="Zoom evidencia" className="img-zoom-full" />
                    </div>
                </div>
            )}

            {cargando && (
                <div className="bloqueo-sistema">
                    <div className="scanner"></div>
                    <p>PRECISANDO SEÑAL CON EL BÚNKER...</p>
                </div>
            )}
        </div>
    );
};

export default PanelAdmin;
