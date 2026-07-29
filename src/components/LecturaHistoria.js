import React, { useState, useEffect, useRef } from 'react';
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

// Divide el texto en oraciones/chunks más cortos para que no falle en iOS/Safari móvil
const splitText = (text, maxLen = 180) => {
    const sentences = text.split(/([.!?])/g);
    const chunks = [];
    let currentChunk = '';
    
    for (let i = 0; i < sentences.length; i++) {
        const part = sentences[i];
        if (part === undefined || part === null) continue;
        
        if (part === '.' || part === '!' || part === '?') {
            currentChunk += part;
            continue;
        }
        
        if (currentChunk.length + part.length > maxLen) {
            if (currentChunk.trim()) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = '';
            
            let remaining = part;
            while (remaining.length > maxLen) {
                let sliceIndex = remaining.lastIndexOf(' ', maxLen);
                if (sliceIndex === -1 || sliceIndex < 20) {
                    sliceIndex = maxLen;
                }
                chunks.push(remaining.substring(0, sliceIndex).trim());
                remaining = remaining.substring(sliceIndex).trim();
            }
            currentChunk = remaining;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + part;
        }
    }
    
    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }
    
    return chunks;
};

// ==========================================
// COMPONENTE DE ARTÍCULOS RELACIONADOS
// ==========================================
const ArticulosRelacionados = ({ currentId, currentSrc }) => {
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [relacionados, setRelacionados] = useState([]);

    useEffect(() => {
        let isMounted = true;
        const cargarRelacionados = async () => {
            try {
                const reqs = [
                    axios.get(`${API_BASE_URL}/api/ruleta/aleatorio?categoria=expedientes`),
                    axios.get(`${API_BASE_URL}/api/ruleta/aleatorio?categoria=casos`),
                    axios.get(`${API_BASE_URL}/api/ruleta/aleatorio?categoria=misterios`)
                ];
                const res = await Promise.allSettled(reqs);
                const items = res
                    .filter(r => r.status === 'fulfilled' && r.value && r.value.data)
                    .map(r => r.value.data)
                    .filter(item => String(item.id) !== String(currentId));

                if (isMounted && items.length > 0) {
                    setRelacionados(items.slice(0, 3));
                }
            } catch (err) {
                console.error("Error al cargar relacionados:", err);
            }
        };
        cargarRelacionados();
        return () => { isMounted = false; };
    }, [currentId]);

    if (!relacionados || relacionados.length === 0) return null;

    const resolverImg = (url) => {
        if (!url) return '/assets/ruleta_bunker.jpg';
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
        return `${API_BASE_URL}/${url}`;
    };

    const nombresCat = {
        expedientes: language === 'en' ? 'DOSSIER' : 'EXPEDIENTE',
        casos: language === 'en' ? 'TRUE CRIME' : 'CRÓNICA NEGRA',
        misterios: language === 'en' ? 'MYSTERY' : 'MISTERIO',
        noticias: language === 'en' ? 'NEWS' : 'NOTICIA'
    };

    return (
        <div className="articulos-relacionados-section fade-in" style={{
            marginTop: '50px',
            paddingTop: '30px',
            borderTop: '2px dashed rgba(0, 255, 65, 0.3)',
            width: '100%'
        }}>
            <h3 style={{
                color: 'var(--color-principal, #00ff41)',
                fontFamily: 'Courier New, monospace',
                fontSize: '1.1rem',
                letterSpacing: '2px',
                textAlign: 'center',
                marginBottom: '25px',
                textTransform: 'uppercase'
            }}>
                👁️ {language === 'en' ? 'IF YOU LIKED THIS MYSTERY, CONTINUE INVESTIGATING...' : 'SI TE GUSTÓ ESTE MISTERIO, CONTINÚA INVESTIGANDO...'}
            </h3>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '20px'
            }}>
                {relacionados.map((rel, idx) => (
                    <div
                        key={idx}
                        onClick={() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            navigate(`/leer-historia/${rel.id}?src=${rel.src || rel.categoria}`);
                        }}
                        style={{
                            background: '#0a0a0a',
                            border: '1px solid #1a3a1a',
                            borderRadius: '6px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#00ff41'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 0 20px rgba(0,255,65,0.2)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#1a3a1a'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div style={{ height: '140px', overflow: 'hidden', background: '#050505', position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                background: 'rgba(0,0,0,0.85)',
                                color: '#00ff41',
                                border: '1px solid #00ff41',
                                padding: '2px 6px',
                                fontSize: '0.65rem',
                                fontFamily: 'monospace',
                                borderRadius: '3px',
                                zIndex: 2
                            }}>
                                {nombresCat[rel.categoria] || rel.categoria}
                            </span>
                            <img
                                src={resolverImg(rel.imagen_url)}
                                alt={rel.titulo}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={e => { e.target.style.display = 'none'; }}
                            />
                        </div>
                        <div style={{ padding: '15px', flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <h4 style={{ color: '#fff', fontSize: '0.9rem', fontFamily: 'Courier New, monospace', margin: '0 0 10px 0', lineHeight: '1.4' }}>
                                {rel.titulo}
                            </h4>
                            <span style={{ color: '#00d4ff', fontSize: '0.75rem', fontFamily: 'monospace', textTransform: 'uppercase' }}>
                                📖 {language === 'en' ? 'READ DOSSIER →' : 'LEER EXPEDIENTE →'}
                            </span>
                        </div>
                    </div>
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
    
    const getInitialHistoria = () => {
        if (typeof window !== 'undefined' && window.__INITIAL_HISTORIA__) {
            const h = window.__INITIAL_HISTORIA__;
            if (String(h.id) === String(id)) {
                return h;
            }
        }
        return null;
    };

    const initialData = getInitialHistoria();
    const initialTypes = (typeof window !== 'undefined' && window.__INITIAL_HISTORIA_TYPE__) || {};

    const [historia, setHistoria] = useState(initialData);
    const [esRelatoAdmin, setEsRelatoAdmin] = useState(initialData ? !!initialTypes.esRelatoAdmin : false);
    const [esNoticia, setEsNoticia] = useState(initialData ? !!initialTypes.esNoticia : false);
    const [esMisterio, setEsMisterio] = useState(initialData ? !!initialTypes.esMisterio : false);
    const [esCaso, setEsCaso] = useState(initialData ? !!initialTypes.esCaso : false);
    const [cargando, setCargando] = useState(!initialData);
    
    // ESTADO DE AUDIO (ROBOCOP) MULTICHOICE SEQUENTIAL PARA MÓVIL
    const [reproduciendoAudio, setReproduciendoAudio] = useState(false);
    const audioIndexRef = useRef(0);
    const audioChunksRef = useRef([]);
    const reproduciendoAudioRef = useRef(false);
    const currentUtteranceRef = useRef(null);

    const reproducirSiguienteChunk = () => {
        if (!reproduciendoAudioRef.current) return;
        
        const index = audioIndexRef.current;
        const chunks = audioChunksRef.current;
        
        if (index >= chunks.length) {
            setReproduciendoAudio(false);
            reproduciendoAudioRef.current = false;
            audioIndexRef.current = 0;
            return;
        }
        
        const texto = chunks[index];
        if (!texto) {
            audioIndexRef.current = index + 1;
            reproducirSiguienteChunk();
            return;
        }
        
        const ut = new SpeechSynthesisUtterance(texto);
        ut.lang = language === 'en' ? 'en-US' : 'es-ES';
        ut.rate = 0.95;
        ut.pitch = 0.95;
        
        if (window.speechSynthesis) {
            const voces = window.speechSynthesis.getVoices();
            const langPrefix = language === 'en' ? 'en' : 'es';
            const maleNames = ['Pablo', 'Jorge', 'Alvaro', 'David', 'Mark', 'Guy', 'Male'];
            const vozElegida = voces.find(v => v.lang.startsWith(langPrefix) && maleNames.some(name => v.name.includes(name)));
            if (vozElegida) {
                ut.voice = vozElegida;
            }
        }
        
        ut.onend = () => {
            if (!reproduciendoAudioRef.current) return;
            audioIndexRef.current = index + 1;
            reproducirSiguienteChunk();
        };
        
        ut.onerror = (e) => {
            console.error("SpeechSynthesis error:", e);
            if (!reproduciendoAudioRef.current) return;
            audioIndexRef.current = index + 1;
            reproducirSiguienteChunk();
        };
        
        currentUtteranceRef.current = ut;
        window.speechSynthesis.speak(ut);
    };
    
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
    let biblioData = amazonConfig?.bibliografia;
    const enlaceCualquiera = amazonConfig?.enlace_amazon || amazonConfig?.url_afiliado || amazonConfig?.link || amazonConfig?.url;
    if (!biblioData && enlaceCualquiera) {
        biblioData = [{
            titulo: amazonConfig.titulo,
            autor: amazonConfig.autor || "Redacción Búnker",
            descripcion: amazonConfig.descripcion || "",
            imagen_url: amazonConfig.imagen_url,
            link: enlaceCualquiera
        }];
    }

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
                    const resCaso = await axios.get(`${API_BASE_URL}/api/casos/detalle/${id}`);
                    if (resCaso.data && resCaso.data.id) {
                        const hist = await traducirAlVuelo(resCaso.data);
                        setHistoria(hist);
                        setEsRelatoAdmin(false);
                        setEsNoticia(false);
                        setEsMisterio(false);
                        setEsCaso(true);
                        setCargando(false);
                        return;
                    }
                } catch (errC) {
                    console.warn("Intento rápido en /api/casos/detalle falló, buscando en colección:", errC.message);
                }
            }

            // Si viene especificado que es un misterio histórico, lo buscamos con máxima prioridad
            if (src === 'misterios') {
                try {
                    const resMisterio = await axios.get(`${API_BASE_URL}/api/misterios-historicos/${id}`);
                    if (resMisterio.data && resMisterio.data.id) {
                        const hist = await traducirAlVuelo(resMisterio.data);
                        setHistoria(hist);
                        setEsRelatoAdmin(false);
                        setEsNoticia(false);
                        setEsMisterio(true);
                        setEsCaso(false);
                        setCargando(false);
                        return;
                    }
                } catch (errM) {
                    console.warn("Intento rápido en /api/misterios falló, buscando en colección:", errM.message);
                }
            }

            // Si viene especificado que es una noticia, la buscamos con prioridad
            if (src === 'noticias') {
                try {
                    const resNoticia = await axios.get(`${API_BASE_URL}/api/galeria/noticias/detalle/${id}`);
                    if (resNoticia.data && resNoticia.data.id) {
                        const hist = await traducirAlVuelo(resNoticia.data, 'cuerpo');
                        setHistoria(hist);
                        setEsRelatoAdmin(false);
                        setEsNoticia(true);
                        setEsMisterio(false);
                        setEsCaso(false);
                        setCargando(false);
                        return;
                    }
                } catch (errN) {
                    console.warn("Intento rápido en noticias/detalle falló:", errN.message);
                }
            }

            // Si viene especificado que es un expediente (admin o público), lo buscamos con prioridad
            if (src === 'expedientes') {
                try {
                    const resExp = await axios.get(`${API_BASE_URL}/api/expedientes/detalle/${id}`);
                    if (resExp.data && resExp.data.id) {
                        const hist = await traducirAlVuelo(resExp.data);
                        setHistoria(hist);
                        setEsRelatoAdmin(resExp.data.tipo === 'jefe');
                        setEsNoticia(false);
                        setEsMisterio(false);
                        setEsCaso(false);
                        setCargando(false);
                        return;
                    }
                } catch (errE) {
                    console.warn("Intento rápido en expedientes/detalle falló:", errE.message);
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
            const initialH = getInitialHistoria();
            if (initialH && String(initialH.id) === String(id)) {
                setHistoria(initialH);
            }
        } finally {
            setCargando(false);
            if (forceTranslationUpdate) forceTranslationUpdate();
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0); // SUBIDA AUTOMÁTICA AL CARGAR
        const initialH = getInitialHistoria();
        if (initialH && String(initialH.id) === String(id) && language !== 'en') {
            setCargando(false);
        } else {
            obtenerHistoria();
        }
        
        // Prime the voices database on mobile/Safari
        if (window.speechSynthesis) {
            window.speechSynthesis.getVoices();
        }
        
        return () => {
            if (window.speechSynthesis) {
                reproduciendoAudioRef.current = false;
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

    const compartirHistoria = (red) => {
        if (!historia) return;

        // El ?src= es IMPRESCINDIBLE — el servidor lo usa para saber en qué tabla
        // de la BD buscar el artículo (casos_abiertos, expedientes, noticias, misterios)
        let url = `${window.location.origin}/leer-historia/${historia.id}`;
        if (esCaso) url += '?src=casos';
        else if (esMisterio) url += '?src=misterios';
        else if (esNoticia) url += '?src=noticias';
        else url += '?src=expedientes';

        const textoCompartir = `🛸 ¡EXPEDIENTE DESCLASIFICADO! "${(historia.titulo || '').toUpperCase()}" — Investígalo en el Búnker Granaíno 👁️ #MisterioGranadino #ExpedienteXGranaino #TrueCrime`;

        if (red === 'copiar') {
            try {
                navigator.clipboard.writeText(url);
                alert("📋 ¡Enlace copiado al portapapeles con éxito! Puedes pegarlo directamente en tus redes o chats.");
            } catch (err) {
                alert("No se pudo copiar el enlace automáticamente. Cópialo de la barra del navegador.");
            }
            return;
        }

        // Solo usar navigator.share en móviles para evitar el bug de PC
        if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            try {
                navigator.share({
                    title: historia.titulo || 'Expediente X Granaíno',
                    text: textoCompartir,
                    url: url
                });
                return;
            } catch (err) {
                console.log("Fallo al usar navigator.share nativo", err);
            }
        }

        // Fallback para PC: Siempre abrimos la URL directa de cada red
        let link = '';
        if (red === 'whatsapp') {
            link = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartir + ' ' + url)}`;
        } else if (red === 'facebook') {
            link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        } else if (red === 'twitter') {
            link = `https://x.com/intent/tweet?text=${encodeURIComponent(textoCompartir)}&url=${encodeURIComponent(url)}`;
        }

        if (link) {
            window.open(link, '_blank', 'noopener,noreferrer');
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
                    {comentarios.length > 0 && (
                        <p style={{ marginTop: '10px' }}>
                            <span 
                                onClick={() => {
                                    const el = document.querySelector('.comentarios-container');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }} 
                                style={{ 
                                    color: '#00d4ff', 
                                    cursor: 'pointer', 
                                    textDecoration: 'underline',
                                    fontWeight: 'bold',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                💬 {language === 'en' ? 'TRANSMISSIONS RECEIVED:' : 'TRANSMISIONES RECIBIDAS:'} {comentarios.length} {comentarios.length === 1 ? (language === 'en' ? 'Comment' : 'Comentario') : (language === 'en' ? 'Comments' : 'Comentarios')} ({language === 'en' ? 'Click to read' : 'Pulsar para leer'})
                            </span>
                        </p>
                    )}
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
                                
                                if (reproduciendoAudio) {
                                    window.speechSynthesis.cancel();
                                    reproduciendoAudioRef.current = false;
                                    setReproduciendoAudio(false);
                                    audioIndexRef.current = 0;
                                } else {
                                    window.speechSynthesis.cancel(); // Flush stuck state
                                    
                                    const textoAConversar = historia.contenido || historia.cuerpo || "";
                                    const textoLimpio = textoAConversar
                                        .replace(/<[^>]*>?/gm, '')
                                        .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
                                        .replace(/\s+/g, ' ').trim();
                                    
                                    if (!textoLimpio) return;
                                    
                                    const chunks = splitText(textoLimpio, 180);
                                    audioChunksRef.current = chunks;
                                    audioIndexRef.current = 0;
                                    reproduciendoAudioRef.current = true;
                                    setReproduciendoAudio(true);
                                    
                                    reproducirSiguienteChunk();
                                }
                            }}
                            style={{
                                background: reproduciendoAudio ? 'rgba(255, 51, 51, 0.1)' : 'transparent',
                                color: reproduciendoAudio ? '#ff3333' : '#00d4ff',
                                border: reproduciendoAudio ? '1px solid #ff3333' : '1px solid #00d4ff',
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
                            {reproduciendoAudio ? (
                                <>⏹️ {language === 'en' ? 'STOP AUDIO (A.I. VOICE)' : 'DETENER AUDIO (VOZ I.A.)'}</>
                            ) : (
                                <>🔊 {language === 'en' ? 'LISTEN AUDIO (A.I. VOICE)' : 'ESCUCHAR RELATO (VOZ I.A.)'}</>
                            )}
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
                            <button onClick={() => compartirHistoria('whatsapp')} className="btn-share-tactico" style={{ background: '#25D366', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>💬 WHATSAPP</button>
                            <button onClick={() => compartirHistoria('facebook')} className="btn-share-tactico" style={{ background: '#1877F2', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>📘 FACEBOOK</button>
                            <button onClick={() => compartirHistoria('twitter')} className="btn-share-tactico" style={{ background: '#000', color: '#fff', border: '1px solid #555', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>𝕏 PUBLICAR EN X</button>
                            <button onClick={() => compartirHistoria('copiar')} className="btn-share-tactico" style={{ background: '#444', color: '#fff', border: '1px solid #666', padding: '10px 18px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem', fontFamily: 'monospace' }}>🔗 COPIAR ENLACE</button>
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

                {/* SI TE GUSTÓ ESTE MISTERIO... ARTÍCULOS RELACIONADOS */}
                <ArticulosRelacionados currentId={id} currentSrc={src} />

            </div>
        </div>
    );
};

export default LecturaHistoria;
