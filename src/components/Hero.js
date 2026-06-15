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
import imgAtarfeReal from '../assets/atarfe_captura_real_horizontal.png';

const Hero = ({ userAuth }) => {
    const { t, toggleLanguage, language } = useLanguage();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [novedadesGlobales, setNovedadesGlobales] = useState([]);

    useEffect(() => {
        const fetchUltimos = async () => {
            try {
                let todasNovedades = [];

                // 1. Expedientes
                const resExp = await fetch(`${API_BASE_URL}/api/expedientes/ultimos`);
                const dataExp = await resExp.json();
                if (Array.isArray(dataExp)) {
                    todasNovedades = todasNovedades.concat(dataExp.map(x => ({ ...x, type: 'expediente', timestamp: new Date(x.fecha).getTime() })));
                }

                // 2. Noticias
                const resNot = await fetch(`${API_BASE_URL}/api/noticias/ultimas`);
                const dataNot = await resNot.json();
                if (Array.isArray(dataNot)) {
                    todasNovedades = todasNovedades.concat(dataNot.map(x => ({ ...x, type: 'noticia', timestamp: new Date(x.fecha).getTime() })));
                }

                // 3. Videos
                const resVideos = await fetch(`${API_BASE_URL}/api/videos/publicos`);
                const dataVideos = await resVideos.json();
                if (Array.isArray(dataVideos)) {
                    todasNovedades = todasNovedades.concat(dataVideos.map(x => ({ ...x, type: 'video', timestamp: new Date(x.fecha).getTime() })));
                }

                // 4. Casos Abiertos (True Crime)
                const resCasos = await fetch(`${API_BASE_URL}/api/casos`);
                const dataCasos = await resCasos.json();
                if (Array.isArray(dataCasos)) {
                    todasNovedades = todasNovedades.concat(dataCasos.map(x => ({ ...x, type: 'caso', timestamp: new Date(x.fecha).getTime() })));
                }

                // 5. Misterios Históricos (Casos Históricos)
                const resMist = await fetch(`${API_BASE_URL}/api/misterios-historicos`);
                const dataMist = await resMist.json();
                if (Array.isArray(dataMist)) {
                    todasNovedades = todasNovedades.concat(dataMist.map(x => ({ ...x, type: 'misterio', timestamp: new Date(x.fecha).getTime() })));
                }

                // Ordenar por fecha y coger los 4 más recientes
                todasNovedades.sort((a, b) => b.timestamp - a.timestamp);
                setNovedadesGlobales(todasNovedades.slice(0, 4));

            } catch (err) {
                console.error("Error al captar últimas actualizaciones para Hero:", err);
            }
        };
        fetchUltimos();
    }, []);

    const getSlides = () => {
        return [
            {
                id: 'especial-atarfe',
                image: imgAtarfeReal,
                backgroundPosition: 'right center',
                subtitle: language === 'en' ? "DECLASSIFIED DOSSIER" : "DOSSIER DESCLASIFICADO",
                title: "CASO OVNI ATARFE",
                tagline: language === 'en' ? "THE ATARFE INCIDENT" : "EL INCIDENTE ATARFE Y ALBOLOTE",
                infoTitle: language === 'en' ? "CONFIDENTIAL ARCHIVE" : "ARCHIVO CONFIDENCIAL / NIVEL 4",
                infoText: language === 'en' 
                    ? "Full technical report on the UFO sightings in Granada. Unedited original evidence and direct testimonies."
                    : "Informe técnico completo sobre los avistamientos OVNI en Granada. Evidencias originales sin editar y testimonios directos.",
                highlight: language === 'en' ? "ORIGINAL EVIDENCE" : "EVIDENCIAS ORIGINALES Y TESTIMONIOS",
                btnText: language === 'en' ? "ACCESS DOSSIER" : "ACCEDER AL DOSSIER",
                btnLink: "/especial-atarfe"
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
            }
        ];
    };

    const [slides, setSlides] = useState(getSlides());

    useEffect(() => {
        let alertasRecientes = [];

        novedadesGlobales.forEach(item => {
            if (item.type === 'expediente') {
                alertasRecientes.push({
                    id: `nuevo-exp-${item.id}`,
                    image: item.imagen_url ? (item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`) : imgEspacio,
                    subtitle: t('heroLatestExp') || 'NUEVO EXPEDIENTE',
                    title: (item.titulo || 'NUEVO EXPEDIENTE').toUpperCase(),
                    tagline: "EXPEDIENTE DESCLASIFICADO",
                    infoTitle: "ARCHIVO RECIENTE",
                    infoText: `Nuevas evidencias aportadas al Búnker.`,
                    highlight: "NUEVA EVIDENCIA DISPONIBLE",
                    btnText: t('heroExpBtn') || 'VER EXPEDIENTE',
                    btnLink: "/expedientes"
                });
            } else if (item.type === 'noticia') {
                alertasRecientes.push({
                    id: `nueva-not-${item.id}`,
                    image: item.imagen_url ? (item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`) : imgEvidencias,
                    subtitle: "ÚLTIMA HORA",
                    title: (item.titulo || 'NOTICIA').toUpperCase(),
                    tagline: "NOTICIA DE INTELIGENCIA",
                    infoTitle: "BOLETÍN INFORMATIVO",
                    infoText: item.cuerpo ? item.cuerpo.replace(/<[^>]+>/g, '').substring(0, 100) + '...' : "Nueva información desclasificada.",
                    highlight: "INFORMACIÓN DE ALTO NIVEL",
                    btnText: "LEER NOTICIA",
                    btnLink: "/noticias"
                });
            } else if (item.type === 'video') {
                const primerCaptura = item.capturas && item.capturas.trim() !== '' ? item.capturas.split(',')[0].trim() : '';
                alertasRecientes.push({
                    id: `nuevo-video-${item.id}`,
                    image: primerCaptura 
                        ? (primerCaptura.startsWith('http') ? primerCaptura : `${API_BASE_URL}/imagenes/${primerCaptura}`) 
                        : imgEvidencias,
                    subtitle: language === 'en' ? "NEW VIDEO" : "NUEVO VÍDEO",
                    title: (item.titulo || 'EVIDENCIA EN VÍDEO').toUpperCase(),
                    tagline: language === 'en' ? "VISUAL EVIDENCE" : "VISUALIZA LAS PRUEBAS",
                    infoTitle: language === 'en' ? "AUDIOVISUAL MATERIAL" : "MATERIAL AUDIOVISUAL",
                    infoText: language === 'en' ? "New classified video added to the central archive." : "Nuevo vídeo desclasificado añadido al archivo general. Revisa el material.",
                    highlight: language === 'en' ? "SENSITIVE FOOTAGE" : "IMÁGENES SENSIBLES",
                    btnText: language === 'en' ? "WATCH VIDEO" : "VER VÍDEO",
                    btnLink: "/galeria"
                });
            } else if (item.type === 'caso') {
                alertasRecientes.push({
                    id: `nuevo-caso-${item.id}`,
                    image: item.imagen_url ? (item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`) : imgRelatos,
                    subtitle: language === 'en' ? "NEW UNSOLVED CASE" : "NUEVO CASO ABIERTO",
                    title: (item.titulo || 'TRUE CRIME DOSSIER').toUpperCase(),
                    tagline: language === 'en' ? "CRIMES & MYSTERIES" : "CRÍMENES Y MISTERIOS",
                    infoTitle: language === 'en' ? "NEW DOSSIER" : "NUEVO DOSSIER",
                    infoText: language === 'en' ? "A new true crime dossier has been opened." : "Se ha abierto un nuevo dossier de un crimen o misterio sin resolver.",
                    highlight: language === 'en' ? "CLASSIFIED FILE" : "ARCHIVO CLASIFICADO",
                    btnText: language === 'en' ? "ENTER DOSSIER" : "ENTRAR AL DOSSIER",
                    btnLink: "/casos-abiertos"
                });
            } else if (item.type === 'misterio') {
                alertasRecientes.push({
                    id: `nuevo-misterio-${item.id}`,
                    image: item.imagen_url ? (item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`) : imgRelatos,
                    subtitle: language === 'en' ? "HISTORICAL MYSTERY" : "MISTERIO HISTÓRICO",
                    title: (item.titulo || 'MISTERIO DESCLASIFICADO').toUpperCase(),
                    tagline: language === 'en' ? "UNRESOLVED ENIGMAS" : "ENIGMAS DE LA HISTORIA",
                    infoTitle: language === 'en' ? "CLASSIFIED HISTORY" : "HISTORIA CLASIFICADA",
                    infoText: item.contenido ? item.contenido.replace(/<[^>]+>/g, '').substring(0, 100) + '...' : (language === 'en' ? "New historical enigma cataloged." : "Nuevo enigma histórico catalogado."),
                    highlight: language === 'en' ? "ANCIENT SECRETS" : "SECRETOS DEL PASADO",
                    btnText: language === 'en' ? "EXPLORE ENIGMAS" : "EXPLORAR ENIGMAS",
                    btnLink: "/misterios-historicos"
                });
            }
        });

        // Prepend a los slides originales
        setSlides([...alertasRecientes, ...getSlides()]);
        
    }, [novedadesGlobales, language]);

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
            className={`hero-global-mufon hero-slide-${activeSlide?.id}`}
            style={{ 
                backgroundImage: `url(${activeSlide?.image})`,
                backgroundPosition: activeSlide?.backgroundPosition || 'center'
            }}
        >
            <div className="hero-overlay-dark"></div>
            
            {/* BARRA SUPERIOR DE ACCIONES RÁPIDAS */}
            <div className="hero-top-actions">
                <div className="action-buttons-group">
                    {novedadesGlobales.length > 0 && (
                        <Link 
                            to={
                                novedadesGlobales[0].type === 'noticia' ? "/noticias" : 
                                novedadesGlobales[0].type === 'video' ? "/galeria" : 
                                novedadesGlobales[0].type === 'caso' ? "/casos-abiertos" : 
                                novedadesGlobales[0].type === 'misterio' ? "/misterios-historicos" : 
                                "/expedientes"
                            } 
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
