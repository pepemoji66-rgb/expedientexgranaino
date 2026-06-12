import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { renderizarTextoConMedios } from '../utils/renderMedios';
import './lecturahistoria.css';
import API_BASE_URL from '../config';
import { useLanguage } from '../context/LanguageContext';
import { safeLocalStorage } from '../utils/storage';

const LecturaHistoria = () => {
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
    const [cargando, setCargando] = useState(true);
    
    // Recuperamos la identidad del agente para los permisos de borrado
    const sesion = safeLocalStorage.getItem('agente_sesion');
    const userAuth = sesion ? JSON.parse(sesion) : null;
    const esJefe = userAuth && (userAuth.rol === 'admin' || userAuth.email === 'archipegv2@gmail.com');

    const obtenerHistoria = async () => {
        try {
            setCargando(true);
            console.log(`📡 ESCANEANDO ARCHIVO ID: ${id}...`);

            // Si viene especificado que es un misterio histórico, lo buscamos con máxima prioridad
            if (src === 'misterios') {
                try {
                    const resMisterios = await axios.get(`${API_BASE_URL}/api/misterios-historicos`);
                    const encontradaMisterio = resMisterios.data.find(h => h.id == id);
                    if (encontradaMisterio) {
                        const hist = { ...encontradaMisterio };
                        if (language === 'en' && encontradaMisterio.titulo_en) {
                            hist.titulo = encontradaMisterio.titulo_en;
                        }
                        if (language === 'en' && encontradaMisterio.contenido_en) {
                            hist.contenido = encontradaMisterio.contenido_en;
                        }
                        setHistoria(hist);
                        setEsRelatoAdmin(false);
                        setEsNoticia(false);
                        setEsMisterio(true);
                        setCargando(false);
                        return;
                    }
                } catch (errM) {
                    console.error("Error al buscar en misterios:", errM);
                }
            }

            // 1. Intentamos buscar primero en los Relatos del Administrador
            const resAdmin = await axios.get(`${API_BASE_URL}/api/expedientes/relatos-admin-publicos`);
            const encontradaAdmin = resAdmin.data.find(h => h.id == id);

            if (encontradaAdmin) {
                setHistoria(encontradaAdmin);
                setEsRelatoAdmin(true);
                setEsNoticia(false);
                setEsMisterio(false);
            } else {
                // 2. Si no es de admin, buscamos en los expedientes públicos de usuarios
                const resPublicos = await axios.get(`${API_BASE_URL}/api/expedientes/expedientes-publicos`);
                const encontradaPublica = resPublicos.data.find(h => h.id == id);
                
                if (encontradaPublica) {
                    setHistoria(encontradaPublica);
                    setEsRelatoAdmin(false);
                    setEsNoticia(false);
                    setEsMisterio(false);
                } else {
                    // 3. ¡EL PARCHE! Si no es expediente, buscamos en las NOTICIAS
                    const resNoticias = await axios.get(`${API_BASE_URL}/api/galeria/noticias-publicas`);
                    const encontradaNoticia = resNoticias.data.find(h => h.id == id);
                    
                    if (encontradaNoticia) {
                        setHistoria(encontradaNoticia);
                        setEsRelatoAdmin(false); // Tratamos noticia como registro estándar
                        setEsNoticia(true);
                        setEsMisterio(false);
                    } else {
                        // 4. Si no es noticia, buscamos en los MISTERIOS HISTÓRICOS
                        try {
                            const resMisterios = await axios.get(`${API_BASE_URL}/api/misterios-historicos`);
                            const encontradaMisterio = resMisterios.data.find(h => h.id == id);
                            if (encontradaMisterio) {
                                const hist = { ...encontradaMisterio };
                                if (language === 'en' && encontradaMisterio.titulo_en) {
                                    hist.titulo = encontradaMisterio.titulo_en;
                                }
                                if (language === 'en' && encontradaMisterio.contenido_en) {
                                    hist.contenido = encontradaMisterio.contenido_en;
                                }
                                setHistoria(hist);
                                setEsRelatoAdmin(false);
                                setEsNoticia(false);
                                setEsMisterio(true);
                            } else {
                                setHistoria(null);
                            }
                        } catch (errM) {
                            setHistoria(null);
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
            window.speechSynthesis.cancel();
        };
    }, [id]);

    const eliminarEstaHistoria = async () => {
        const mensajeConfirm = esRelatoAdmin
            ? t('readConfirmDeleteAdmin')
            : t('readConfirmDeleteAgent');

        if (window.confirm(mensajeConfirm)) {
            try {
                // Usamos la ruta correspondiente según el tipo de relato
                const rutaBorrado = esRelatoAdmin 
                    ? `${API_BASE_URL}/api/expedientes/borrar-relato-admin/${id}` 
                    : `${API_BASE_URL}/api/expedientes/expedientes/${id}`;

                await axios.delete(rutaBorrado);
                alert(t('readDeleteSuccess'));
                navigate(-1);
            } catch (err) {
                alert(t('readDeleteError'));
            }
        }
    };

    const compartirHistoria = async (red) => {
        if (!historia) return;
        const url = window.location.origin + `/leer-historia/${historia.id}`;
        const textoCompartir = `🛸 ¡AVISTAMIENTO DETECTADO! Mira esto en el Búnker de ExpedienteX: "${(historia.titulo || '').toUpperCase()}" #UFO #Granada #ExpedienteXGranaino`;
        
        // Prioridad 1: Web Share API (Móviles)
        if (navigator.share && red !== 'copy') {
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

        // Prioridad 2: Fallback (Escritorio o copia manual)
        let link = '';
        if (red === 'twitter') {
            link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(textoCompartir)}&url=${encodeURIComponent(url)}`;
        } else if (red === 'whatsapp') {
            link = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartir + ' ' + url)}`;
        } else if (red === 'facebook') {
            link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        }

        if (link) {
            window.open(link, '_blank');
        } else {
            try {
                await navigator.clipboard.writeText(url);
                alert("📋 ¡Enlace copiado al portapapeles con éxito!");
            } catch (err) {
                alert("❌ No se pudo copiar el enlace automáticamente.");
            }
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
                        
                        {esJefe && (
                            <button
                                onClick={eliminarEstaHistoria}
                                className="forms-btn-submit"
                                style={{ width: 'auto', background: '#8b0000', color: 'white', padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '2px', opacity: 0.8 }}
                            >
                                🗑️ {t('readDelete')}
                            </button>
                        )}
                    </div>
                </div>

                <h2 className="admin-title" style={{ textAlign: 'left', color: 'var(--color-principal)', borderBottom: '1px solid rgba(0,255,65,0.3)', paddingBottom: '15px' }}>
                    {historia.titulo ? historia.titulo.toUpperCase() : t('readNoTitle')}
                </h2>

                <div className="meta-lectura" style={{ color: '#aaa', fontFamily: 'Courier New', marginBottom: '25px', fontSize: '0.9rem' }}>
                    <p>ID_SERIAL: <span style={{ color: 'var(--color-principal)' }}>#{historia.id}</span></p>
                    <p>CLASIFICACIÓN: <span style={{ color: esRelatoAdmin ? 'var(--color-principal)' : '#ff9900' }}>
                        {esRelatoAdmin ? t('readAdminStory') : t('readAgentRegistry')}
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
                                onClick={() => navigate('/lugares', { state: { lat: historia.latitud, lng: historia.longitud, noticiaId: (esMisterio ? 'misterio-' : esNoticia ? 'noticia-' : 'exp-') + historia.id } })}
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
                    {language === 'en' && (
                        <div style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                            <button 
                                onClick={async (e) => {
                                    const btn = e.currentTarget;
                                    btn.innerText = "📡 " + t('readTranslateWait').toUpperCase();
                                    
                                    try {
                                        const texto = historia.contenido || historia.cuerpo || "";
                                        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(texto)}`);
                                        const data = await res.json();
                                        const traducido = data[0].map(x => x[0]).join("");
                                        
                                        let tituloTraducido = historia.titulo;
                                        if (historia.titulo) {
                                            const resTitulo = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(historia.titulo)}`);
                                            const dataTitulo = await resTitulo.json();
                                            tituloTraducido = dataTitulo[0].map(x => x[0]).join("");
                                        }

                                        setHistoria({ ...historia, contenido: traducido, cuerpo: traducido, titulo: tituloTraducido });
                                        btn.style.display = 'none';
                                    } catch (err) {
                                        const urlTranslate = `https://translate.google.com/?sl=es&tl=en&text=${encodeURIComponent(historia.contenido || historia.cuerpo)}&op=translate`;
                                        window.open(urlTranslate, '_blank');
                                    }
                                }}
                                style={{
                                    background: 'var(--color-principal)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '10px 20px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem',
                                    boxShadow: '0 0 15px rgba(0,255,65,0.4)'
                                }}
                            >
                                📡 {t('readTranslateStory')}
                            </button>
                        </div>
                    )}

                    {/* BOTÓN ROBOCOP (TTS) */}
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <button
                            onClick={() => {
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
                            📡 {language === 'en' ? 'DIFFUSE EVIDENCES / SHARE NEWS' : 'DIFUNDIR EVIDENCIA / COMPARTIR EN REDES'}
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => compartirHistoria('twitter')} className="btn-share-tactico" style={{ background: '#1DA1F2', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>𝕏 TWITTER</button>
                            <button onClick={() => compartirHistoria('whatsapp')} className="btn-share-tactico" style={{ background: '#25D366', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>WHATSAPP</button>
                            <button onClick={() => compartirHistoria('facebook')} className="btn-share-tactico" style={{ background: '#1877F2', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>FACEBOOK</button>
                            <button onClick={() => compartirHistoria('copy')} className="btn-share-tactico" style={{ background: '#555', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>📋 COPIAR ENLACE</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LecturaHistoria;
