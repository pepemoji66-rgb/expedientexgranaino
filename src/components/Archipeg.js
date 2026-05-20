import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';
import { Shield, HardDrive, Map, Users, Calendar, Lock, Unlock, Download, Mail, Smartphone, Play, Volume2, VolumeX, Loader2, Eye, X, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../config';
import './archipeg.css';

const Archipeg = ({ userAuth }) => {
    const { t, language } = useLanguage();
    const [solicitudes, setSolicitudes] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [cargandoEstado, setCargandoEstado] = useState(false);
    const [mensajeFeedback, setMensajeFeedback] = useState({ tipo: '', texto: '' });
    
    // Estados de la presentación interactiva
    const [showPresentation, setShowPresentation] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const audioRef = useRef(null);
    const [audioStarted, setAudioStarted] = useState(false);

    const slides = [
        {
            title: "ARCHIPEG PRO",
            text: language === 'en'
                ? "Where technology meets your most valuable photos and videos. Rediscover your personal history with intelligence and elegance."
                : "Donde la tecnología se encuentra con tus fotos y vídeos más valiosos. Redescubre tu historia personal con inteligencia y elegancia.",
            bg: "/presentacion_hero.png",
            type: "hero"
        },
        {
            title: language === 'en' ? "THE MAP OF YOUR LIFE" : "EL MAPA DE TU VIDA",
            text: language === 'en'
                ? "Every memory has a place. Visualize your travels and special moments geolocated on a high-resolution interactive map."
                : "Cada recuerdo tiene un lugar. Visualiza tus viajes y momentos especiales geolocalizados en un mapa interactivo de alta resolución.",
            bg: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=2000",
            type: "content"
        },
        {
            title: "MAGIC SCAN",
            text: language === 'en'
                ? "The ultimate tool. Connect a USB with your photos and videos and Archipeg will do all the dirty work for you: import, organize, and date."
                : "La herramienta definitiva. Conecta un USB con tus fotos y vídeos y Archipeg hará todo el trabajo sucio por ti: importar, organizar y fechar.",
            bg: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=2000",
            type: "magic"
        },
        {
            title: language === 'en' ? "ZERO DUPLICATES" : "CERO DUPLICADOS",
            text: language === 'en'
                ? "Archipeg analyzes your collection and detects repeated files automatically. Keep your archive clean, light, and clutter-free."
                : "Archipeg analiza tu colección y detecta archivos repetidos automáticamente. Mantén tu archivo limpio, ligero y sin desorden.",
            bg: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=2000",
            type: "content"
        },
        {
            title: language === 'en' ? "IDENTIFY YOUR FAMILY" : "IDENTIFICA A TU FAMILIA",
            text: language === 'en'
                ? "Create profiles for your loved ones. Tag people in your memories and find all their moments with a single click."
                : "Crea perfiles para tus seres queridos. Etiqueta a las personas en tus recuerdos y encuentra todos sus momentos con un solo click.",
            bg: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&q=80&w=2000",
            type: "content"
        },
        {
            title: language === 'en' ? "FAVORITES SELECTION" : "SELECCIÓN FAVORITOS",
            text: language === 'en'
                ? "Your crown jewels. Mark your favorite memories with a star (⭐) and create your own VIP gallery instantly."
                : "Tus joyas de la corona. Marca tus recuerdos preferidos con la estrella (⭐) y crea tu propia galería VIP instantáneamente.",
            bg: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=2000",
            type: "content"
        },
        {
            title: language === 'en' ? "QUICK START GUIDE" : "GUÍA RÁPIDA DE USO",
            text: language === 'en'
                ? "Master Archipeg in four simple steps and put order to your history."
                : "Domina Archipeg en cuatro pasos sencillos y pon orden a tu historia.",
            bg: "/presentacion_hero.png",
            type: "summary"
        },
        {
            title: language === 'en' ? "READY TO START?" : "¿LISTO PARA EMPEZAR?",
            text: language === 'en'
                ? "Your digital archive is waiting. Take absolute control of your visual legacy today."
                : "Tu archivo digital está esperando. Toma el control total de tu legado visual hoy mismo.",
            bg: "/presentacion_hero.png",
            type: "final"
        }
    ];

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Cargar historial de solicitudes
    const cargarEstadoSolicitudes = useCallback(async () => {
        if (!userAuth) return;
        setCargandoEstado(true);
        try {
            const uid = userAuth.id || userAuth.usuario_id;
            const res = await axios.get(`${API_BASE_URL}/api/archipeg/estado/${uid}`);
            setSolicitudes(res.data);
        } catch (err) {
            console.error("Error al cargar estado de Archipeg:", err);
        } finally {
            setCargandoEstado(false);
        }
    }, [userAuth]);

    useEffect(() => {
        cargarEstadoSolicitudes();
    }, [cargarEstadoSolicitudes]);

    // Solicitar versión (Demo o Pro)
    const realizarSolicitud = async (tipo) => {
        if (!userAuth) return;
        setCargando(true);
        setMensajeFeedback({ tipo: '', texto: '' });
        try {
            const uid = userAuth.id || userAuth.usuario_id;
            const res = await axios.post(`${API_BASE_URL}/api/archipeg/solicitar`, {
                usuario_id: uid,
                tipo: tipo
            });
            setMensajeFeedback({ tipo: 'success', texto: res.data.message });
            cargarEstadoSolicitudes();
        } catch (err) {
            console.error("Error al solicitar Archipeg:", err);
            const errText = err.response?.data?.error || err.response?.data?.mensaje || "Error al procesar la solicitud.";
            setMensajeFeedback({ tipo: 'error', texto: errText });
        } finally {
            setCargando(false);
        }
    };

    // Temporizador de Diapositivas para la presentación
    useEffect(() => {
        if (!showPresentation) return;
        const timer = setInterval(() => {
            if (currentSlide < slides.length - 1) {
                setCurrentSlide(prev => prev + 1);
            } else {
                setCurrentSlide(0);
            }
        }, 8000);
        return () => clearInterval(timer);
    }, [currentSlide, slides.length, showPresentation]);

    // Detener audio al cerrar la presentación
    const cerrarPresentacion = () => {
        setShowPresentation(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setAudioStarted(false);
    };

    const startExperience = () => {
        if (audioRef.current) {
            audioRef.current.play()
                .then(() => setAudioStarted(true))
                .catch(e => console.log("Auto-play blocked, waiting for interaction"));
        }
    };

    const solicitudDemo = solicitudes.find(s => s.tipo === 'demo');
    const solicitudPro = solicitudes.find(s => s.tipo === 'pro');

    return (
        <div className="archipeg-page fade-in">
            <div className="archipeg-hero">
                <div className="archipeg-badge">PROYECTO SECRETO DESCLASIFICADO</div>
                <h1 className="archipeg-title">ARCHIPEG V3.0</h1>
                <p className="archipeg-subtitle">
                    {language === 'en' 
                        ? "The definitive offline system to organize and protect your digital life without depending on the cloud."
                        : "El sistema offline definitivo para organizar y proteger tu vida digital sin depender de la nube."}
                </p>
                
                {/* BOTÓN PARA ABRIR LA PRESENTACIÓN PREMIUM */}
                <button className="btn-open-presentation" onClick={() => { setShowPresentation(true); setCurrentSlide(0); }}>
                    ✨ {language === 'en' ? "LAUNCH INTERACTIVE EXPERIENCE (WITH AUDIO)" : "VER PRESENTACIÓN INTERACTIVA (CON AUDIO)"}
                </button>
            </div>

            <div className="archipeg-main-container">
                {/* SECCIÓN DE PRIVACIDAD Y CONCEPTO */}
                <div className="archipeg-concept-box">
                    <Shield size={48} className="concept-icon" />
                    <h2>{language === 'en' ? "100% PRIVATE & OFFLINE" : "100% PRIVADO Y FUERA DE LA RED"}</h2>
                    <p>
                        {language === 'en'
                            ? "Tired of big tech companies scanning your family and intimate photos in the cloud? Archipeg is designed to run directly from your external hard drive. No internet connection required, no cloud uploads, no spying. Everything stays in your hands."
                            : "¿Cansado de que las grandes corporaciones escaneen tus fotos familiares e íntimas en la nube? Archipeg está diseñado para ejecutarse directamente desde tu disco duro extraíble. Sin internet, sin subidas a la nube, sin espionaje. Todo queda en tus manos."}
                    </p>
                </div>

                {/* CARACTERÍSTICAS TÁCTICAS */}
                <h3 className="section-heading">{language === 'en' ? "TACTICAL FEATURES" : "CARACTERÍSTICAS TÁCTICAS"}</h3>
                <div className="features-grid">
                    <div className="feature-card">
                        <HardDrive className="f-icon" />
                        <h4>{language === 'en' ? "PORTABLE" : "PORTABILIDAD TOTAL"}</h4>
                        <p>{language === 'en' ? "Install it on a USB or External HDD. Take your library anywhere." : "Llévalo en un USB o Disco Duro Externo. Tu biblioteca siempre contigo."}</p>
                    </div>
                    <div className="feature-card">
                        <Calendar className="f-icon" />
                        <h4>{language === 'en' ? "TIMELINE" : "LÍNEA TEMPORAL"}</h4>
                        <p>{language === 'en' ? "Organize perfectly by date, month, and year instantly." : "Organización perfecta por fecha, mes y año de forma instantánea."}</p>
                    </div>
                    <div className="feature-card">
                        <Map className="f-icon" />
                        <h4>{language === 'en' ? "INTERACTIVE MAP" : "MAPA INTERACTIVO"}</h4>
                        <p>{language === 'en' ? "Geolocate your memories in a completely private internal map." : "Geolocaliza tus recuerdos en un mapa interno totalmente privado."}</p>
                    </div>
                    <div className="feature-card">
                        <Users className="f-icon" />
                        <h4>{language === 'en' ? "PEOPLE & EVENTS" : "PERSONAS Y EVENTOS"}</h4>
                        <p>{language === 'en' ? "Tag people and create specific events." : "Etiqueta a personas y crea eventos específicos."}</p>
                    </div>
                </div>

                {/* MENSAJES DE FEEDBACK DE SOLICITUDES */}
                {mensajeFeedback.texto && (
                    <div className={`archipeg-feedback-banner ${mensajeFeedback.tipo}`}>
                        {mensajeFeedback.texto}
                    </div>
                )}

                {/* ZONA DE DESCARGA Y COMPRA CON ACCESO RESTRINGIDO */}
                <h3 className="section-heading">{language === 'en' ? "ACQUISITION PORTAL" : "PORTAL DE ADQUISICIÓN"}</h3>

                {/* AVISO IMPORTANTE DE WINDOWS SMARTSCREEN */}
                <div className="windows-warning-container">
                    <div className="windows-warning-icon-wrapper">
                        <AlertTriangle className="windows-warning-icon" size={28} />
                    </div>
                    <div className="windows-warning-text">
                        <h4>
                            {language === 'en' 
                                ? "⚠️ TECHNICAL NOTICE: WINDOWS SMARTSCREEN WARNING" 
                                : "⚠️ NOTIFICACIÓN TÁCTICA: ADVERTENCIA DE WINDOWS SMARTSCREEN"}
                        </h4>
                        <p>
                            {language === 'en'
                                ? "When running the downloaded Archipeg .EXE for the first time, Windows Defender may display a blue warning screen saying 'Windows protected your PC' (because it's an independent, unsigned executable). Rest assured, it is 100% safe. To proceed, simply click 'More info' (Más información) and then click 'Run anyway' (Ejecutar de todas formas)."
                                : "Al ejecutar el archivo .EXE descargado de Archipeg por primera vez, es totalmente normal que Windows Defender muestre una pantalla azul de advertencia indicando 'Windows protegió su PC' (al ser un ejecutable independiente y no firmado digitalmente). El programa es 100% seguro. Para iniciarlo, haz clic en 'Más información' y luego presiona el botón 'Ejecutar de todas formas'."}
                        </p>
                    </div>
                </div>
                
                {!userAuth ? (
                    <div className="archipeg-bunker-lock">
                        <Lock size={48} className="lock-icon" />
                        <h3>{language === 'en' ? "ACCESS RESTRICTED: AGENT AUTHENTICATION REQUIRED" : "ACCESO RESTRINGIDO: SE REQUIERE AUTENTICACIÓN DE AGENTE"}</h3>
                        <p>
                            {language === 'en'
                                ? "To request, purchase, or download Archipeg software versions, you must be a registered and approved agent of the Expediente X Granaíno Bunker."
                                : "Para solicitar, adquirir o descargar las versiones de Archipeg, debes formar parte del búnker de agentes autorizados de Expediente X Granaíno."}
                        </p>
                        <div className="bunker-lock-buttons">
                            <Link to="/acceso" className="btn-bunker-login">{language === 'en' ? "LOGIN TO BUNKER" : "ENTRAR AL BÚNKER"}</Link>
                            <Link to="/acceso" className="btn-bunker-register">{language === 'en' ? "REGISTER NEW AGENT" : "REGISTRARSE EN EL BÚNKER"}</Link>
                        </div>
                    </div>
                ) : (
                    <div className="acquisition-zone">
                        {/* CARD 1: DEMO VERSION */}
                        <div className="demo-box">
                            <div className="demo-header">
                                <Download size={28} />
                                <h3>{language === 'en' ? "DOWNLOAD DEMO" : "DESCARGAR VERSIÓN DEMO"}</h3>
                            </div>
                            <p className="demo-desc">
                                {language === 'en' 
                                    ? "Try the power of Archipeg for free. Limited to archiving 50 images and 10 videos." 
                                    : "Prueba la potencia de Archipeg totalmente gratis. Limitado a archivar 50 imágenes y 10 vídeos."}
                            </p>
                            
                            <div className="status-container">
                                {!solicitudDemo ? (
                                    <button 
                                        onClick={() => realizarSolicitud('demo')} 
                                        disabled={cargando}
                                        className="btn-demo"
                                    >
                                        {cargando ? <Loader2 className="spinner" /> : (language === 'en' ? "REQUEST DEMO (FREE)" : "SOLICITAR DEMO (GRATIS)")}
                                    </button>
                                ) : solicitudDemo.estado === 'pendiente' ? (
                                    <div className="status-badge pending">
                                        <div className="radar-ping"></div>
                                        <span>{language === 'en' ? "REQUEST IN PROCESS - PENDING" : "SOLICITUD EN CURSO - PENDIENTE"}</span>
                                    </div>
                                ) : (
                                    <div className="status-badge approved" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <span>✅ {language === 'en' ? "APPROVED - CHECK YOUR EMAIL" : "APROBADO - REVISA TU CORREO"}</span>
                                        <a href="https://drive.google.com/file/d/1q8F9zO7qQ9OEqMshbPrOhyyPU3wQvJJj/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="btn-demo" style={{ textDecoration: 'none', background: '#28a745', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Download size={18} style={{ marginRight: '8px' }}/>
                                            {language === 'en' ? "DOWNLOAD .EXE NOW" : "DESCARGAR .EXE AHORA"}
                                        </a>
                                    </div>
                                )}
                            </div>
                            <small className="archipeg-small-info">
                                {language === 'en'
                                    ? "* Once requested, an admin will review and email you the official download link."
                                    : "* Una vez solicitada, un administrador la validará y te llegará el enlace oficial a tu correo registrado."}
                            </small>
                        </div>

                        {/* CARD 2: PRO VERSION */}
                        <div className="pro-box">
                            <div className="pro-header">
                                <Lock size={28} />
                                <h3>{language === 'en' ? "ARCHIPEG UNLIMITED" : "ARCHIPEG SIN LÍMITES"}</h3>
                                <span className="price-tag">5€</span>
                            </div>
                            <p className="pro-desc">
                                {language === 'en' 
                                    ? "Unlock the absolute control of your digital life forever. Single payment, no subscriptions." 
                                    : "Desbloquea el control absoluto de tu vida digital para siempre. Pago único, sin suscripciones mensuales."}
                            </p>
                            
                            <div className="status-container">
                                {!solicitudPro ? (
                                    <button 
                                        onClick={() => realizarSolicitud('pro')} 
                                        disabled={cargando}
                                        className="btn-pro"
                                    >
                                        {cargando ? <Loader2 className="spinner" /> : (language === 'en' ? "REQUEST PRO VERSION" : "SOLICITAR EDICIÓN PRO")}
                                    </button>
                                ) : solicitudPro.estado === 'pendiente' ? (
                                    <div className="status-badge pending pro-pending-status">
                                        <div className="radar-ping"></div>
                                        <div className="pending-pro-details">
                                            <strong>{language === 'en' ? "PENDING PAYMENT VALIDATION" : "PENDIENTE DE COMPROBAR PAGO"}</strong>
                                            <p>{language === 'en' ? "Please complete your 5€ payment via our secure Ko-fi link. Once validated, your EXE download link will be emailed automatically." : "Realiza tu donación/pago de 5€ a través de nuestro enlace seguro de Ko-fi. En cuanto se verifique, se te enviará el EXE al correo al instante."}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="status-badge approved" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <span>🎉 {language === 'en' ? "PRO LICENSE ACTIVE! CHECK EMAIL" : "¡LICENCIA PRO ACTIVA! REVISA TU CORREO"}</span>
                                        <a href="https://drive.google.com/file/d/1q8F9zO7qQ9OEqMshbPrOhyyPU3wQvJJj/view?usp=drive_link" target="_blank" rel="noopener noreferrer" className="btn-pro" style={{ textDecoration: 'none', background: '#28a745', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Download size={18} style={{ marginRight: '8px' }}/>
                                            {language === 'en' ? "DOWNLOAD PRO .EXE NOW" : "DESCARGAR .EXE PRO AHORA"}
                                        </a>
                                    </div>
                                )}
                            </div>

                            <div className="payment-instructions">
                                <h4>{language === 'en' ? "HOW TO GET IT:" : "CÓMO CONSEGUIRLO:"}</h4>
                                <ol>
                                    <li>
                                        <Mail className="inst-icon" size={18}/> 
                                        {language === 'en' ? "Click 'Request Pro' above to register your interest." : "Pulsa en 'Solicitar Edición Pro' para registrar tu interés."}
                                    </li>
                                    <li>
                                        <Lock className="inst-icon" size={18}/> 
                                        {language === 'en' ? "Make your 5€ payment securely via Ko-fi (Card/Apple Pay/PayPal):" : "Realiza el pago seguro de 5€ mediante Ko-fi (Tarjeta/Apple Pay/PayPal):"}
                                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                            <a href="https://ko-fi.com/archipegexpedientexgranaino" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', background: '#FF5E5B', color: 'white', padding: '8px 16px', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontFamily: 'Outfit, sans-serif' }}>
                                                ☕ Adquirir en Ko-fi
                                            </a>
                                        </div>
                                    </li>
                                    <li>
                                        <Download className="inst-icon" size={18}/> 
                                        {language === 'en' ? "After admin verification, the official full EXE is sent to your email." : "Tras la verificación, te llegará el instalador EXE completo a tu correo."}
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                )}

                <div className="archipeg-footer">
                    <p>SYSTEM ENGINEERED BY ARCHIPEG - EXPEDIENTE X GRANAÍNO BASE</p>
                </div>
            </div>

            {/* PRESENTACIÓN INTERACTIVA EN OVERLAY */}
            {showPresentation && (
                <div className="presentacion-overlay fade-in" onClick={startExperience}>
                    <audio ref={audioRef} src="/presentacion.mp3" loop preload="auto" crossOrigin="anonymous" />
                    
                    <button className="btn-close-presentation" onClick={(e) => { e.stopPropagation(); cerrarPresentacion(); }}>
                        <X size={28} />
                    </button>

                    {!audioStarted && (
                        <div className="sound-alert-banner">
                            🎵 HAZ CLIC EN CUALQUIER PARTE PARA ACTIVAR EL SONIDO TÁCTICO
                        </div>
                    )}

                    {slides.map((slide, index) => (
                        <div key={index} className={`slide ${index === currentSlide ? 'active' : ''}`}>
                            <img src={slide.bg} alt="bg" className="slide-bg" />

                            <div className="slide-content glass-panel" onClick={(e) => e.stopPropagation()}>
                                <h1 className="slide-title">{slide.title}</h1>
                                <div className="neon-line"></div>
                                <p className="slide-text">{slide.text}</p>

                                {slide.type === 'magic' && (
                                    <div className="instruction-grid">
                                        <div className="instruction-item">
                                            <span className="step-number">01</span>
                                            <p>{language === 'en' ? "Connect your USB or External HDD to your PC." : "Conecta tu USB o Disco Externo al PC."}</p>
                                        </div>
                                        <div className="instruction-item">
                                            <span className="step-number">02</span>
                                            <p>{language === 'en' ? "Create the folder 'FOTOS PARA SUBIR' inside." : "Crea la carpeta FOTOS PARA SUBIR dentro."}</p>
                                        </div>
                                        <div className="instruction-item">
                                            <span className="step-number">03</span>
                                            <p>{language === 'en' ? "Click 'MAGIC SCAN' on your Admin Panel." : "Pulsa MAGIC SCAN en el panel Admin."}</p>
                                        </div>
                                    </div>
                                )}

                                {slide.type === 'summary' && (
                                    <div className="instruction-grid summary-grid">
                                        <div className="instruction-item">
                                            <span className="step-number">01</span>
                                            <h3>{language === 'en' ? "CONNECT" : "CONECTAR"}</h3>
                                            <p>{language === 'en' ? "Use Magic Scan to import from USB." : "Usa Magic Scan para importar desde USB."}</p>
                                        </div>
                                        <div className="instruction-item">
                                            <span className="step-number">02</span>
                                            <h3>{language === 'en' ? "MAP" : "MAPEAR"}</h3>
                                            <p>{language === 'en' ? "Visualize paths in the Satellite Map." : "Visualiza tus rutas en el Mapa Satelital."}</p>
                                        </div>
                                        <div className="instruction-item">
                                            <span className="step-number">03</span>
                                            <h3>{language === 'en' ? "PEOPLE" : "PERSONAS"}</h3>
                                            <p>{language === 'en' ? "Identify and group your loved ones." : "Identifica y agrupa a tus seres queridos."}</p>
                                        </div>
                                        <div className="instruction-item">
                                            <span className="step-number">04</span>
                                            <h3>{language === 'en' ? "CLEAN" : "LIMPIAR"}</h3>
                                            <p>{language === 'en' ? "Remove duplicates and organize events." : "Elimina duplicados y organiza por eventos."}</p>
                                        </div>
                                    </div>
                                )}

                                {index === slides.length - 1 && (
                                    <button className="btn-start" onClick={(e) => {
                                        e.stopPropagation();
                                        cerrarPresentacion();
                                    }}>
                                        {language === 'en' ? "ENTRAR A ARCHIPEG" : "ADQUIRIR ARCHIPEG V3"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    <div className="controls">
                        {slides.map((_, index) => (
                            <div
                                key={index}
                                className={`dot ${index === currentSlide ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCurrentSlide(index);
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Archipeg;
