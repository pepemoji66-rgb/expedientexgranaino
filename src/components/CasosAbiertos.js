import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AdSlot from './AdSlot';
import './casosabiertos.css';
import API_BASE_URL from '../config';

const CasosAbiertos = ({ userAuth }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [casos, setCasos] = useState([]);
    const [casoExpandido, setCasoExpandido] = useState(null);
    const [paginaActual, setPaginaActual] = useState(1);
    const casosPorPagina = 9;

    useEffect(() => {
        cargarCasos();
    }, []);

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

    const compartirCaso = async (caso, red) => {
        const url = `${window.location.origin}/casos-abiertos?id=${caso.id}`;
        const textoTitulo = language === 'en' && caso.titulo_en ? caso.titulo_en : caso.titulo;
        const texto = `💀 UNRESOLVED MYSTERY / CASO ABIERTO: "${textoTitulo?.toUpperCase()}" @PEPE1318057 #TrueCrime #Misterio #ExpedienteXGranaino`;
        
        if (navigator.share && red !== 'copy') {
            try {
                await navigator.share({
                    title: 'BÚNKER EXPEDIENTE X - TRUE CRIME',
                    text: texto,
                    url: url,
                });
                return;
            } catch (err) {
                console.log("Compartir cancelado o no soportado");
            }
        }

        let link = '';
        if (red === 'twitter') {
            link = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`;
        } else if (red === 'whatsapp') {
            link = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto + ' ' + url)}`;
        }
        
        if (link) {
            window.open(link, '_blank');
        } else {
            try {
                await navigator.clipboard.writeText(`${texto} ${url}`);
                alert(t('sysLinkCopied') || "📎 ENLACE COPIADO AL PORTAPAPELES.");
            } catch (err) {
                alert("❌ ERROR AL COPIAR.");
            }
        }
    };

    const indexOfLastCaso = paginaActual * casosPorPagina;
    const indexOfFirstCaso = indexOfLastCaso - casosPorPagina;
    const casosActuales = casos.slice(indexOfFirstCaso, indexOfLastCaso);
    const totalPaginas = Math.ceil(casos.length / casosPorPagina);

    return (
        <div className="casos-container fade-in">
            <h1 className="casos-titulo">
                {language === 'en' ? 'UNSOLVED CASES' : 'CASOS ABIERTOS'}
            </h1>
            <p className="casos-subtitulo">
                {language === 'en' ? 'TRUE CRIME & UNEXPLAINED MYSTERIES' : 'TRUE CRIME & MISTERIOS SIN RESOLVER'}
            </p>

            <AdSlot id="casos-top" />

            <div className="grid-casos">
                {casosActuales.length > 0 ? (
                    casosActuales.map((caso) => {
                        const tituloMostrar = language === 'en' && caso.titulo_en ? caso.titulo_en : caso.titulo;
                        const contenidoMostrar = language === 'en' && caso.contenido_en ? caso.contenido_en : caso.contenido;
                        
                        return (
                            <div key={caso.id} id={`caso-${caso.id}`} className="caso-card">
                                <div className="caso-imagen-wrapper">
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
                                    
                                    <div className="caso-contenido colapsado">
                                        <p>{contenidoMostrar}</p>
                                    </div>
                                    
                                    <button 
                                        className="btn-leer-mas" 
                                        onClick={() => setCasoExpandido(caso)}
                                    >
                                        {language === 'en' ? 'READ FULL DOSSIER' : 'LEER DOSSIER COMPLETO'}
                                    </button>

                                    <div className="caso-acciones">
                                        <button onClick={() => compartirCaso(caso, 'twitter')} className="btn-mando-pro btn-secondary-pro">𝕏 TWITTER</button>
                                        <button onClick={() => compartirCaso(caso, 'whatsapp')} className="btn-mando-pro btn-secondary-pro">WHATSAPP</button>
                                        <button onClick={() => compartirCaso(caso, 'copy')} className="btn-mando-pro btn-secondary-pro" style={{ width: '40px' }}>📎</button>
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
                    <button disabled={paginaActual === 1} onClick={() => { setPaginaActual(p => p - 1); window.scrollTo(0,0); }}>ATRÁS</button>
                    <span>PÁG {paginaActual} / {totalPaginas}</span>
                    <button disabled={paginaActual === totalPaginas} onClick={() => { setPaginaActual(p => p + 1); window.scrollTo(0,0); }}>SIGUIENTE</button>
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
                                    style={{ display: 'block', marginBottom: '20px', fontSize: '0.85rem' }}
                                    onClick={() => navigate('/lugares', { state: { lat: casoExpandido.latitud, lng: casoExpandido.longitud, noticiaId: 'caso-' + casoExpandido.id } })}
                                    title="Ver en el radar"
                                >
                                    📍 VER COORDENADAS EN EL RADAR
                                </button>
                            )}
                            <p>{language === 'en' && casoExpandido.contenido_en ? casoExpandido.contenido_en : casoExpandido.contenido}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CasosAbiertos;
