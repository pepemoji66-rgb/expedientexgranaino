import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import './Hero.css';

// Importamos las imágenes para el carrusel
import imgEspacio from '../assets/espacio_ufo.png';
import imgEvidencias from '../assets/galeria_evidencias.png';
import imgRelatos from '../assets/misterio_relatos.png';

const Hero = ({ userAuth }) => {
    const { t, toggleLanguage, language } = useLanguage();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [ultimosExpedientes, setUltimosExpedientes] = useState([]);
    const [ultimasNoticias, setUltimasNoticias] = useState([]);

    useEffect(() => {
        const fetchUltimos = async () => {
            try {
                // Rastrear últimos expedientes
                const resExp = await fetch(`${API_BASE_URL}/api/expedientes/ultimos`);
                const dataExp = await resExp.json();
                if (Array.isArray(dataExp)) setUltimosExpedientes(dataExp);

                // Rastrear últimas noticias
                const resNot = await fetch(`${API_BASE_URL}/api/noticias/ultimas`);
                const dataNot = await resNot.json();
                if (Array.isArray(dataNot)) setUltimasNoticias(dataNot);

            } catch (err) {
                console.error("Error al captar últimas actualizaciones para Hero:", err);
            }
        };
        fetchUltimos();
    }, []);



    const getSlides = () => {
        return [
            {
                id: 'bilingual',
                image: imgEspacio,
                subtitle: t('slideBilingualSubtitle'),
                title: t('slideBilingualTitle'),
                tagline: t('slideBilingualTagline'),
                infoTitle: t('slideBilingualInfoTitle'),
                infoText: t('slideBilingualInfoText'),
                highlight: t('slideBilingualHighlight'),
                btnText: t('slideBilingualBtn'),
                btnLink: "#",
                onClick: (e) => { e.preventDefault(); toggleLanguage(); }
            },
            {
                id: 'archipeg-promo',
                image: imgEspacio,
                subtitle: language === 'en' ? "PRIVATE SOFTWARE" : "SOFTWARE OFFLINE",
                title: "ARCHIPEG V3",
                tagline: language === 'en' ? "YOUR DIGITAL BUNKER" : "TU BÚNKER DIGITAL",
                infoTitle: language === 'en' ? "PROTECT YOUR LEGACY" : "PROTEGE TU LEGADO",
                infoText: language === 'en' ? "Download the sovereign offline software to organize and protect your UFO files completely out of the cloud." : "Descarga el software soberano sin conexión para organizar y blindar tus archivos ufológicos fuera de la red.",
                highlight: language === 'en' ? "100% PRIVATE • SECURE • NO CLOUD" : "100% PRIVADO • SEGURO • SIN NUBE",
                btnText: language === 'en' ? "GET ARCHIPEG" : "ADQUIRIR ARCHIPEG",
                btnLink: "/archipeg"
            },
            {
                id: 'casos-abiertos',
                image: imgRelatos,
                subtitle: language === 'en' ? "UNSOLVED CASES" : "CASOS ABIERTOS",
                title: "TRUE CRIME",
                tagline: language === 'en' ? "CRIMES & MYSTERIES" : "CRÍMENES & MISTERIOS",
                infoTitle: language === 'en' ? "UNRESOLVED MYSTERIES" : "MISTERIOS SIN RESOLVER",
                infoText: language === 'en' ? "Delve into the unsolved cases. Real crimes, unexplained disappearances, and mysteries that defy logic." : "Adéntrate en los casos abiertos. Crímenes reales, desapariciones inexplicables y misterios que desafían la lógica.",
                highlight: language === 'en' ? "CLASSIFIED FILES" : "ARCHIVOS CLASIFICADOS",
                btnText: language === 'en' ? "ENTER DOSSIER" : "ENTRAR AL DOSSIER",
                btnLink: "/casos-abiertos"
            },
            {
                id: 0,
                image: imgEspacio,
                subtitle: "GLOBAL",
                title: "EXPEDIENTEXGRANAINO",
                tagline: t('heroObserverNetwork'),
                infoTitle: t('heroObserverTitle'),
                infoText: t('heroObserverText'),
                highlight: t('heroObserverHighlight'),
                btnText: t('heroReport'),
                btnLink: "/expedientes"
            },
            {
                id: 1,
                image: imgEvidencias,
                subtitle: "DIVISIÓN",
                title: t('heroGalleryTitle'),
                tagline: "ARCHIVO CLASIFICADO",
                infoTitle: t('heroGalleryTitle'),
                infoText: t('heroGalleryDesc'),
                highlight: "ACCESO TOTAL A ARCHIVOS DESCLASIFICADOS",
                btnText: t('heroGalleryBtn'),
                btnLink: "/galeria"
            },
            {
                id: 2,
                image: imgRelatos,
                subtitle: "INTELIGENCIA",
                title: t('heroStoriesTitle'),
                tagline: "HISTORIA OCULTA",
                infoTitle: t('heroStoriesTitle'),
                infoText: t('heroStoriesDesc'),
                highlight: "COMPARTE TU EXPERIENCIA CON NOSOTROS",
                btnText: t('heroStoriesBtn'),
                btnLink: "/noticias"
            },
            {
                id: 3,
                image: imgEspacio,
                subtitle: "ASCENSO TÁCTICO",
                title: t('heroRankTitle'),
                tagline: "EVOLUCIÓN EN LA RED",
                infoTitle: t('heroRankTitle'),
                infoText: t('heroRankDesc'),
                highlight: "MÁS VISITAS = MAYOR RANGO TÁCTICO",
                btnText: t('heroRankBtn'),
                btnLink: "/acceso"
            },
            {
                id: 4,
                image: imgEspacio,
                subtitle: "RECLUTAMIENTO",
                title: t('heroRegisterTitle'),
                tagline: "PROTEGEMOS TU IDENTIDAD",
                infoTitle: t('heroRegisterTitle'),
                infoText: t('heroRegisterDesc'),
                highlight: "TU PRIVACIDAD ES NUESTRA PRIORIDAD MÁXIMA",
                btnText: t('heroRegisterBtn'),
                btnLink: "/acceso"
            }
        ];
    };

    const [slides, setSlides] = useState(getSlides());

    useEffect(() => {
        let alertasRecientes = [];

        // Mapear noticias
        ultimasNoticias.forEach(noticia => {
            alertasRecientes.push({
                _timestamp: new Date(noticia.fecha || Date.now()).getTime(),
                slideData: {
                    id: `nueva-not-${noticia.id}`,
                    image: noticia.imagen_url || imgRelatos,
                    subtitle: t('heroLatestNews'),
                    title: (noticia.titulo || 'NUEVA NOTICIA').toUpperCase(),
                    tagline: "ACTUALIDAD EN EL BÚNKER",
                    infoTitle: "NUEVO ARCHIVO DISPONIBLE",
                    infoText: "Se ha detectado nueva actividad en el sector de noticias. Accede al informe completo.",
                    highlight: "¡MANTENTE AL TANTO DE LOS ÚLTIMOS SUCESOS!",
                    btnText: t('heroNewsBtn'),
                    btnLink: "/noticias"
                }
            });
        });

        // Mapear expedientes (solo si tienen imagen si es posible, pero por defecto los mapeamos)
        ultimosExpedientes.forEach(expediente => {
            alertasRecientes.push({
                _timestamp: new Date(expediente.fecha || Date.now()).getTime(),
                slideData: {
                    id: `nuevo-exp-${expediente.id}`,
                    image: expediente.imagen_url 
                        ? (expediente.imagen_url.startsWith('http') ? expediente.imagen_url : `${API_BASE_URL}/imagenes/${expediente.imagen_url}`)
                        : imgEspacio,
                    subtitle: t('heroLatestExp'),
                    title: (expediente.titulo || 'NUEVO EXPEDIENTE').toUpperCase(),
                    tagline: "NUEVO EXPEDIENTE DESCLASIFICADO",
                    infoTitle: "ARCHIVO RECIENTE",
                    infoText: `El agente ${(expediente.usuario_nombre || 'Desconocido').toUpperCase()} ha aportado nuevas evidencias al Búnker.`,
                    highlight: "NUEVA EVIDENCIA DISPONIBLE EN EL ARCHIVO",
                    btnText: t('heroExpBtn'),
                    btnLink: "/expedientes"
                }
            });
        });

        // Ordenar por más reciente y coger solo los 2 últimos para no saturar el slider
        alertasRecientes.sort((a, b) => b._timestamp - a._timestamp);
        const top2Alertas = alertasRecientes.slice(0, 2).map(item => item.slideData);

        // Prepend a los slides originales
        setSlides([...top2Alertas, ...getSlides()]);
        
    }, [ultimosExpedientes, ultimasNoticias, language]); // Escuchamos language para refrescar textos

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000); // 5 segundos para que de tiempo a leer el nuevo expediente

        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

    const activeSlide = slides[currentSlide];

    return (
        <section 
            className="hero-global-mufon" 
            style={{ backgroundImage: `url(${activeSlide.image})` }}
        >
            <div className="hero-overlay-dark"></div>
            
            {/* BARRA SUPERIOR DE ACCIONES RÁPIDAS */}
            <div className="hero-top-actions">
                <div className="action-buttons-group">
                    {(ultimosExpedientes.length > 0 || ultimasNoticias.length > 0) && (
                        <Link 
                            to={(ultimasNoticias[0]?.id || 0) > (ultimosExpedientes[0]?.id || 0) ? "/noticias" : "/expedientes"} 
                            className="btn-nuevo-archivo-blink"
                        >
                            <span className="blink-dot"></span> {t('heroNewFile')}
                        </Link>
                    )}
                    
                    {/* PLACA DE AGENTE INTEGRADA EN PANEL DE MANDOS */}
                    {userAuth && (
                        <div className="hero-agent-badge">
                            <span className="agent-status-led"></span>
                            <span className="agent-code">AGENTE_{userAuth.nombre?.split(' ')[0].toUpperCase()}</span>
                            {userAuth.rango && (
                                <span className="agent-rango-tag">
                                    {userAuth.rango === 'Agente en Prácticas' ? '🔰 ' :
                                     userAuth.rango === 'Cabo' ? '🎖️ ' :
                                     userAuth.rango === 'Cabo 1º' ? '🎖️🎖️ ' :
                                     userAuth.rango === 'Sargento' ? '⭐ ' :
                                     userAuth.rango === 'Teniente' ? '⭐⭐ ' :
                                     userAuth.rango === 'Capitán' ? '⭐⭐⭐ ' :
                                     userAuth.rango === 'Comandante' ? '🦅 ' : '🛡️ '}
                                    {userAuth.rango.toUpperCase()}
                                </span>
                            )}
                        </div>
                    )}

                    <Link to="/expedientes" className="btn-mufon-red">
                        {t('heroNavReport')}
                    </Link>
                    <Link to="/acceso" className="btn-mufon-red">
                        {t('heroNavReg')}
                    </Link>
                    <Link to="/galeria" className="btn-mufon-black">
                        {t('heroNavMedia')}
                    </Link>
                    <Link to="/acceso" className="btn-mufon-outline">
                        {t('heroNavAccess')}
                    </Link>
                </div>
            </div>

            <div className="hero-main-content fade-in-slide" key={currentSlide}>
                <div className="mufon-logo-container">
                    <div className="mufon-glow"></div>
                    <h2 className="mufon-subtitle">{activeSlide.subtitle}</h2>
                    <h1 className="mufon-title">{activeSlide.title}</h1>
                    <h3 className="mufon-tagline">{activeSlide.tagline}</h3>
                </div>

                <div className="hero-info-box">
                    <h2 className="info-title">{activeSlide.infoTitle}</h2>
                    <p className="info-text">
                        {activeSlide.infoText}<br />
                        <span className="highlight-mufon">{activeSlide.highlight}</span>
                    </p>
                    {activeSlide.onClick ? (
                        <button onClick={activeSlide.onClick} className="btn-explore-mufon">
                            {activeSlide.btnText}
                        </button>
                    ) : (
                        <Link to={activeSlide.btnLink} className="btn-explore-mufon">
                            {activeSlide.btnText}
                        </Link>
                    )}
                </div>
            </div>

            {/* FLECHAS DE NAVEGACIÓN MANUAL */}
            <button className="carousel-arrow left-arrow" onClick={prevSlide}>
                <ChevronLeft size={36} />
            </button>
            <button className="carousel-arrow right-arrow" onClick={nextSlide}>
                <ChevronRight size={36} />
            </button>

            {/* ELEMENTOS DECORATIVOS DE NAVEGACIÓN (PUNTOS) */}
            <div className="hero-pagination-dots">
                {slides.map((_, index) => (
                    <span 
                        key={index}
                        className={`dot ${currentSlide === index ? 'active' : ''}`}
                        onClick={() => setCurrentSlide(index)}
                    ></span>
                ))}
            </div>

            {/* BLOQUE SEO - INDEXABLE POR BOTS - BILINGÜE */}
            <div className="seo-bunker-block" aria-label={language === 'en' ? "About Expediente X Granaíno" : "Información sobre Expediente X Granaíno"}>
                <h2 className="seo-bunker-title">
                    {language === 'en'
                        ? "UFO Investigation & Paranormal Phenomena in Granada, Spain"
                        : "Investigación OVNI y Fenómenos Paranormales en Granada"}
                </h2>
                {language === 'en' ? (
                    <>
                        <p>
                            <strong>Expediente X Granaíno</strong> is the leading UFO and paranormal phenomena investigation platform in southern Spain.
                            From our digital bunker we monitor <strong>real-time UFO alerts</strong>, unidentified aerial sightings,
                            chronicles of mystery and unexplained events occurring in the province of Granada and its surrounding areas.
                            Our field agents document every case with GPS coordinates, photographic evidence and detailed reports,
                            building the largest archive of <strong>historical cases in Granada</strong> ever compiled by a civilian research network.
                        </p>
                        <p>
                            Our observer network constantly analyzes aerial anomalies and electromagnetic phenomena recorded over Sierra Nevada,
                            the Granada Valley, the Tropical Coast and the Guadix region. Each classified dossier receives a tactical relevance score
                            from our community, ensuring the most significant <strong>paranormal phenomena</strong> are properly documented for history.
                            Join our investigation network and contribute your own sightings, photographs and anonymous testimonies.
                        </p>
                        <p>
                            Explore our classified evidence gallery, listen to the bunker's audio frequencies and consult our historical dossiers
                            covering the most relevant <strong>UFO cases in Andalusia</strong>. The truth is out there — and we document it.
                            Real-time UFO alerts, paranormal wave analysis, dossiers on power locations in Granada
                            and chronicles of mystery that defy any conventional explanation. Welcome to the darkest archive on the net.
                        </p>
                    </>
                ) : (
                    <>
                        <p>
                            <strong>Expediente X Granaíno</strong> es la plataforma de investigación ufológica y fenómenos paranormales más completa del sur de España.
                            Desde nuestro búnker digital monitorizamos en <strong>tiempo real alertas OVNI</strong>, avistamientos aéreos no identificados,
                            crónicas del misterio y eventos inexplicables que ocurren en la provincia de Granada y su área de influencia.
                            Nuestros agentes sobre el terreno documentan cada caso con coordenadas GPS, fotografías de evidencia y relatos detallados
                            para construir el mayor archivo de <strong>casos históricos en Granada</strong> jamás compilado.
                        </p>
                        <p>
                            La red de observadores analiza constantemente el espacio aéreo, las anomalías electromagnéticas
                            y los fenómenos de energía anómala registrados en Sierra Nevada, la Vega de Granada, la Costa Tropical y la comarca de Guadix.
                            Cada expediente clasificado recibe una valoración de relevancia táctica por parte de la comunidad,
                            asegurando que los <strong>fenómenos paranormales</strong> más significativos queden debidamente registrados para la historia.
                            Únete a nuestra red de investigación y contribuye con tus propios avistamientos, fotografías y testimonios.
                        </p>
                        <p>
                            Explora nuestra galería de evidencias clasificadas y consulta nuestros expedientes históricos sobre
                            los casos más relevantes de <strong>ufología en Andalucía</strong>. La verdad está ahí fuera, y nosotros la documentamos.
                            Alertas OVNI en tiempo real, análisis de ondas paranormales, dossiers sobre lugares de poder en Granada y
                            crónicas del misterio que desafían cualquier explicación convencional. Bienvenido al archivo más oscuro de la red.
                        </p>
                    </>
                )}
            </div>
        </section>
    );
};

export default Hero;
