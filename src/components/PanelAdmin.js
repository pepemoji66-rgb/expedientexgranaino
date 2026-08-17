import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './paneladmin.css';
import { API_BASE_URL, ADMIN_EMAIL } from '../config';
import { safeLocalStorage } from '../utils/storage';
import Paginacion from './Paginacion';

const PanelAdmin = () => {
    const [tab, setTab] = useState('inicio');
    const [datos, setDatos] = useState({
        usuarios: [],
        noticias: [],
        imagenes: [],
        videos: [],
        misterios_historicos: [],
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
        es_atarfe: 0,
        youtube_url: ''
    });
    const [imagenSeleccionada, setImagenSeleccionada] = useState(null);
    const [archivoEdit, setArchivoEdit] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1); // Se resetea a 1 al cambiar de pestaña
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
    const [youtubeUrlSubida, setYoutubeUrlSubida] = useState('');
    
    // ESTADOS PARA PORTADA DE VÍDEO EN CREACIÓN
    const [archivoCapturaSubida, setArchivoCapturaSubida] = useState(null);
    const [urlCapturaSubida, setUrlCapturaSubida] = useState('');

    // ESTADOS DE REDES SOCIALES
    const [modalRedes, setModalRedes] = useState(null); // item a publicar
    const [redesSeleccionadas, setRedesSeleccionadas] = useState({ instagram: true, facebook: true });
    const [publicandoRedes, setPublicandoRedes] = useState(false);
    const [resultadoRedes, setResultadoRedes] = useState(null);
    const [publicarAlSubir, setPublicarAlSubir] = useState(false);
    const [estadoRedes, setEstadoRedes] = useState(null);

    // ESTADO PARA AMAZON AFILIADOS (NINJA)
    const [amazonJson, setAmazonJson] = useState('');

    // ESTADO PARA COMENTARIOS PENDIENTES
    const [comentariosPendientes, setComentariosPendientes] = useState(0);

    // --- HERRAMIENTAS DE ENLACES DE RETENCIÓN (SEO & ADSENSE) ---
    const insertarEnlaceEnSubida = () => {
        const texto = prompt("Texto a mostrar (ej: El Fantasma del Pub Gran Casino):");
        if (!texto) return;
        const url = prompt("URL del artículo o enlace (ej: https://expedientexgranaino.com/leer-historia/34):");
        if (!url) return;
        const snippet = `<a href="${url}" target="_blank" rel="noopener noreferrer">${texto}</a>`;
        setContenidoSubida(prev => prev ? prev + ' ' + snippet : snippet);
    };

    const insertarRecomendacionEnSubida = () => {
        const titulo = prompt("Título del artículo recomendado (ej: El Fantasma del Pub Gran Casino):");
        if (!titulo) return;
        const url = prompt("URL del artículo recomendado (ej: https://expedientexgranaino.com/leer-historia/34):");
        if (!url) return;
        const snippet = `\n\nSi te ha gustado este caso, no te puedes perder nuestro expediente sobre <a href="${url}" target="_blank" rel="noopener noreferrer">${titulo}</a>, donde analizamos otro fascinante misterio de nuestros archivos.`;
        setContenidoSubida(prev => prev ? prev + snippet : snippet);
    };

    const insertarEnlaceEnEdicion = () => {
        const texto = prompt("Texto a mostrar (ej: El Fantasma del Pub Gran Casino):");
        if (!texto) return;
        const url = prompt("URL del artículo o enlace (ej: https://expedientexgranaino.com/leer-historia/34):");
        if (!url) return;
        const snippet = `<a href="${url}" target="_blank" rel="noopener noreferrer">${texto}</a>`;
        setEditForm(prev => ({ ...prev, contenido: prev.contenido ? prev.contenido + ' ' + snippet : snippet }));
    };

    const insertarRecomendacionEnEdicion = () => {
        const titulo = prompt("Título del artículo recomendado (ej: El Fantasma del Pub Gran Casino):");
        if (!titulo) return;
        const url = prompt("URL del artículo recomendado (ej: https://expedientexgranaino.com/leer-historia/34):");
        if (!url) return;
        const snippet = `\n\nSi te ha gustado este caso, no te puedes perder nuestro expediente sobre <a href="${url}" target="_blank" rel="noopener noreferrer">${titulo}</a>, donde analizamos otro fascinante misterio de nuestros archivos.`;
        setEditForm(prev => ({ ...prev, contenido: prev.contenido ? prev.contenido + snippet : snippet }));
    };

    useEffect(() => {
        if (itemParaEditar) {
            const id = itemParaEditar.id || itemParaEditar._id;
            let tipo = 'exp';
            if (tab === 'misterios_historicos') tipo = 'misterio';
            if (tab === 'noticias') tipo = 'noticia';
            if (tab === 'casos_abiertos') tipo = 'caso';
            const itemKey = `${tipo}-${id}`;
            
            axios.get(`${API_BASE_URL}/api/amazon/${itemKey}`).then(res => {
                if (res.data) {
                    setAmazonJson(JSON.stringify(res.data, null, 4));
                } else {
                    setAmazonJson('');
                }
            }).catch(err => {
                console.error("Error al cargar amazon:", err);
                setAmazonJson('');
            });
        }
    }, [itemParaEditar, tab]);

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const [resU, resV, resE, resI, resL, resN, resM, resC, resCOM, resARCH, resPendientes] = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/api/usuarios`),
                axios.get(`${API_BASE_URL}/api/videos/todos`),
                axios.get(`${API_BASE_URL}/api/expedientes/todos`),
                axios.get(`${API_BASE_URL}/api/galeria/admin/todas-las-imagenes`),
                axios.get(`${API_BASE_URL}/api/lugares`),
                axios.get(`${API_BASE_URL}/api/galeria/admin/todas-noticias`),
                axios.get(`${API_BASE_URL}/api/misterios-historicos/todos`),
                axios.get(`${API_BASE_URL}/api/casos/todos`),
                axios.get(`${API_BASE_URL}/api/admin/todos-comentarios`),
                axios.get(`${API_BASE_URL}/api/archipeg/solicitudes`),
                axios.get(`${API_BASE_URL}/api/comentarios/pendientes/count`)
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
                misterios_historicos: parse(resM),
                casos_abiertos: parse(resC),
                comentarios: parse(resCOM),
                archipeg: parse(resARCH)
            });

            // Actualizar badge de comentarios pendientes
            if (resPendientes.status === 'fulfilled') {
                setComentariosPendientes(resPendientes.value.data.total || 0);
            }
        } catch (err) {
            console.error("❌ Error en la recepción de datos", err);
        } finally {
            setCargando(false);
        }
    }, []);

    // Cargar estado de las plataformas al montar
    const cargarEstadoRedes = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/social/estado`);
            setEstadoRedes(res.data);
        } catch (err) {
            console.log('📡 Estado de redes no disponible');
        }
    }, []);

    useEffect(() => {
        // SEGURIDAD NIVEL 5: Verificación interna de sesión
        const sesion = safeLocalStorage.getItem('agente_sesion');
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
        cargarEstadoRedes();
        setPaginaActual(1);
    }, [tab, cargarDatos, cargarEstadoRedes]);

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
                casos_abiertos: { base: '/casos', approve: '/casos/aprobar' },
                misterios_historicos: { base: '/misterios-historicos', approve: '/misterios-historicos/aprobar' },
                chat: { base: '/borrar-mensaje' },
                comentarios: { base: '/comentarios', approve: '/comentarios' },
                archipeg: { base: '/archipeg/solicitudes', approve: '/archipeg/solicitudes' }
            };

            const route = mapping[tipo];
            if (!route) throw new Error("Tipo de sector no reconocido");

            let finalUrl = '';
            if (tipo === 'archipeg') {
                finalUrl = accion === 'aprobar' 
                    ? `${url}/archipeg/solicitudes/${id}/aprobar` 
                    : `${url}/archipeg/solicitudes/${id}`;
            } else if (tipo === 'comentarios' && accion === 'aprobar') {
                finalUrl = `${url}/comentarios/${id}/aprobar`;
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
            ruta: item.ruta || item.url_audio || '',
            youtube_url: item.youtube_url || ''
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
            if (tab === 'misterios_historicos') endpoint = `${API_BASE_URL}/api/misterios-historicos/${id}`;
            
            let payload;
            let config = {};

            // Mapeo dinámico para el backend (lugares/imagenes usan nombre/descripcion, otros titulo/contenido)
            const finalData = { ...editForm };

            // Limpiar rutas locales de capturas y url para vídeos
            if (tab === 'videos') {
                if (finalData.capturas) {
                    finalData.capturas = finalData.capturas
                        .split(',')
                        .map(u => u.trim())
                        .filter(u => u && !(u.includes('\\') || u.startsWith('C:') || u.includes('/Users/')))
                        .join(',');
                }
                if (finalData.url) {
                    if (finalData.url.includes('\\') || finalData.url.startsWith('C:') || finalData.url.includes('/Users/')) {
                        finalData.url = '';
                    }
                }
            }

            // AUTO-UPLOAD CAPTURAS DE VÍDEOS: si hay capturas seleccionadas pero no cargadas, las subimos automáticamente
            if (tab === 'videos' && archivosCapturas && archivosCapturas.length > 0) {
                const formData = new FormData();
                Array.from(archivosCapturas).forEach(file => {
                    formData.append('capturas', file);
                });
                const resCapturas = await axios.post(`${API_BASE_URL}/api/videos/${id}/capturas`, formData);
                finalData.capturas = resCapturas.data.urls;
                setArchivosCapturas([]);
            }

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

            // --- GUARDAR AFILIADOS AMAZON (NINJA) ---
            if (amazonJson.trim() !== '') {
                let tipo = 'exp';
                if (tab === 'misterios_historicos') tipo = 'misterio';
                if (tab === 'noticias') tipo = 'noticia';
                if (tab === 'casos_abiertos') tipo = 'caso';
                const itemKey = `${tipo}-${id}`;
                try {
                    const parsedJson = JSON.parse(amazonJson);
                    await axios.post(`${API_BASE_URL}/api/amazon/${itemKey}`, parsedJson);
                } catch(e) {
                    alert("❌ CUIDADO: El código de Amazon no es un JSON válido y no se ha guardado. Corrige los corchetes o comillas.");
                }
            } else if (itemParaEditar && itemParaEditar.id) {
                // Si lo vacían, en el futuro se podría borrar de la bd, pero por ahora lo dejamos así.
            }

            alert("✅ REGISTRO ACTUALIZADO CORRECTAMENTE");
            setItemParaEditar(null);
            setArchivoEdit(null);
            setAmazonJson('');
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
            
            const urlsLimpias = res.data.urls
                ? res.data.urls.split(',').map(u => u.trim()).filter(u => u && !(u.includes('\\') || u.startsWith('C:') || u.includes('/Users/'))).join(',')
                : '';

            setEditForm(prev => ({ ...prev, capturas: urlsLimpias }));
            setArchivosCapturas([]);
            alert("✅ Evidencias fotográficas añadidas al registro.");
        } catch (err) {
            alert("❌ Fallo al transmitir las capturas.");
        } finally {
            setCargando(false);
        }
    };

    // --- FUNCIÓN: PUBLICAR EN REDES SOCIALES ---
    const publicarEnRedes = async (item) => {
        const plataformas = [];
        if (redesSeleccionadas.instagram) plataformas.push('instagram');
        if (redesSeleccionadas.facebook) plataformas.push('facebook');

        if (plataformas.length === 0) {
            alert('⚠️ Selecciona al menos una plataforma.');
            return;
        }

        setPublicandoRedes(true);
        setResultadoRedes(null);

        try {
            // Construir la URL pública del contenido
            let urlContenido = item.url || 'https://expedientexgranaino.com';
            if (!item.url && item.id) {
                const seccion = (tab === 'expedientes' || tab === 'misterios_historicos' || tab === 'casos_abiertos') ? 'leer-historia' : tab === 'noticias' ? 'noticias' : tab === 'imagenes' ? 'galeria' : tab === 'videos' ? 'videos' : '';
                if (seccion === 'leer-historia') {
                    const params = tab === 'misterios_historicos' ? '?src=misterios' : tab === 'casos_abiertos' ? '?src=casos' : tab === 'expedientes' ? '?src=expedientes' : '';
                    urlContenido = `https://expedientexgranaino.com/${seccion}/${item.id}${params}`;
                } else if (seccion) {
                    urlContenido = `https://expedientexgranaino.com/${seccion}`;
                }
            }

            const res = await axios.post(`${API_BASE_URL}/api/social/publicar`, {
                titulo: item.titulo || item.nombre || 'Nuevo Expediente',
                contenido: item.contenido || item.descripcion || item.cuerpo || '',
                url: urlContenido,
                imagen_url: item.imagen_url || item.url_imagen || item.imagen || '',
                plataformas
            });

            setResultadoRedes(res.data);
        } catch (err) {
            console.error('❌ Error publicando en redes:', err);
            setResultadoRedes({
                mensaje: '❌ Error de conexión con el servidor.',
                resultados: [],
                exitosas: 0,
                fallidas: 1
            });
        } finally {
            setPublicandoRedes(false);
        }
    };

    const manejarSubidaAdmin = async (e) => {
        e.preventDefault();
        
        if (!tituloSubida) {
            setMensajeSubida("⚠️ Título requerido.");
            return;
        }

        const esTexto = tipoSubida === 'expedientes' || tipoSubida === 'casos_abiertos' || tipoSubida === 'misterios_historicos';

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

        if (tipoSubida === 'videos') {
            const esRutaLocal = (val) => val && (val.includes('\\') || val.startsWith('C:') || val.includes('/Users/'));
            if (esRutaLocal(urlCapturaSubida)) {
                setMensajeSubida("❌ ERROR: Has introducido una ruta local en la portada. Sube la portada con el selector de archivos.");
                return;
            }
            if (esRutaLocal(urlExternaAdmin)) {
                setMensajeSubida("❌ ERROR: Has introducido una ruta local en el enlace del vídeo.");
                return;
            }
        }

        const formData = new FormData();
        if (archivoSubida) formData.append('archivo', archivoSubida);
        if (urlExternaAdmin) formData.append('url_externa', urlExternaAdmin);
        formData.append('titulo', tituloSubida);
        formData.append('tipo', tipoSubida);
        if (contenidoSubida) formData.append('contenido', contenidoSubida);
        if (tipoSubida === 'casos_abiertos' || tipoSubida === 'misterios_historicos') {
            if (tituloEnSubida) formData.append('titulo_en', tituloEnSubida);
            if (contenidoEnSubida) formData.append('contenido_en', contenidoEnSubida);
        }
        if (tipoSubida === 'noticias' && editForm.fuente_url) formData.append('fuente_url', editForm.fuente_url);
        if (youtubeUrlSubida) formData.append('youtube_url', youtubeUrlSubida);
        
        // Coordenadas para Lugares, Relatos, Noticias, Vídeos, Casos y Misterios
        if (tipoSubida === 'lugares' || tipoSubida === 'expedientes' || tipoSubida === 'noticias' || tipoSubida === 'casos_abiertos' || tipoSubida === 'misterios_historicos' || tipoSubida === 'videos') {
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

        if (tipoSubida === 'videos' && urlCapturaSubida) {
            formData.append('capturas', urlCapturaSubida);
        }


        try {
            setCargando(true);
            setMensajeSubida("🛰️ Transmitiendo al búnker...");
            const resUpload = await axios.post(`${API_BASE_URL}/api/admin/admin/upload`, formData);
            const urlImagenCargada = resUpload.data?.ruta || '';
            const newRecordId = resUpload.data?.id;
            setMensajeSubida("✅ REGISTRO CLASIFICADO");

            // Subida consecutiva de la portada del vídeo si se seleccionó archivo
            if (tipoSubida === 'videos' && newRecordId && archivoCapturaSubida) {
                setMensajeSubida("🖼️ Subiendo archivo de portada...");
                const imgFormData = new FormData();
                imgFormData.append('capturas', archivoCapturaSubida);
                await axios.post(`${API_BASE_URL}/api/videos/${newRecordId}/capturas`, imgFormData);
            }

            // --- PUBLICAR EN REDES SOCIALES AUTOMÁTICAMENTE ---
            if (publicarAlSubir) {
                setMensajeSubida("✅ REGISTRO CLASIFICADO — 📡 Publicando en redes sociales...");
                try {
                    let urlContenido = 'https://expedientexgranaino.com';
                    const seccionMap = { expedientes: 'expedientes', noticias: 'noticias', imagenes: 'galeria', videos: 'videos', casos_abiertos: 'casos-abiertos' };
                    if (seccionMap[tipoSubida]) {
                        urlContenido = `https://expedientexgranaino.com/${seccionMap[tipoSubida]}`;
                    }

                    const plataformas = [];
                    if (redesSeleccionadas.instagram) plataformas.push('instagram');
                    if (redesSeleccionadas.facebook) plataformas.push('facebook');

                    if (plataformas.length > 0) {
                        const resSocial = await axios.post(`${API_BASE_URL}/api/social/publicar`, {
                            titulo: tituloSubida,
                            contenido: contenidoSubida || '',
                            url: urlContenido,
                            imagen_url: urlImagenCargada,
                            plataformas
                        });

                        if (resSocial.data.exitosas > 0) {
                            setMensajeSubida(`✅ REGISTRO CLASIFICADO + 📡 Publicado en ${resSocial.data.exitosas} red(es)`);
                        } else {
                            setMensajeSubida(`✅ REGISTRO CLASIFICADO — ⚠️ Redes: ${resSocial.data.mensaje}`);
                        }
                    }
                } catch (errSocial) {
                    console.error('⚠️ Error en publicación social post-subida:', errSocial);
                    setMensajeSubida("✅ REGISTRO CLASIFICADO — ⚠️ Fallo al publicar en redes (revisa claves .env)");
                }
            }

            setTituloSubida('');
            setTituloEnSubida('');
            setArchivoSubida(null);
            setContenidoSubida('');
            setContenidoEnSubida('');
            setUrlExternaAdmin('');
            setArchivoCapturaSubida(null);
            setUrlCapturaSubida('');
            cargarDatos();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "❌ FALLO EN LA CARGA";
            setMensajeSubida(errorMsg);
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

            {/* BANNER DE ALERTAS PENDIENTES DE REVISIÓN */}
            {((datos.expedientes || []).filter(e => e.estado === 'pendiente' || e.estado === 0).length +
              (datos.noticias || []).filter(n => n.estado === 'pendiente' || n.estado === 0).length +
              (datos.casos_abiertos || []).filter(c => c.estado === 'pendiente' || c.estado === 0).length +
              (datos.misterios_historicos || []).filter(m => m.estado === 'pendiente' || m.estado === 0).length +
              comentariosPendientes) > 0 && (
                <div style={{
                    background: 'rgba(255, 71, 87, 0.15)',
                    border: '2px solid #ff4757',
                    borderRadius: '8px',
                    padding: '18px 22px',
                    marginBottom: '20px',
                    boxShadow: '0 0 20px rgba(255, 71, 87, 0.35)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <span style={{ fontSize: '2.2rem' }}>🚨</span>
                        <div>
                            <h3 style={{ color: '#ff4757', margin: 0, fontSize: '1.2rem', fontFamily: 'Orbitron, monospace', letterSpacing: '1.5px', textShadow: '0 0 8px rgba(255, 71, 87, 0.5)' }}>
                                ALERTA DEL BÚNKER: REVISIÓN DE REGISTROS PENDIENTES
                            </h3>
                            <p style={{ color: '#eee', margin: '4px 0 0 0', fontSize: '0.85rem' }}>
                                Hay material enviado por usuarios o testigos sin revisar. Comprueba los registros para aprobarlos o descartarlos.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {(datos.expedientes || []).filter(e => e.estado === 'pendiente' || e.estado === 0).length > 0 && (
                            <button onClick={() => { setTab('expedientes'); setPaginaActual(1); }} style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                                📁 {(datos.expedientes || []).filter(e => e.estado === 'pendiente' || e.estado === 0).length} RELATOS PENDIENTES ➔
                            </button>
                        )}
                        {(datos.casos_abiertos || []).filter(c => c.estado === 'pendiente' || c.estado === 0).length > 0 && (
                            <button onClick={() => { setTab('casos_abiertos'); setPaginaActual(1); }} style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                                💀 {(datos.casos_abiertos || []).filter(c => c.estado === 'pendiente' || c.estado === 0).length} CASOS PENDIENTES ➔
                            </button>
                        )}
                        {(datos.misterios_historicos || []).filter(m => m.estado === 'pendiente' || m.estado === 0).length > 0 && (
                            <button onClick={() => { setTab('misterios_historicos'); setPaginaActual(1); }} style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                                👁️ {(datos.misterios_historicos || []).filter(m => m.estado === 'pendiente' || m.estado === 0).length} MISTERIOS PENDIENTES ➔
                            </button>
                        )}
                        {(datos.noticias || []).filter(n => n.estado === 'pendiente' || n.estado === 0).length > 0 && (
                            <button onClick={() => { setTab('noticias'); setPaginaActual(1); }} style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                                📰 {(datos.noticias || []).filter(n => n.estado === 'pendiente' || n.estado === 0).length} NOTICIAS PENDIENTES ➔
                            </button>
                        )}
                        {comentariosPendientes > 0 && (
                            <button onClick={() => { setTab('comentarios'); setPaginaActual(1); }} style={{ background: '#ff4757', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }}>
                                💬 {comentariosPendientes} COMENTARIOS PENDIENTES ➔
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="tabs-admin">
                <button key="inicio" className={tab === 'inicio' ? 'active' : ''} onClick={() => { setTab('inicio'); setPaginaActual(1); }} style={tab !== 'inicio' ? { borderColor: '#00d4ff', color: '#00d4ff' } : {}}>
                    🏠 INICIO
                </button>
                {Object.keys(datos).map(t => {
                    let label = t.toUpperCase();
                    if (t === 'imagenes') label = 'FOTOS';
                    if (t === 'noticias') label = 'NOTICIAS';
                    if (t === 'expedientes') label = 'RELATOS';
                    if (t === 'casos_abiertos') label = '💀 CASOS ABIERTOS';
                    if (t === 'misterios_historicos') label = '👁️ MISTERIOS';
                    if (t === 'archipeg') label = '💻 ARCHIPEG';
                    
            const expPendientes = (datos.expedientes || []).filter(e => e.estado === 'pendiente' || e.estado === 0).length;
            const notiPendientes = (datos.noticias || []).filter(n => n.estado === 'pendiente' || n.estado === 0).length;
            const casosPendientes = (datos.casos_abiertos || []).filter(c => c.estado === 'pendiente' || c.estado === 0).length;
            const misteriosPendientes = (datos.misterios_historicos || []).filter(m => m.estado === 'pendiente' || m.estado === 0).length;
            const usuariosPendientes = (datos.usuarios || []).filter(u => u.aprobado === 0 || u.aprobado === '0').length;
            const archipegPendientes = (datos.archipeg || []).filter(a => a.estado === 'pendiente').length;

            return (
                <button key={t} className={tab === t ? 'active' : ''} onClick={() => { setTab(t); setPaginaActual(1); }}>
                    {label}
                    {t === 'usuarios' && usuariosPendientes > 0 && <span className="badge-pendiente">{usuariosPendientes}</span>}
                    {t === 'expedientes' && expPendientes > 0 && <span className="badge-pendiente">{expPendientes}</span>}
                    {t === 'casos_abiertos' && casosPendientes > 0 && <span className="badge-pendiente">{casosPendientes}</span>}
                    {t === 'misterios_historicos' && misteriosPendientes > 0 && <span className="badge-pendiente">{misteriosPendientes}</span>}
                    {t === 'noticias' && notiPendientes > 0 && <span className="badge-pendiente">{notiPendientes}</span>}
                    {t === 'archipeg' && archipegPendientes > 0 && <span className="badge-pendiente">{archipegPendientes}</span>}
                    {t === 'comentarios' && comentariosPendientes > 0 && (
                        <span className="badge-pendiente">{comentariosPendientes}</span>
                    )}
                </button>
            );
                })}
                <button key="ruleta" className={tab === 'ruleta' ? 'active' : ''} onClick={() => { setTab('ruleta'); setPaginaActual(1); }} style={tab !== 'ruleta' ? { borderColor: '#ff0033', color: '#ff0033' } : {}}>
                    🎡 LA RULETA
                </button>
                <button className={tab === 'subir' ? 'active' : ''} onClick={() => setTab('subir')} style={{ background: '#b18904', color: 'black' }}>
                    + SUBIR
                </button>
            </div>

            {tab === 'inicio' ? (
                <div className="inicio-dashboard">
                    <div className="inicio-bienvenida">
                        <h3>📡 ESTADO DEL BÚNKER</h3>
                        <p className="inicio-fecha">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>

                    <div className="inicio-stats-grid">
                        {[
                            { icon: '👥', count: datos.usuarios.length, label: 'Agentes', color: '#00ff41' },
                            { icon: '📁', count: datos.expedientes.length, label: 'Relatos', color: '#00d4ff' },
                            { icon: '🎡', count: '100%', label: 'La Ruleta', color: '#ff0033' },
                            { icon: '🎬', count: datos.videos.length, label: 'Vídeos', color: '#ff6b6b' },
                            { icon: '📷', count: datos.imagenes.length, label: 'Fotos', color: '#ffd93d' },
                            { icon: '📰', count: datos.noticias.length, label: 'Noticias', color: '#6c5ce7' },
                            { icon: '👁️', count: datos.misterios_historicos.length, label: 'Misterios', color: '#ff00ff' },
                            { icon: '🗺️', count: datos.lugares.length, label: 'Lugares', color: '#00b894' },
                            { icon: '💀', count: datos.casos_abiertos.length, label: 'Casos', color: '#d63031' },
                            { icon: '💬', count: datos.comentarios.length, label: 'Comentarios', color: '#0984e3' },
                            { icon: '💻', count: datos.archipeg.length, label: 'ARCHIPEG', color: '#fdcb6e' }
                        ].map((stat, i) => (
                            <div key={i} className="inicio-stat-card" style={{ borderColor: stat.color + '30', color: stat.color }}>
                                <span className="inicio-stat-icon">{stat.icon}</span>
                                <span className="inicio-stat-number" style={{ color: stat.color }}>{stat.count}</span>
                                <span className="inicio-stat-label">{stat.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="inicio-promo-section">
                        <div className="inicio-promo-header">
                            <h3>🎬 GENERADOR DE VÍDEO PROMOCIONAL</h3>
                            <p>Lanza la presentación cinematográfica y graba tu pantalla para crear vídeos para redes sociales</p>
                        </div>

                        <div className="inicio-promo-actions">
                            <button className="inicio-btn-cine" onClick={() => window.open('/promo/cine.html', '_blank')}>
                                <span className="btn-cine-icon">▶</span>
                                <div>
                                    <strong>MODO CINE</strong>
                                    <small>Presentación automática para grabar</small>
                                </div>
                            </button>
                            <button className="inicio-btn-landing" onClick={() => window.open('/promo/', '_blank')}>
                                <span className="btn-cine-icon">🌐</span>
                                <div>
                                    <strong>LANDING PROMO</strong>
                                    <small>Página promocional interactiva</small>
                                </div>
                            </button>
                        </div>

                        <div className="inicio-promo-tip">
                            <span>💡</span>
                            <div>
                                <strong>¿CÓMO GRABAR EL VÍDEO?</strong>
                                <p>1. Pulsa "MODO CINE" para abrir la presentación</p>
                                <p>2. Pon la ventana en pantalla completa (F11)</p>
                                <p>3. Activa la grabación de pantalla (Win+G en Windows, o usa OBS)</p>
                                <p>4. La presentación se reproduce automáticamente con música 🎵</p>
                                <p>5. Cuando termine, para la grabación y ya tienes tu vídeo 🎉</p>
                            </div>
                        </div>

                        <div className="inicio-promo-preview">
                            <h4>📺 VISTA PREVIA DE LA LANDING</h4>
                            <div className="inicio-iframe-container">
                                <iframe src="/promo/" title="Preview promocional" loading="lazy" />
                            </div>
                        </div>
                    </div>
                </div>
            ) : tab === 'ruleta' ? (
                <div className="inicio-dashboard fade-in">
                    <div className="inicio-bienvenida" style={{ borderColor: '#ff0033' }}>
                        <h3 style={{ color: '#ff0033' }}>🎡 LA RULETA DEL BÚNKER — CENTRO DE CONTROL Y DIFUSIÓN</h3>
                        <p className="inicio-fecha">HERRAMIENTA DE EXPLORACIÓN DE CONTENIDO ALEATORIO Y MONETIZACIÓN</p>
                    </div>

                    <div className="glass-card" style={{ marginTop: '20px', padding: '25px', borderLeft: '4px solid #ff0033' }}>
                        <h4 style={{ color: '#ff0033', marginTop: 0, fontFamily: 'monospace' }}>📡 DIFUSIÓN AUTOMÁTICA EN REDES SOCIALES (TELEGRAM / META)</h4>
                        <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: '1.6' }}>
                            Publica un anuncio directo de La Ruleta del Búnker en tus canales sociales conectados (Telegram, Facebook, Instagram):
                        </p>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '15px' }}>
                            <button
                                className="btn-publicar-redes"
                                style={{ background: '#ff0033', color: '#fff', border: 'none', padding: '12px 24px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.85rem' }}
                                onClick={() => {
                                    setModalRedes({
                                        id: 'ruleta-main',
                                        titulo: '🎡 LA RULETA DEL BÚNKER — Radar de Contenido Aleatorio',
                                        contenido: '¡Gira la Ruleta del Búnker y descubre expedientes OVNI, crónica negra y misterios al azar 100% Gratis! ¿Qué expediente desclasificado te tocará hoy? 🛸',
                                        url: 'https://expedientexgranaino.com/la-ruleta',
                                        imagen_url: '/assets/ruleta_bunker.jpg'
                                    });
                                    setResultadoRedes(null);
                                    setRedesSeleccionadas({ instagram: true, facebook: true });
                                }}
                            >
                                📡 DIFUNDIR EN REDES (TELEGRAM / META)
                            </button>

                            <button
                                className="btn-accion-admin"
                                style={{ background: '#00d4ff', color: '#000', border: 'none', padding: '12px 24px', fontWeight: 'bold', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.85rem' }}
                                onClick={() => window.open('/la-ruleta', '_blank')}
                            >
                                🎡 ABRIR LA RULETA EN VIVO ➔
                            </button>
                        </div>
                    </div>

                    {/* RECURSOS Y PÓSTER PARA TIKTOK / REELS */}
                    <div className="glass-card" style={{ marginTop: '25px', padding: '25px', borderLeft: '4px solid #00ff41' }}>
                        <h4 style={{ color: '#00ff41', marginTop: 0, fontFamily: 'monospace' }}>📱 MATERIAL PROMOCIONAL VERTICAL PARA TIKTOK, REELS Y STORIES (9:16)</h4>
                        <p style={{ color: '#aaa', fontSize: '0.85rem', lineHeight: '1.6' }}>
                            Utiliza este cartel diseñado en formato vertical para tus historias o publicaciones en TikTok e Instagram:
                        </p>

                        <div style={{ display: 'flex', gap: '25px', alignItems: 'center', flexWrap: 'wrap', marginTop: '20px' }}>
                            <div style={{ width: '150px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #00ff41', boxShadow: '0 0 20px rgba(0,255,65,0.3)' }}>
                                <img src="/assets/tiktok_ruleta.jpg" alt="Póster TikTok 9:16" style={{ width: '100%', height: 'auto', display: 'block' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: '250px' }}>
                                <p style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '8px', fontFamily: 'monospace' }}>
                                    🖼️ Cartel Vertical 9:16 (Descarga Directa)
                                </p>
                                <p style={{ color: '#888', fontSize: '0.8rem', marginBottom: '15px', wordBreak: 'break-all' }}>
                                    Enlace directo: <code style={{ color: '#00ff41' }}>https://expedientexgranaino.com/assets/tiktok_ruleta.jpg</code>
                                </p>
                                <a
                                    href="/assets/tiktok_ruleta.jpg"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download="tiktok_ruleta_bunker.jpg"
                                    style={{
                                        display: 'inline-block',
                                        background: '#00ff41',
                                        color: '#000',
                                        fontWeight: 'bold',
                                        padding: '12px 24px',
                                        borderRadius: '4px',
                                        textDecoration: 'none',
                                        fontFamily: 'monospace',
                                        fontSize: '0.85rem',
                                        boxShadow: '0 0 15px rgba(0,255,65,0.4)'
                                    }}
                                >
                                    📥 DESCARGAR PÓSTER 9:16 EN ALTA RESOLUCIÓN
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            ) : tab !== 'subir' ? (
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
                                                {(tab === 'expedientes' || tab === 'casos_abiertos' || tab === 'misterios_historicos') && (
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
                                                {tab === 'misterios_historicos' && (
                                                    <div className="texto-verde" style={{fontSize: '0.75rem', maxWidth: '200px'}}>
                                                        {item.contenido?.substring(0, 80)}...
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
                                                    {(tab === 'expedientes' || tab === 'videos' || tab === 'noticias' || tab === 'imagenes' || tab === 'lugares' || tab === 'casos_abiertos' || tab === 'misterios_historicos') && (
                                                        <button className="btn-edit" onClick={() => handleEditar(item)}>EDIT</button>
                                                    )}
                                                    {esAprobado && (tab === 'expedientes' || tab === 'noticias' || tab === 'imagenes' || tab === 'videos' || tab === 'casos_abiertos' || tab === 'misterios_historicos') && (
                                                        <button 
                                                            className="btn-publicar-redes" 
                                                            onClick={() => {
                                                                setModalRedes(item);
                                                                setResultadoRedes(null);
                                                                setRedesSeleccionadas({ instagram: true, facebook: true });
                                                            }}
                                                        >
                                                            📡 REDES
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
                        <Paginacion paginaActual={paginaActual} totalPaginas={totalPaginas} onChange={setPaginaActual} storageKey="page_admin" scrollToTop={false} />
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
                                    <option value="misterios_historicos">👁️ MISTERIOS HISTÓRICOS</option>
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

                        {tipoSubida === 'expedientes' || tipoSubida === 'noticias' || tipoSubida === 'casos_abiertos' || tipoSubida === 'misterios_historicos' || tipoSubida === 'videos' ? (
                            <>
                                <div className="form-group-admin">
                                    <label>CONTENIDO / DESCRIPCIÓN:</label>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(0,255,65,0.03)', padding: '6px 10px', border: '1px solid rgba(0,255,65,0.15)', borderRadius: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-principal)', fontWeight: 'bold' }}>🔗 ENLACES DE RETENCIÓN (SEO):</span>
                                        <button 
                                            type="button" 
                                            onClick={insertarEnlaceEnSubida} 
                                            style={{ background: 'rgba(0, 255, 65, 0.1)', color: 'var(--color-principal)', border: '1px solid var(--color-principal)', padding: '4px 10px', fontSize: '0.75rem', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                                            title="Inserta un hipervínculo en pestaña nueva"
                                        >
                                            ➕ Insertar Enlace Interno
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={insertarRecomendacionEnSubida} 
                                            style={{ background: 'rgba(255, 177, 0, 0.1)', color: '#ffb100', border: '1px solid #ffb100', padding: '4px 10px', fontSize: '0.75rem', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                                            title="Inserta el bloque de recomendación al final"
                                        >
                                            📌 Recomendación Final
                                        </button>
                                    </div>
                                    <textarea 
                                        className="textarea-bunker-admin"
                                        value={contenidoSubida} 
                                        onChange={e => setContenidoSubida(e.target.value)} 
                                        placeholder="Redacta el informe..."
                                        style={{ width: '100%', minHeight: '100px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', padding: '10px' }}
                                    ></textarea>
                                </div>
                                
                                <div className="form-group-admin" style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', color: '#ff0000', fontSize: '0.8rem', marginBottom: '5px' }}>🎬 ENLACE YOUTUBE (OPCIONAL):</label>
                                    <input 
                                        type="url" value={youtubeUrlSubida} 
                                        onChange={e => setYoutubeUrlSubida(e.target.value)} 
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        style={{ width: '100%', padding: '10px', background: '#000', color: '#ff0000', border: '1px solid #333' }}
                                    />
                                </div>

                            </>
                        ) : null}

                        {tipoSubida === 'videos' ? (
                            <>
                                <div style={{ background: 'rgba(0, 212, 255, 0.05)', padding: '15px', border: '1px solid rgba(0, 212, 255, 0.2)', marginBottom: '15px', borderRadius: '5px' }}>
                                    <label style={{ display: 'block', color: '#00d4ff', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px' }}>
                                        📼 ORIGEN DEL VÍDEO (MP4 O YOUTUBE)
                                    </label>
                                    
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ fontSize: '0.75rem', color: '#ccc', display: 'block', marginBottom: '4px' }}>Opción A: Subir archivo de vídeo (MP4)</label>
                                        <input type="file" accept="video/mp4,video/*" onChange={e => setArchivoSubida(e.target.files[0])} style={{ fontSize: '0.8rem', color: '#fff' }} />
                                        {archivoSubida && <small style={{ color: '#00d4ff', display: 'block', marginTop: '4px' }}>✓ Archivo seleccionado: {archivoSubida.name}</small>}
                                    </div>

                                    <div style={{ borderTop: '1px solid #222', paddingTop: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', color: '#ccc', display: 'block', marginBottom: '4px' }}>Opción B: Enlace de YouTube o vídeo externo</label>
                                        <input 
                                            type="text" 
                                            value={urlExternaAdmin} 
                                            onChange={e => setUrlExternaAdmin(e.target.value)} 
                                            placeholder="Ej: https://www.youtube.com/watch?v=... o nombre de archivo de vídeo"
                                            style={{ width: '100%', padding: '8px', background: '#000', color: '#fff', border: '1px solid #333' }}
                                        />
                                        {urlExternaAdmin && (urlExternaAdmin.includes('\\') || urlExternaAdmin.startsWith('C:') || urlExternaAdmin.includes('/Users/')) && (
                                            <small style={{ color: '#ff4444', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                                                ⚠️ ALERTA: Has escrito una ruta de archivo local de tu ordenador. Los enlaces deben ser direcciones web.
                                            </small>
                                        )}
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255, 177, 0, 0.05)', padding: '15px', border: '1px solid rgba(255, 177, 0, 0.2)', marginBottom: '15px', borderRadius: '5px' }}>
                                    <label style={{ display: 'block', color: '#ffb100', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px' }}>
                                        🖼️ IMAGEN DE PORTADA / MINIATURA DEL VÍDEO (Captura)
                                    </label>
                                    
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ fontSize: '0.75rem', color: '#ccc', display: 'block', marginBottom: '4px' }}>Opción A: Subir imagen desde tu ordenador</label>
                                        <input type="file" accept="image/*" onChange={e => setArchivoCapturaSubida(e.target.files[0])} style={{ fontSize: '0.8rem', color: '#fff' }} />
                                        {archivoCapturaSubida && <small style={{ color: '#ffb100', display: 'block', marginTop: '4px' }}>✓ Portada seleccionada: {archivoCapturaSubida.name}</small>}
                                    </div>

                                    <div style={{ borderTop: '1px solid #222', paddingTop: '10px' }}>
                                        <label style={{ fontSize: '0.75rem', color: '#ccc', display: 'block', marginBottom: '4px' }}>Opción B: URL de la imagen de portada</label>
                                        <input 
                                            type="text" 
                                            value={urlCapturaSubida} 
                                            onChange={e => setUrlCapturaSubida(e.target.value)} 
                                            placeholder="Ej: https://expedientexgranaino.com/imagenes/mi_captura.png"
                                            style={{ width: '100%', padding: '8px', background: '#000', color: '#fff', border: '1px solid #333' }}
                                        />
                                        {urlCapturaSubida && (urlCapturaSubida.includes('\\') || urlCapturaSubida.startsWith('C:') || urlCapturaSubida.includes('/Users/')) && (
                                            <small style={{ color: '#ff4444', display: 'block', marginTop: '4px', fontWeight: 'bold' }}>
                                                ⚠️ ALERTA: Has escrito una ruta de archivo local de tu ordenador. Para usar esa imagen, selecciónala arriba en "Opción A".
                                            </small>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="form-group-admin">
                                <label>ARCHIVO ADJUNTO {(tipoSubida === 'expedientes' || tipoSubida === 'casos_abiertos' || tipoSubida === 'misterios_historicos') ? '(OPCIONAL)' : ''}:</label>
                                <input type="file" onChange={e => setArchivoSubida(e.target.files[0])} />
                            </div>
                        )}

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
                        
                        {tipoSubida !== 'videos' && (
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
                        )}
                        
                        {(tipoSubida === 'lugares' || tipoSubida === 'expedientes' || tipoSubida === 'imagenes' || tipoSubida === 'noticias' || tipoSubida === 'casos_abiertos' || tipoSubida === 'misterios_historicos' || tipoSubida === 'videos') && (
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
                        
                        {/* --- CHECKBOX: PUBLICAR EN REDES AL SUBIR --- */}
                        <div className="redes-al-subir-container">
                            <div className="redes-al-subir-toggle" onClick={() => setPublicarAlSubir(!publicarAlSubir)}>
                                <div className={`toggle-switch ${publicarAlSubir ? 'active' : ''}`}>
                                    <div className="toggle-knob"></div>
                                </div>
                                <span className="toggle-label">📡 PUBLICAR EN REDES SOCIALES AL SUBIR</span>
                            </div>
                            
                            {publicarAlSubir && (
                                <div className="redes-plataformas-subir">
                                    <label className="plataforma-check">
                                        <input 
                                            type="checkbox"
                                            id="check-instagram-subir"
                                            checked={redesSeleccionadas.instagram} 
                                            onChange={e => setRedesSeleccionadas({...redesSeleccionadas, instagram: e.target.checked})}
                                        />
                                        <span className="plataforma-icon instagram">📸</span> Instagram
                                        {estadoRedes && !estadoRedes.webhook.configurado && (
                                            <span className="plataforma-warn">⚠️ Sin webhook</span>
                                        )}
                                    </label>
                                    <label className="plataforma-check">
                                        <input 
                                            type="checkbox"
                                            id="check-facebook-subir"
                                            checked={redesSeleccionadas.facebook} 
                                            onChange={e => setRedesSeleccionadas({...redesSeleccionadas, facebook: e.target.checked})}
                                        />
                                        <span className="plataforma-icon facebook">f</span> Facebook
                                        {estadoRedes && !estadoRedes.facebook.configurado && !estadoRedes.webhook.configurado && (
                                            <span className="plataforma-warn">⚠️ Sin claves</span>
                                        )}
                                    </label>
                                    {estadoRedes && estadoRedes.webhook.configurado && (
                                        <div className="webhook-activo">🔗 Make.com activo → Instagram + Facebook</div>
                                    )}
                                    {estadoRedes && !estadoRedes.alguno_activo && (
                                        <div className="redes-aviso-config">⚠️ Configura las claves de las APIs o un webhook en el archivo .env para activar esta función</div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button type="submit" className="btn-ok-subir" style={{ marginTop: '20px' }}>
                            {publicarAlSubir ? '🚀 SUBIR AL BÚNKER + PUBLICAR EN REDES' : 'SUBIR AL BÚNKER'}
                        </button>

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

                            {(tab === 'casos_abiertos' || tab === 'misterios_historicos') && (
                                <>
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>DESCRIPCIÓN / CASO:</label>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(0,255,65,0.03)', padding: '6px 10px', border: '1px solid rgba(0,255,65,0.15)', borderRadius: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-principal)', fontWeight: 'bold' }}>🔗 ENLACES DE RETENCIÓN (SEO):</span>
                                        <button 
                                            type="button" 
                                            onClick={insertarEnlaceEnEdicion} 
                                            style={{ background: 'rgba(0, 255, 65, 0.1)', color: 'var(--color-principal)', border: '1px solid var(--color-principal)', padding: '4px 10px', fontSize: '0.75rem', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            ➕ Insertar Enlace Interno
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={insertarRecomendacionEnEdicion} 
                                            style={{ background: 'rgba(255, 177, 0, 0.1)', color: '#ffb100', border: '1px solid #ffb100', padding: '4px 10px', fontSize: '0.75rem', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            📌 Recomendación Final
                                        </button>
                                    </div>
                                    <textarea 
                                        value={editForm.contenido} 
                                        onChange={e => setEditForm({...editForm, contenido: e.target.value})} 
                                        style={{ width: '100%', minHeight: '150px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', padding: '10px', marginBottom: '15px' }}
                                    />

                                    <label style={{ display: 'block', color: '#00d4ff', fontSize: '0.8rem', marginBottom: '5px' }}>🔗 URL FUENTE ORIGINAL (OPCIONAL):</label>
                                    <input 
                                        type="url" value={editForm.fuente_url} 
                                        onChange={e => setEditForm({...editForm, fuente_url: e.target.value})} 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: '#00d4ff', border: '1px solid #333', marginBottom: '15px' }}
                                    />

                                    <label style={{ display: 'block', color: '#ff0000', fontSize: '0.8rem', marginBottom: '5px' }}>🎬 ENLACE YOUTUBE (OPCIONAL):</label>
                                    <input 
                                        type="url" value={editForm.youtube_url} 
                                        onChange={e => setEditForm({...editForm, youtube_url: e.target.value})} 
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        style={{ width: '100%', padding: '10px', background: '#000', color: '#ff0000', border: '1px solid #333', marginBottom: '15px' }}
                                    />

                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>CAMBIAR IMAGEN DE PORTADA (OPCIONAL):</label>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={e => setArchivoEdit(e.target.files[0])} 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', marginBottom: '15px' }}
                                    />

                                    {/* GEOLOCALIZACIÓN ESTRATÉGICA */}
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
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(0,255,65,0.03)', padding: '6px 10px', border: '1px solid rgba(0,255,65,0.15)', borderRadius: '4px' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-principal)', fontWeight: 'bold' }}>🔗 ENLACES DE RETENCIÓN (SEO):</span>
                                        <button 
                                            type="button" 
                                            onClick={insertarEnlaceEnEdicion} 
                                            style={{ background: 'rgba(0, 255, 65, 0.1)', color: 'var(--color-principal)', border: '1px solid var(--color-principal)', padding: '4px 10px', fontSize: '0.75rem', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            ➕ Insertar Enlace Interno
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={insertarRecomendacionEnEdicion} 
                                            style={{ background: 'rgba(255, 177, 0, 0.1)', color: '#ffb100', border: '1px solid #ffb100', padding: '4px 10px', fontSize: '0.75rem', borderRadius: '3px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >
                                            📌 Recomendación Final
                                        </button>
                                    </div>
                                    <textarea 
                                        value={editForm.contenido} 
                                        onChange={e => setEditForm({...editForm, contenido: e.target.value})} 
                                        style={{ width: '100%', minHeight: '150px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', padding: '10px', marginBottom: '15px' }}
                                    />
                                    
                                    <label style={{ display: 'block', color: '#00d4ff', fontSize: '0.8rem', marginBottom: '5px' }}>🔗 URL FUENTE ORIGINAL (OPCIONAL):</label>
                                    <input 
                                        type="url" value={editForm.fuente_url} 
                                        onChange={e => setEditForm({...editForm, fuente_url: e.target.value})} 
                                        style={{ width: '100%', padding: '10px', background: '#000', color: '#00d4ff', border: '1px solid #333', marginBottom: '15px' }}
                                    />

                                    <label style={{ display: 'block', color: '#ff0000', fontSize: '0.8rem', marginBottom: '5px' }}>🎬 ENLACE YOUTUBE (OPCIONAL):</label>
                                    <input 
                                        type="url" value={editForm.youtube_url} 
                                        onChange={e => setEditForm({...editForm, youtube_url: e.target.value})} 
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        style={{ width: '100%', padding: '10px', background: '#000', color: '#ff0000', border: '1px solid #333', marginBottom: '15px' }}
                                    />

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
                                    {/* SECCIÓN 1: VÍDEO */}
                                    <div style={{ background: 'rgba(0, 212, 255, 0.05)', padding: '15px', border: '1px solid rgba(0, 212, 255, 0.2)', marginBottom: '20px', borderRadius: '5px' }}>
                                        <label style={{ display: 'block', color: '#00d4ff', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>
                                            📼 ORIGEN DEL VÍDEO (ARCHIVO O YOUTUBE):
                                        </label>
                                        <input 
                                            type="text" value={editForm.url} 
                                            onChange={e => setEditForm({...editForm, url: e.target.value})} 
                                            placeholder="Enlace de YouTube o nombre de archivo de vídeo (ej: 1.mp4)"
                                            style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: '1px solid #333', marginBottom: '5px' }}
                                        />
                                        <small style={{ display: 'block', color: '#888', fontSize: '0.7rem', marginBottom: '5px' }}>
                                            Especifica el enlace de YouTube o el nombre del archivo MP4 que se reproducirá en el búnker.
                                        </small>
                                        {editForm.url && (editForm.url.includes('\\') || editForm.url.startsWith('C:') || editForm.url.includes('/Users/')) && (
                                            <div style={{ background: 'rgba(255, 0, 0, 0.15)', border: '1px solid #ff4444', padding: '8px', marginTop: '8px', color: '#ff4444', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                ⚠️ ERROR: Has escrito una ruta local (`{editForm.url}`). Las rutas locales de tu disco duro no funcionarán. Debes usar enlaces de Internet o nombres de archivos subidos.
                                            </div>
                                        )}
                                    </div>

                                    {/* SECCIÓN 2: DESCRIPCIÓN */}
                                    <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px', fontWeight: 'bold' }}>
                                        📝 CONTENIDO / DESCRIPCIÓN DEL VÍDEO:
                                    </label>
                                    <textarea 
                                        value={editForm.contenido} 
                                        onChange={e => setEditForm({...editForm, contenido: e.target.value})} 
                                        style={{ width: '100%', minHeight: '100px', background: '#000', color: 'var(--color-principal)', border: '1px solid #333', padding: '10px', marginBottom: '20px' }}
                                    />

                                    {/* SECCIÓN 3: PORTADA / MINIATURA */}
                                    <div style={{ background: 'rgba(255, 177, 0, 0.05)', padding: '15px', border: '1px solid rgba(255, 177, 0, 0.2)', marginBottom: '20px', borderRadius: '5px' }}>
                                        <label style={{ display: 'block', color: '#ffb100', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px' }}>
                                            🖼️ PORTADA / MINIATURA REPRESENTATIVA (CAPTURA):
                                        </label>
                                        
                                        <textarea 
                                            value={editForm.capturas} 
                                            onChange={e => setEditForm({...editForm, capturas: e.target.value})} 
                                            placeholder="Enlace o dirección web de la imagen de portada..."
                                            style={{ width: '100%', minHeight: '60px', background: '#000', color: '#fff', border: '1px solid #333', padding: '10px', marginBottom: '10px' }}
                                        />
                                        
                                        {editForm.capturas && (editForm.capturas.includes('\\') || editForm.capturas.startsWith('C:') || editForm.capturas.includes('/Users/')) && (
                                            <div style={{ background: 'rgba(255, 0, 0, 0.2)', border: '1px solid #ff4444', padding: '10px', marginBottom: '15px', color: '#ff4444', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                ⚠️ ATENCIÓN: Has escrito una ruta local de tu ordenador (`{editForm.capturas}`). 
                                                Las rutas locales NO se cargan en internet. Para colocar esta imagen, usa el botón de abajo "SUBIR Y APLICAR PORTADA" para subir el archivo.
                                            </div>
                                        )}

                                        <div style={{ padding: '12px', background: 'rgba(0,0,0,0.5)', border: '1px dashed #555', borderRadius: '4px' }}>
                                            <label style={{ display: 'block', color: '#ffb100', fontSize: '0.75rem', marginBottom: '8px', fontWeight: 'bold' }}>
                                                ⚙️ SUBIR PORTADA DESDE EL ORDENADOR:
                                            </label>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={e => setArchivosCapturas(e.target.files)} 
                                                style={{ fontSize: '0.75rem', color: '#ccc', marginBottom: '10px', display: 'block' }} 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={subirCapturasAdicionales} 
                                                style={{ padding: '8px 15px', fontSize: '0.75rem', background: '#ffb100', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '3px' }}
                                            >
                                                SUBIR Y APLICAR PORTADA
                                            </button>
                                        </div>
                                    </div>
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

                                    <label style={{ display: 'block', color: '#ff0000', fontSize: '0.8rem', marginBottom: '5px' }}>🎬 ENLACE YOUTUBE (OPCIONAL):</label>
                                    <input 
                                        type="url" value={editForm.youtube_url} 
                                        onChange={e => setEditForm({...editForm, youtube_url: e.target.value})} 
                                        placeholder="https://www.youtube.com/watch?v=..."
                                        style={{ width: '100%', padding: '10px', background: '#000', color: '#ff0000', border: '1px solid #333', marginBottom: '15px' }}
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

                            {(tab === 'expedientes' || tab === 'noticias' || tab === 'misterios_historicos' || tab === 'casos_abiertos') && (
                                <div style={{ background: 'rgba(255,153,0,0.05)', padding: '15px', marginBottom: '20px', border: '1px solid #ff9900' }}>
                                    <label style={{ display: 'block', color: '#ff9900', fontSize: '0.8rem', marginBottom: '5px', fontWeight: 'bold' }}>🛒 CÓDIGO MÁGICO DE AMAZON (JSON)</label>
                                    <p style={{ fontSize: '0.7rem', color: '#888', marginBottom: '10px' }}>Pega aquí el bloque de código que te paso por el chat para recomendar libros.</p>
                                    <textarea 
                                        value={amazonJson} 
                                        onChange={e => setAmazonJson(e.target.value)} 
                                        placeholder='{\n  "banner": { ... },\n  "bibliografia": [ ... ]\n}'
                                        style={{ width: '100%', minHeight: '150px', background: '#050505', color: '#ff9900', border: '1px solid #333', padding: '10px', fontFamily: 'monospace', fontSize: '0.8rem' }}
                                    />
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                                <button 
                                    type="button" 
                                    onClick={() => setItemParaEditar(null)}
                                    style={{ flex: '0 0 auto', padding: '15px 20px', background: 'transparent', color: '#888', border: '1px solid #444', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', letterSpacing: '1px' }}
                                >
                                    ← VOLVER
                                </button>
                                <button type="submit" className="btn-ok" style={{ flex: 1, padding: '15px' }}>GUARDAR CAMBIOS EN EL ARCHIVO</button>
                            </div>
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

            {/* ========== MODAL DE PUBLICACIÓN EN REDES SOCIALES ========== */}
            {modalRedes && (
                <div className="modal-admin-overlay" onClick={() => { if (!publicandoRedes) { setModalRedes(null); setResultadoRedes(null); } }}>
                    <div className="modal-redes-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-redes-header">
                            <h3>📡 PUBLICAR EN REDES SOCIALES</h3>
                            {!publicandoRedes && (
                                <button className="btn-cerrar-modal" onClick={() => { setModalRedes(null); setResultadoRedes(null); }}>X</button>
                            )}
                        </div>

                        <div className="modal-redes-body">
                            {/* PREVISUALIZACIÓN DEL CONTENIDO */}
                            <div className="redes-preview">
                                <div className="redes-preview-titulo">
                                    🛸 {(modalRedes.titulo || modalRedes.nombre || 'Sin título').toUpperCase()}
                                </div>
                                <div className="redes-preview-contenido">
                                    {(modalRedes.contenido || modalRedes.descripcion || modalRedes.cuerpo || '').substring(0, 150)}
                                    {(modalRedes.contenido || modalRedes.descripcion || modalRedes.cuerpo || '').length > 150 ? '...' : ''}
                                </div>
                                <div className="redes-preview-hashtags">
                                    #Granada #Misterio #ExpedienteX #OVNI #Paranormal
                                </div>
                            </div>

                            {/* SELECCIÓN DE PLATAFORMAS */}
                            {!resultadoRedes && (
                                <div className="redes-seleccion">
                                    <p className="redes-seleccion-titulo">Selecciona las plataformas:</p>
                                    <label className="plataforma-check-modal">
                                        <input 
                                            type="checkbox"
                                            id="check-instagram-modal"
                                            checked={redesSeleccionadas.instagram} 
                                            onChange={e => setRedesSeleccionadas({...redesSeleccionadas, instagram: e.target.checked})}
                                            disabled={publicandoRedes}
                                        />
                                        <span className="plataforma-icon-lg instagram">📸</span>
                                        <div>
                                            <strong>Instagram</strong>
                                            {estadoRedes && (
                                                <small className={estadoRedes.webhook.configurado ? 'cfg-ok' : 'cfg-warn'}>
                                                    {estadoRedes.webhook.configurado ? '🔗 Vía Make.com' : '⚠️ Sin webhook'}
                                                </small>
                                            )}
                                        </div>
                                    </label>
                                    <label className="plataforma-check-modal">
                                        <input 
                                            type="checkbox"
                                            id="check-facebook-modal"
                                            checked={redesSeleccionadas.facebook} 
                                            onChange={e => setRedesSeleccionadas({...redesSeleccionadas, facebook: e.target.checked})}
                                            disabled={publicandoRedes}
                                        />
                                        <span className="plataforma-icon-lg facebook">f</span>
                                        <div>
                                            <strong>Facebook</strong>
                                            {estadoRedes && (
                                                <small className={estadoRedes.facebook.configurado || estadoRedes.webhook.configurado ? 'cfg-ok' : 'cfg-warn'}>
                                                    {estadoRedes.facebook.configurado ? '✅ API Directa' : estadoRedes.webhook.configurado ? '🔗 Vía Make.com' : '⚠️ Sin configurar'}
                                                </small>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            )}

                            {/* BOTÓN DE PUBLICAR */}
                            {!resultadoRedes && (
                                <button 
                                    className="btn-lanzar-redes" 
                                    onClick={() => publicarEnRedes(modalRedes)}
                                    disabled={publicandoRedes || (!redesSeleccionadas.instagram && !redesSeleccionadas.facebook)}
                                >
                                    {publicandoRedes ? (
                                        <><span className="spinner-redes"></span> TRANSMITIENDO...</>
                                    ) : (
                                        '🚀 LANZAR PUBLICACIÓN'
                                    )}
                                </button>
                            )}

                            {/* RESULTADOS */}
                            {resultadoRedes && (
                                <div className="redes-resultados">
                                    <div className={`redes-resultado-header ${resultadoRedes.exitosas > 0 ? 'exito' : 'fallo'}`}>
                                        {resultadoRedes.exitosas > 0 ? '✅' : '⚠️'} {resultadoRedes.mensaje}
                                    </div>
                                    {resultadoRedes.resultados && resultadoRedes.resultados.map((r, i) => (
                                        <div key={i} className={`redes-resultado-item ${r.exito ? 'ok' : 'fail'}`}>
                                            <span className="resultado-plataforma">
                                                {r.plataforma === 'twitter' ? '𝕏' : r.plataforma === 'facebook' ? 'f' : '🔗'}
                                            </span>
                                            <span className="resultado-texto">
                                                {r.exito ? r.mensaje : r.error}
                                            </span>
                                        </div>
                                    ))}
                                    <button className="btn-cerrar-resultados" onClick={() => { setModalRedes(null); setResultadoRedes(null); }}>
                                        CERRAR
                                    </button>
                                </div>
                            )}
                        </div>
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
