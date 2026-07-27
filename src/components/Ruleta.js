import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './ruleta.css';

// ============================================
// 🎡 LA RULETA DEL BÚNKER
// ============================================

const SECTORES = [
    { id: 'expedientes', nombre: 'EXPEDIENTES', nombreEn: 'DOSSIERS', icono: '🛸', color: '#003322', colorBorde: '#00ff41' },
    { id: 'casos', nombre: 'CRÓNICA NEGRA', nombreEn: 'TRUE CRIME', icono: '🔪', color: '#330011', colorBorde: '#ff0033' },
    { id: 'misterios', nombre: 'MISTERIOS', nombreEn: 'MYSTERIES', icono: '🏛️', color: '#1a1a00', colorBorde: '#ffcc00' },
    { id: 'noticias', nombre: 'NOTICIAS', nombreEn: 'NEWS', icono: '📡', color: '#001a33', colorBorde: '#00d4ff' },
    { id: 'sorpresa', nombre: 'SORPRESA', nombreEn: 'SURPRISE', icono: '🎲', color: '#1a0033', colorBorde: '#aa00ff' }
];

const NUM_SECTORES = SECTORES.length;
const ANGULO_SECTOR = 360 / NUM_SECTORES; // 72°

// ============================================
// Web Audio API — Efectos de sonido sin archivos
// ============================================
const crearContextoAudio = () => {
    try {
        return new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        return null;
    }
};

const sonidoTick = (audioCtx) => {
    if (!audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 800 + Math.random() * 400;
        osc.type = 'square';
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.05);
    } catch (e) { /* silencioso */ }
};

const sonidoConfirmacion = (audioCtx) => {
    if (!audioCtx) return;
    try {
        // Nota grave de confirmación
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.frequency.value = 220;
        osc1.type = 'triangle';
        gain1.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc1.start(audioCtx.currentTime);
        osc1.stop(audioCtx.currentTime + 0.4);

        // Nota aguda armónica
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.value = 440;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.08, audioCtx.currentTime + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc2.start(audioCtx.currentTime + 0.05);
        osc2.stop(audioCtx.currentTime + 0.5);
    } catch (e) { /* silencioso */ }
};

// ============================================
// COMPONENTE SVG DE LA RULETA
// ============================================
const RuletaSVG = ({ rotacion }) => {
    const cx = 160, cy = 160, r = 155;

    const crearSector = (index) => {
        const sector = SECTORES[index];
        const startAngle = index * ANGULO_SECTOR - 90; // -90 para empezar arriba
        const endAngle = startAngle + ANGULO_SECTOR;

        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;

        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);

        const largeArc = ANGULO_SECTOR > 180 ? 1 : 0;

        const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        // Posición del texto (centro del sector)
        const midAngle = ((startAngle + endAngle) / 2 * Math.PI) / 180;
        const textR = r * 0.6;
        const iconR = r * 0.42;
        const tx = cx + textR * Math.cos(midAngle);
        const ty = cy + textR * Math.sin(midAngle);
        const ix = cx + iconR * Math.cos(midAngle);
        const iy = cy + iconR * Math.sin(midAngle);

        const textAngle = (startAngle + endAngle) / 2;

        return (
            <g key={sector.id}>
                {/* Gradiente para el sector */}
                <defs>
                    <radialGradient id={`grad-${sector.id}`} cx="50%" cy="50%" r="70%">
                        <stop offset="0%" stopColor={sector.color} stopOpacity="1" />
                        <stop offset="100%" stopColor="#050505" stopOpacity="1" />
                    </radialGradient>
                </defs>
                {/* Sector */}
                <path
                    d={d}
                    fill={`url(#grad-${sector.id})`}
                    stroke={sector.colorBorde}
                    strokeWidth="1.5"
                    className="sector-path"
                    strokeOpacity="0.6"
                />
                {/* Icono */}
                <text
                    x={ix}
                    y={iy}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="sector-icon"
                    fontSize="22"
                    transform={`rotate(${textAngle}, ${ix}, ${iy})`}
                >
                    {sector.icono}
                </text>
                {/* Nombre */}
                <text
                    x={tx}
                    y={ty}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="sector-label"
                    fontSize="9"
                    fill={sector.colorBorde}
                    transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                >
                    {sector.nombre}
                </text>
            </g>
        );
    };

    return (
        <svg
            className={`ruleta-svg`}
            viewBox="0 0 320 320"
            style={{ transform: `rotate(${rotacion}deg)` }}
        >
            {/* Fondo del círculo */}
            <circle cx={cx} cy={cy} r={r + 2} fill="#0a0a0a" stroke="#1a1a1a" strokeWidth="2" />
            {/* Sectores */}
            {SECTORES.map((_, i) => crearSector(i))}
            {/* Centro decorativo */}
            <circle cx={cx} cy={cy} r="52" fill="#0a0a0a" stroke="#00ff41" strokeWidth="2" opacity="0.8" />
            <circle cx={cx} cy={cy} r="48" fill="#050505" stroke="rgba(0,255,65,0.2)" strokeWidth="1" />
        </svg>
    );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const Ruleta = () => {
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [rotacion, setRotacion] = useState(0);
    const [girando, setGirando] = useState(false);
    const [resultado, setResultado] = useState(null);
    const [mostrarModal, setMostrarModal] = useState(false);
    const [girosTotal, setGirosTotal] = useState(0);
    const audioCtxRef = useRef(null);
    const tickIntervalRef = useRef(null);

    // Limpiar intervalos al desmontar
    useEffect(() => {
        return () => {
            if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
        };
    }, []);

    const resolverImagen = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        if (url.startsWith('/')) return `${API_BASE_URL}${url}`;
        return `${API_BASE_URL}/${url}`;
    };

    const categoriaNombres = {
        expedientes: language === 'en' ? 'DOSSIERS' : 'EXPEDIENTES',
        casos: language === 'en' ? 'TRUE CRIME' : 'CRÓNICA NEGRA',
        misterios: language === 'en' ? 'MYSTERIES' : 'MISTERIOS HISTÓRICOS',
        noticias: language === 'en' ? 'NEWS' : 'NOTICIAS',
        sorpresa: language === 'en' ? 'SURPRISE' : 'SORPRESA'
    };

    const girarRuleta = useCallback(async () => {
        if (girando) return;

        // Inicializar audio al primer clic del usuario (requisito navegadores)
        if (!audioCtxRef.current) {
            audioCtxRef.current = crearContextoAudio();
        }

        setGirando(true);
        setMostrarModal(false);
        setResultado(null);

        // Elegir sector aleatorio
        const sectorGanador = Math.floor(Math.random() * NUM_SECTORES);
        const categoriaGanadora = SECTORES[sectorGanador].id;

        // Calcular ángulo final (mínimo 5 vueltas completas + offset al sector)
        const vueltasBase = 5 + Math.floor(Math.random() * 3); // 5-7 vueltas
        const offsetSector = sectorGanador * ANGULO_SECTOR + ANGULO_SECTOR / 2;
        // La flecha está arriba (0°), la ruleta se numera desde arriba en sentido horario
        // Para que el sector quede arriba, rotamos: vueltasBase*360 + (360 - offsetSector)
        const anguloFinal = rotacion + vueltasBase * 360 + (360 - offsetSector) - (rotacion % 360);

        // Sonido de ticks durante el giro
        let tickCount = 0;
        const maxTicks = 40;
        tickIntervalRef.current = setInterval(() => {
            tickCount++;
            sonidoTick(audioCtxRef.current);
            if (tickCount >= maxTicks) {
                clearInterval(tickIntervalRef.current);
            }
        }, 80 + tickCount * 3);

        // Aplicar rotación (la transición CSS se encarga de la animación)
        setRotacion(anguloFinal);

        // Esperar a que termine la animación (4s como en CSS)
        setTimeout(async () => {
            if (tickIntervalRef.current) clearInterval(tickIntervalRef.current);
            sonidoConfirmacion(audioCtxRef.current);

            // Llamar a la API
            try {
                const res = await axios.get(`${API_BASE_URL}/api/ruleta/aleatorio?categoria=${categoriaGanadora}`);
                setResultado(res.data);
                setMostrarModal(true);
                setGirosTotal(prev => prev + 1);
            } catch (err) {
                console.error('Error al obtener resultado de la ruleta:', err);
                // Intentar con sorpresa como fallback
                try {
                    const res2 = await axios.get(`${API_BASE_URL}/api/ruleta/aleatorio?categoria=sorpresa`);
                    setResultado(res2.data);
                    setMostrarModal(true);
                    setGirosTotal(prev => prev + 1);
                } catch (err2) {
                    alert(language === 'en'
                        ? '⚠️ Connection error. Try again.'
                        : '⚠️ Error de conexión con el búnker. Inténtalo de nuevo.');
                }
            }

            setGirando(false);
        }, 4200);

    }, [girando, rotacion, language]);

    const cerrarModal = () => {
        setMostrarModal(false);
    };

    const volverAGirar = () => {
        setMostrarModal(false);
        setResultado(null);
        // Pequeño delay para que se vea cerrar el modal
        setTimeout(() => girarRuleta(), 300);
    };

    const abrirExpediente = () => {
        if (resultado) {
            navigate(`/leer-historia/${resultado.id}?src=${resultado.src || resultado.categoria}`);
        }
    };

    return (
        <div className="ruleta-container">
            {/* Navegación */}
            <div className="ruleta-nav">
                <Link to="/" className="btn-volver-bunker-ruleta">
                    <ArrowLeft size={18} /> {language === 'en' ? 'BACK TO BUNKER' : 'VOLVER AL BÚNKER'}
                </Link>
            </div>

            {/* Header */}
            <div className="ruleta-header">
                <h1>🎡 {language === 'en' ? 'THE BUNKER ROULETTE' : 'LA RULETA DEL BÚNKER'}</h1>
                <p className="ruleta-subtitle">
                    {language === 'en'
                        ? '[ RANDOM CONTENT RADAR — SPIN TO DISCOVER ]'
                        : '[ RADAR DE CONTENIDO ALEATORIO — GIRA Y DESCUBRE ]'}
                </p>
            </div>

            {/* Instrucciones */}
            <div className="ruleta-instrucciones">
                <p>
                    {language === 'en'
                        ? <>Press the central button and the <span className="destacado">classified radar</span> will select a random dossier from our archives. What will the wheel reveal?</>
                        : <>Pulsa el botón central y el <span className="destacado">radar clasificado</span> seleccionará un expediente aleatorio de nuestros archivos. ¿Qué revelará la ruleta?</>
                    }
                </p>
            </div>

            {/* Ruleta */}
            <div className="ruleta-wheel-wrapper">
                {/* Flecha indicadora */}
                <svg className="ruleta-indicator" width="30" height="24" viewBox="0 0 30 24">
                    <polygon points="15,24 0,0 30,0" fill="#ff0033" />
                </svg>

                <div className="ruleta-wheel-container">
                    <RuletaSVG rotacion={rotacion} />
                    <button
                        className="ruleta-btn-girar"
                        onClick={girarRuleta}
                        disabled={girando}
                    >
                        {girando
                            ? (language === 'en' ? 'SCANNING...' : 'RASTREANDO...')
                            : (language === 'en' ? 'SPIN\nRADAR' : 'GIRAR\nRADAR')
                        }
                    </button>
                </div>
            </div>

            {/* Estadísticas */}
            {girosTotal > 0 && (
                <div className="ruleta-stats">
                    <div className="stat-item">
                        <span className="stat-value">{girosTotal}</span>
                        <span className="stat-label">{language === 'en' ? 'Spins' : 'Giros'}</span>
                    </div>
                </div>
            )}

            {/* Contenido SEO */}
            <div className="ruleta-seo-content">
                {language === 'en' ? (
                    <>
                        <h2>🎡 The Bunker Roulette — Discover Hidden Content</h2>
                        <p>
                            The <strong>Bunker Roulette</strong> is our exclusive exploration tool designed for those agents
                            who dare to let fate decide what to read next. With a single spin, you can uncover classified
                            <strong> UFO dossiers</strong>, <strong>true crime investigations</strong>, <strong>historical
                            mysteries</strong> or <strong>paranormal news</strong> from our archives.
                        </p>
                        <p>
                            Each spin randomly selects a published article from our database of over 150 entries. The
                            <strong> SURPRISE</strong> sector adds an extra layer of mystery: neither the category nor
                            the specific article is known until the wheel stops spinning. It&apos;s the ultimate way to
                            explore the unknown depths of Expediente X Granaíno.
                        </p>
                    </>
                ) : (
                    <>
                        <h2>🎡 La Ruleta del Búnker — Descubre Contenido Oculto</h2>
                        <p>
                            La <strong>Ruleta del Búnker</strong> es nuestra herramienta exclusiva de exploración diseñada
                            para aquellos agentes que se atreven a dejar que el destino decida qué leer a continuación.
                            Con un solo giro, puedes desenterrar <strong>expedientes OVNI clasificados</strong>,
                            <strong> investigaciones de crónica negra</strong>, <strong>misterios históricos</strong>
                            o <strong>noticias paranormales</strong> de nuestros archivos.
                        </p>
                        <p>
                            Cada giro selecciona aleatoriamente un artículo publicado de nuestra base de datos con más de
                            150 entradas. El sector <strong>SORPRESA</strong> añade una capa extra de misterio: ni la
                            categoría ni el artículo concreto se conocen hasta que la ruleta se detiene. Es la forma
                            definitiva de explorar las profundidades desconocidas de Expediente X Granaíno.
                        </p>
                    </>
                )}
            </div>

            {/* Modal de resultado */}
            {mostrarModal && resultado && (
                <div className="ruleta-modal-overlay" onClick={cerrarModal}>
                    <div className="ruleta-modal" onClick={(e) => e.stopPropagation()}>
                        <span className="modal-sello">
                            {language === 'en' ? 'CLASSIFIED' : 'CONFIDENCIAL'}
                        </span>

                        {/* Header bar */}
                        <div className="modal-header-bar">
                            <span className="modal-categoria-badge">
                                {categoriaNombres[resultado.categoria] || resultado.categoria}
                            </span>
                            <span className="modal-fecha">
                                {resultado.fecha
                                    ? new Date(resultado.fecha).toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES')
                                    : ''}
                            </span>
                        </div>

                        {/* Imagen */}
                        {resultado.imagen_url && (
                            <div className="modal-imagen-wrapper">
                                <img
                                    src={resolverImagen(resultado.imagen_url)}
                                    alt={resultado.titulo}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>
                        )}

                        {/* Contenido */}
                        <div className="modal-body">
                            <h3 className="modal-titulo">{resultado.titulo}</h3>
                            <p className="modal-extracto">{resultado.contenido}</p>
                        </div>

                        {/* Botones */}
                        <div className="modal-acciones">
                            <button className="btn-abrir-expediente" onClick={abrirExpediente}>
                                📖 {language === 'en' ? 'OPEN DOSSIER' : 'ABRIR EXPEDIENTE'}
                            </button>
                            <button className="btn-volver-girar" onClick={volverAGirar}>
                                🔄 {language === 'en' ? 'SPIN AGAIN' : 'GIRAR DE NUEVO'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ruleta;
