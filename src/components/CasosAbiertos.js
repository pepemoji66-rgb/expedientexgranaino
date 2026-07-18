import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { renderizarTextoConMedios } from '../utils/renderMedios';
import BuscadorAZ, { filtrarItemsBunker } from './BuscadorAZ';
import AdSlot from './AdSlot';
import './casosabiertos.css';
import API_BASE_URL from '../config';

const buildAmazonMaps = (todos) => {
    const keys = new Set();
    const links = new Map();
    
    if (Array.isArray(todos)) {
        todos.forEach(item => {
            const k = item.item_key;
            if (!k) return;
            
            const link = item.enlace_amazon || item.banner?.link || item.bibliografia?.[0]?.link;
            if (!link) return;
            
            keys.add(k);
            links.set(k, link);
            
            const id = k.split('-')[1];
            if (id) {
                if (k.startsWith('misterio') || k.startsWith('misterios_historicos')) {
                    keys.add(`misterio-${id}`);
                    keys.add(`misterios_historicos-${id}`);
                    links.set(`misterio-${id}`, link);
                    links.set(`misterios_historicos-${id}`, link);
                } else if (k.startsWith('caso') || k.startsWith('casos_abiertos')) {
                    keys.add(`caso-${id}`);
                    keys.add(`casos_abiertos-${id}`);
                    links.set(`caso-${id}`, link);
                    links.set(`casos_abiertos-${id}`, link);
                } else if (k.startsWith('exp') || k.startsWith('expedientes')) {
                    keys.add(`exp-${id}`);
                    keys.add(`expedientes-${id}`);
                    links.set(`exp-${id}`, link);
                    links.set(`expedientes-${id}`, link);
                } else if (k.startsWith('noticia') || k.startsWith('noticias')) {
                    keys.add(`noticia-${id}`);
                    keys.add(`noticias-${id}`);
                    links.set(`noticia-${id}`, link);
                    links.set(`noticias-${id}`, link);
                }
            }
        });
    }
    return { keys, links };
};

const CasosAbiertos = ({ userAuth }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [casos, setCasos] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [letraSeleccionada, setLetraSeleccionada] = useState('TODOS');
    const [casoExpandido, setCasoExpandido] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const [amazonKeys, setAmazonKeys] = useState(new Set());
    const [amazonLinks, setAmazonLinks] = useState(new Map());
    const casosPorPagina = 9;

    // Formulario states
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [nuevoContenido, setNuevoContenido] = useState('');
    const [latitud, setLatitud] = useState('');
    const [longitud, setLongitud] = useState('');
    const [busquedaLugar, setBusquedaLugar] = useState('');
    const [cargandoSubida, setCargandoSubida] = useState(false);

    useEffect(() => {
        cargarCasos();
        
        // Cargar claves y enlaces de Amazon
        axios.get(`${API_BASE_URL}/api/amazon/todos`).then(res => {
            const { keys, links } = buildAmazonMaps(res.data);
            setAmazonKeys(keys);
            setAmazonLinks(links);
        }).catch(() => {});
    }, []);

    // Detener Robocop al cerrar el modal
    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, letraSeleccionada]);

    useEffect(() => {
        if (!casoExpandido && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    }, [casoExpandido]);

    // Desplazamiento automático si hay un ID en la URL (viniendo del mapa)
    useEffect(() => {
        if (casos.length > 0) {
            const urlParams = new URLSearchParams(window.location.search);
            const casoId = urlParams.get('id');
            if (casoId) {
                const element = document.getElementById(`caso-${casoId}`);
                if (element) {
                    setTimeout(() => {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('flash-highlight');
                        setTimeout(() => element.classList.remove('flash-highlight'), 3000);
                    }, 500);
                }
            }
        }
    }, [casos]);

    // Traducción automática al vuelo en inglés / restauración en español
    useEffect(() => {
        if (casoExpandido) {
            if (language === 'en') {
                const alreadyTranslated = casoExpandido.titulo_en || casoExpandido.contenido_en || (casoExpandido._translatedLanguage === 'en');
                if (!alreadyTranslated) {
                    (async () => {
                        try {
                            const texto = casoExpandido.contenido || "";
                            const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(texto)}`);
                            const data = await res.json();
                            const traducido = data[0].map(x => x[0]).join("");
                            
                            let tituloTraducido = casoExpandido.titulo;
                            if (casoExpandido.titulo) {
                                const resTitulo = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(casoExpandido.titulo)}`);
                                const dataTitulo = await resTitulo.json();
                                tituloTraducido = dataTitulo[0].map(x => x[0]).join("");
                            }
                            
                            setCasoExpandido(prev => {
                                if (prev && prev.id === casoExpandido.id) {
                                    return {
                                        ...prev,
                                        contenido: traducido,
                                        contenido_en: traducido,
                                        titulo: tituloTraducido,
                                        titulo_en: tituloTraducido,
                                        _translatedLanguage: 'en'
                                    };
                                }
                                return prev;
                            });
                        } catch (e) {
                            console.error("Auto translation error for case:", e);
                        }
                    })();
                }
            } else if (language === 'es') {
                const casoOriginal = casos.find(c => c.id === casoExpandido.id);
                if (casoOriginal) {
                    setCasoExpandido(casoOriginal);
                }
            }
        }
    }, [casoExpandido?.id, language, casos]);

    const cargarCasos = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/casos`);
            if (Array.isArray(res.data)) {
                setCasos(res.data);
            }
        } catch (err) {
            console.error("❌ Error al cargar Casos Abiertos:", err);
        }
    };

    const obtenerUbicacion = () => {
        if (!navigator.geolocation) return alert("GPS NO DISPONIBLE.");
        navigator.geolocation.getCurrentPosition(pos => {
            setLatitud(pos.coords.latitude.toFixed(6));
            setLongitud(pos.coords.longitude.toFixed(6));
        });
    };

    const buscarCoordenadas = async () => {
        if (!busquedaLugar) return;
        setCargandoSubida(true);
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
            setCargandoSubida(false);
        }
    };

    const enviarCaso = async (e) => {
        e.preventDefault();
        if (!userAuth) return alert("Identidad no verificada. Inicia sesión como agente.");

        const formData = new FormData();
        formData.append('titulo', nuevoTitulo);
        formData.append('contenido', nuevoContenido);
        formData.append('usuario_nombre', userAuth.nombre);
        formData.append('latitud', latitud || 0);
        formData.append('longitud', longitud || 0);

        const fileInput = document.getElementById('archivo-caso');
        if (fileInput && fileInput.files[0]) {
            formData.append('imagen', fileInput.files[0]);
        }

        try {
            setCargandoSubida(true);
            await axios.post(`${API_BASE_URL}/api/casos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("🚀 CASO ENVIADO CON ÉXITO. EL BÚNKER DEBERÁ APROBARLO ANTES DE HACERSE PÚBLICO.");
            setNuevoTitulo('');
            setNuevoContenido('');
            setLatitud('');
            setLongitud('');
            setBusquedaLugar('');
            if (fileInput) fileInput.value = "";
        } catch (err) {
            console.error("Error al subir caso:", err);
            alert("❌ ERROR AL SUBIR EL CASO.");
        } finally {
            setCargandoSubida(false);
        }
    };

    const compartirCaso = (caso, red) => {
        // El ?src= es IMPRESCINDIBLE — el servidor busca en casos_abiertos gracias a él
        const url = `${window.location.origin}/leer-historia/${caso.id}?src=casos`;
        const textoTitulo = language === 'en' && caso.titulo_en ? caso.titulo_en : caso.titulo;
        const texto = `💀 UNRESOLVED MYSTERY / CASO ABIERTO: "${textoTitulo?.toUpperCase()}" @PEPE1318057 #TrueCrime #Misterio #ExpedienteXGranaino`;

        if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            try {
                navigator.share({
                    title: caso.titulo || 'Expediente X Granaíno',
                    text: texto,
                    url: url
                });
                return;
            } catch (err) {
                console.log("Fallo al usar navigator.share nativo", err);
            }
        }

        // Directo a la red seleccionada — sin navigator.share que intercepta en PC
        let link = '';
        if (red === 'whatsapp') {
            link = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto + ' ' + url)}`;
        } else if (red === 'facebook') {
            link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        } else if (red === 'twitter') {
            link = `https://x.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
        }

        if (link) {
            window.open(link, '_blank', 'noopener,noreferrer');
        }
    };

    const casosFiltrados = filtrarItemsBunker(casos, busqueda, letraSeleccionada);
    const indexOfLastCaso = paginaActual * casosPorPagina;
    const indexOfFirstCaso = indexOfLastCaso - casosPorPagina;
    const casosActuales = casosFiltrados.slice(indexOfFirstCaso, indexOfLastCaso);
    const totalPaginas = Math.ceil(casosFiltrados.length / casosPorPagina);

    return (
        <div className="casos-container fade-in">
            <h1 className="casos-titulo">
                {language === 'en' ? 'UNSOLVED CASES' : 'CASOS ABIERTOS'}
            </h1>
            <p className="casos-subtitulo">
                {language === 'en' ? 'TRUE CRIME & UNEXPLAINED MYSTERIES' : 'TRUE CRIME & MISTERIOS SIN RESOLVER'}
            </p>

            <AdSlot id="casos-top" />

            {/* BUSCADOR Y ÍNDICE A-Z TÁCTICO */}
            <BuscadorAZ 
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                letraSeleccionada={letraSeleccionada}
                onLetraChange={setLetraSeleccionada}
                totalResultados={casosFiltrados.length}
                placeholder="Buscar casos por True Crime, título, investigación..."
            />

            <div className="grid-casos">
                {casosActuales.length > 0 ? (
                    casosActuales.map((caso) => {
                        const tituloMostrar = language === 'en' && caso.titulo_en ? caso.titulo_en : caso.titulo;
                        const contenidoMostrar = language === 'en' && caso.contenido_en ? caso.contenido_en : caso.contenido;

                        return (
                            <div key={caso.id} id={`caso-${caso.id}`} className="caso-card">
                                <div className="caso-imagen-wrapper" style={{ position: 'relative' }}>
                                    {caso.imagen_url ? (
                                        <img
                                            src={caso.imagen_url.startsWith('http') ? caso.imagen_url : `${API_BASE_URL}/imagenes/${caso.imagen_url}`}
                                            alt={tituloMostrar}
                                            className="caso-imagen"
                                        />
                                    ) : (
                                        <div className="caso-imagen-placeholder">
                                            <span>💀 NO EVIDENCE AVAILABLE</span>
                                        </div>
                                    )}
                                    <div className="caso-badge">CLASSIFIED</div>
                                    
                                    {/* BADGE AMAZON */}
                                    {(amazonKeys.has(`caso-${caso.id}`) || amazonKeys.has(`casos_abiertos-${caso.id}`) || amazonKeys.has(`exp-${caso.id}`)) && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const link = amazonLinks.get(`caso-${caso.id}`) || amazonLinks.get(`casos_abiertos-${caso.id}`) || amazonLinks.get(`exp-${caso.id}`);
                                                if (link) window.open(link, '_blank');
                                            }}
                                            style={{
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
                                                zIndex: 10,
                                                textTransform: 'uppercase',
                                                border: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            📚 {language === 'en' ? 'AMAZON BOOK' : 'LIBRO RECOMENDADO'}
                                        </button>
                                    )}
                                </div>

                                <div className="caso-info">
                                    <div className="caso-meta">
                                        <button
                                            className="btn-mapa-caso"
                                            onClick={() => navigate('/lugares', { state: { lat: caso.latitud, lng: caso.longitud, noticiaId: 'caso-' + caso.id } })}
                                            title="Ver en el radar"
                                        >
                                            📍 {caso.latitud && caso.latitud !== 0 ? 'COORDENADAS FIJADAS' : 'ARCHIVO CENTRAL'}
                                        </button>
                                        <span>#{caso.id}</span>
                                    </div>
                                    <h3>{tituloMostrar?.toUpperCase()}</h3>

                                    <div className="caso-contenido colapsado" dangerouslySetInnerHTML={{ __html: contenidoMostrar }} />

                                    <button
                                        className="btn-leer-mas"
                                        onClick={() => navigate(`/leer-historia/${caso.id}?src=casos`)}
                                    >
                                        {language === 'en' ? 'READ FULL DOSSIER' : 'LEER DOSSIER COMPLETO'}
                                    </button>

                                    <div className="caso-acciones">
                                        <button onClick={() => compartirCaso(caso, 'whatsapp')} className="btn-mando-pro btn-secondary-pro">WHATSAPP</button>
                                        <button onClick={() => compartirCaso(caso, 'facebook')} className="btn-mando-pro btn-secondary-pro">FACEBOOK</button>
                                        <button onClick={() => compartirCaso(caso, 'twitter')} className="btn-mando-pro btn-secondary-pro">𝕏 TWITTER</button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-hay-datos">
                        <p>[ SISTEMA: No hay expedientes abiertos disponibles en este momento ]</p>
                    </div>
                )}
            </div>

            {totalPaginas > 1 && (
                <div className="paginacion-casos">
                    <button disabled={paginaActual === 1} onClick={() => { setPaginaActual(p => p - 1); window.scrollTo(0, 0); }}>ATRÁS</button>
                    <span>PÁG {paginaActual} / {totalPaginas}</span>
                    <button disabled={paginaActual === totalPaginas} onClick={() => { setPaginaActual(p => p + 1); window.scrollTo(0, 0); }}>SIGUIENTE</button>
                </div>
            )}

            {/* FORMULARIO DE ENVÍO DE CASOS */}
            {userAuth && (
                <div className="contenedor-envio-expediente fade-in" style={{ marginTop: '40px', borderTop: '2px solid #333', paddingTop: '40px' }}>
                    <div style={{ background: 'rgba(255,177,0,0.1)', border: '1px solid #ffb100', padding: '15px', marginBottom: '20px', borderRadius: '5px', textAlign: 'center' }}>
                        <p style={{ color: '#ffb100', fontSize: '0.9rem', fontFamily: 'monospace', margin: 0 }}>
                            ⚠️ ATENCIÓN AGENTE: CUALQUIER DOSSIER DE "TRUE CRIME" APORTADO SERÁ CLASIFICADO Y AUDITADO POR LA ADMINISTRACIÓN DEL BÚNKER ANTES DE HACERSE PÚBLICO EN EL MAPA.
                        </p>
                    </div>
                    <h2 className="titulo-neon-p">
                        {language === 'en' ? 'SUBMIT TRUE CRIME CASE' : 'APORTAR CASO TRUE CRIME'}
                    </h2>
                    <form onSubmit={enviarCaso} className="form-expediente">
                        <input
                            type="text"
                            className="input-bunker-exp"
                            placeholder={language === 'en' ? 'Case Title...' : 'Título del caso...'}
                            value={nuevoTitulo}
                            onChange={(e) => setNuevoTitulo(e.target.value)}
                            required
                        />
                        <textarea
                            className="textarea-bunker-exp"
                            placeholder={language === 'en' ? 'Case details...' : 'Detalles del caso...'}
                            value={nuevoContenido}
                            onChange={(e) => setNuevoContenido(e.target.value)}
                            required
                        ></textarea>

                        {/* BUSCADOR DE COORDENADAS */}
                        <div style={{ background: 'rgba(0,255,65,0.05)', padding: '15px', marginBottom: '20px', border: '1px solid #222' }}>
                            <label style={{ display: 'block', color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '5px' }}>
                                {language === 'en' ? 'GPS RADAR SEARCH' : 'RASTREO GPS'}
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    value={busquedaLugar}
                                    onChange={e => setBusquedaLugar(e.target.value)}
                                    placeholder={language === 'en' ? 'Search city or zone...' : 'Buscar ciudad o zona...'}
                                    className="input-bunker-exp"
                                    style={{ flex: 1, marginBottom: 0 }}
                                />
                                <button type="button" onClick={buscarCoordenadas} style={{ padding: '10px', background: 'var(--color-principal)', color: '#000', border: 'none', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {language === 'en' ? 'SEARCH' : 'RASTREAR'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', alignItems: 'end', marginBottom: '15px' }}>
                            <div>
                                <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem' }}>LATITUD</label>
                                <input type="number" step="any" className="input-bunker-exp" value={latitud} onChange={e => setLatitud(e.target.value)} />
                            </div>
                            <div>
                                <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem' }}>LONGITUD</label>
                                <input type="number" step="any" className="input-bunker-exp" value={longitud} onChange={e => setLongitud(e.target.value)} />
                            </div>
                            <button type="button" onClick={obtenerUbicacion} style={{
                                padding: '10px', background: 'transparent', border: '1px solid var(--color-principal)', color: 'var(--color-principal)',
                                fontFamily: 'monospace', fontSize: '0.65rem', cursor: 'pointer', marginBottom: '10px'
                            }}>
                                {language === 'en' ? 'CURRENT POS' : 'USAR MI POSICIÓN'}
                            </button>
                        </div>

                        <div className="form-group-exp">
                            <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem', display: 'block', marginBottom: '5px' }}>
                                {language === 'en' ? 'EVIDENCE IMAGE (OPTIONAL)' : 'IMAGEN DE EVIDENCIA (OPCIONAL)'}
                            </label>
                            <input type="file" id="archivo-caso" className="input-file-exp" style={{ color: 'var(--color-principal)', fontSize: '0.8rem', marginBottom: '15px' }} />
                        </div>

                        <button type="submit" className="btn-enviar-expediente" disabled={cargandoSubida}>
                            {cargandoSubida ? 'TRANSMITIENDO...' : (language === 'en' ? 'SUBMIT TO BUNKER' : 'ENVIAR AL BÚNKER')}
                        </button>
                    </form>
                </div>
            )}

            {casoExpandido && (
                <div className="modal-caso-overlay" onClick={() => setCasoExpandido(null)}>
                    <div className="modal-caso-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-caso-header">
                            <h2>{(language === 'en' && casoExpandido.titulo_en ? casoExpandido.titulo_en : casoExpandido.titulo).toUpperCase()}</h2>
                            <button className="btn-cerrar-modal-caso" onClick={() => setCasoExpandido(null)}>X</button>
                        </div>
                        {casoExpandido.imagen_url && (
                            <img
                                src={casoExpandido.imagen_url.startsWith('http') ? casoExpandido.imagen_url : `${API_BASE_URL}/imagenes/${casoExpandido.imagen_url}`}
                                alt="Evidencia"
                                className="modal-caso-imagen"
                            />
                        )}
                        <div className="modal-caso-body">
                            {casoExpandido.latitud && casoExpandido.latitud !== 0 && (
                                <button
                                    className="btn-mapa-caso"
                                    style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem' }}
                                    onClick={() => navigate('/lugares', { state: { lat: casoExpandido.latitud, lng: casoExpandido.longitud, noticiaId: 'caso-' + casoExpandido.id } })}
                                    title="Ver en el radar"
                                >
                                    📍 VER COORDENADAS EN EL RADAR
                                </button>
                            )}


                            {/* BOTÓN ROBOCOP (TTS) */}
                            <button
                                onClick={() => {
                                    if (!window.speechSynthesis) {
                                        alert("🔊 El sistema de síntesis de voz no está disponible en este navegador o dispositivo.");
                                        return;
                                    }
                                    if (window.speechSynthesis.speaking) {
                                        window.speechSynthesis.cancel();
                                    } else {
                                        const texto = language === 'en' && casoExpandido.contenido_en ? casoExpandido.contenido_en : casoExpandido.contenido;
                                        // 1. Quitar HTML, 2. Quitar Emojis, 3. Limpiar espacios extra
                                        const textoLimpio = texto
                                            .replace(/<[^>]*>?/gm, '')
                                            .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
                                            .replace(/\s+/g, ' ').trim();

                                        const ut = new SpeechSynthesisUtterance(textoLimpio);
                                        ut.lang = language === 'en' ? 'en-US' : 'es-ES';

                                        // Ajustes de voz de misterio: optimizados para que no distorsione en móviles
                                        ut.rate = 0.95; // Velocidad un poco más natural para que el procesador del móvil no sufra
                                        ut.pitch = 0.95; // Tono casi neutro (antes estaba en 0.45 y eso rompía el altavoz del móvil)

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
                                    gap: '8px',
                                    marginBottom: '20px'
                                }}
                            >
                                🔊 {language === 'en' ? 'LISTEN CASE (A.I. VOICE)' : 'ESCUCHAR CASO (VOZ I.A.)'}
                            </button>

                            <div className="modal-caso-body-html">
                                {renderizarTextoConMedios(language === 'en' && casoExpandido.contenido_en ? casoExpandido.contenido_en : casoExpandido.contenido)}
                            </div>

                            {casoExpandido.fuente_url && (
                                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                                    <a href={casoExpandido.fuente_url} target="_blank" rel="noopener noreferrer" className="btn-access-tactical" style={{ display: 'inline-block', padding: '10px 20px', background: 'var(--color-principal)', color: '#000', textDecoration: 'none', fontWeight: 'bold' }}>
                                        🔗 {language === 'en' ? 'VIEW ORIGINAL SOURCE' : 'VER FUENTE ORIGINAL'}
                                    </a>
                                </div>
                            )}

                            {/* SECCIÓN DE COMPARTIR EN MODAL */}
                            <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                                <p style={{ color: 'var(--color-principal)', fontSize: '0.7rem', marginBottom: '10px', fontFamily: 'monospace' }}>
                                    📡 {language === 'en' ? 'SHARE THIS CASE' : 'COMPARTIR ESTE CASO'}
                                </p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                    <button onClick={() => compartirCaso(casoExpandido, 'whatsapp')} className="btn-share-tactico" style={{ background: '#25D366', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>WHATSAPP</button>
                                    <button onClick={() => compartirCaso(casoExpandido, 'facebook')} className="btn-share-tactico" style={{ background: '#1877F2', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>FACEBOOK</button>
                                    <button onClick={() => compartirCaso(casoExpandido, 'twitter')} className="btn-share-tactico" style={{ background: '#1DA1F2', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.7rem' }}>𝕏 TWITTER</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CasosAbiertos;
