import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useLocation } from 'react-router-dom';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './paneladmin.css';

// --- ICONOS ESTRATÉGICOS ---
const iconoLugar = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

const iconoNoticia = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
    iconSize: [35, 35], popupAnchor: [1, -34]
});

const iconoResaltado = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    iconSize: [30, 45], iconAnchor: [15, 45], popupAnchor: [1, -34]
});

// Componente para el movimiento fluido del mapa
const ActualizadorMapa = ({ centro }) => {
    const map = useMap();
    useEffect(() => {
        if (centro && centro[0] && centro[1]) {
            map.flyTo(centro, 15, { animate: true });
        }
    }, [centro, map]);
    return null;
};

const Lugares = () => {
    const location = useLocation();
    const [puntos, setPuntos] = useState([]);
    const [noticias, setNoticias] = useState([]);
    const [vista, setVista] = useState('lugares'); 
    const [centroMapa, setCentroMapa] = useState([37.1773, -3.5986]);
    const [idResaltado, setIdResaltado] = useState(null);
    const [indicesPestanas, setIndicesPestanas] = useState({});

    // Cortafuegos para el bucle de imágenes
    const handleImgError = (e) => {
        e.target.onerror = null; 
        e.target.src = "https://placehold.co/300x200/000000/00ff41?text=SIN+IMAGEN+DISPONIBLE";
    };

    const cargarDatos = useCallback(async () => {
        try {
            console.log("📡 SINCRONIZANDO RADAR...");
            const [resL, resN] = await Promise.all([
                axios.get('http://localhost:5000/lugares'),
                axios.get('http://localhost:5000/admin/todas-noticias')
            ]);

            setPuntos(resL.data.filter(p => p.estado === 'activo' || p.estado === 'aprobado' || p.estado === 'publicado'));
            setNoticias(resN.data.filter(n => n.estado === 'aprobado' && n.latitud && n.longitud));

            // ESTO ES LO IMPORTANTE: Si vienes de "Archivos" o "Noticias", el mapa reacciona
            if (location.state?.lat && location.state?.lng) {
                // Si trae datos, cambiamos a la vista de noticias automáticamente
                setVista('noticias');
                const nuevasCoords = [parseFloat(location.state.lat), parseFloat(location.state.lng)];
                setCentroMapa(nuevasCoords);
                if (location.state.noticiaId) setIdResaltado(location.state.noticiaId);
            }
        } catch (err) {
            console.error("❌ ERROR DE CONEXIÓN:", err);
        }
    }, [location.state]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    // Lógica para que varios puntos en la misma coordenada no se tapen
    const agruparNoticias = () => {
        const grupos = {};
        noticias.forEach(n => {
            const key = `${n.latitud}-${n.longitud}`;
            if (!grupos[key]) grupos[key] = [];
            grupos[key].push(n);
        });
        return Object.values(grupos);
    };

    const noticiasAgrupadas = agruparNoticias();

    return (
        <section className="panel-admin-container fade-in">
            <h2 className="titulo-neon">SISTEMA DE MANDO ESTRATÉGICO</h2>

            <div className="selector-vistas-bunker">
                <button
                    onClick={() => { setVista('lugares'); setIdResaltado(null); }}
                    className={`btn-mando-v2 ${vista === 'lugares' ? 'activo-lugares' : ''}`}
                > 📍 SECTORES CLAVE </button>

                <button
                    onClick={() => { setVista('noticias'); setIdResaltado(null); }}
                    className={`btn-mando-v2 ${vista === 'noticias' ? 'activo-alertas' : ''}`}
                > ⚠️ ALERTAS ACTIVAS </button>
            </div>

            <div className="contenedor-radar-flexible">
                {/* EL MAPA REY */}
                <div className="mapa-mando-wrapper">
                    <MapContainer center={centroMapa} zoom={13} className="mapa-principal-leaflet">
                        <ActualizadorMapa centro={centroMapa} />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {/* Marcadores de Lugares */}
                        {vista === 'lugares' && puntos.map(l => (
                            <Marker key={`l-${l.id}`} position={[parseFloat(l.latitud), parseFloat(l.longitud)]} icon={idResaltado === l.id ? iconoResaltado : iconoLugar}>
                                <Popup>
                                    <div className="popup-bunker-v2">
                                        <h4>📍 {l.nombre}</h4>
                                        {l.imagen_url && <img src={`http://localhost:5000/lugares/${l.imagen_url}`} onError={handleImgError} />}
                                        <p>{l.descripcion}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* Marcadores de Noticias (con selector si están agrupadas) */}
                        {vista === 'noticias' && noticiasAgrupadas.map((grupo, idx) => {
                            const keyGrupo = `${grupo[0].latitud}-${grupo[0].longitud}`;
                            const indexActual = indicesPestanas[keyGrupo] || 0;
                            const n = grupo[indexActual];
                            return (
                                <Marker key={`g-${idx}`} position={[parseFloat(n.latitud), parseFloat(n.longitud)]} icon={idResaltado === n.id ? iconoResaltado : iconoNoticia}>
                                    <Popup>
                                        <div className="popup-bunker-v2">
                                            <h4 style={{ color: '#ff4444' }}>⚠️ ALERTA</h4>
                                            <strong>{n.titulo}</strong>
                                            <img src={`http://localhost:5000/imagenes/${n.imagen}`} onError={handleImgError} />
                                            <p>{n.cuerpo}</p>
                                            {grupo.length > 1 && (
                                                <div className="selector-noticia-popup">
                                                    <button onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIndicesPestanas(prev => ({...prev, [keyGrupo]: (indexActual - 1 + grupo.length) % grupo.length}));
                                                    }}>◀</button>
                                                    <span>{indexActual + 1} / {grupo.length}</span>
                                                    <button onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIndicesPestanas(prev => ({...prev, [keyGrupo]: (indexActual + 1) % grupo.length}));
                                                    }}>▶</button>
                                                </div>
                                            )}
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>

                {/* LISTA DE OBJETIVOS (CONECTADA AL MAPA) */}
                <div className="panel-objetivos-radar">
                    <h3 className="titulo-objetivos-v2">{vista === 'lugares' ? '🎯 OBJETIVOS' : '🔥 ALERTAS'}</h3>
                    <div className="lista-objetivos-scroll-v2">
                        {(vista === 'lugares' ? puntos : noticias).map(item => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setCentroMapa([parseFloat(item.latitud), parseFloat(item.longitud)]);
                                    setIdResaltado(item.id);
                                }}
                                className={`objetivo-item-v2 ${idResaltado === item.id ? 'sel-activo' : ''}`}
                            >
                                <div className="item-txt-v2">{item.nombre || item.titulo}</div>
                                <div className="item-sub-v2">{item.ubicacion || 'Detectado por el radar'}</div>
                                {idResaltado === item.id && <div className="scanner-line"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Lugares;