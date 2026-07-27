import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { ArrowLeft, X } from 'lucide-react';
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
            if (resultado.src === 'especial-atarfe') {
                navigate('/especial-atarfe');
            } else {
                navigate(`/leer-historia/${resultado.id}?src=${resultado.src || resultado.categoria}`);
            }
        }
    };

    const compartirRuleta = (red, articuloConcreto = false) => {
        let url, textoCompartir;

        if (articuloConcreto && resultado) {
            if (resultado.src === 'especial-atarfe') {
                url = `${window.location.origin}/especial-atarfe`;
            } else {
                url = `${window.location.origin}/leer-historia/${resultado.id}?src=${resultado.src || resultado.categoria}`;
            }
            textoCompartir = language === 'en'
                ? `🎡 The Bunker Roulette chose: "${(resultado.titulo || '').toUpperCase()}" — Spin yours! 🛸 #ExpedienteXGranaino`
                : `🎡 La Ruleta del Búnker ha elegido: "${(resultado.titulo || '').toUpperCase()}" — ¡Gira la tuya! 🛸 #ExpedienteXGranaino #MisterioGranadino`;
        } else {
            url = `${window.location.origin}/la-ruleta`;
            textoCompartir = language === 'en'
                ? '🎡 Spin the Bunker Roulette and discover random UFO dossiers, true crime cases and mysteries! 🛸 #ExpedienteXGranaino'
                : '🎡 ¡Gira la Ruleta del Búnker y descubre expedientes OVNI, crónica negra y misterios al azar! 🛸 #ExpedienteXGranaino #MisterioGranadino';
        }

        if (red === 'copiar') {
            try {
                navigator.clipboard.writeText(url);
                alert(language === 'en'
                    ? '📋 Link copied to clipboard!'
                    : '📋 ¡Enlace copiado al portapapeles!');
            } catch (err) {
                alert(language === 'en'
                    ? 'Could not copy the link automatically.'
                    : 'No se pudo copiar el enlace automáticamente.');
            }
            return;
        }

        if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            try {
                navigator.share({ title: 'La Ruleta del Búnker', text: textoCompartir, url });
                return;
            } catch (err) { /* fallback */ }
        }

        let link = '';
        if (red === 'whatsapp') {
            link = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoCompartir + ' ' + url)}`;
        } else if (red === 'facebook') {
            link = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        } else if (red === 'twitter') {
            link = `https://x.com/intent/tweet?text=${encodeURIComponent(textoCompartir)}&url=${encodeURIComponent(url)}`;
        }
        if (link) window.open(link, '_blank', 'noopener,noreferrer');
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
                <div className="ruleta-hero-img">
                    <img src="/assets/ruleta_bunker.jpg" alt="La Ruleta del Búnker — Expediente X Granaíno" />
                </div>
            </div>

            {/* Instrucciones */}
            <div className="ruleta-instrucciones">
                {language === 'en' ? (
                    <>
                        <p>
                            <span className="destacado">100% free, no registration required.</span> If you love mystery, the paranormal and true crime
                            but don't know where to start or don't want to browse articles one by one, <strong>the Bunker Roulette</strong> is
                            your best ally. One spin and our classified radar picks a random dossier from our entire archive.
                        </p>
                        <p>
                            Don't like what came up? <span className="destacado">Spin again!</span> There are no limits — keep spinning
                            until you find the case that hooks you. Over <strong>150 articles</strong> about UFOs, unsolved crimes,
                            historical enigmas and paranormal news, all at one click away.
                        </p>
                    </>
                ) : (
                    <>
                        <p>
                            <span className="destacado">Totalmente gratis, sin registro ni suscripción.</span> Si te apasiona el misterio,
                            lo paranormal y la crónica negra pero no sabes por dónde empezar o no quieres ir artículo por artículo,
                            <strong> la Ruleta del Búnker</strong> es tu mejor aliada. Un solo giro y nuestro radar clasificado
                            elige un expediente al azar de todo nuestro archivo.
                        </p>
                        <p>
                            ¿No te convence lo que ha salido? <span className="destacado">¡Vuelve a girar!</span> No hay límites
                            — dale las veces que quieras hasta dar con el caso que te enganche. Más de <strong>150 artículos</strong> sobre
                            OVNIs, crímenes sin resolver, enigmas históricos y noticias paranormales, todo a un solo clic.
                        </p>
                    </>
                )}
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

            {/* Compartir La Ruleta */}
            <div className="ruleta-compartir">
                <p className="compartir-titulo">{language === 'en' ? '📢 SHARE THE ROULETTE' : '📢 COMPARTE LA RULETA'}</p>
                <div className="compartir-botones">
                    <button onClick={() => compartirRuleta('whatsapp')} className="btn-share btn-share-whatsapp" title="WhatsApp">💬</button>
                    <button onClick={() => compartirRuleta('facebook')} className="btn-share btn-share-facebook" title="Facebook">📘</button>
                    <button onClick={() => compartirRuleta('twitter')} className="btn-share btn-share-twitter" title="X / Twitter">🐦</button>
                    <button onClick={() => compartirRuleta('copiar')} className="btn-share btn-share-copiar" title={language === 'en' ? 'Copy link' : 'Copiar enlace'}>📋</button>
                </div>
            </div>

            {/* Contenido SEO */}
            <div className="ruleta-seo-content">
                {language === 'en' ? (
                    <>
                        <h2>🎡 The Bunker Roulette — Your Free Gateway to the Unknown</h2>
                        <p>
                            The <strong>Bunker Roulette</strong> was created so you don&apos;t have to scroll through endless lists
                            looking for something interesting. We built it for one simple reason: <strong>if you love mystery,
                            you deserve a faster, more fun way to explore.</strong> One spin and the wheel selects a random
                            article from our complete archive of classified dossiers.
                        </p>
                        <p>
                            This tool is <strong>completely free</strong>, requires no registration, no subscription and no download.
                            Just press the button and let the radar do the work. Each spin pulls from our database of over
                            <strong> 150 published articles</strong> spanning four categories: <strong>UFO dossiers</strong> with
                            field reports and eyewitness accounts, <strong>true crime</strong> investigations of unsolved cases,
                            <strong> historical mysteries</strong> full of ancient legends and haunted places, and <strong>paranormal
                            news</strong> covering the latest UAP sightings and official declassifications.
                        </p>
                        <p>
                            The <strong>SURPRISE</strong> sector is the wildcard — the system picks a random category first,
                            then a random article from that category. You won&apos;t know what&apos;s coming until the wheel stops.
                            And if the result doesn&apos;t grab you? <strong>Just spin again.</strong> There are no limits, no cooldowns,
                            no hidden costs. Spin as many times as you want.
                        </p>
                        <p>
                            Found something you love? Share it directly on <strong>WhatsApp, Facebook or Twitter</strong> with the
                            built-in share buttons. Every article opens its own dedicated page with the full text, images, maps
                            and recommended reading — ready to be explored in depth.
                        </p>
                        <h2>Why We Built the Roulette</h2>
                        <p>
                            At <strong>Expediente X Granaíno</strong> we believe that the best discoveries happen by chance.
                            Many of our readers told us they didn&apos;t know which article to read first. The roulette solves that:
                            it removes the paradox of choice and turns browsing into a game. Whether you have five minutes or
                            an entire evening, one spin is all it takes to fall into a rabbit hole of mystery.
                        </p>
                    </>
                ) : (
                    <>
                        <h2>🎡 La Ruleta del Búnker — Tu Acceso Gratuito a lo Desconocido</h2>
                        <p>
                            La <strong>Ruleta del Búnker</strong> se creó para que no tengas que recorrer listas interminables
                            buscando algo interesante. La construimos por una razón muy sencilla: <strong>si te apasiona el
                            misterio, mereces una forma más rápida y divertida de explorar.</strong> Un giro y la ruleta
                            selecciona un artículo al azar de todo nuestro archivo de expedientes clasificados.
                        </p>
                        <p>
                            Esta herramienta es <strong>completamente gratuita</strong>, no requiere registro, ni suscripción,
                            ni descarga de ningún tipo. Solo pulsa el botón y deja que el radar haga el trabajo. Cada giro
                            extrae de nuestra base de datos con más de <strong>150 artículos publicados</strong> repartidos
                            en cuatro categorías: <strong>expedientes OVNI</strong> con informes de campo y testimonios de
                            testigos, <strong>crónica negra</strong> con investigaciones de casos sin resolver,
                            <strong> misterios históricos</strong> llenos de leyendas ancestrales y lugares encantados,
                            y <strong>noticias paranormales</strong> con los últimos avistamientos y desclasificaciones oficiales.
                        </p>
                        <p>
                            El sector <strong>SORPRESA</strong> es el comodín: el sistema elige primero una categoría al azar
                            y después un artículo aleatorio dentro de esa categoría. No sabrás qué viene hasta que la ruleta
                            se detenga. ¿Y si el resultado no te convence? <strong>Vuelve a girar sin límite.</strong> No hay
                            restricciones, ni tiempos de espera, ni costes ocultos. Gira todas las veces que quieras.
                        </p>
                        <p>
                            ¿Has encontrado algo que te ha enganchado? Compártelo directamente en <strong>WhatsApp, Facebook
                            o Twitter</strong> con los botones de compartir integrados. Cada artículo se abre en su propia
                            página dedicada con el texto completo, imágenes, mapas y lecturas recomendadas — listo para
                            investigar a fondo.
                        </p>
                        <h2>Por Qué Creamos la Ruleta</h2>
                        <p>
                            En <strong>Expediente X Granaíno</strong> creemos que los mejores descubrimientos ocurren por
                            casualidad. Muchos de nuestros lectores nos decían que no sabían qué artículo leer primero.
                            La ruleta resuelve eso: elimina la parálisis de elección y convierte la navegación en un juego.
                            Tanto si tienes cinco minutos como una tarde entera, un solo giro es todo lo que necesitas para
                            caer en la madriguera del misterio.
                        </p>
                    </>
                )}
            </div>

            {/* Modal de resultado */}
            {mostrarModal && resultado && (
                <div className="ruleta-modal-overlay" onClick={cerrarModal}>
                    <div className="ruleta-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={cerrarModal} title={language === 'en' ? 'Close' : 'Cerrar'}>
                            <X size={18} />
                        </button>
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

                        {/* Compartir resultado */}
                        <div className="modal-compartir">
                            <p className="compartir-titulo-modal">{language === 'en' ? '📢 SHARE THIS FIND' : '📢 COMPARTE ESTE HALLAZGO'}</p>
                            <div className="compartir-botones">
                                <button onClick={() => compartirRuleta('whatsapp', true)} className="btn-share btn-share-whatsapp" title="WhatsApp">💬</button>
                                <button onClick={() => compartirRuleta('facebook', true)} className="btn-share btn-share-facebook" title="Facebook">📘</button>
                                <button onClick={() => compartirRuleta('twitter', true)} className="btn-share btn-share-twitter" title="X / Twitter">🐦</button>
                                <button onClick={() => compartirRuleta('copiar', true)} className="btn-share btn-share-copiar" title={language === 'en' ? 'Copy link' : 'Copiar enlace'}>📋</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Ruleta;
