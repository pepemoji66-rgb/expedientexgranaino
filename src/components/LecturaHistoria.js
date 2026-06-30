import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { renderizarTextoConMedios } from '../utils/renderMedios';
import './lecturahistoria.css';
import './Comentarios.css';
import API_BASE_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

// ==========================================
// COMPONENTES DEL SISTEMA DE AFILIADOS AMAZON
// ==========================================

const AmazonBanner = ({ titulo, descripcion, link }) => (
    <a href={link} target="_blank" rel="noopener noreferrer" className="amazon-banner">
        <div className="amazon-banner-icon">📖</div>
        <div className="amazon-banner-content">
            <h4 className="amazon-banner-title">{titulo}</h4>
            <p className="amazon-banner-desc">{descripcion}</p>
        </div>
        <div className="amazon-banner-btn">VER EN AMAZON</div>
    </a>
);

const AmazonBibliography = ({ libros, tituloSeccion, customStyle }) => {
    if (!libros || libros.length === 0) return null;
    return (
        <div className="amazon-bibliography-section fade-in" style={customStyle}>
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

const LecturaHistoria = ({ userAuth }) => {
    const { language, t, forceTranslationUpdate } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const src = queryParams.get('src');
    
    const [historia, setHistoria] = useState(null);
    const [esRelatoAdmin, setEsRelatoAdmin] = useState(false);
    const [esNoticia, setEsNoticia] = useState(false);
    const [esMisterio, setEsMisterio] = useState(false);
    const [esCaso, setEsCaso] = useState(false);
    const [cargando, setCargando] = useState(true);
    const [amazonConfig, setAmazonConfig] = useState(null);

    // ESTADO DE COMENTARIOS
    const [comentarios, setComentarios] = useState([]);
    const [nick, setNick] = useState('');
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [enviando, setEnviando] = useState(false);

    const isAdmin = userAuth && (userAuth.email === 'archipegv2@gmail.com' || userAuth.rol === 'admin');
    const currentItemKey = (esMisterio ? 'misterio-' : esNoticia ? 'noticia-' : esCaso ? 'caso-' : 'exp-') + id;

    // Cargar Nick guardado o pre-llenar con el nombre del usuario
    useEffect(() => {
        if (userAuth && userAuth.nombre) {
            setNick(userAuth.nombre);
        } else {
            const savedNick = localStorage.getItem('agente_nick');
            if (savedNick) {
                setNick(savedNick);
            }
        }
    }, [userAuth]);

    // Cargar Comentarios del expediente
    const cargarComentarios = async () => {
        if (!id) return;
        try {
            const key = currentItemKey;
            const res = await axios.get(`${API_BASE_URL}/api/comentarios/${key}`);
            setComentarios(res.data);
        } catch (err) {
            console.error("Error al cargar comentarios del expediente:", err);
        }
    };

    useEffect(() => {
        if (historia) {
            cargarComentarios();
        }
    }, [historia, id, esMisterio, esNoticia, esCaso]);

    // DATOS DINÁMICOS DE AMAZON DESDE API
    useEffect(() => {
        if (historia) {
            axios.get(`${API_BASE_URL}/api/amazon/${currentItemKey}`).then(res => {
                if (res.data) setAmazonConfig(res.data);
            }).catch(e => console.error("Error amazon config:", e));
        }
    }, [historia, id, esMisterio, esNoticia, esCaso, currentItemKey]);

    const bannerData = amazonConfig?.banner;
    const biblioData = amazonConfig?.bibliografia;

    const obtenerHistoria = async () => {
        try {
            setCargando(true);
            console.log(`📡 ESCANEANDO ARCHIVO ID: ${id}...`);

            const traducirAlVuelo = async (objeto, campoContenido = 'contenido') => {
                if (language !== 'en') return { ...objeto };
                
                let finalTitulo = objeto.titulo;
                let finalContenido = objeto[campoContenido] || objeto.contenido || objeto.cuerpo || '';

                if (objeto.titulo_en) finalTitulo = objeto.titulo_en;
                if (objeto.contenido_en) finalContenido = objeto.contenido_en;

                if (!objeto.titulo_en && !objeto.contenido_en) {
                    try {
                        const resTrans = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(finalContenido)}`);
                        const dataTrans = await resTrans.json();
                        finalContenido = dataTrans[0].map(x => x[0]).join("");

                        if (finalTitulo) {
                            const resTit = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(finalTitulo)}`);
                            const dataTit = await resTit.json();
                            finalTitulo = dataTit[0].map(x => x[0]).join("");
                        }
                    } catch (e) {
                        console.error("Auto translation error:", e);
                    }
                }

                return { 
                    ...objeto, 
                    titulo: finalTitulo, 
                    [campoContenido]: finalContenido,
                    contenido: finalContenido,
                    cuerpo: finalContenido
                };
            };

            // Si viene especificado que es un caso abierto (True Crime), lo buscamos con prioridad
            if (src === 'casos') {
                try {
                    const resCasos = await axios.get(`${API_BASE_URL}/api/casos`);
                    const encontradaCaso = resCasos.data.find(h => h.id == id);
                    if (encontradaCaso) {
                        const hist = await traducirAlVuelo(encontradaCaso);
                        setHistoria(hist);
                        setEsRelatoAdmin(false);
                        setEsNoticia(false);
                        setEsMisterio(false);
                        setEsCaso(true);
                        setCargando(false);
                        return;
                    }
                } catch (errC) {
                    console.error("Error al buscar en casos:", errC);
                }
            }

            // Si viene especificado que es un misterio histórico, lo buscamos con máxima prioridad
            if (src === 'misterios') {
                try {
                    const resMisterios = await axios.get(`${API_BASE_URL}/api/misterios-historicos`);
                    const encontradaMisterio = resMisterios.data.find(h => h.id == id);
                    if (encontradaMisterio) {
                        const hist = await traducirAlVuelo(encontradaMisterio);
                        setHistoria(hist);
                        setEsRelatoAdmin(false);
                        setEsNoticia(false);
                        setEsMisterio(true);
                        setEsCaso(false);
                        setCargando(false);
                        return;
                    }
                } catch (errM) {
                    console.error("Error al buscar en misterios:", errM);
                }
            }

            // Si viene especificado que es una noticia, la buscamos con prioridad
            if (src === 'noticias') {
                try {
                    const resNoticias = await axios.get(`${API_BASE_URL}/api/galeria/noticias-publicas`);
                    const encontradaNoticia = resNoticias.data.find(h => h.id == id);
                    if (encontradaNoticia) {
                        const hist = await traducirAlVuelo(encontradaNoticia, 'cuerpo');
                        setHistoria(hist);
                        setEsRelatoAdmin(false);
                        setEsNoticia(true);
                        setEsMisterio(false);
                        setEsCaso(false);
                        setCargando(false);
                        return;
                    }
                } catch (errN) {
                    console.error("Error al buscar en noticias:", errN);
                }
            }

            // Si viene especificado que es un expediente (admin o público), lo buscamos con prioridad
            if (src === 'expedientes') {
                try {
                    const resAdmin = await axios.get(`${API_BASE_URL}/api/expedientes/relatos-admin-publicos`);
                    const encontradaAdmin = resAdmin.data.find(h => h.id == id);
                    if (encontradaAdmin) {
                        const hist = await traducirAlVuelo(encontradaAdmin);
                        setHistoria(hist);
                        setEsRelatoAdmin(true);
                        setEsNoticia(false);
                        setEsMisterio(false);
                        setEsCaso(false);
                        setCargando(false);
                        return;
                    }

                    const resPublicos = await axios.get(`${API_BASE_URL}/api/expedientes/expedientes-publicos`);
                    const encontradaPublica = resPublicos.data.find(h => h.id == id);
                    if (encontradaPublica) {
                        const hist = await traducirAlVuelo(encontradaPublica);
                        setHistoria(hist);
                        setEsRelatoAdmin(false);
                        setEsNoticia(false);
                        setEsMisterio(false);
                        setEsCaso(false);
                        setCargando(false);
                        return;
                    }
                } catch (errE) {
                    console.error("Error al buscar en expedientes:", errE);
                }
            }

            // 1. Intentamos buscar primero en los Relatos del Administrador
            const resAdmin = await axios.get(`${API_BASE_URL}/api/expedientes/relatos-admin-publicos`);
            const encontradaAdmin = resAdmin.data.find(h => h.id == id);

            if (encontradaAdmin) {
                const hist = await traducirAlVuelo(encontradaAdmin);
                setHistoria(hist);
                setEsRelatoAdmin(true);
                setEsNoticia(false);
                setEsMisterio(false);
                setEsCaso(false);
            } else {
                // 2. Si no es de admin, buscamos en los expedientes públicos de usuarios
                const resPublicos = await axios.get(`${API_BASE_URL}/api/expedientes/expedientes-publicos`);
                const encontradaPublica = resPublicos.data.find(h => h.id == id);
                
                if (encontradaPublica) {
                    const hist = await traducirAlVuelo(encontradaPublica);
                    setHistoria(hist);
                    setEsRelatoAdmin(false);
                    setEsNoticia(false);
                    setEsMisterio(false);
                    setEsCaso(false);
                } else {
                    // 3. ¡EL PARCHE! Si no es expediente, buscamos en las NOTICIAS
                    const resNoticias = await axios.get(`${API_BASE_URL}/api/galeria/noticias-publicas`);
                    const encontradaNoticia = resNoticias.data.find(h => h.id == id);
                    
                    if (encontradaNoticia) {
                        const hist = await traducirAlVuelo(encontradaNoticia, 'cuerpo');
                        setHistoria(hist);
                        setEsRelatoAdmin(false); // Tratamos noticia como registro estándar
                        setEsNoticia(true);
                        setEsMisterio(false);
                        setEsCaso(false);
                    } else {
                        // 4. Si no es noticia, buscamos en los MISTERIOS HISTÓRICOS
                        try {
                            const resMisterios = await axios.get(`${API_BASE_URL}/api/misterios-historicos`);
                            const encontradaMisterio = resMisterios.data.find(h => h.id == id);
                            if (encontradaMisterio) {
                                const hist = await traducirAlVuelo(encontradaMisterio);
                                setHistoria(hist);
                                setEsRelatoAdmin(false);
                                setEsNoticia(false);
                                setEsMisterio(true);
                                setEsCaso(false);
                            } else {
                                // 5. Si no es misterio, buscamos en los casos (True Crime)
                                const resCasos = await axios.get(`${API_BASE_URL}/api/casos`);
                                const encontradaCaso = resCasos.data.find(h => h.id == id);
                                if (encontradaCaso) {
                                    const hist = await traducirAlVuelo(encontradaCaso);
                                    setHistoria(hist);
                                    setEsRelatoAdmin(false);
                                    setEsNoticia(false);
                                    setEsMisterio(false);
                                    setEsCaso(true);
                                } else {
                                    setHistoria(null);
                                }
                            }
                        } catch (errM) {
                            // Intentar casos en catch de misterios
                            try {
                                const resCasos = await axios.get(`${API_BASE_URL}/api/casos`);
                                const encontradaCaso = resCasos.data.find(h => h.id == id);
                                if (encontradaCaso) {
                                    const hist = await traducirAlVuelo(encontradaCaso);
                                    setHistoria(hist);
                                    setEsRelatoAdmin(false);
                                    setEsNoticia(false);
                                    setEsMisterio(false);
                                    setEsCaso(true);
                                } else {
                                    setHistoria(null);
                                }
                            } catch (e) {
                                setHistoria(null);
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error("❌ Error al recuperar el relato del búnker", err);
        } finally {
            setCargando(false);
            if (forceTranslationUpdate) forceTranslationUpdate();
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0); // SUBIDA AUTOMÁTICA AL CARGAR
        obtenerHistoria();
        return () => {
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [id, language, src]);

    const enviarComentario = async (e) => {
        e.preventDefault();
        if (!nick.trim() || !nuevoComentario.trim()) return;

        setEnviando(true);
        try {
            await axios.post(`${API_BASE_URL}/api/comentarios/${currentItemKey}`, {
                agente: nick,
                mensaje: nuevoComentario
            });
            setNuevoComentario('');
            localStorage.setItem('agente_nick', nick);
            cargarComentarios();
        } catch (err) {
            alert("Error al enviar la transmisión.");
        } finally {
            setEnviando(false);
        }
    };

    const borrarComentario = async (id) => {
        if (!window.confirm("¿ELIMINAR ESTA COMUNICACIÓN DEL ARCHIVO?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/api/comentarios/${id}`);
            cargarComentarios();
        } catch (err) {
            alert("Error al borrar.");
        }
    };

    const renderComentariosBox = (isSideBySide = false) => (
        <div className="comentarios-container" style={isSideBySide ? {
            flex: '1.5 1 400px',
            minWidth: '300px',
            margin: 0,
            maxWidth: 'none',
            width: '100%',
            boxSizing: 'border-box'
        } : {
            marginTop: '50px',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '40px'
        }}>
            <h3 className="titulo-seccion-bunker">📡 {language === 'en' ? 'AGENT COMMUNICATIONS' : 'COMUNICACIONES DE AGENTES'}</h3>
            
            <p style={{ color: 'var(--color-principal)', fontSize: '0.8rem', opacity: 0.8, marginBottom: '15px', fontFamily: 'monospace', textAlign: 'left' }}>
                💬 {language === 'en' 
                    ? 'Contribute your data, theories, or comments on this file. Free access (no registration required).' 
                    : 'Aporta tus datos, teorías o comentarios sobre este expediente. Libre acceso (no requiere registro).'}
            </p>

            <form onSubmit={enviarComentario} className="form-comentario">
                <input
                    type="text"
                    value={nick}
                    onChange={(e) => setNick(e.target.value)}
                    placeholder={language === 'en' ? "Your Nick / Agent Name..." : "Tu Nick / Nombre de Agente..."}
                    className="input-bunker-nick"
                    required
                    style={{ marginBottom: '10px' }}
                />
                <textarea
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)}
                    placeholder={language === 'en' ? "Write your comment or report here..." : "Escribe tu informe o comentario aquí..."}
                    className="input-bunker-comentario"
                    required
                ></textarea>
                <button type="submit" disabled={enviando} className="btn-enviar-comentario">
                    {enviando ? (language === 'en' ? 'TRANSMITTING...' : 'TRANSMITIENDO...') : (language === 'en' ? 'SEND TO FILE' : 'ENVIAR AL ARCHIVO')}
                </button>
            </form>

            <div className="lista-comentarios">
                {comentarios.length > 0 ? (
                    comentarios.map((c) => (
                        <div key={c.id} className="comentario-card fade-in">
                            <div className="comentario-header">
                                <span className="comentario-agente">👤 AGENTE: {c.agente?.toUpperCase()}</span>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <span className="comentario-fecha">{new Date(c.fecha).toLocaleString()}</span>
                                    {isAdmin && (
                                        <button onClick={() => borrarComentario(c.id)} className="btn-borrar-comentario">
                                            🗑️
                                        </button>
                                    )}
                                </div>
                           </div>
                            <p className="comentario-mensaje">{c.mensaje}</p>
                        </div>
                    ))
                ) : (
                    <p className="no-comentarios">
                        {language === 'en' 
                            ? 'FREQUENCY CLEAR. BE THE FIRST TO REPORT ON THIS FILE...' 
                            : 'FRECUENCIA LIMPIA. SÉ EL PRIMERO EN APORTAR INFORMACIÓN SOBRE ESTE EXPEDIENTE...'}
                    </p>
                )}
            </div>
        </div>
    );

    const compartirHistoria = async (red) => {
        if (!historia) return;
        
        let url = window.location.origin + `/leer-historia/${historia.id}`;
        if (esCaso) url += '?src=casos';
        else if (esMisterio) url += '?src=misterios';
        else if (esNoticia) url += '?src=noticias';
        else url += '?src=expedientes';

        const textoCompartir = `🛸 ¡AVISTAMIENTO DETECTADO! Mira esto en el Búnker de ExpedienteX: "${(historia.titulo || '').toUpperCase()}" #UFO #Granada #ExpedienteXGranaino`;
        
        // Prioridad 1: Web Share API (Móviles)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'BÚNKER EXPEDIENTE X',
                    text: textoCompartir,
                    url: url,
                });
                return;
            } catch (err) {
                console.log("Compartir cancelado o no soportado");
            }
        }

        // Prioridad 2: Fallback (Escritorio)
        let link = '';
        if (red === 'whatsapp') {
            link = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartir + ' ' + url)}`;
        } else if (red === 'facebook') {
            link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        } else if (red === 'twitter') {
            link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textoCompartir)}&url=${encodeURIComponent(url)}`;
        }

        if (link) {
            window.open(link, '_blank');
        }
    };

    if (cargando) return (
        <div className="admin-dashboard">
            <div className="radar-loader-container" style={{ marginTop: '100px' }}>
                <div className="radar-loader"></div>
                <p style={{ color: 'var(--color-principal)', textAlign: 'center', fontFamily: 'Courier New' }}>
                    {t('readDecrypting')}
                </p>
            </div>
        </div>
    );

    if (!historia) return (
        <div className="admin-dashboard">
            <div className="glass-card" style={{ marginTop: '100px', textAlign: 'center' }}>
                <p style={{ color: '#ff4444' }}>{t('readNotFound')}</p>
                <button onClick={() => navigate(-1)} className="forms-btn-submit" style={{ width: 'auto', marginTop: '20px' }}>
                    {t('readBack')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard fade-in">
            <div className="glass-card full-width" style={{ textAlign: 'left', marginTop: '50px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate(-1)}
                            className="forms-btn-submit"
                            style={{ width: 'auto', background: '#222', padding: '10px 20px', cursor: 'pointer', border: '1px solid #444', borderRadius: '2px', fontWeight: 'bold' }}
                        >
                            ⬅ {t('readBack')}
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="forms-btn-submit"
                            style={{ width: 'auto', background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', padding: '10px 20px', cursor: 'pointer', border: '1px solid #00d4ff', borderRadius: '2px', fontWeight: 'bold' }}
                        >
                            🏠 {language === 'en' ? 'BUNKER HOME' : 'VOLVER A INICIO'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {historia.latitud && historia.longitud && (
                            <button
                                onClick={() => navigate('/lugares', { state: { lat: historia.latitud, lng: historia.longitud, noticiaId: (esNoticia ? 'noticia-' : 'exp-') + historia.id } })}
                                className="forms-btn-submit"
                                style={{ 
                                    width: 'auto', background: '#fff', color: '#000', 
                                    padding: '10px 20px', cursor: 'pointer', 
                                    border: '2px solid #000', borderRadius: '2px', 
                                    fontWeight: '900', boxShadow: '0 0 15px rgba(255,255,255,0.4)' 
                                }}
                            >
                                {t('readViewRadar')}
                            </button>
                        )}
                    </div>
                </div>

                <h2 className="admin-title" style={{ textAlign: 'left', color: 'var(--color-principal)', borderBottom: '1px solid rgba(0,255,65,0.3)', paddingBottom: '15px' }}>
                    {historia.titulo ? historia.titulo.toUpperCase() : t('readNoTitle')}
                </h2>

                <div className="meta-lectura" style={{ color: '#aaa', fontFamily: 'Courier New', marginBottom: '25px', fontSize: '0.9rem' }}>
                    <p>ID_SERIAL: <span style={{ color: 'var(--color-principal)' }}>#{historia.id}</span></p>
                    <p>CLASIFICACIÓN: <span style={{ color: esRelatoAdmin ? 'var(--color-principal)' : esCaso ? '#ff3333' : esMisterio ? '#a855f7' : esNoticia ? '#f59e0b' : '#ff9900' }}>
                        {esRelatoAdmin ? t('readAdminStory') : esCaso ? '🔴 CASO REAL / TRUE CRIME' : esMisterio ? '👽 MISTERIO HISTÓRICO' : esNoticia ? '📰 NOTICIA' : t('readAgentRegistry')}
                    </span></p>
                    <p>ORIGEN: <span style={{ color: '#fff' }}>
                        {(historia.usuario_nombre || historia.agente || t('readSystemCentral')).toUpperCase()}
                    </span></p>
                </div>

                {/* IMAGEN PRINCIPAL DE LA NOTICIA / EXPEDIENTE */}
                {(historia.imagen_url || historia.url_imagen) && (
                    <div className="portada-lectura">
                        {/* BOTÓN FLOTANTE SOBRE IMAGEN */}
                        {historia.latitud && historia.longitud && parseFloat(historia.latitud) !== 0 && (
                            <button
                                onClick={() => navigate('/lugares', { state: { lat: historia.latitud, lng: historia.longitud, noticiaId: (esMisterio ? 'misterio-' : esNoticia ? 'noticia-' : esCaso ? 'caso-' : 'exp-') + historia.id } })}
                                className="btn-localizar-portada"
                            >
                                {t('readLocateRadar')}
                            </button>
                        )}
                        <img 
                            src={
                                (historia.imagen_url && historia.imagen_url.startsWith('http')) 
                                ? historia.imagen_url 
                                : (historia.url_imagen && historia.url_imagen.startsWith('http'))
                                ? historia.url_imagen
                                : `${API_BASE_URL}/imagenes/${(historia.imagen_url || historia.url_imagen || '').split('/').pop()}`
                            } 
                            alt="Portada de la Evidencia"
                            className="lectura-imagen-portada"
                            onLoad={(e) => { e.target.style.opacity = 1; }}
                            onError={(e) => { 
                                console.error("Fallo carga imagen:", e.target.src);
                                e.target.style.display = 'none'; 
                            }}
                        />
                    </div>
                )}

                {/* BOTÓN AMAZON DESTACADO BAJO LA IMAGEN — SIEMPRE VISIBLE SI HAY LIBRO */}
                {(biblioData && biblioData.length > 0) && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '18px 0 10px 0'
                    }}>
                        <a
                            href={biblioData[0].link}
                            target="_blank"
                            rel="noopener noreferrer"
                            id="amazon-cta-portada"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'linear-gradient(135deg, #ff9900, #e47911)',
                                color: '#111',
                                fontWeight: '900',
                                fontFamily: 'Courier New, monospace',
                                fontSize: '0.95rem',
                                letterSpacing: '1px',
                                padding: '14px 30px',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                boxShadow: '0 0 20px rgba(255,153,0,0.5)',
                                border: '2px solid #ff9900',
                                transition: 'all 0.2s ease',
                                textTransform: 'uppercase'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 0 35px rgba(255,153,0,0.85)'; e.currentTarget.style.transform='scale(1.04)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 0 20px rgba(255,153,0,0.5)'; e.currentTarget.style.transform='scale(1)'; }}
                        >
                            🛒 <span>📚 {language === 'en' ? 'RECOMMENDED BOOK — BUY ON AMAZON' : 'LIBRO RECOMENDADO — COMPRAR EN AMAZON'}</span>
                        </a>
                    </div>
                )}
                {(!biblioData || biblioData.length === 0) && bannerData && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '18px 0 10px 0'
                    }}>
                        <a
                            href={bannerData.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            id="amazon-banner-cta-portada"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'linear-gradient(135deg, #ff9900, #e47911)',
                                color: '#111',
                                fontWeight: '900',
                                fontFamily: 'Courier New, monospace',
                                fontSize: '0.95rem',
                                letterSpacing: '1px',
                                padding: '14px 30px',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                boxShadow: '0 0 20px rgba(255,153,0,0.5)',
                                border: '2px solid #ff9900',
                                transition: 'all 0.2s ease',
                                textTransform: 'uppercase'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.boxShadow='0 0 35px rgba(255,153,0,0.85)'; e.currentTarget.style.transform='scale(1.04)'; }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow='0 0 20px rgba(255,153,0,0.5)'; e.currentTarget.style.transform='scale(1)'; }}
                        >
                            🛒 <span>📚 {language === 'en' ? 'RECOMMENDED BOOK — BUY ON AMAZON' : 'LIBRO RECOMENDADO — COMPRAR EN AMAZON'}</span>
                        </a>
                    </div>
                )}

                <div className="cuerpo-historia" style={{
                    color: '#e0e0e0',
                    lineHeight: '1.8',
                    fontSize: '1.1rem',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Courier New, serif',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '30px',
                    borderRadius: '5px',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                }}>


                    {/* BOTÓN ROBOCOP (TTS) */}
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <button
                            onClick={() => {
                                if (!window.speechSynthesis) {
                                    alert("🔊 El sistema de síntesis de voz no está disponible en este navegador o dispositivo.");
                                    return;
                                }
                                if (window.speechSynthesis.speaking) {
                                    window.speechSynthesis.cancel();
                                } else {
                                    const textoAConversar = historia.contenido || historia.cuerpo || "";
                                    const textoLimpio = textoAConversar
                                        .replace(/<[^>]*>?/gm, '')
                                        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
                                        .replace(/\s+/g, ' ').trim();

                                    const ut = new SpeechSynthesisUtterance(textoLimpio);
                                    ut.lang = language === 'en' ? 'en-US' : 'es-ES';
                                    ut.rate = 0.95;
                                    ut.pitch = 0.95;

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
                                padding: '10px 20px',
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

                    {/* BANNER AMAZON DINÁMICO */}
                    {bannerData && <AmazonBanner {...bannerData} />}

                    {renderizarTextoConMedios(historia.contenido || historia.cuerpo || t('readNoContent'))}
                    
                    {historia.fuente_url && (
                        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(0,255,65,0.1)', textAlign: 'center' }}>
                            <a 
                                href={historia.fuente_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn-technical-link highlight"
                                style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 25px', background: 'rgba(0,255,65,0.05)', border: '1px solid var(--color-principal)', color: 'var(--color-principal)', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '1px' }}
                            >
                                🌐 {t('readSource')}
                            </a>
                        </div>
                    )}

                    {/* SECCIÓN DE COMPARTIR TÁCTICO */}
                    <div style={{ marginTop: '35px', paddingTop: '25px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                        <p style={{ color: 'var(--color-principal)', fontSize: '0.85rem', marginBottom: '15px', fontFamily: 'Courier New', fontWeight: 'bold', letterSpacing: '1px' }}>
                            📡 {language === 'en' ? 'SHARE / COMPARTIR EN REDES' : 'DIFUNDIR EVIDENCIA / COMPARTIR EN REDES'}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => compartirHistoria('whatsapp')} className="btn-share-tactico" style={{ background: '#25D366', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>WHATSAPP</button>
                            <button onClick={() => compartirHistoria('facebook')} className="btn-share-tactico" style={{ background: '#1877F2', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>FACEBOOK</button>
                            <button onClick={() => compartirHistoria('twitter')} className="btn-share-tactico" style={{ background: '#1DA1F2', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>𝕏 TWITTER</button>
                        </div>
                    </div>
                </div>
                
                {/* LAYOUT DE PIE DE EXPEDIENTE: LIBROS + COMENTARIOS AL LADO */}
                {biblioData ? (
                    <div className="lectura-historia-footer-layout" style={{
                        display: 'flex',
                        gap: '40px',
                        marginTop: '50px',
                        alignItems: 'flex-start',
                        width: '100%',
                        flexWrap: 'wrap',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        paddingTop: '30px'
                    }}>
                        <div style={{ flex: '1 1 300px', minWidth: '280px' }}>
                            <AmazonBibliography libros={biblioData} customStyle={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }} />
                        </div>
                        {renderComentariosBox(true)}
                    </div>
                ) : (
                    renderComentariosBox(false)
                )}

            </div>
        </div>
    );
};

export default LecturaHistoria;
