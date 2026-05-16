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
    const [ultimoExpediente, setUltimoExpediente] = useState(null);
    const [ultimaNoticia, setUltimaNoticia] = useState(null);

    useEffect(() => {
        const fetchUltimos = async () => {
            try {
                // Rastrear último expediente
                const resExp = await fetch(`${API_BASE_URL}/api/expedientes/ultimo`);
                const dataExp = await resExp.json();
                if (dataExp && dataExp.id) setUltimoExpediente(dataExp);

                // Rastrear última noticia
                const resNot = await fetch(`${API_BASE_URL}/api/noticias/ultima`);
                const dataNot = await resNot.json();
                if (dataNot && dataNot.id) setUltimaNoticia(dataNot);

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
        let nuevosSlides = getSlides();
        
        if (ultimaNoticia) {
            const slideNoticia = {
                id: 'nueva-not',
                image: ultimaNoticia.imagen_url || imgRelatos,
                subtitle: t('heroLatestNews'),
                title: (ultimaNoticia.titulo || 'NUEVA NOTICIA').toUpperCase(),
                tagline: "ACTUALIDAD EN EL BÚNKER",
                infoTitle: "NUEVO ARCHIVO DISPONIBLE",
                infoText: "Se ha detectado nueva actividad en el sector de noticias. Accede al informe completo.",
                highlight: "¡MANTENTE AL TANTO DE LOS ÚLTIMOS SUCESOS!",
                btnText: t('heroNewsBtn'),
                btnLink: "/noticias"
            };
            nuevosSlides = [slideNoticia, ...nuevosSlides];
        }

        if (ultimoExpediente) {
            const nuevoSlide = {
                id: 'nuevo-exp',
                image: ultimoExpediente.imagen_url 
                    ? (ultimoExpediente.imagen_url.startsWith('http') ? ultimoExpediente.imagen_url : `${API_BASE_URL}/imagenes/${ultimoExpediente.imagen_url}`)
                    : imgEspacio,
                subtitle: t('heroLatestExp'),
                title: (ultimoExpediente.titulo || 'NUEVO EXPEDIENTE').toUpperCase(),
                tagline: "NUEVO EXPEDIENTE DESCLASIFICADO",
                infoTitle: "ARCHIVO RECIENTE",
                infoText: `El agente ${(ultimoExpediente.usuario_nombre || 'Desconocido').toUpperCase()} ha aportado nuevas evidencias al Búnker.`,
                highlight: "NUEVA EVIDENCIA DISPONIBLE EN EL ARCHIVO",
                btnText: t('heroExpBtn'),
                btnLink: "/expedientes"
            };
            nuevosSlides = [nuevoSlide, ...nuevosSlides];
        }
        
        setSlides(nuevosSlides);
    }, [ultimoExpediente, ultimaNoticia, language]); // Escuchamos language para refrescar textos

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
                    {(ultimoExpediente || ultimaNoticia) && (
                        <Link 
                            to={(ultimaNoticia?.id || 0) > (ultimoExpediente?.id || 0) ? "/noticias" : "/expedientes"} 
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
        </section>
    );
};

export default Hero;
