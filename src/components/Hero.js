import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './Hero.css';

// Importamos las imágenes para el carrusel
import imgEspacio from '../assets/espacio_ufo.png';
import imgEvidencias from '../assets/galeria_evidencias.png';
import imgRelatos from '../assets/misterio_relatos.png';

const Hero = ({ userAuth }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            id: 0,
            image: imgEspacio,
            subtitle: "GLOBAL",
            title: "EXPEDIENTEXGRANAINO",
            tagline: "OBSERVER NETWORK",
            infoTitle: "LA RED DE OBSERVADORES DE EXPEDIENTEXGRANAINO",
            infoText: "Forma parte del próximo gran acontecimiento. Una red exclusiva para entusiastas de los OVNIS y la ufología técnica.",
            highlight: "¡SOLO PARA MIEMBROS DEL BÚNKER!",
            btnText: "Informar Avistamiento",
            btnLink: "/expedientes"
        },
        {
            id: 1,
            image: imgEvidencias,
            subtitle: "DIVISIÓN",
            title: "MULTIMEDIA Y EVIDENCIAS",
            tagline: "ARCHIVO CLASIFICADO",
            infoTitle: "REPOSITORIO DE PRUEBAS GRÁFICAS",
            infoText: "Explora nuestra galería de fotos y vídeos analizados por el mando central. Evidencias de lo inexplicable en alta resolución.",
            highlight: "ACCESO TOTAL A ARCHIVOS DESCLASIFICADOS",
            btnText: "Explorar Galería",
            btnLink: "/galeria"
        },
        {
            id: 2,
            image: imgRelatos,
            subtitle: "INTELIGENCIA",
            title: "RELATOS Y MISTERIOS",
            tagline: "HISTORIA OCULTA",
            infoTitle: "EL ARCHIVO DEL INVESTIGADOR",
            infoText: "Sumérgete en los relatos más impactantes y misterios históricos que desafían la lógica. La verdad está escrita en estas páginas.",
            highlight: "COMPARTE TU EXPERIENCIA CON NOSOTROS",
            btnText: "Leer Relatos",
            btnLink: "/noticias"
        },
        {
            id: 3,
            image: imgEspacio,
            subtitle: "ASCENSO TÁCTICO",
            title: "SISTEMA DE RANGOS AGENTE",
            tagline: "EVOLUCIÓN EN LA RED",
            infoTitle: "JERARQUÍA DEL BÚNKER",
            infoText: "Tu lealtad y actividad son monitorizadas. Sube de rango automáticamente: Agente > Cabo > Sargento > Teniente > Capitán. ¡Alcanza el estatus de élite!",
            highlight: "MÁS VISITAS = MAYOR RANGO TÁCTICO",
            btnText: "Ver Mi Perfil",
            btnLink: "/acceso"
        },
        {
            id: 4,
            image: imgEspacio, // Reusamos una de las imágenes que encaja bien
            subtitle: "RECLUTAMIENTO",
            title: "REGISTRO 100% ANÓNIMO",
            tagline: "PROTEGEMOS TU IDENTIDAD",
            infoTitle: "ÚNETE A LA RED GLOBAL SIN RASTRO",
            infoText: "Hemos actualizado nuestros protocolos de seguridad. Ahora puedes darte de alta en el Búnker de ExpedienteXGranaino usando solo un Alias. Cero datos personales.",
            highlight: "TU PRIVACIDAD ES NUESTRA PRIORIDAD MÁXIMA",
            btnText: "Registrarse Ahora",
            btnLink: "/acceso"
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 3500); // Cambia cada 3.5 segundos en lugar de 6

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
                    <Link to="/expedientes" className="btn-mufon-red">
                        REPORTAR EXPERIENCIA
                    </Link>
                    <Link to="/acceso" className="btn-mufon-red">
                        REGISTRO GRATUITO
                    </Link>
                    <Link to="/galeria" className="btn-mufon-black">
                        APORTAR MULTIMEDIA
                    </Link>
                    <Link to="/acceso" className="btn-mufon-outline">
                        ACCESO AGENTES
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
                    <Link to={activeSlide.btnLink} className="btn-explore-mufon">
                        {activeSlide.btnText}
                    </Link>
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
