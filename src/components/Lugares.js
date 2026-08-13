import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './lugares.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Maximize2, Facebook, Twitter, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { safeLocalStorage } from '../utils/storage';
import API_BASE_URL from '../config';

const crearIconoPulsante = (esResaltado = false) => new L.divIcon({
    className: `marcador-contenedor ${esResaltado ? 'resaltado' : ''}`,
    html: `<div class="marcador-pulsante ${esResaltado ? 'pulso-resaltado' : ''}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

const crearIconoCasos = (esResaltado = false) => new L.divIcon({
    className: `marcador-contenedor ${esResaltado ? 'resaltado' : ''}`,
    html: `<div style="font-size: 16px; line-height: 16px; text-align: center; filter: drop-shadow(0 0 6px red); ${esResaltado ? 'animation: pulse-red 1.5s infinite;' : ''}">💀</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});

const crearIconoEmoji = (emoji, esResaltado = false) => new L.divIcon({
    className: `marcador-contenedor ${esResaltado ? 'resaltado' : ''}`,
    html: `<div style="font-size: 16px; line-height: 16px; text-align: center; filter: drop-shadow(0 0 6px ${esResaltado ? 'red' : 'rgba(0,255,65,0.8)'}); ${esResaltado ? 'animation: pulse-red 1.5s infinite;' : ''}">${emoji}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10]
});

const iconos = {
    hallazgos: (resaltar) => crearIconoPulsante(resaltar),
    caso: (resaltar) => crearIconoCasos(resaltar),
    expediente: (resaltar) => crearIconoEmoji('📁', resaltar),
    noticia: (resaltar) => crearIconoEmoji('📰', resaltar),
    foto: (resaltar) => crearIconoEmoji('📸', resaltar),
    lugar: (resaltar) => crearIconoEmoji('📍', resaltar),
    misterio: (resaltar) => crearIconoEmoji('👁️', resaltar)
};

const ActualizadorMapa = ({ centro, idResaltado }) => {
    const map = useMap();
    useEffect(() => {
        if (idResaltado && centro) {
            const currentZoom = map.getZoom();
            const targetZoom = currentZoom > 5 ? currentZoom : 5;
            map.flyTo(centro, targetZoom, { animate: true, duration: 1.5 }); // Vuelo más rápido y dinámico
        } else {
            map.setView(centro || [37.1773, -3.5986], 2); // Si falla, Granada por defecto
        }
        setTimeout(() => { map.invalidateSize(); }, 600);
    }, [centro, idResaltado, map]);
    return null;
};

const FILTROS = [
    { id: 'todos',      label: 'TODOS',       emoji: '🌐' },
    { id: 'expediente', label: 'EXPEDIENTES',  emoji: '📁' },
    { id: 'caso',       label: 'TRUE CRIME',   emoji: '💀' },
    { id: 'noticia',    label: 'NOTICIAS',     emoji: '📰' },
    { id: 'misterio',  label: 'MISTERIOS',    emoji: '👁️' },
];

const Lugares = () => {
    const { t } = useLanguage();
    const location = useLocation();
    const navigate = useNavigate();
    const [puntos, setPuntos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [centroMapa, setCentroMapa] = useState([20, 0]); // Volvemos al centro global
    const [idResaltado, setIdResaltado] = useState(null);
    const [filtroActivo, setFiltroActivo] = useState('todos');

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (location.state && location.state.lat !== undefined && location.state.lng !== undefined) {
            const lat = parseFloat(location.state.lat);
            const lng = parseFloat(location.state.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                setCentroMapa([lat, lng]);
                if (location.state.noticiaId) {
                    setIdResaltado(location.state.noticiaId);
                }
            }
        }
    }, [location.state]);

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true);
            const resultados = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/api/galeria/noticias-publicas`),
                axios.get(`${API_BASE_URL}/api/expedientes`),
                axios.get(`${API_BASE_URL}/api/casos`),
                axios.get(`${API_BASE_URL}/api/misterios-historicos`)
            ]);

            const noticias = resultados[0].status === 'fulfilled' ? (resultados[0].value.data.data || resultados[0].value.data || []).map(p => ({ ...p, id: `noticia-${p.id}`, tipo: 'noticia' })) : [];
            const expedientes = resultados[1].status === 'fulfilled' ? (resultados[1].value.data || []).map(p => ({ ...p, id: `exp-${p.id}`, tipo: 'expediente' })) : [];
            const casos = resultados[2].status === 'fulfilled' ? (resultados[2].value.data || []).map(p => ({ ...p, id: `caso-${p.id}`, tipo: 'caso' })) : [];
            const misterios = resultados[3].status === 'fulfilled' ? (resultados[3].value.data || []).map(p => ({ ...p, id: `misterio-${p.id}`, tipo: 'misterio' })) : [];

            // Prioridad: 1. Misterios, 2. Casos, 3. Expedientes, 4. Noticias
            const todosLosPuntos = [...misterios, ...casos, ...expedientes, ...noticias].filter(p => 
                p && p.latitud && p.longitud && 
                parseFloat(p.latitud) !== 0 && parseFloat(p.longitud) !== 0
            );

            // Deduplicación inteligente por coordenadas (~100m de radio = 3 decimales)
            const unicos = [];
            const coordenadasVistas = new Set();

            for (const p of todosLosPuntos) {
                const lat = parseFloat(p.latitud).toFixed(3);
                const lng = parseFloat(p.longitud).toFixed(3);
                const key = `${lat},${lng}`;

                if (!coordenadasVistas.has(key)) {
                    unicos.push(p);
                    coordenadasVistas.add(key);
                }
            }

            setPuntos(unicos);
        } catch (err) {
            console.error("❌ ERROR CRÍTICO EN EL RADAR:", err);
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { 
        cargarDatos(); 
    }, [cargarDatos]);
    
    useEffect(() => {
        const resaltado = safeLocalStorage.getItem('lugar_a_resaltar');
        if (resaltado) {
            try {
                const data = JSON.parse(resaltado);
                if (data.id) setIdResaltado(data.id);
                if (data.latitud && data.longitud && parseFloat(data.latitud) !== 0) {
                    setCentroMapa([parseFloat(data.latitud), parseFloat(data.longitud)]);
                }
                safeLocalStorage.removeItem('lugar_a_resaltar');
            } catch (e) {
                console.error("Error procesando radar:", e);
            }
        }
    }, []);

    const getImagen = (item) => {
        const fallbackColor = '00d4ff';
        if (!item) return `https://placehold.co/200x120/000/${fallbackColor}?text=DATOS+CORRUPTOS`;
        let nombreImagen = item.url_imagen || item.imagen_url || item.imagenes || item.imagen || "";
        if (!nombreImagen) return `https://placehold.co/200x120/000/${fallbackColor}?text=SIN+IMAGEN`;
        if (nombreImagen.startsWith('http')) return nombreImagen;
        
        if (item.agente || item.autor || item.tipo === 'foto' || item.tipo === 'noticia' || item.tipo === 'misterio') {
            return `${API_BASE_URL}/imagenes/${nombreImagen.split('/').pop()}`;
        }
        return `${API_BASE_URL}/lugares/${nombreImagen.split('/').pop()}`;
    };

    const renderContenidoPopup = (m, idx) => {
        const handleImageClick = () => {
            // Lógica de navegación táctica según el tipo de registro
            if (m.tipo === 'noticia') navigate('/noticias');
            else if (m.tipo === 'foto') navigate('/galeria');
            else if (m.tipo === 'lugar') navigate('/lugares'); // O una vista de detalle si existiera
            else if (m.tipo === 'video') navigate('/videos');
            else if (m.tipo === 'expediente') navigate(`/leer-historia/${String(m.id).replace('exp-', '')}?src=expedientes`);
            else if (m.tipo === 'caso') navigate(`/casos-abiertos?id=${m.id.replace('caso-', '')}`);
            else if (m.tipo === 'misterio') navigate(`/leer-historia/${String(m.id).replace('misterio-', '')}?src=misterios`);
            else navigate('/galeria'); // Fallback
        };
        const { t } = useLanguage();

        const goToNext = (e) => {
            e.stopPropagation();
            const nextIdx = (idx + 1) % puntos.length;
            const nextPunto = puntos[nextIdx];
            if (nextPunto) {
                setCentroMapa([parseFloat(nextPunto.latitud), parseFloat(nextPunto.longitud)]);
                setIdResaltado(nextPunto.id);
            }
        };

        const goToPrev = (e) => {
            e.stopPropagation();
            const prevIdx = (idx === 0) ? puntos.length - 1 : idx - 1;
            const prevPunto = puntos[prevIdx];
            if (prevPunto) {
                setCentroMapa([parseFloat(prevPunto.latitud), parseFloat(prevPunto.longitud)]);
                setIdResaltado(prevPunto.id);
            }
        };

        return (
            <div className="contenedor-img-popup" onClick={handleImageClick} style={{ cursor: 'pointer' }}>
                <div className="overlay-ampliar-radar">
                    <Maximize2 size={20} />
                    <span>{t('mapExpand')}</span>
                </div>
                {puntos.length > 1 && (
                    <div className="controles-radar-popup">
                        <button onClick={(e) => { e.stopPropagation(); goToPrev(e); }} className="btn-radar-nav prev">
                            <ChevronLeft size={24} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); goToNext(e); }} className="btn-radar-nav next">
                            <ChevronRight size={24} />
                        </button>
                    </div>
                )}
                <img
                    src={getImagen(m)}
                    alt="evidencia"
                    className="img-radar-popup"
                    onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/200x120/000/00d4ff?text=${t('mapError')}`;
                    }}
                />
            </div>
        );
    };

    const puntosFiltrados = filtroActivo === 'todos'
        ? puntos
        : puntos.filter(p => p.tipo === filtroActivo);

    return (
        <section className="seccion-radar-total">
            {/* PANEL DE FILTROS TÁCTICO */}
            <div className="radar-filtros-panel">
                <div className="radar-filtros-titulo">⚙ FILTRAR OBJETIVOS</div>
                <div className="radar-filtros-lista">
                    {FILTROS.map(f => {
                        const count = f.id === 'todos' ? puntos.length : puntos.filter(p => p.tipo === f.id).length;
                        return (
                            <button
                                key={f.id}
                                className={`radar-filtro-btn ${filtroActivo === f.id ? 'activo' : ''}`}
                                onClick={() => setFiltroActivo(f.id)}
                            >
                                <span className="radar-filtro-emoji">{f.emoji}</span>
                                <span className="radar-filtro-label">{f.label}</span>
                                <span className="radar-filtro-count">{count}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="mapa-mando-full">
                <MapContainer center={centroMapa} zoom={2} minZoom={2} style={{ height: '100%', width: '100%' }} closePopupOnClick={true}>
                    <ActualizadorMapa centro={centroMapa} idResaltado={idResaltado} />
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='&copy; Esri'
                    />
                    <MarkerClusterGroup
                        chunkedLoading
                        maxClusterRadius={60}
                        showCoverageOnHover={false}
                        iconCreateFunction={(cluster) => {
                            const count = cluster.getChildCount();
                            return L.divIcon({
                                html: `<div class="cluster-bunker"><span>${count}</span></div>`,
                                className: 'cluster-bunker-wrapper',
                                iconSize: L.point(40, 40)
                            });
                        }}
                    >
                    {puntosFiltrados.map((m, idx) => {
                        let esEste = false;
                        if (idResaltado) {
                            const strIdRes = String(idResaltado);
                            const strMId = String(m.id);
                            
                            if (strIdRes === strMId) esEste = true;
                            else if (strIdRes === `noticia-${strMId}` || `noticia-${strIdRes}` === strMId) esEste = true;
                            else if (strIdRes === `exp-${strMId}` || `exp-${strIdRes}` === strMId) esEste = true;
                            else if (strIdRes === `caso-${strMId}` || `caso-${strIdRes}` === strMId) esEste = true;
                            else if (strIdRes === `misterio-${strMId}` || `misterio-${strIdRes}` === strMId) esEste = true;
                        }

                        return (
                            <Marker
                                key={`punto-${m.id || idx}`}
                                position={[parseFloat(m.latitud), parseFloat(m.longitud)]}
                                icon={iconos[m.tipo] ? iconos[m.tipo](esEste) : iconos.hallazgos(esEste)}
                                zIndexOffset={esEste ? 1000 : 0}
                                eventHandlers={{
                                    click: () => { 
                                        setIdResaltado(m.id); 
                                        setCentroMapa([parseFloat(m.latitud), parseFloat(m.longitud)]);
                                    }
                                }}
                                ref={(r) => { 
                                    if (r && esEste) {
                                        setTimeout(() => { if (!r.isPopupOpen()) r.openPopup(); }, 300);
                                    } 
                                }}
                            >
                                <Popup autoClose={true} closeOnClick={true} autoPan={false}>
                                    <div className="popup-bunker-v2">
                                        <div className="popup-header-tactico">
                                            <span className="status-online">
                                                {m.tipo === 'caso' ? '💀 TRUE CRIME' : 
                                                 m.tipo === 'misterio' ? `👁️ ${t('navMysteries')}` : 
                                                 m.tipo === 'expediente' ? t('mapDossier') : 
                                                 m.tipo === 'noticia' ? t('mapNews') : 
                                                 m.tipo === 'lugar' ? t('mapPlace') : t('mapEvidence')}
                                            </span>
                                            <h4 className="titulo-popup-neon">{m.titulo || m.nombre || t('mapEvidence').replace('📸 ', '')}</h4>
                                        </div>
                                        <div className="agente-tag">
                                            {m.tipo === 'expediente' ? t('mapAuthor') : t('mapAgent')}: {m.agente || m.usuario_nombre || t('mapSystem')}
                                        </div>
                                        {renderContenidoPopup(m, idx)}
                                        <div className="descripcion-popup-container">
                                            <p className="descripcion-popup">{m.descripcion || m.contenido || t('mapNoDesc')}</p>
                                        </div>
                                        <div className="popup-footer-tactico">
                                            COORD: {parseFloat(m.latitud).toFixed(4)}, {parseFloat(m.longitud).toFixed(4)}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                    </MarkerClusterGroup>
                </MapContainer>
            </div>
            
            {/* BARRA DE ESTADO */}
            <div className="ui-radar-status">
                <div className="status-item">
                    <span className="label">{t('mapObjectives')}:</span>
                    <span className="value">{puntosFiltrados.length}</span>
                </div>
                <div className="status-item">
                    <span className="label">{t('mapSystemLabel')}:</span>
                    <span className="value pulse">{t('mapActive')}</span>
                </div>
            </div>

            {/* PANEL COMPARTIR EN REDES */}
            <div className="radar-share-panel">
                <div className="radar-share-titulo">📡 COMPARTIR RADAR</div>
                <div className="radar-share-botones">
                    <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="radar-share-btn facebook"
                        title="Compartir en Facebook"
                    >
                        <Facebook size={16} />
                    </a>
                    <a
                        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent('🗺️ El radar de Expediente X Granaíno — todos los casos, expedientes y misterios en el mapa')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="radar-share-btn twitter"
                        title="Compartir en X (Twitter)"
                    >
                        <Twitter size={16} />
                    </a>
                    <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent('🗺️ Mira el radar de Expediente X Granaíno: ' + window.location.href)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="radar-share-btn whatsapp"
                        title="Compartir en WhatsApp"
                    >
                        <MessageCircle size={16} />
                    </a>
                    <button
                        className="radar-share-btn copiar"
                        title="Copiar enlace"
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert('¡Enlace del mapa copiado al portapapeles!');
                        }}
                    >
                        <LinkIcon size={16} />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default Lugares;