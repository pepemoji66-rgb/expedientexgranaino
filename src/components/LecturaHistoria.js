import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { renderizarTextoConMedios } from '../utils/renderMedios';
import './lecturahistoria.css';
import './Comentarios.css';
import API_BASE_URL from '../config';
import { useLanguage } from '../context/LanguageContext';
import AdSlot from './AdSlot';
import { MapPin } from 'lucide-react';

// ==========================================
// COMPONENTES DEL SISTEMA DE AFILIADOS AMAZON
// ==========================================

const ReferenceBanner = ({ titulo, descripcion, link }) => (
    <a href={link} target="_blank" rel="noopener noreferrer" className="reference-resource-card">
        <div className="reference-resource-icon">📖</div>
        <div className="reference-resource-content">
            <h4 className="reference-resource-title">{titulo}</h4>
            <p className="reference-resource-desc">{descripcion}</p>
        </div>
        <div className="btn-library-link">VER DETALLES</div>
    </a>
);

const ReferenceBibliography = ({ libros, tituloSeccion, customStyle }) => {
    if (!libros || libros.length === 0) return null;
    const audibleUrl = "https://www.amazon.es/hz/audible/mlp/membership/premiumplus?tag=expedientexg-21";

    return (
        <div className="ref-bibliography-section fade-in" style={customStyle}>
            <div className="ref-bibliography-header" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: '#9c4221',
                fontSize: '1.05rem',
                fontFamily: "'Merriweather', Georgia, serif",
                fontWeight: 'bold',
                marginBottom: '20px',
                letterSpacing: '0.5px'
            }}>
                📚 <span>{tituloSeccion || "PARA SABER MÁS (BIBLIOGRAFÍA RECOMENDADA)"}</span>
            </div>
            <div style={{
                background: '#f8fafc',
                borderLeft: '3px solid #9c4221',
                padding: '10px 14px',
                borderRadius: '0 4px 4px 0',
                marginBottom: '18px',
                fontSize: '0.82rem',
                color: '#475569',
                lineHeight: '1.5'
            }}>
                📌 <strong>Índice de investigación:</strong> Este expediente resume los datos y evidencias clave de un caso real. Si deseas profundizar en la investigación forense, histórica o ufológica completa, te recomendamos consultar las obras especializadas a continuación.
            </div>
            <div className="ref-bibliography-grid">
                {libros.map((libro, index) => (
                    <div key={index} className="book-citation-block" style={{ display: 'flex', flexDirection: 'column', height: '100%', cursor: 'default' }}>
                        <div style={{ display: 'flex', flex: '1' }}>
                            <a 
                                href={libro.link} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="book-citation-cover-container"
                                style={{ display: 'flex', textDecoration: 'none' }}
                                title="Ver en Amazon"
                            >
                                <img 
                                    src={libro.imagen_url || '/logoexpedientex.jpeg'} 
                                    alt={libro.titulo} 
                                    className="book-citation-cover"
                                    onError={(e) => { e.target.src = '/logoexpedientex.jpeg'; }}
                                />
                            </a>
                            <div className="book-citation-info" style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <a 
                                        href={libro.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{ textDecoration: 'none', color: '#1E293B' }}
                                    >
                                        <h5 className="book-citation-title" style={{ transition: 'color 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.color='#9c4221'} onMouseLeave={e => e.currentTarget.style.color='#1E293B'}>
                                            {libro.titulo}
                                        </h5>
                                    </a>
                                    <p className="book-citation-author">✍️ {libro.autor}</p>
                                    {libro.descripcion && (
                                        <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '4px 0 10px 0', lineHeight: '1.45' }}>
                                            {libro.descripcion}
                                        </p>
                                    )}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
                                    <a 
                                        href={libro.link} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="btn-library-link" 
                                        style={{ 
                                            background: '#9c4221', 
                                            borderColor: '#7a3319', 
                                            textDecoration: 'none', 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '5px',
                                            padding: '8px 14px',
                                            fontSize: '0.78rem'
                                        }}
                                    >
                                        📖 VER LIBRO EN AMAZON ↗
                                    </a>
                                    <a 
                                        href={audibleUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        style={{ 
                                            background: '#0f172a', 
                                            color: '#f59e0b', 
                                            border: '1px solid #334155', 
                                            padding: '8px 14px', 
                                            borderRadius: '4px', 
                                            fontSize: '0.78rem', 
                                            fontWeight: 'bold', 
                                            fontFamily: "'Inter', sans-serif",
                                            letterSpacing: '0.3px', 
                                            textDecoration: 'none', 
                                            display: 'inline-flex', 
                                            alignItems: 'center', 
                                            gap: '6px',
                                            transition: 'all 0.2s ease' 
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background='#1e293b'; e.currentTarget.style.borderColor='#f59e0b'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background='#0f172a'; e.currentTarget.style.borderColor='#334155'; }}
                                        title="Escuchar con la prueba gratuita de 30 días de Amazon Audible"
                                    >
                                        🎧 AUDIBLE (30 DÍAS GRATIS) ↗
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* DESTACADO PROMO AUDIBLE */}
            <div style={{
                marginTop: '16px',
                padding: '12px 18px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.08)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.3rem' }}>🎧</span>
                    <span style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: '1.4' }}>
                        <strong>¿Prefieres audiolibros?</strong> Disfruta de <strong>30 días de prueba GRATIS</strong> en Amazon Audible con miles de títulos y podcasts de misterio sin permanencia.
                    </span>
                </div>
                <a 
                    href={audibleUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    style={{ 
                        background: '#f59e0b', 
                        color: '#78350f', 
                        fontWeight: '800', 
                        fontSize: '0.78rem',
                        padding: '6px 14px',
                        borderRadius: '4px',
                        textDecoration: 'none',
                        border: '1px solid #d97706',
                        whiteSpace: 'nowrap'
                    }}
                >
                    PROBAR AUDIBLE GRATIS ↗
                </a>
            </div>
        </div>
    );
};

// Helper para extraer ID de YouTube soportando formatos normales, shorts, youtu.be, etc.
const extractYouTubeId = (url) => {
    if (!url || typeof url !== 'string') return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/|v\/))([\w-]{11})/i);
    return match ? match[1] : null;
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
            borderTop: '1px solid #E2E8F0',
            width: '100%'
        }}>
            <h3 style={{
                color: '#9c4221',
                fontFamily: "'Merriweather', Georgia, serif",
                fontSize: '1.05rem',
                letterSpacing: '0.5px',
                textAlign: 'center',
                marginBottom: '25px',
                textTransform: 'uppercase',
                fontWeight: '700'
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
                            background: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.04)'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#9c4221'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(156,66,33,0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.04)'; }}
                    >
                        <div style={{ height: '140px', overflow: 'hidden', background: '#F1F5F9', position: 'relative' }}>
                            <span style={{
                                position: 'absolute',
                                top: '8px',
                                left: '8px',
                                background: 'rgba(255,255,255,0.95)',
                                color: '#9c4221',
                                border: '1px solid #fed7aa',
                                padding: '3px 8px',
                                fontSize: '0.65rem',
                                fontFamily: 'monospace',
                                fontWeight: 'bold',
                                borderRadius: '4px',
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
                        <div style={{ padding: '16px', flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <h4 style={{ color: '#1E293B', fontSize: '0.92rem', fontFamily: "'Merriweather', Georgia, serif", margin: '0 0 10px 0', lineHeight: '1.45', fontWeight: '700' }}>
                                {rel.titulo}
                            </h4>
                            <span style={{ color: '#9c4221', fontSize: '0.75rem', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 'bold', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                📄 {language === 'en' ? 'READ DOSSIER →' : 'LEER EXPEDIENTE →'}
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
    const srcQuery = queryParams.get('src');

    // Detección inteligente de la sección por la ruta o el query string
    const pathname = location.pathname || '';
    const src = srcQuery || (
        pathname.includes('/casos-abiertos') ? 'casos' :
        pathname.includes('/noticias') ? 'noticias' :
        pathname.includes('/misterios-historicos') ? 'misterios' :
        pathname.includes('/expedientes') ? 'expedientes' : null
    );
    
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
    const [esNoticia, setEsNoticia] = useState(initialData ? !!initialTypes.esNoticia : (src === 'noticias'));
    const [esMisterio, setEsMisterio] = useState(initialData ? !!initialTypes.esMisterio : (src === 'misterios'));
    const [esCaso, setEsCaso] = useState(initialData ? !!initialTypes.esCaso : (src === 'casos'));
    const [cargando, setCargando] = useState(!initialData);
    
    // ESTADO DE GALERÍA DE EVIDENCIAS / CAPTURAS
    const [capturasEvidencias, setCapturasEvidencias] = useState([]);
    const [capturaExpandida, setCapturaExpandida] = useState(null);
    const [galeriaAbierta, setGaleriaAbierta] = useState(true);

    // Sincronización y carga de capturas fotográficas y evidencias del caso
    useEffect(() => {
        if (!historia) return;

        // 1. Si la historia ya cuenta con capturas en su registro propio
        if (historia.capturas && typeof historia.capturas === 'string' && historia.capturas.trim() !== '') {
            let lista = [];
            const raw = historia.capturas.trim();
            if (raw.startsWith('[') && raw.endsWith(']')) {
                try {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) lista = parsed;
                } catch(e) {}
            }
            if (lista.length === 0) {
                lista = raw.split(',').map(s => s.trim()).filter(Boolean);
            }
            if (lista.length > 0) {
                setCapturasEvidencias(lista.map(c => c.startsWith('http') ? c : `${API_BASE_URL}/imagenes/${c}`));
                return;
            }
        }

        // 2. Si tiene vídeo de YouTube asociado, generamos de inmediato sus 4 fotogramas oficiales como evidencias
        const ytCandidate = historia.youtube_url || 
                           (historia.fuente_url && /youtu/i.test(historia.fuente_url) ? historia.fuente_url : null) ||
                           (historia.video_url && /youtu/i.test(historia.video_url) ? historia.video_url : null) ||
                           (historia.url && /youtu/i.test(historia.url) ? historia.url : null);
        const currentYtId = extractYouTubeId(ytCandidate);
        
        if (currentYtId) {
            const fotogramasYouTube = [
                `https://img.youtube.com/vi/${currentYtId}/hqdefault.jpg`,
                `https://img.youtube.com/vi/${currentYtId}/1.jpg`,
                `https://img.youtube.com/vi/${currentYtId}/2.jpg`,
                `https://img.youtube.com/vi/${currentYtId}/3.jpg`
            ];
            setCapturasEvidencias(fotogramasYouTube);
        } else {
            setCapturasEvidencias([]);
        }

        // 3. Buscar si en la base de datos de vídeos hay capturas subidas manualmente en alta resolución
        const buscarCapturasEnVideos = async () => {
            try {
                const resVideos = await axios.get(`${API_BASE_URL}/api/videos`);
                if (resVideos.data && Array.isArray(resVideos.data)) {
                    const vidsConCapturas = resVideos.data.filter(v => v.capturas && v.capturas.trim() !== '');

                    let videoEncontrado = null;
                    if (currentYtId) {
                        videoEncontrado = vidsConCapturas.find(v => extractYouTubeId(v.url) === currentYtId);
                    }
                    if (!videoEncontrado && historia.titulo) {
                        const tituloNorm = historia.titulo.toLowerCase().trim();
                        videoEncontrado = vidsConCapturas.find(v => {
                            const vTit = (v.titulo || '').toLowerCase().trim();
                            return vTit && (vTit.includes(tituloNorm) || tituloNorm.includes(vTit));
                        });
                    }

                    if (videoEncontrado && videoEncontrado.capturas) {
                        const caps = videoEncontrado.capturas.split(',').map(s => s.trim()).filter(Boolean);
                        if (caps.length > 0) {
                            setCapturasEvidencias(caps.map(c => c.startsWith('http') ? c : `${API_BASE_URL}/imagenes/${c}`));
                        }
                    }
                }
            } catch (err) {
                // Silencioso si falla la búsqueda secundaria
            }
        };

        buscarCapturasEnVideos();
    }, [historia]);
    
    // Navegación entre evidencias en el visor (flechas)
    const irAnteriorEvidencia = (e) => {
        if (e) e.stopPropagation();
        if (!capturasEvidencias || capturasEvidencias.length === 0) return;
        const idx = capturasEvidencias.indexOf(capturaExpandida);
        const prevIdx = idx > 0 ? idx - 1 : capturasEvidencias.length - 1;
        setCapturaExpandida(capturasEvidencias[prevIdx]);
    };

    const irSiguienteEvidencia = (e) => {
        if (e) e.stopPropagation();
        if (!capturasEvidencias || capturasEvidencias.length === 0) return;
        const idx = capturasEvidencias.indexOf(capturaExpandida);
        const nextIdx = idx < capturasEvidencias.length - 1 ? idx + 1 : 0;
        setCapturaExpandida(capturasEvidencias[nextIdx]);
    };

    // Cerrar visor o pasar fotos con teclado (Escape, Flechas Izquierda / Derecha)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setCapturaExpandida(null);
            } else if (e.key === 'ArrowLeft') {
                irAnteriorEvidencia();
            } else if (e.key === 'ArrowRight') {
                irSiguienteEvidencia();
            }
        };
        if (capturaExpandida) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [capturaExpandida, capturasEvidencias]);

    // ESTADO DE AUDIO (ROBOCOP) MULTICHOICE SEQUENTIAL PARA MÓVIL
    const [reproduciendoAudio, setReproduciendoAudio] = useState(false);
    const audioIndexRef = useRef(0);
    const audioChunksRef = useRef([]);
    const reproduciendoAudioRef = useRef(false);
    const currentUtteranceRef = useRef(null);
    const keepAliveRef = useRef(null);

    // Keep-alive para Chrome Android: SpeechSynthesis se detiene tras ~15s sin actividad
    const iniciarKeepAlive = () => {
        if (keepAliveRef.current) clearInterval(keepAliveRef.current);
        keepAliveRef.current = setInterval(() => {
            if (window.speechSynthesis && reproduciendoAudioRef.current) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
            }
        }, 10000);
    };

    const detenerKeepAlive = () => {
        if (keepAliveRef.current) {
            clearInterval(keepAliveRef.current);
            keepAliveRef.current = null;
        }
    };

    // Detener audio al desmontar componente o cambiar de ruta
    useEffect(() => {
        return () => {
            detenerKeepAlive();
            if (window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
            reproduciendoAudioRef.current = false;
        };
    }, []);

    const reproducirSiguienteChunk = () => {
        if (!reproduciendoAudioRef.current) return;
        
        const index = audioIndexRef.current;
        const chunks = audioChunksRef.current;
        
        if (index >= chunks.length) {
            detenerKeepAlive();
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
        if (id) {
            setAmazonConfig(null); // Limpiar datos anteriores al cambiar de artículo
            axios.get(`${API_BASE_URL}/api/amazon/${currentItemKey}`).then(res => {
                setAmazonConfig(res.data || null);
            }).catch(e => {
                console.error("Error amazon config:", e);
                setAmazonConfig(null);
            });
        }
    }, [id, currentItemKey]);

    // Helpers para normalizar cualquier variante de campo que venga de Amazon (retrocompatibilidad total)
    const extraerLinkAmazon = (obj) => {
        if (!obj || typeof obj !== 'object') return null;
        let link = obj.amazon_url 
            || obj.enlace 
            || obj.enlace_amazon 
            || obj.enlace_afiliado 
            || obj.link 
            || obj.url 
            || obj.url_afiliado 
            || obj.codigo 
            || obj.codigo_amazon 
            || obj.codigo_afiliado 
            || obj.libro_enlace 
            || null;
        
        if (!link && obj.id && typeof obj.id === 'string' && /^[0-9a-zA-Z_-]{6,12}$/.test(obj.id)) {
            link = `https://amzn.to/${obj.id}`;
        }
        return (link && typeof link === 'string' && link.trim() !== '') ? link : null;
    };

    const extraerTituloAmazon = (obj) => {
        if (!obj || typeof obj !== 'object') return 'Libro Recomendado';
        return obj.titulo || obj.titulo_libro || obj.libro_titulo || obj.title || 'Libro Recomendado';
    };

    const extraerAutorAmazon = (obj) => {
        if (!obj || typeof obj !== 'object') return 'Redacción Búnker';
        return obj.autor || obj.autor_libro || obj.libro_autor || obj.author || 'Redacción Búnker';
    };

    const extraerImagenAmazon = (obj) => {
        if (!obj || typeof obj !== 'object') return '/logoexpedientex.jpeg';
        return obj.imagen_url || obj.libro_imagen || obj.image || obj.imagen || '/logoexpedientex.jpeg';
    };

    let bannerData = null;
    let biblioData = null;
    try {
        if (amazonConfig) {
            // Caso 1: amazonConfig es un Array directamente [...]
            if (Array.isArray(amazonConfig) && amazonConfig.length > 0) {
                biblioData = amazonConfig.map(item => ({
                    titulo: extraerTituloAmazon(item),
                    autor: extraerAutorAmazon(item),
                    descripcion: item.descripcion || item.sinopsis || '',
                    imagen_url: extraerImagenAmazon(item),
                    link: extraerLinkAmazon(item) || '#'
                })).filter(item => item.link && item.link !== '#');
            } else if (typeof amazonConfig === 'object') {
                // Caso 2: Contiene campo banner
                if (amazonConfig.banner && typeof amazonConfig.banner === 'object') {
                    const bannerLink = extraerLinkAmazon(amazonConfig.banner) || extraerLinkAmazon(amazonConfig);
                    if (bannerLink) {
                        bannerData = {
                            titulo: amazonConfig.banner.titulo || extraerTituloAmazon(amazonConfig),
                            descripcion: amazonConfig.banner.descripcion || amazonConfig.descripcion || '',
                            link: bannerLink
                        };
                    }
                }

                // Caso 3: Contiene bibliografia (array o json string)
                let rawBiblio = amazonConfig.bibliografia;
                if (rawBiblio && typeof rawBiblio === 'string') {
                    try { rawBiblio = JSON.parse(rawBiblio); } catch(e) {}
                }

                if (Array.isArray(rawBiblio) && rawBiblio.length > 0) {
                    biblioData = rawBiblio.map(item => ({
                        titulo: extraerTituloAmazon(item),
                        autor: extraerAutorAmazon(item),
                        descripcion: item.descripcion || item.sinopsis || '',
                        imagen_url: extraerImagenAmazon(item),
                        link: extraerLinkAmazon(item) || extraerLinkAmazon(amazonConfig) || '#'
                    })).filter(item => item.link && item.link !== '#');
                }

                // Caso 4: Contiene recomendacion_libro
                if ((!biblioData || biblioData.length === 0) && amazonConfig.recomendacion_libro) {
                    const rec = amazonConfig.recomendacion_libro;
                    const recLink = extraerLinkAmazon(rec);
                    if (recLink) {
                        biblioData = [{
                            titulo: extraerTituloAmazon(rec),
                            autor: extraerAutorAmazon(rec),
                            descripcion: rec.descripcion || '',
                            imagen_url: extraerImagenAmazon(rec),
                            link: recLink
                        }];
                    }
                }

                // Caso 5: Es un objeto directo con titulo, autor, link/enlace/amazon_url
                const fallbackLink = extraerLinkAmazon(amazonConfig);
                if ((!biblioData || biblioData.length === 0) && fallbackLink) {
                    biblioData = [{
                        titulo: extraerTituloAmazon(amazonConfig),
                        autor: extraerAutorAmazon(amazonConfig),
                        descripcion: amazonConfig.descripcion || amazonConfig.sinopsis || '',
                        imagen_url: extraerImagenAmazon(amazonConfig),
                        link: fallbackLink
                    }];
                }
            }
        }
    } catch (e) {
        console.error("Error procesando datos de referencia:", e);
        bannerData = null;
        biblioData = null;
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

    const renderComentariosBox = (isSideBySide = false) => {
        if (!comentarios || comentarios.length === 0) return null;
        return (
            <div className="comentarios-container" style={isSideBySide ? {
                flex: '1.5 1 400px',
                minWidth: '300px',
                margin: 0,
                maxWidth: 'none',
                width: '100%',
                boxSizing: 'border-box'
            } : {
                marginTop: '40px',
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                paddingTop: '25px'
            }}>
                <h4 style={{ fontSize: '0.85rem', color: '#9c4221', fontFamily: 'monospace', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '15px' }}>
                    💬 {language === 'en' ? 'ARCHIVED COMMUNICATIONS' : 'COMUNICACIONES DEL EXPEDIENTE'}
                </h4>

                <div className="lista-comentarios">
                    {comentarios.map((c) => (
                        <div key={c.id} className="comentario-card fade-in">
                            <div className="comentario-header">
                                <span className="comentario-agente">👤 {c.agente?.toUpperCase()}</span>
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
                    ))}
                </div>
            </div>
        );
    };

    const compartirHistoria = (red) => {
        if (!historia) return;

        // URL limpia y canónica por sección para compartir directamente en Facebook, Pinterest, WhatsApp, etc.
        let url = `${window.location.origin}/expedientes/${historia.id}`;
        if (esCaso || src === 'casos') url = `${window.location.origin}/casos-abiertos/${historia.id}`;
        else if (esMisterio || src === 'misterios') url = `${window.location.origin}/misterios-historicos/${historia.id}`;
        else if (esNoticia || src === 'noticias') url = `${window.location.origin}/noticias/${historia.id}`;

        // Inteligencia de Etiquetas por Categoría
        let tagsTexto = '';
        let hashtagsTwitter = 'ExpedienteXGranaino,Misterio,Granada';

        if (esCaso) {
            tagsTexto = '#TrueCrime #CronicaNegra #CasosReales #MisterioGranada #Investigacion #Granada #ExpedienteXGranaino';
            hashtagsTwitter = 'TrueCrime,CronicaNegra,CasosReales,MisterioGranada,ExpedienteXGranaino,Granada';
        } else if (esMisterio) {
            tagsTexto = '#MisteriosHistoricos #HistoriaOculta #Leyendas #AndaluciaMagica #Granada #ExpedienteXGranaino #Secretos';
            hashtagsTwitter = 'MisteriosHistoricos,HistoriaOculta,Leyendas,AndaluciaMagica,Granada,ExpedienteX';
        } else if (esNoticia) {
            tagsTexto = '#UltimaHora #NoticiasMisterio #AlertaParanormal #Granada #ExpedienteXGranaino #FenomenoOVNI';
            hashtagsTwitter = 'UltimaHora,NoticiasMisterio,AlertaParanormal,Granada,ExpedienteXGranaino';
        } else {
            tagsTexto = '#OVNI #Ufologia #FenomenoParanormal #Misterio #Granada #ExpedienteXGranaino #Desclasificado #UFO';
            hashtagsTwitter = 'OVNI,Ufologia,FenomenoParanormal,Misterio,Granada,ExpedienteXGranaino,UFO';
        }

        const tituloLimpio = (historia.titulo || 'Expediente X Granaíno').toUpperCase();
        const textoCompartir = `🛸 ¡EVIDENCIA DESCLASIFICADA! "${tituloLimpio}"\n\n👁️ Léelo y analízalo en el Búnker:\n\n${tagsTexto}`;
        const textoTwitter = `🛸 ¡EVIDENCIA DESCLASIFICADA! "${tituloLimpio}"\n\n👁️ Léelo en el Búnker de Expediente X:`;

        if (red === 'copiar') {
            try {
                navigator.clipboard.writeText(url);
                alert("📋 ¡Enlace copiado al portapapeles! Puedes pegarlo donde quieras.");
            } catch (err) {
                alert("No se pudo copiar automáticamente. Cópialo de la barra del navegador.");
            }
            return;
        }

        // En móviles: Si el navegador soporta navigator.share, usar el menú nativo del teléfono
        // Esto permite compartir directamente a la APP OFICIAL de Facebook (Grupos, Feed, Historias) con imagen
        const esMovil = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (esMovil && navigator.share && (red === 'facebook' || red === 'fbhistoria')) {
            navigator.share({
                title: historia.titulo || 'Expediente X Granaíno',
                url: url
            }).catch(() => {});
            return;
        }

        // Para el resto de redes en móvil (WhatsApp, etc.)
        if (esMovil && navigator.share && red !== 'facebook' && red !== 'whatsapp') {
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

        // Enlaces directos para PC o navegadores sin share nativo
        let link = '';
        if (red === 'fbhistoria') {
            link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        } else if (red === 'whatsapp') {
            link = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartir + '\n' + url)}`;
        } else if (red === 'facebook') {
            link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        } else if (red === 'twitter') {
            link = `https://x.com/intent/tweet?text=${encodeURIComponent(textoTwitter)}&url=${encodeURIComponent(url)}&hashtags=${encodeURIComponent(hashtagsTwitter)}`;
        } else if (red === 'pinterest') {
            const imgUrl = encodeURIComponent(historia.imagen_url || 'https://expedientexgranaino.com/social-preview.png');
            const descPinterest = encodeURIComponent(`${tituloLimpio} — Expediente X Granaíno`);
            link = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${imgUrl}&description=${descPinterest}`;
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
        <div className="admin-dashboard fade-in lectura-page-wrapper" style={{ background: '#F8F9FA', minHeight: '100vh', padding: '20px 10px' }}>
            <div className="glass-card full-width lectura-card-centered" style={{ textAlign: 'left', marginTop: '20px', maxWidth: '840px', margin: '20px auto 40px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '35px 30px', boxShadow: '0 4px 25px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate(-1)}
                            className="btn-nav-tactico"
                            style={{ background: '#FFF7ED', color: '#9c4221', padding: '8px 16px', cursor: 'pointer', border: '1px solid #fed7aa', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.78rem', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: '0.2s ease' }}
                        >
                            ⬅ {t('readBack')}
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="btn-nav-tactico"
                            style={{ background: '#FFF7ED', color: '#9c4221', padding: '8px 16px', cursor: 'pointer', border: '1px solid #fed7aa', borderRadius: '4px', fontWeight: 'bold', fontSize: '0.78rem', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: '0.2s ease' }}
                        >
                            🏠 {language === 'en' ? 'HOME' : 'VOLVER A INICIO'}
                        </button>
                    </div>
                </div>

                <h1 style={{ textAlign: 'left', color: '#9c4221', borderBottom: '2px solid #9c4221', paddingBottom: '15px', fontFamily: "'Merriweather', Georgia, serif", fontSize: '1.85rem', fontWeight: '800', letterSpacing: '-0.5px', margin: '15px 0' }}>
                    {historia.titulo ? historia.titulo.toUpperCase() : t('readNoTitle')}
                </h1>

                <div className="meta-lectura" style={{ color: '#64748B', fontFamily: 'monospace', marginBottom: '25px', fontSize: '0.85rem', lineHeight: '1.8' }}>
                    <p style={{ margin: '4px 0' }}>EXPEDIENTE: <span style={{ color: '#9c4221', fontWeight: 'bold' }}>#{historia.id}</span></p>
                    <p style={{ margin: '4px 0' }}>SECCIÓN: <span style={{ color: '#9c4221', fontWeight: 'bold' }}>
                        {esRelatoAdmin ? t('readAdminStory') : esCaso ? 'CASO REAL / TRUE CRIME' : esMisterio ? 'MISTERIO HISTÓRICO' : esNoticia ? 'NOTICIA' : t('readAgentRegistry')}
                    </span></p>
                    <p style={{ margin: '4px 0' }}>REDACCIÓN / ARCHIVO: <span style={{ color: '#1E293B', fontWeight: 'bold' }}>
                        {(historia.usuario_nombre || historia.agente || t('readSystemCentral')).toUpperCase()}
                    </span></p>
                    {comentarios.length > 0 && (
                        <p style={{ marginTop: '8px' }}>
                            <span 
                                onClick={() => {
                                    const el = document.querySelector('.comentarios-container');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }} 
                                style={{ 
                                    color: '#9c4221', 
                                    cursor: 'pointer', 
                                    textDecoration: 'underline',
                                    fontWeight: 'bold',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                💬 {language === 'en' ? 'ARCHIVED COMMENTS:' : 'COMUNICACIONES REGISTRADAS:'} {comentarios.length}
                            </span>
                        </p>
                    )}
                    {capturasEvidencias && capturasEvidencias.length > 0 && (
                        <p style={{ marginTop: '6px' }}>
                            <span 
                                onClick={() => {
                                    const el = document.querySelector('.galeria-evidencias-seccion');
                                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                                }} 
                                style={{ 
                                    color: '#008726', 
                                    cursor: 'pointer', 
                                    textDecoration: 'underline',
                                    fontWeight: 'bold',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                📸 {language === 'en' ? 'PHOTO EVIDENCE ARCHIVE:' : 'ARCHIVO FOTOGRÁFICO:'} {capturasEvidencias.length} {language === 'en' ? 'EVIDENCES' : 'EVIDENCIAS DISPONIBLES'} ↓
                            </span>
                        </p>
                    )}
                </div>

                {/* IMAGEN PRINCIPAL DE LA NOTICIA / EXPEDIENTE — EFECTO CINEMATOGRÁFICO AMBIENTAL */}
                {(historia.imagen_url || historia.url_imagen) && (() => {
                    const imgUrl = (historia.imagen_url && historia.imagen_url.startsWith('http')) 
                        ? historia.imagen_url 
                        : (historia.url_imagen && historia.url_imagen.startsWith('http'))
                        ? historia.url_imagen
                        : `${API_BASE_URL}/imagenes/${(historia.imagen_url || historia.url_imagen || '').split('/').pop()}`;

                    return (
                        <div className="portada-lectura">
                            <div className="portada-backdrop-ambient" style={{ backgroundImage: `url(${imgUrl})` }} />
                            {/* MARCADOR TIPO PIN / CHUPACHUPS PARA LOCALIZAR EN MAPA SIN TAPAR LA CARA */}
                            {historia.latitud && historia.longitud && parseFloat(historia.latitud) !== 0 && (
                                <button
                                    onClick={() => navigate('/lugares', { state: { lat: historia.latitud, lng: historia.longitud, noticiaId: (esMisterio ? 'misterio-' : esNoticia ? 'noticia-' : esCaso ? 'caso-' : 'exp-') + historia.id } })}
                                    className="btn-localizar-portada"
                                    title={t('readLocateRadar') || "Localizar en el radar"}
                                    aria-label={t('readLocateRadar') || "Localizar en el radar"}
                                >
                                    <MapPin size={20} className="icono-pin-radar" />
                                </button>
                            )}
                            <img 
                                src={imgUrl} 
                                alt="Portada de la Evidencia"
                                className="lectura-imagen-portada"
                                onLoad={(e) => { e.target.style.opacity = 1; }}
                                onError={(e) => { 
                                    console.error("Fallo carga imagen:", e.target.src);
                                    e.target.style.display = 'none'; 
                                }}
                            />
                        </div>
                    );
                })()}

                {/* BOTÓN DE ACCESO DIRECTO / DESPLEGABLE A LA GALERÍA DE EVIDENCIAS */}
                {capturasEvidencias && capturasEvidencias.length > 0 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        margin: '14px 0 10px 0'
                    }}>
                        <button
                            type="button"
                            onClick={() => {
                                setGaleriaAbierta(prev => {
                                    const nextState = !prev;
                                    if (nextState) {
                                        setTimeout(() => {
                                            const el = document.getElementById('seccion-galeria-evidencias');
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }, 100);
                                    }
                                    return nextState;
                                });
                            }}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#f0fdf4',
                                color: '#166534',
                                border: '1px solid #86efac',
                                padding: '10px 22px',
                                borderRadius: '30px',
                                fontWeight: '800',
                                fontFamily: "'Inter', sans-serif",
                                fontSize: '0.82rem',
                                letterSpacing: '0.3px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 8px rgba(22, 101, 52, 0.08)'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >
                            📸 <span>{galeriaAbierta ? (language === 'en' ? 'PHOTO ARCHIVE OPEN (CLICK TO FOLD)' : 'ARCHIVO FOTOGRÁFICO ABIERTO (PULSA PARA PLEGAR)') : (language === 'en' ? 'OPEN PHOTO ARCHIVE' : 'DESPLEGAR ARCHIVO FOTOGRÁFICO')} ({capturasEvidencias.length}) {galeriaAbierta ? '▲' : '▼'}</span>
                        </button>
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
                            id="ref-cta-portada"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: '#2D5A43',
                                color: '#fff',
                                fontWeight: '700',
                                fontFamily: "'Merriweather', Georgia, serif",
                                fontSize: '0.85rem',
                                letterSpacing: '0.5px',
                                padding: '12px 28px',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                border: '1px solid #3a7a5a',
                                transition: 'all 0.2s ease',
                                textTransform: 'uppercase'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background='#3a7a5a'; e.currentTarget.style.transform='scale(1.02)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='#2D5A43'; e.currentTarget.style.transform='scale(1)'; }}
                        >
                            📚 <span>{language === 'en' ? 'RECOMMENDED BOOK — VIEW DETAILS' : 'LIBRO RECOMENDADO — VER DETALLES'}</span>
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
                            id="ref-banner-cta-portada"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: '#9c4221',
                                color: '#fff',
                                fontWeight: '700',
                                fontFamily: "'Merriweather', Georgia, serif",
                                fontSize: '0.85rem',
                                letterSpacing: '0.5px',
                                padding: '12px 28px',
                                borderRadius: '4px',
                                textDecoration: 'none',
                                border: '1px solid #7a3319',
                                transition: 'all 0.2s ease',
                                textTransform: 'uppercase'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background='#7a3319'; e.currentTarget.style.transform='scale(1.02)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background='#9c4221'; e.currentTarget.style.transform='scale(1)'; }}
                        >
                            📚 <span>{language === 'en' ? 'RECOMMENDED BOOK — VIEW DETAILS' : 'LIBRO RECOMENDADO — VER DETALLES'}</span>
                        </a>
                    </div>
                )}

                <div className="cuerpo-historia" style={{
                    color: '#1E293B',
                    lineHeight: '1.85',
                    fontSize: '1.15rem',
                    whiteSpace: 'pre-wrap',
                    fontFamily: "'Merriweather', Georgia, serif",
                    background: '#FFFFFF',
                    padding: '20px 0',
                    maxWidth: '100%',
                    margin: '0 auto'
                }}>


                    {/* BOTÓN ROBOCOP (TTS) */}
                    <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                        <button
                            onClick={() => {
                                if (!window.speechSynthesis) return;
                                
                                if (reproduciendoAudio) {
                                    detenerKeepAlive();
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
                                    iniciarKeepAlive();
                                    
                                    reproducirSiguienteChunk();
                                }
                            }}
                            style={{
                                background: reproduciendoAudio ? '#fee2e2' : '#FFF7ED',
                                color: reproduciendoAudio ? '#dc2626' : '#9c4221',
                                border: reproduciendoAudio ? '1px solid #dc2626' : '1px solid #fed7aa',
                                padding: '10px 20px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontFamily: "'Merriweather', Georgia, serif",
                                fontSize: '0.8rem',
                                width: '100%',
                                borderRadius: '4px',
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
                    {bannerData && <ReferenceBanner {...bannerData} />}

                    {renderizarTextoConMedios(historia.contenido || historia.cuerpo || t('readNoContent'))}
                    
                    {/* ENLACE Y FUENTE OFICIAL DEL CASO (DOCUMENTACIÓN EXTERNA) */}
                    {(() => {
                        const fuenteReal = historia.fuente_url || historia.url_externa || historia.fuente || null;
                        if (!fuenteReal) return null;
                        const esYt = extractYouTubeId(fuenteReal);
                        // Si es YouTube y además ya tenemos youtube_url específica diferente, podemos seguir mostrando la fuente
                        let dominioFuente = '';
                        try {
                            const urlObj = new URL(fuenteReal.startsWith('http') ? fuenteReal : `https://${fuenteReal}`);
                            dominioFuente = urlObj.hostname.replace('www.', '');
                        } catch (e) {
                            dominioFuente = 'Fuente oficial';
                        }

                        return (
                            <div style={{
                                marginTop: '35px',
                                marginBottom: '25px',
                                padding: '18px 22px',
                                background: '#FFFDF9',
                                border: '1px solid #fed7aa',
                                borderLeft: '4px solid #9c4221',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '15px',
                                boxShadow: '0 2px 10px rgba(0,0,0,0.03)'
                            }}>
                                <div>
                                    <span style={{ display: 'block', color: '#9c4221', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                        📑 DOCUMENTACIÓN Y FUENTE OFICIAL
                                    </span>
                                    <span style={{ color: '#555', fontSize: '0.88rem', fontFamily: 'Merriweather, Georgia, serif' }}>
                                        {dominioFuente ? `Referencia externa verificada: ${dominioFuente}` : 'Acceso a la fuente original del informe'}
                                    </span>
                                </div>
                                <a 
                                    href={fuenteReal} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        textDecoration: 'none',
                                        padding: '10px 20px',
                                        background: '#9c4221',
                                        color: '#FFFFFF',
                                        fontWeight: 'bold',
                                        fontSize: '0.82rem',
                                        letterSpacing: '0.5px',
                                        borderRadius: '4px',
                                        fontFamily: 'monospace',
                                        boxShadow: '0 2px 8px rgba(156, 66, 33, 0.25)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#7c3318'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#9c4221'; }}
                                >
                                    🌐 {language === 'en' ? 'VIEW ORIGINAL SOURCE ↗' : 'CONSULTAR FUENTE ORIGINAL ↗'}
                                </a>
                            </div>
                        );
                    })()}
                    
                    {/* ARCHIVO FOTOGRÁFICO Y GALERÍA DE EVIDENCIAS DEL CASO */}
                    {capturasEvidencias && capturasEvidencias.length > 0 && (
                        <div className="galeria-evidencias-seccion" id="seccion-galeria-evidencias">
                            <div 
                                className="galeria-evidencias-header" 
                                onClick={() => setGaleriaAbierta(!galeriaAbierta)}
                                style={{ cursor: 'pointer', userSelect: 'none' }}
                                title="Haz clic para plegar o desplegar la galería de evidencias"
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>📸 {language === 'en' ? 'PHOTOGRAPHIC EVIDENCE & CASE ARCHIVE' : 'ARCHIVO FOTOGRÁFICO Y EVIDENCIAS DEL CASO'}</span>
                                    <span style={{ fontSize: '0.72rem', opacity: 0.85, color: '#aaa' }}>[{capturasEvidencias.length} {language === 'en' ? 'RECORDS' : 'EVIDENCIAS'}]</span>
                                </div>
                                <button 
                                    type="button" 
                                    style={{ 
                                        background: 'rgba(0, 255, 65, 0.1)', 
                                        color: '#00ff41', 
                                        border: '1px solid rgba(0, 255, 65, 0.35)', 
                                        borderRadius: '4px', 
                                        padding: '4px 12px', 
                                        fontFamily: 'monospace', 
                                        fontSize: '0.75rem', 
                                        fontWeight: 'bold', 
                                        cursor: 'pointer' 
                                    }}
                                >
                                    {galeriaAbierta ? '▲ PLEGAR ARCHIVO' : '▼ DESPLEGAR ARCHIVO'}
                                </button>
                            </div>
                            
                            {galeriaAbierta && (
                                <>
                                    <div className="galeria-evidencias-grid fade-in">
                                        {capturasEvidencias.map((url, idx) => (
                                            <div 
                                                key={idx} 
                                                className="galeria-evidencia-item"
                                                onClick={() => setCapturaExpandida(url)}
                                                title={language === 'en' ? 'Click to inspect in high resolution' : 'Clic para inspeccionar en alta resolución'}
                                            >
                                                <img 
                                                    src={url} 
                                                    alt={`Evidencia ${idx + 1}`} 
                                                    referrerPolicy="no-referrer"
                                                    onError={(e) => { 
                                                        console.error("Fallo carga evidencia:", e.target.src);
                                                        e.target.style.opacity = '0.3';
                                                    }}
                                                />
                                                <span className="galeria-evidencia-badge">
                                                    🔍 EVIDENCIA #{idx + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    <div style={{ marginTop: '14px', textAlign: 'center' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => setGaleriaAbierta(false)}
                                            style={{ 
                                                background: 'rgba(0,0,0,0.5)', 
                                                color: '#aaa', 
                                                border: '1px dashed #444', 
                                                borderRadius: '4px', 
                                                padding: '6px 18px', 
                                                fontFamily: 'monospace', 
                                                fontSize: '0.75rem', 
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.color = '#ff4444'; e.currentTarget.style.borderColor = '#ff4444'; }}
                                            onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.borderColor = '#444'; }}
                                        >
                                            ▲ CERRAR / PLEGAR GALERÍA DE FOTOS
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    
                    {/* REPRODUCTOR DE VÍDEO YOUTUBE OFICIAL */}
                    {(() => {
                        const ytCandidate = historia.youtube_url || 
                                           (historia.fuente_url && /youtu/i.test(historia.fuente_url) ? historia.fuente_url : null) ||
                                           (historia.video_url && /youtu/i.test(historia.video_url) ? historia.video_url : null) ||
                                           (historia.url && /youtu/i.test(historia.url) ? historia.url : null);
                        const videoId = extractYouTubeId(ytCandidate);
                        if (!videoId) return null;
                        return (
                            <div style={{ margin: '30px 0', textAlign: 'center' }}>
                                <div style={{
                                    position: 'relative',
                                    paddingBottom: '56.25%',
                                    height: 0,
                                    overflow: 'hidden',
                                    borderRadius: '8px',
                                    border: '1px solid #E2E8F0',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                                    maxWidth: '680px',
                                    margin: '0 auto',
                                    background: '#000'
                                }}>
                                    <iframe 
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: '100%',
                                            border: 0
                                        }}
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        title="Video YouTube - Expediente X Granaíno"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                                <p style={{ color: '#9c4221', fontSize: '0.8rem', marginTop: '10px', fontFamily: 'monospace', letterSpacing: '1px', fontWeight: 'bold' }}>
                                    🎬 VÍDEO DEL EXPEDIENTE (CANAL OFICIAL)
                                </p>
                            </div>
                        );
                    })()}

                    {/* SECCIÓN DE APOYO / PROPINA KO-FI */}
                    <div style={{ marginTop: '35px', padding: '22px 24px', background: '#FFF7ED', border: '1px solid #fed7aa', borderRadius: '8px', textAlign: 'center' }}>
                        <p style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 'bold', color: '#9c4221', fontFamily: 'Merriweather, serif' }}>
                            ☕ ¿Te ha gustado este artículo?
                        </p>
                        <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#444', fontFamily: 'Merriweather, serif', lineHeight: '1.6' }}>
                            Si puedes y quieres, una pequeña propina ayuda mucho a mantener el servidor y seguir investigando. ¡Gracias por tu apoyo!
                        </p>
                        <a
                            href="https://ko-fi.com/expedientexgranaino"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-kofi-cafe"
                            style={{ display: 'inline-block', background: '#9c4221', color: '#fff', padding: '10px 24px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.82rem', letterSpacing: '0.5px', textDecoration: 'none' }}
                        >
                            ☕ INVÍTANOS A UN CAFÉ
                        </a>
                    </div>

                    {/* SECCIÓN DE COMPARTIR EDITORIAL */}
                    <div style={{ marginTop: '35px', paddingTop: '25px', borderTop: '1px solid rgba(0,0,0,0.08)', textAlign: 'center' }}>
                        <p style={{ color: '#64748B', fontSize: '0.78rem', marginBottom: '14px', fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase' }}>
                            {language === 'en' ? 'SHARE THIS INVESTIGATION' : 'DIFUNDIR ESTA INVESTIGACIÓN'}
                        </p>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => compartirHistoria('whatsapp')} className="btn-share-editorial share-whatsapp" title="Compartir en WhatsApp">
                                <span style={{ color: '#25D366', fontSize: '0.95rem' }}>💬</span> WhatsApp
                            </button>
                            <button onClick={() => compartirHistoria('facebook')} className="btn-share-editorial share-facebook" title="Compartir en Facebook">
                                <span style={{ color: '#1877F2', fontSize: '0.95rem' }}>📘</span> Facebook
                            </button>
                            <button onClick={() => compartirHistoria('fbhistoria')} className="btn-share-editorial share-fbhistoria" title="Compartir en Historia">
                                <span style={{ color: '#0084FF', fontSize: '0.95rem' }}>📖</span> Historia
                            </button>
                            <button onClick={() => compartirHistoria('twitter')} className="btn-share-editorial share-twitter" title="Publicar en X (Twitter)">
                                <span style={{ color: '#1E293B', fontSize: '0.9rem' }}>𝕏</span> X (Twitter)
                            </button>
                            <button onClick={() => compartirHistoria('pinterest')} className="btn-share-editorial share-pinterest" title="Guardar en Pinterest">
                                <span style={{ color: '#E60023', fontSize: '0.95rem' }}>📌</span> Pinterest
                            </button>
                            <a 
                                href="https://www.tiktok.com/@expedientexgranaino" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn-share-editorial share-tiktok"
                                style={{ textDecoration: 'none', color: '#1E293B' }}
                                title="Síguenos en TikTok"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#010101"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.47 6.27 6.27 0 0 0 1.96-4.47V8.52a8.27 8.27 0 0 0 4.81 1.54V6.69z"/></svg> TikTok
                            </a>
                            <a 
                                href="https://www.youtube.com/@expedientexgranaino" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="btn-share-editorial share-youtube"
                                style={{ textDecoration: 'none', color: '#1E293B' }}
                                title="Canal oficial en YouTube"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#CC0000"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg> YouTube
                            </a>
                            <button onClick={() => compartirHistoria('copiar')} className="btn-share-editorial share-copiar" title="Copiar enlace al portapapeles">
                                <span style={{ color: '#64748B', fontSize: '0.95rem' }}>🔗</span> Copiar Enlace
                            </button>
                        </div>
                    </div>

                    {/* 🎰 BANNER COMPACTO, RELATIVO Y MODERNO: LA RULETA DEL BÚNKER */}
                    <div className="ruleta-strip-banner">
                        <div className="ruleta-strip-info">
                            <div className="ruleta-strip-icon">🎲</div>
                            <div>
                                <div className="ruleta-strip-tag">
                                    {language === 'en' ? 'BUNKER RADAR · RANDOM ACCESS' : 'RADAR DEL BÚNKER · ACCESO ALEATORIO'}
                                </div>
                                <h4 className="ruleta-strip-title">
                                    {language === 'en' ? 'Let the Bunker pick your next secret dossier' : '¿Dejar que el azar elija tu próximo misterio?'}
                                </h4>
                                <p className="ruleta-strip-sub">
                                    {language === 'en' ? 'Spin the wheel and declassify an unexpected case' : 'Gira la ruleta y desclasifica un expediente al azar'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                navigate('/la-ruleta');
                            }}
                            className="ruleta-strip-btn"
                        >
                            {language === 'en' ? 'GIRAR RULETA ➔' : 'GIRAR RULETA ➔'}
                        </button>
                    </div>
                </div>
                
                {/* LAYOUT DE PIE DE EXPEDIENTE: LIBROS RECOMENDADOS */}
                {biblioData && (
                    <div className="lectura-historia-footer-layout" style={{
                        marginTop: '40px',
                        width: '100%',
                        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                        paddingTop: '25px'
                    }}>
                        <ReferenceBibliography libros={biblioData} customStyle={{ marginTop: 0, paddingTop: 0, borderTop: 'none' }} />
                    </div>
                )}
                {renderComentariosBox(false)}

                {/* SI TE GUSTÓ ESTE MISTERIO... ARTÍCULOS RELACIONADOS */}
                <ArticulosRelacionados currentId={id} currentSrc={src} />

            </div>

            {/* MODAL LIGHTBOX DE INSPECCIÓN DE EVIDENCIA CON NAVEGACIÓN */}
            {capturaExpandida && (() => {
                const indiceActual = capturasEvidencias.indexOf(capturaExpandida);
                const total = capturasEvidencias.length;

                return (
                    <div 
                        className="modal-evidencia-lightbox fade-in" 
                        onClick={() => setCapturaExpandida(null)}
                        style={{ cursor: 'pointer' }}
                    >
                        {/* Botón flotante siempre visible y fijo en la esquina superior derecha */}
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setCapturaExpandida(null);
                            }}
                            style={{
                                position: 'fixed',
                                top: '20px',
                                right: '25px',
                                background: '#ef4444',
                                color: '#ffffff',
                                border: '2px solid #ffffff',
                                width: '46px',
                                height: '46px',
                                borderRadius: '50%',
                                fontSize: '1.4rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.7)',
                                zIndex: 9999999,
                                transition: 'all 0.2s ease'
                            }}
                            title={language === 'en' ? 'Close (Esc)' : 'Cerrar (Esc)'}
                            aria-label="Cerrar"
                        >
                            ✕
                        </button>

                        {/* FLECHA ANTERIOR (◀) */}
                        {total > 1 && (
                            <button
                                type="button"
                                onClick={irAnteriorEvidencia}
                                style={{
                                    position: 'fixed',
                                    left: '20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'rgba(0, 0, 0, 0.75)',
                                    color: '#00ff41',
                                    border: '2px solid rgba(0, 255, 65, 0.5)',
                                    width: '54px',
                                    height: '54px',
                                    borderRadius: '50%',
                                    fontSize: '1.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                                    zIndex: 9999999,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#00ff41'; e.currentTarget.style.color = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)'; e.currentTarget.style.color = '#00ff41'; }}
                                title={language === 'en' ? 'Previous evidence (←)' : 'Evidencia anterior (←)'}
                                aria-label="Anterior"
                            >
                                ◀
                            </button>
                        )}

                        {/* FLECHA SIGUIENTE (▶) */}
                        {total > 1 && (
                            <button
                                type="button"
                                onClick={irSiguienteEvidencia}
                                style={{
                                    position: 'fixed',
                                    right: '20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'rgba(0, 0, 0, 0.75)',
                                    color: '#00ff41',
                                    border: '2px solid rgba(0, 255, 65, 0.5)',
                                    width: '54px',
                                    height: '54px',
                                    borderRadius: '50%',
                                    fontSize: '1.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
                                    zIndex: 9999999,
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#00ff41'; e.currentTarget.style.color = '#000'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.75)'; e.currentTarget.style.color = '#00ff41'; }}
                                title={language === 'en' ? 'Next evidence (→)' : 'Evidencia siguiente (→)'}
                                aria-label="Siguiente"
                            >
                                ▶
                            </button>
                        )}

                        <div 
                            className="modal-evidencia-box" 
                            onClick={e => e.stopPropagation()} 
                            style={{ cursor: 'default', textAlign: 'center', position: 'relative' }}
                        >
                            <img 
                                src={capturaExpandida} 
                                alt="Evidencia ampliada" 
                                style={{ maxHeight: '78vh', maxWidth: '84vw', objectFit: 'contain', borderRadius: '6px', border: '1px solid rgba(0, 255, 65, 0.4)', boxShadow: '0 8px 30px rgba(0,0,0,0.8)' }}
                            />
                            
                            {/* INDICADOR DE FOTOGRAMA Y BOTONES INFERIORES */}
                            <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                                {total > 1 && (
                                    <button
                                        type="button"
                                        onClick={irAnteriorEvidencia}
                                        style={{
                                            background: '#0d1410',
                                            color: '#00ff41',
                                            border: '1px solid rgba(0, 255, 65, 0.4)',
                                            padding: '8px 18px',
                                            borderRadius: '20px',
                                            fontWeight: 'bold',
                                            fontFamily: 'monospace',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        ◀ ANTERIOR
                                    </button>
                                )}

                                <span style={{ color: '#00ff41', fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                                    EVIDENCIA {indiceActual !== -1 ? indiceActual + 1 : 1} / {total}
                                </span>

                                {total > 1 && (
                                    <button
                                        type="button"
                                        onClick={irSiguienteEvidencia}
                                        style={{
                                            background: '#0d1410',
                                            color: '#00ff41',
                                            border: '1px solid rgba(0, 255, 65, 0.4)',
                                            padding: '8px 18px',
                                            borderRadius: '20px',
                                            fontWeight: 'bold',
                                            fontFamily: 'monospace',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem'
                                        }}
                                    >
                                        SIGUIENTE ▶
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={() => setCapturaExpandida(null)}
                                    style={{
                                        background: '#ef4444',
                                        color: '#ffffff',
                                        border: '1px solid #f87171',
                                        padding: '8px 20px',
                                        borderRadius: '20px',
                                        fontWeight: '800',
                                        fontFamily: 'monospace',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem',
                                        letterSpacing: '1px',
                                        marginLeft: '10px'
                                    }}
                                >
                                    ✕ CERRAR
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default LecturaHistoria;
