import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { renderizarTextoConMedios } from '../utils/renderMedios';
import API_BASE_URL from '../config';
import AdSlot from './AdSlot';
import { useLanguage } from '../context/LanguageContext';
import { safeLocalStorage } from '../utils/storage';
import './expedientes.css';
import './lecturahistoria.css';

// ==========================================
// COMPONENTES DEL SISTEMA DE AFILIADOS AMAZON
// ==========================================

const AmazonBanner = ({ titulo, descripcion, link }) => (
    <a href={link} target="_blank" rel="noopener noreferrer" className="amazon-banner" style={{marginBottom: '20px'}}>
        <div className="amazon-banner-icon">📖</div>
        <div className="amazon-banner-content">
            <h4 className="amazon-banner-title">{titulo}</h4>
            <p className="amazon-banner-desc">{descripcion}</p>
        </div>
        <div className="amazon-banner-btn">VER EN AMAZON</div>
    </a>
);

const AmazonBibliography = ({ libros, tituloSeccion }) => {
    if (!libros || libros.length === 0) return null;
    return (
        <div className="amazon-bibliography-section fade-in" style={{marginTop: '30px'}}>
            <div className="amazon-bibliography-header">
                📚 <span>{tituloSeccion || "PARA SABER MÁS (BIBLIOGRAFÍA)"}</span>
            </div>
            <div className="amazon-bibliography-grid">
                {libros.map((libro, index) => (
                    <a key={index} href={libro.link} target="_blank" rel="noopener noreferrer" className="amazon-book-card">
                        <div className="amazon-book-cover-container">
                            <img src={libro.imagen_url} alt={libro.titulo} className="amazon-book-cover" />
                        </div>
                        <div className="amazon-book-info">
                            <div>
                                <h5 className="amazon-book-title">{libro.titulo}</h5>
                                <p className="amazon-book-author">{libro.autor}</p>
                            </div>
                            <div className="amazon-book-btn">🛒 COMPRAR EN AMAZON</div>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    );
};

const Expedientes = () => {
    const { language, t, forceTranslationUpdate } = useLanguage();
    const [busqueda, setBusqueda] = useState('');
    const [filtroActivo, setFiltroActivo] = useState('todos');
    const [tipoRegistro, setTipoRegistro] = useState('agente');
    const [datos, setDatos] = useState([]);
    const [relatoAbierto, setRelatoAbierto] = useState(null);
    const navigate = useNavigate();
    const [paginaActual, setPaginaActual] = useState(1);
    const expedientesPorPagina = 9;
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [nuevoContenido, setNuevoContenido] = useState('');
    const [latitud, setLatitud] = useState('');
    const [longitud, setLongitud] = useState('');
    const [busquedaLugar, setBusquedaLugar] = useState('');
    const [cargando, setCargando] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const [amazonConfig, setAmazonConfig] = useState(null);
    const [amazonKeys, setAmazonKeys] = useState(new Set());

    const [userAuth, setUserAuth] = useState(null);

    const isAdmin = userAuth && (userAuth.rol === 'admin' || userAuth.email === 'archipegv2@gmail.com');

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const sesion = safeLocalStorage.getItem('agente_sesion');
        if (sesion) setUserAuth(JSON.parse(sesion));

        // Cargar claves de Amazon
        axios.get(`${API_BASE_URL}/api/amazon-keys`).then(res => {
            if (Array.isArray(res.data)) {
                setAmazonKeys(new Set(res.data));
            }
        }).catch(() => {});
    }, []);

    useEffect(() => {
        if (isAdmin) {
            setTipoRegistro('jefe');
        } else {
            setTipoRegistro('agente');
        }
    }, [isAdmin]);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, filtroActivo]);

    const cargarDatos = useCallback(async () => {
        setCargando(true);
        try {
            const [resAgentes, resJefe] = await Promise.all([
                axios.get(`${API_BASE_URL}/api/expedientes/expedientes-publicos`),
                axios.get(`${API_BASE_URL}/api/expedientes/relatos-admin-publicos`)
            ]);

            const agentesData = Array.isArray(resAgentes.data) ? resAgentes.data : [];
            const jefeData = Array.isArray(resJefe.data) ? resJefe.data : [];

            // Combinar todos los relatos
            const todos = [...agentesData, ...jefeData];

            // Ordenarlos por fecha descendente
            todos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

            setDatos(todos);
        } catch (err) {
            console.error("❌ Error en la aduana de expedientes:", err);
            setDatos([]);
        } finally {
            setCargando(false);
            if (forceTranslationUpdate) forceTranslationUpdate();
        }
    }, [forceTranslationUpdate]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // Detener Robocop al cerrar el modal y limpiar amazonConfig
    useEffect(() => {
        if (!relatoAbierto) {
            setAmazonConfig(null);
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        } else {
            // Fetch Amazon config
            const itemKey = `exp-${relatoAbierto.id}`;
            axios.get(`${API_BASE_URL}/api/amazon/${itemKey}`).then(res => {
                if (res.data) setAmazonConfig(res.data);
            }).catch(e => console.error("Error amazon config:", e));
        }
    }, [relatoAbierto]);

    // Traducción automática al vuelo en inglés / restauración en español para relatoAbierto
    useEffect(() => {
        if (relatoAbierto) {
            if (language === 'en') {
                const alreadyTranslated = relatoAbierto.titulo_en || relatoAbierto.contenido_en || (relatoAbierto._translatedLanguage === 'en');
                if (!alreadyTranslated) {
                    (async () => {
                        try {
                            const texto = relatoAbierto.contenido || "";
                            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(texto)}`);
                            const data = await res.json();
                            const traducido = data[0].map(x => x[0]).join("");
                            
                            let tituloTraducido = relatoAbierto.titulo;
                            if (relatoAbierto.titulo) {
                                const resTitulo = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(relatoAbierto.titulo)}`);
                                const dataTitulo = await resTitulo.json();
                                tituloTraducido = dataTitulo[0].map(x => x[0]).join("");
                            }

                            setRelatoAbierto(prev => {
                                if (prev && prev.id === relatoAbierto.id) {
                                    return { 
                                        ...prev, 
                                        contenido: traducido, 
                                        titulo: tituloTraducido,
                                        _translatedLanguage: 'en'
                                    };
                                }
                                return prev;
                            });
                        } catch (err) {
                            console.error("Auto translation error for relato:", err);
                        }
                    })();
                }
            } else if (language === 'es') {
                const relatoOriginal = datos.find(d => d.id === relatoAbierto.id);
                if (relatoOriginal) {
                    setRelatoAbierto(relatoOriginal);
                }
            }
        }
    }, [relatoAbierto?.id, language, datos]);

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
        formData.append('tipo', tipoRegistro);

        const fileInput = document.getElementById('archivo-expediente');
        if (fileInput && fileInput.files[0]) {
            formData.append('imagen', fileInput.files[0]);
        }

        try {
            await axios.post(`${API_BASE_URL}/api/expedientes/subir-expediente`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("🚀 " + t('expUpload'));
            setNuevoTitulo('');
            setNuevoContenido('');
            setLatitud('');
            setLongitud('');
            if (fileInput) fileInput.value = "";
            cargarDatos();
        } catch (err) {
            console.error("Error al subir expediente:", err);
            alert("❌ " + t('errorFallen'));
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
        const texto = `${t('expShareText')} "${relatoAbierto.titulo?.toUpperCase()}" @PEPE1318057 @MUFON #UFO #Granada #ExpedienteXGranaino`;

        // Prioridad 1: Web Share API (Móviles)
        if (navigator.share) {
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
        if (red === 'whatsapp') {
            link = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto + ' ' + url)}`;
        } else if (red === 'facebook') {
            link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        } else if (red === 'twitter') {
            link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
        }

        if (link) {
            window.open(link, '_blank');
        }
    };

    // Filtrado por buscador y píldoras
    const datosFiltrados = datos.filter(item => {
        // Filtro por tipo (píldoras)
        if (filtroActivo === 'jefe' && item.tipo !== 'jefe') return false;
        if (filtroActivo === 'agente' && item.tipo === 'jefe') return false;

        // Filtro por búsqueda
        if (busqueda.trim() !== '') {
            const query = busqueda.toLowerCase();
            const titulo = (item.titulo || '').toLowerCase();
            const contenido = (item.contenido || '').toLowerCase();
            const autor = (item.usuario_nombre || '').toLowerCase();
            return titulo.includes(query) || contenido.includes(query) || autor.includes(query);
        }

        return true;
    });

    // Conteos para píldoras
    const countTodos = datos.length;
    const countJefe = datos.filter(d => d.tipo === 'jefe').length;
    const countAgentes = datos.filter(d => d.tipo !== 'jefe').length;

    // Lógica de Paginación
    const indexOfLastExp = paginaActual * expedientesPorPagina;
    const indexOfFirstExp = indexOfLastExp - expedientesPorPagina;
    const expedientesActuales = datosFiltrados.slice(indexOfFirstExp, indexOfLastExp);
    const totalPaginas = Math.ceil(datosFiltrados.length / expedientesPorPagina);

    return (
        <div className="experiencias-page">
            <header className="header-central">
                <h1 className="titulo-principal">{t('expTitle')}</h1>
            </header>

            <div className="advertencia-expedientes">
                <p>{t('expProtocol')}</p>
            </div>

            {/* BUSCADOR DE EXPEDIENTES FUTURISTA */}
            <div className="buscador-expedientes-container">
                <div className="buscador-wrapper">
                    <span className="buscador-icono">🔍</span>
                    <input
                        type="text"
                        className="input-buscador-neon"
                        placeholder={t('expSearchPlaceholder')}
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                    {busqueda && (
                        <button className="btn-limpiar-busqueda" onClick={() => setBusqueda('')}>×</button>
                    )}
                </div>
            </div>

            {/* PÍLDORAS DE FILTRADO DINÁMICO */}
            <div className="filtros-expedientes-pills">
                <button
                    className={`pill-filtro ${filtroActivo === 'todos' ? 'active' : ''}`}
                    onClick={() => setFiltroActivo('todos')}
                >
                    {t('expFilterAll')} <span className="pill-count">{countTodos}</span>
                </button>
                <button
                    className={`pill-filtro pill-admin ${filtroActivo === 'jefe' ? 'active' : ''}`}
                    onClick={() => setFiltroActivo('jefe')}
                >
                    {t('expFilterAdmin')} <span className="pill-count">{countJefe}</span>
                </button>
                <button
                    className={`pill-filtro ${filtroActivo === 'agente' ? 'active' : ''}`}
                    onClick={() => setFiltroActivo('agente')}
                >
                    {t('expFilterAgent')} <span className="pill-count">{countAgentes}</span>
                </button>
            </div>

            <div className={`tabla-container-pro ${filtroActivo === 'jefe' ? 'admin-border' : ''}`}>
                {cargando ? (
                    <div className="cargando-expedientes">
                        <div className="scanner-line"></div>
                        <p>{t('expDecrypt')}</p>
                    </div>
                ) : (
                    <>
                        <div className="grid-expedientes">
                            {expedientesActuales.length > 0 ? (
                                expedientesActuales.map(item => (
                                    <div key={item.id} className="card-expediente-mobile" onClick={() => navigate(`/leer-historia/${item.id}?src=expedientes`)}>
                                        {item.imagen_url && (
                                            <div className="card-img-container" style={{ position: 'relative' }}>
                                                <img
                                                    src={item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`}
                                                    alt="evidencia"
                                                />
                                                
                                                {/* BADGE AMAZON */}
                                                {(amazonKeys.has(`exp-${item.id}`) || amazonKeys.has(`expedientes-${item.id}`)) && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        left: '10px',
                                                        background: 'linear-gradient(135deg,#ff9900,#e47911)',
                                                        color: '#111',
                                                        fontWeight: '900',
                                                        fontSize: '0.65rem',
                                                        fontFamily: 'monospace',
                                                        letterSpacing: '0.5px',
                                                        padding: '4px 8px',
                                                        borderRadius: '3px',
                                                        boxShadow: '0 0 10px rgba(255,153,0,0.8)',
                                                        pointerEvents: 'none',
                                                        zIndex: 10,
                                                        textTransform: 'uppercase'
                                                    }}>
                                                        📚 {language === 'en' ? 'AMAZON BOOK' : 'LIBRO RECOMENDADO'}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="card-body-mobile">
                                            <span className="card-tag">{item.tipo === 'jefe' ? '🛡️ JEFE' : `👤 ${t('accessLevelAgent')}`}</span>
                                            <h3 className="card-title-mobile">{item.titulo?.toUpperCase()}</h3>

                                            <div style={{ marginBottom: '15px', color: '#00d4ff', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                                                📍 {item.latitud && item.latitud !== 0 ? `${item.latitud}, ${item.longitud}` : 'ARCHIVO CENTRAL'}
                                            </div>

                                            <div className="card-footer-mobile">
                                                <div className="relevancia-mini" onClick={(e) => aumentarRelevancia(e, item.id)}>
                                                    ⭐ <span className="rel-count">{item.relevancia || 0}</span>
                                                </div>
                                                <small>{item.usuario_nombre || 'ANÓNIMO'}</small>
                                                <button className="btn-leer-pro">{t('expOpen')}</button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="no-datos">{t('expNoData')}</p>
                            )}
                        </div>

                        {totalPaginas > 1 && (
                            <div className="paginacion-expedientes">
                                <button disabled={paginaActual === 1} onClick={() => { setPaginaActual(p => p - 1); window.scrollTo(0, 0); }}>ATRÁS</button>
                                <span>PÁG {paginaActual} / {totalPaginas}</span>
                                <button disabled={paginaActual === totalPaginas} onClick={() => { setPaginaActual(p => p + 1); window.scrollTo(0, 0); }}>SIGUIENTE</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Formulario visible para cualquier agente verificado */}
            {userAuth && (
                <div className="contenedor-envio-expediente">
                    <div style={{ background: 'rgba(255,177,0,0.1)', border: '1px solid #ffb100', padding: '15px', marginBottom: '20px', borderRadius: '5px', textAlign: 'center' }}>
                        <p style={{ color: '#ffb100', fontSize: '0.8rem', fontFamily: 'monospace', margin: 0 }}>
                            {t('expControlArchive')}
                        </p>
                    </div>
                    <h2 className="titulo-neon-p">
                        {tipoRegistro === 'jefe' ? t('expWriteAdmin') : t('expWriteReport')}
                    </h2>
                    <form onSubmit={enviarExpediente} className="form-expediente">
                        {/* Selector para administradores */}
                        {isAdmin && (
                            <div className="selector-tipo-registro" style={{ marginBottom: '20px', background: 'rgba(0, 212, 255, 0.05)', padding: '15px', borderRadius: '6px', border: '1px dashed rgba(0, 212, 255, 0.3)' }}>
                                <label style={{ color: 'var(--color-principal)', fontSize: '0.75rem', display: 'block', marginBottom: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                                    📡 RANGO DE PUBLICACIÓN (ALTO MANDO DETECTADO):
                                </label>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <label style={{ color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="tipo_registro"
                                            value="agente"
                                            checked={tipoRegistro === 'agente'}
                                            onChange={() => setTipoRegistro('agente')}
                                            style={{ cursor: 'pointer', accentColor: 'var(--color-principal)' }}
                                        />
                                        👤 {t('expFilterAgent')}
                                    </label>
                                    <label style={{ color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="tipo_registro"
                                            value="jefe"
                                            checked={tipoRegistro === 'jefe'}
                                            onChange={() => setTipoRegistro('jefe')}
                                            style={{ cursor: 'pointer', accentColor: 'var(--color-principal)' }}
                                        />
                                        🛡️ {t('expFilterAdmin')}
                                    </label>
                                </div>
                            </div>
                        )}

                        <input
                            type="text"
                            className="input-bunker-exp"
                            placeholder={`${t('findingTitle')}...`}
                            value={nuevoTitulo}
                            onChange={(e) => setNuevoTitulo(e.target.value)}
                            required
                        />
                        <textarea
                            className="textarea-bunker-exp"
                            placeholder={`${t('newsDesc')}...`}
                            value={nuevoContenido}
                            onChange={(e) => setNuevoContenido(e.target.value)}
                            required
                        ></textarea>

                        {/* BUSCADOR DE COORDENADAS */}
                        <div style={{ background: 'rgba(0,255,65,0.05)', padding: '15px', marginBottom: '20px', border: '1px solid #222' }}>
                            <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>{t('expRadarSearch')}</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    value={busquedaLugar}
                                    onChange={e => setBusquedaLugar(e.target.value)}
                                    placeholder={t('newsLocationPlaceholder')}
                                    className="input-bunker-exp"
                                    style={{ flex: 1, marginBottom: 0 }}
                                />
                                <button type="button" onClick={buscarCoordenadas} style={{ padding: '10px', background: 'var(--color-principal)', color: '#000', border: 'none', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {t('newsSearch')}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'end', marginBottom: '15px' }}>
                            <div>
                                <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem' }}>{t('latLong')}</label>
                                <input type="number" step="any" className="input-bunker-exp" value={latitud} onChange={e => setLatitud(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem' }}>{t('latLong')}</label>
                                <input type="number" step="any" className="input-bunker-exp" value={longitud} onChange={e => setLongitud(e.target.value)} />
                            </div>
                            <button type="button" onClick={obtenerUbicacion} style={{
                                padding: '10px', background: 'transparent', border: '1px solid var(--color-principal)', color: 'var(--color-principal)',
                                fontFamily: 'monospace', fontSize: '0.65rem', cursor: 'pointer', marginBottom: '10px'
                            }}>
                                {t('expPosicion')}
                            </button>
                        </div>

                        <div className="form-group-exp">
                            <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem', display: 'block', marginBottom: '5px' }}>IMAGEN DE EVIDENCIA (OPCIONAL)</label>
                            <input type="file" id="archivo-expediente" className="input-file-exp" style={{ color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '15px' }} />
                        </div>

                        <button type="submit" className="btn-enviar-expediente">
                            {tipoRegistro === 'jefe' ? t('expPublish') : t('expUpload')}
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
                            <div className="img-relato-full" style={{ position: 'relative' }}>
                                {relatoAbierto.latitud && relatoAbierto.longitud && parseFloat(relatoAbierto.latitud) !== 0 && (
                                    <button
                                        onClick={() => navigate('/lugares', { state: { lat: relatoAbierto.latitud, lng: relatoAbierto.longitud, noticiaId: `exp-${relatoAbierto.id}` } })}
                                        style={{
                                            position: 'absolute',
                                            top: '15px',
                                            right: '15px',
                                            zIndex: 20,
                                            background: 'rgba(0,255,65,0.9)',
                                            color: '#000',
                                            border: 'none',
                                            padding: '8px 12px',
                                            borderRadius: '4px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            boxShadow: '0 0 15px rgba(0,255,65,0.5)',
                                            fontFamily: 'monospace',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        {t('expViewRadar')}
                                    </button>
                                )}
                                <img
                                    src={relatoAbierto.imagen_url.startsWith('http') ? relatoAbierto.imagen_url : `${API_BASE_URL}/imagenes/${relatoAbierto.imagen_url}`}
                                    alt="evidencia"
                                />
                            </div>
                        )}

                        <div className="info-meta">
                            <span>{t('expOrigin')}: {relatoAbierto.usuario_nombre || 'ADMINISTRADOR'}</span>
                            <span>COORD: {relatoAbierto.latitud || '0'}, {relatoAbierto.longitud || '0'}</span>
                        </div>

                        {/* BOTÓN ROBOCOP (TTS) */}
                        <div style={{ marginTop: language === 'en' ? '0' : '15px', textAlign: 'center' }}>
                            <button
                                onClick={() => {
                                    if (!window.speechSynthesis) {
                                        alert("🔊 El sistema de síntesis de voz no está disponible en este navegador o dispositivo.");
                                        return;
                                    }
                                    if (window.speechSynthesis.speaking) {
                                        window.speechSynthesis.cancel();
                                    } else {
                                        // 1. Quitar HTML, 2. Quitar Emojis, 3. Limpiar espacios
                                        const textoLimpio = relatoAbierto.contenido
                                            .replace(/<[^>]*>?/gm, '')
                                            .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
                                            .replace(/\s+/g, ' ').trim();

                                        const ut = new SpeechSynthesisUtterance(textoLimpio);
                                        ut.lang = language === 'en' ? 'en-US' : 'es-ES';

                                        // Ajustes de voz de misterio: optimizados para que no distorsione en móviles
                                        ut.rate = 0.95; // Velocidad natural para que el procesador del móvil no sufra
                                        ut.pitch = 0.95; // Tono casi neutro para no saturar el altavoz

                                        // Intentar pillar voz de hombre (varía según navegador/SO)
                                        const voces = window.speechSynthesis.getVoices();
                                        const langPrefix = language === 'en' ? 'en' : 'es';
                                        const maleNames = ['Pablo', 'Jorge', 'Alvaro', 'David', 'Mark', 'Guy', 'Male'];
                                        const vozElegida = voces.find(v => v.lang.startsWith(langPrefix) && maleNames.some(name => v.name.includes(name)));
                                        if (vozElegida) {
                                            ut.voice = vozElegida;
                                        }

                                        window.speechSynthesis.speak(ut);
                                    }
                                }}
                                style={{
                                    background: 'transparent',
                                    color: '#00d4ff',
                                    border: '1px solid #00d4ff',
                                    padding: '8px 20px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem',
                                    width: '100%',
                                    borderRadius: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                🔊 {language === 'en' ? 'LISTEN AUDIO (A.I. VOICE)' : 'ESCUCHAR RELATO (VOZ I.A.)'}
                            </button>
                        </div>

                        <hr style={{ borderColor: '#333', margin: '15px 0' }} />

                        {/* BANNER AMAZON DINÁMICO */}
                        {amazonConfig?.banner && <AmazonBanner {...amazonConfig.banner} />}

                        <div className="texto-relato-modal">
                            {renderizarTextoConMedios(relatoAbierto.contenido)}
                        </div>
                        
                        {relatoAbierto.fuente_url && (
                            <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                <a href={relatoAbierto.fuente_url} target="_blank" rel="noopener noreferrer" className="btn-access-tactical" style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--color-principal)', color: '#000', textDecoration: 'none', fontWeight: 'bold' }}>
                                    🔗 VER FUENTE ORIGINAL
                                </a>
                            </div>
                        )}

                        <div className="modal-footer-pro">
                            <div className="modal-actions-top">
                                <button onClick={() => setRelatoAbierto(null)} className="btn-volver-atras">
                                    ⬅ {t('back')}
                                </button>
                                <button className="btn-marcar-relevante" onClick={(e) => aumentarRelevancia(e, relatoAbierto.id)}>
                                    {t('expMarkRelevant')} ({relatoAbierto.relevancia || 0})
                                </button>
                            </div>
                            <div className="share-section-modal" style={{ marginTop: '15px', borderTop: '1px solid #333', paddingTop: '15px', width: '100%' }}>
                                <p style={{ color: 'var(--color-principal)', fontSize: '0.7rem', marginBottom: '10px', textAlign: 'center', fontFamily: 'monospace' }}>
                                    {t('expDiffuse')}
                                </p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={() => compartirExpediente('whatsapp')} className="btn-share-tactico" style={{ background: '#25D366', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>WHATSAPP</button>
                                    <button onClick={() => compartirExpediente('facebook')} className="btn-share-tactico" style={{ background: '#1877F2', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>FACEBOOK</button>
                                    <button onClick={() => compartirExpediente('twitter')} className="btn-share-tactico" style={{ background: '#1DA1F2', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>𝕏 TWITTER</button>
                                </div>
                            </div>
                        </div>
                        
                        {/* BIBLIOGRAFÍA AMAZON DINÁMICA */}
                        {amazonConfig?.bibliografia && <AmazonBibliography libros={amazonConfig.bibliografia} />}
                    </div>
                </div>
            )}
            <AdSlot id="expedientes-bottom" />
        </div>
    );
};

export default Expedientes;