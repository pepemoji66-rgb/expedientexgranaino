import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './paneladmin.css';

// --- ICONOS ---
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

const ActualizadorMapa = ({ centro }) => {
    const map = useMap();
    useEffect(() => {
        if (centro) map.flyTo(centro, 15, { animate: true });
    }, [centro, map]);
    return null;
};

const Lugares = () => {
    const [puntos, setPuntos] = useState([]);
    const [noticias, setNoticias] = useState([]);
    const [vista, setVista] = useState('lugares'); 
    const [centroMapa, setCentroMapa] = useState([37.1773, -3.5986]);
    const [idResaltado, setIdResaltado] = useState(null); 

    const cargarDatos = useCallback(async () => {
        try {
            const [resL, resN] = await Promise.all([
                axios.get('http://localhost:5000/lugares'),
                axios.get('http://localhost:5000/admin/todas-noticias')
            ]);
            
            const lugaresValidos = resL.data.filter(p => 
                p.estado === 'activo' || p.estado === 'aprobado' || p.estado === 'publicado'
            );
            
            setPuntos(lugaresValidos);
            setNoticias(resN.data.filter(n => n.estado === 'aprobado' && n.latitud));
            
        } catch (err) { 
            console.error("❌ ERROR EN EL RADAR:", err); 
        }
    }, []);

    useEffect(() => { 
        cargarDatos(); 
    }, [cargarDatos]);

    return (
        <section className="panel-admin-container fade-in">
            <h2 className="titulo-neon">SISTEMA DE MANDO ESTRATÉGICO</h2>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '20px' }}>
                <button 
                    onClick={() => { setVista('lugares'); setIdResaltado(null); }}
                    className={`btn-pagi ${vista === 'lugares' ? 'active' : ''}`}
                    style={{ 
                        background: vista === 'lugares' ? '#00ff00' : '#222', 
                        color: vista === 'lugares' ? '#000' : '#00ff00', 
                        border: '2px solid #00ff00', padding: '10px 20px', 
                        fontWeight: 'bold', cursor: 'pointer',
                        textTransform: 'uppercase'
                    }}
                >
                    📍 VER LUGARES
                </button>
                <button 
                    onClick={() => { setVista('noticias'); setIdResaltado(null); }}
                    className={`btn-pagi ${vista === 'noticias' ? 'active' : ''}`}
                    style={{ 
                        background: vista === 'noticias' ? '#ff4444' : '#222', 
                        color: vista === 'noticias' ? '#000' : '#ff4444', 
                        border: '2px solid #ff4444', padding: '10px 20px', 
                        fontWeight: 'bold', cursor: 'pointer',
                        textTransform: 'uppercase'
                    }}
                >
                    ⚠️ MODO ALERTAS
                </button>
            </div>

            <div className="contenedor-radar-flexible">
                <div className="mapa-mando">
                    <MapContainer center={centroMapa} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <ActualizadorMapa centro={centroMapa} />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {vista === 'lugares' && puntos.map(l => (
                            <Marker 
                                key={`l-${l.id}`} 
                                position={[l.latitud, l.longitud]} 
                                icon={idResaltado === l.id ? iconoResaltado : iconoLugar}
                            >
                                <Popup>
                                    <div className="popup-bunker">
                                        <h4 style={{ color: '#00ff41', margin: '0 0 10px 0' }}>📍 {l.nombre}</h4>
                                        {l.imagen_url && (
                                            <img 
                                                src={`http://localhost:5000/lugares/${l.imagen_url}`} 
                                                alt={l.nombre} 
                                                style={{ width: '100%', borderRadius: '4px', marginBottom: '10px', border: '1px solid #00ff41' }} 
                                            />
                                        )}
                                        <p style={{ fontSize: '12px', color: '#ccc' }}>{l.descripcion}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {vista === 'noticias' && noticias.map((n, idx, self) => {
                            const noticiasEnMismoSitio = self.filter(item => 
                                item.latitud === n.latitud && item.longitud === n.longitud
                            );

                            if (self.findIndex(t => t.latitud === n.latitud && t.longitud === n.longitud) !== idx) return null;

                            return (
                                <Marker 
                                    key={`n-${n.id}`} 
                                    position={[n.latitud, n.longitud]} 
                                    icon={idResaltado === n.id ? iconoResaltado : iconoNoticia}
                                >
                                    <Popup>
                                        <div className="popup-bunker" style={{ minWidth: '220px' }}>
                                            <h4 style={{ color: '#ff4444' }}>⚠️ ALERTA RADAR</h4>
                                            
                                            {noticiasEnMismoSitio.length > 1 && (
                                                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                                    {noticiasEnMismoSitio.map((not, i) => (
                                                        <button 
                                                            key={not.id}
                                                            onClick={() => {
                                                                setIdResaltado(not.id);
                                                                const container = document.getElementById(`noticia-content-${n.id}`);
                                                                if (container) {
                                                                    container.innerHTML = `
                                                                        <div class="contenido-fade-radar">
                                                                            <strong style="color: #00ff88; display: block; margin-bottom: 5px;">${not.titulo}</strong>
                                                                            <p style="color: #ffffff; font-size: 12px; margin-bottom: 8px;">${not.cuerpo}</p>
                                                                            <a href="/noticia/${not.id}" style="color: #ff4444; font-weight: bold; text-decoration: none;">VER EXPEDIENTE COMPLETO →</a>
                                                                        </div>
                                                                    `;
                                                                }
                                                            }}
                                                            style={{ background: '#333', color: '#fff', border: '1px solid #ff4444', fontSize: '9px', padding: '2px 5px', cursor: 'pointer' }}
                                                        >
                                                            INFO {i + 1}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            <div id={`noticia-content-${n.id}`}>
                                                <strong style={{ color: '#00ff88' }}>{n.titulo}</strong>
                                                <p style={{ fontSize: '11px', color: '#eee', margin: '5px 0' }}>{n.cuerpo}</p>
                                                {/* CAMBIO CLAVE AQUÍ: textDecoration en lugar de text-decoration */}
                                                <a href={`/noticia/${n.id}`} style={{ color: '#ff4444', fontWeight: 'bold', textDecoration: 'none' }}>VER EXPEDIENTE COMPLETO →</a>
                                            </div>
                                            <small style={{ color: '#888', display: 'block', marginTop: '5px' }}>📍 {n.ubicacion}</small>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}
                    </MapContainer>
                </div>

                <div className="panel-objetivos">
                    <h3 className="titulo-objetivos">{vista === 'lugares' ? '🎯 OBJETIVOS' : '🔥 ALERTAS'}</h3>
                    <div className="lista-scrollable">
                        {(vista === 'lugares' ? puntos : noticias).map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => {
                                    setCentroMapa([item.latitud, item.longitud]);
                                    setIdResaltado(item.id);
                                }}
                                className={`objetivo-item ${idResaltado === item.id ? 'sel-activo' : ''}`}
                                style={{
                                    borderLeft: idResaltado === item.id ? '4px solid #00ff41' : '4px solid transparent',
                                    padding: '10px',
                                    marginBottom: '5px',
                                    cursor: 'pointer',
                                    background: idResaltado === item.id ? 'rgba(0, 255, 65, 0.1)' : 'transparent'
                                }}
                            >
                                <div className="obj-nombre" style={{ color: idResaltado === item.id ? '#00ff41' : '#fff', fontWeight: 'bold' }}>
                                    {item.nombre || item.titulo}
                                </div>
                                <div className="obj-loc" style={{ fontSize: '0.8rem', color: '#888' }}>
                                    📍 {item.ubicacion || 'Sector Desconocido'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Lugares;