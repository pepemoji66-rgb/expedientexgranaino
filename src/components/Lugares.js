import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './lugares.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import API_BASE_URL from '../config';

const crearIconoPulsante = (esResaltado = false) => new L.divIcon({
    className: `marcador-contenedor ${esResaltado ? 'resaltado' : ''}`,
    html: `<div class="marcador-pulsante ${esResaltado ? 'pulso-resaltado' : ''}"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
});

const iconos = {
    hallazgos: (resaltar) => crearIconoPulsante(resaltar)
};

const ActualizadorMapa = ({ centro, idResaltado }) => {
    const map = useMap();
    useEffect(() => {
        if (idResaltado && centro) {
            map.flyTo(centro, 10, { animate: true, duration: 1.2 }); // Velocidad de vuelo equilibrada
        } else {
            map.setView(centro || [37.1773, -3.5986], 2); // Si falla, Granada por defecto
        }
        setTimeout(() => { map.invalidateSize(); }, 600);
    }, [centro, idResaltado, map]);
    return null;
};

const Lugares = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [puntos, setPuntos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [centroMapa, setCentroMapa] = useState([20, 0]); // Volvemos al centro global
    const [idResaltado, setIdResaltado] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (location.state && location.state.lat !== undefined && location.state.lng !== undefined) {
            const lat = parseFloat(location.state.lat);
            const lng = parseFloat(location.state.lng);
            if (!isNaN(lat) && !isNaN(lng)) {
                setCentroMapa([lat, lng]);
                // Sincronizamos el prefijo del ID para que el mapa lo reconozca
                if (location.state.noticiaId) setIdResaltado(`noticia-${location.state.noticiaId}`);
            }
        }
    }, [location.state]);

    const cargarDatos = useCallback(async () => {
        try {
            setCargando(true);
            const resultados = await Promise.allSettled([
                axios.get(`${API_BASE_URL}/api/galeria/noticias-publicas`),
                axios.get(`${API_BASE_URL}/api/expedientes`)
            ]);

            const noticias = resultados[0].status === 'fulfilled' ? (resultados[0].value.data.data || resultados[0].value.data || []).map(p => ({ ...p, id: `noticia-${p.id}`, tipo: 'noticia' })) : [];
            const expedientes = resultados[1].status === 'fulfilled' ? (resultados[1].value.data || []).map(p => ({ ...p, id: p.id, tipo: 'expediente' })) : [];

            // Prioridad: 1. Expedientes (Relatos), 2. Noticias
            const todosLosPuntos = [...expedientes, ...noticias].filter(p => 
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
        const resaltado = localStorage.getItem('lugar_a_resaltar');
        if (resaltado) {
            try {
                const data = JSON.parse(resaltado);
                if (data.id) setIdResaltado(data.id);
                if (data.latitud && data.longitud && parseFloat(data.latitud) !== 0) {
                    setCentroMapa([parseFloat(data.latitud), parseFloat(data.longitud)]);
                }
                localStorage.removeItem('lugar_a_resaltar');
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
        
        if (item.agente || item.autor || item.tipo === 'foto' || item.tipo === 'noticia') {
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
            else if (m.tipo === 'expediente') navigate(`/leer-historia/${m.id}`);
            else navigate('/galeria'); // Fallback
        };

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
                    <span>AMPLIAR EN SECCIÓN</span>
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
                        e.target.src = `https://placehold.co/200x120/000/00d4ff?text=ERROR+DE+CARGA`;
                    }}
                />
            </div>
        );
    };

    return (
        <section className="seccion-radar-total">
            <div className="mapa-mando-full">
                <MapContainer center={centroMapa} zoom={2} minZoom={2} style={{ height: '100%', width: '100%' }} closePopupOnClick={true}>
                    <ActualizadorMapa centro={centroMapa} idResaltado={idResaltado} />
                    <TileLayer
                        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution='&copy; Esri'
                    />
                    {puntos.map((m, idx) => {
                        const esEste = idResaltado && String(idResaltado) === String(m.id);
                        return (
                            <Marker
                                key={`punto-${m.id || idx}`}
                                position={[parseFloat(m.latitud), parseFloat(m.longitud)]}
                                icon={iconos.hallazgos(esEste)}
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
                                <Popup autoClose={true} closeOnClick={true}>
                                    <div className="popup-bunker-v2">
                                        <div className="popup-header-tactico">
                                            <span className="status-online">
                                                {m.tipo === 'expediente' ? '📜 RELATO' : 
                                                 m.tipo === 'noticia' ? '📰 NOTICIA' : 
                                                 m.tipo === 'lugar' ? '📍 LUGAR' : '📸 EVIDENCIA'}
                                            </span>
                                            <h4 className="titulo-popup-neon">{m.titulo || m.nombre || 'EVIDENCIA'}</h4>
                                        </div>
                                        <div className="agente-tag">
                                            {m.tipo === 'expediente' ? 'AUTOR' : 'AGENTE'}: {m.agente || m.usuario_nombre || 'SISTEMA'}
                                        </div>
                                        {renderContenidoPopup(m, idx)}
                                        <div className="descripcion-popup-container">
                                            <p className="descripcion-popup">{m.descripcion || m.contenido || "Sin descripción adicional en el archivo."}</p>
                                        </div>
                                        <div className="popup-footer-tactico">
                                            COORD: {parseFloat(m.latitud).toFixed(4)}, {parseFloat(m.longitud).toFixed(4)}
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                </MapContainer>
            </div>
            
            {/* BOTÓN DE LOCALIZACIÓN RÁPIDA (OPCIONAL) */}
            <div className="ui-radar-status">
                <div className="status-item">
                    <span className="label">OBJETIVOS:</span>
                    <span className="value">{puntos.length}</span>
                </div>
                <div className="status-item">
                    <span className="label">SISTEMA:</span>
                    <span className="value pulse">ACTIVO</span>
                </div>
            </div>
        </section>
    );
};

export default Lugares;