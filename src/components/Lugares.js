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

const iconoArchivo = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34]
});

const iconoResaltado = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    iconSize: [30, 45], iconAnchor: [15, 45], popupAnchor: [1, -34]
});

// Componente para mover el mapa suavemente
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
    const [archivos, setArchivos] = useState([]); 
    const [vista, setVista] = useState('lugares'); 
    const [centroMapa, setCentroMapa] = useState([37.1773, -3.5986]);
    const [idResaltado, setIdResaltado] = useState(null); 
    const [indicesPestanas, setIndicesPestanas] = useState({});

    // Función mágica para evitar bucles en las fotos de los popups
    const handleImgError = (e) => {
        e.target.onerror = null;
        e.target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8Xw8AAoMBX928o1oAAAAASUVORK5CYII=";
    };

    const cargarDatos = useCallback(async () => {
        try {
            const [resL, resN, resA] = await Promise.all([
                axios.get('http://localhost:5000/lugares'),
                axios.get('http://localhost:5000/admin/todas-noticias'),
                axios.get('http://localhost:5000/imagenes-publicas') 
            ]);
            
            setPuntos(resL.data.filter(p => p.estado === 'activo' || p.estado === 'aprobado' || p.estado === 'publicado'));
            setNoticias(resN.data.filter(n => n.estado === 'aprobado' && n.latitud && n.longitud));
            setArchivos(resA.data); 
            
            const resaltar = localStorage.getItem('lugar_a_resaltar');
            if (resaltar) {
                const data = JSON.parse(resaltar);
                if (data.tipo === 'noticia') setVista('noticias');
                else if (data.tipo === 'archivo') setVista('archivos');
                
                setCentroMapa([parseFloat(data.latitud), parseFloat(data.longitud)]);
                setIdResaltado(data.id);
                localStorage.removeItem('lugar_a_resaltar');
            }
            
        } catch (err) { 
            console.error("❌ ERROR EN EL RADAR:", err); 
        }
    }, []);

    useEffect(() => { 
        cargarDatos(); 
    }, [cargarDatos]);

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

            {/* Selector de Vistas */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '15px', flexWrap: 'wrap' }}>
                <button 
                    onClick={() => { setVista('lugares'); setIdResaltado(null); }}
                    style={{ background: vista === 'lugares' ? '#00ff41' : '#222', color: vista === 'lugares' ? '#000' : '#00ff41', border: '2px solid #00ff41', padding: '10px 15px', fontWeight: 'bold', cursor: 'pointer' }}
                > 📍 LUGARES </button>

                <button 
                    onClick={() => { setVista('noticias'); setIdResaltado(null); }}
                    style={{ background: vista === 'noticias' ? '#ff4444' : '#222', color: vista === 'noticias' ? '#000' : '#ff4444', border: '2px solid #ff4444', padding: '10px 15px', fontWeight: 'bold', cursor: 'pointer' }}
                > ⚠️ ALERTAS </button>

                <button 
                    onClick={() => { setVista('archivos'); setIdResaltado(null); }}
                    style={{ background: vista === 'archivos' ? '#00d4ff' : '#222', color: vista === 'archivos' ? '#000' : '#00d4ff', border: '2px solid #00d4ff', padding: '10px 15px', fontWeight: 'bold', cursor: 'pointer' }}
                > 📂 ARCHIVOS AGENTES </button>
            </div>

            <div className="contenedor-radar-flexible">
                <div className="mapa-mando">
                    <MapContainer center={centroMapa} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <ActualizadorMapa centro={centroMapa} />
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {/* LUGARES */}
                        {vista === 'lugares' && puntos.map(l => (
                            <Marker key={`l-${l.id}`} position={[parseFloat(l.latitud), parseFloat(l.longitud)]} icon={idResaltado === l.id ? iconoResaltado : iconoLugar}>
                                <Popup>
                                    <div className="popup-bunker">
                                        <h4 style={{ color: '#00ff41' }}>📍 {l.nombre}</h4>
                                        {l.imagen_url && <img src={`http://localhost:5000/lugares/${l.imagen_url}`} alt={l.nombre} style={{ width: '100%', borderRadius: '4px' }} onError={handleImgError} />}
                                        <p style={{ fontSize: '12px', color: '#ccc' }}>{l.descripcion}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {/* ALERTAS */}
                        {vista === 'noticias' && noticiasAgrupadas.map((grupo, idx) => {
                            const keyGrupo = `${grupo[0].latitud}-${grupo[0].longitud}`;
                            const indexActual = indicesPestanas[keyGrupo] || 0;
                            const n = grupo[indexActual];

                            return (
                                <Marker key={`g-${idx}`} position={[parseFloat(n.latitud), parseFloat(n.longitud)]} icon={idResaltado === n.id ? iconoResaltado : iconoNoticia}>
                                    <Popup>
                                        <div className="popup-bunker">
                                            {grupo.length > 1 && (
                                                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
                                                    {grupo.map((_, i) => (
                                                        <button key={i} onClick={() => setIndicesPestanas({ ...indicesPestanas, [keyGrupo]: i })}
                                                            style={{ background: indexActual === i ? '#ff4444' : '#333', color: '#fff', border: 'none', padding: '2px 6px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}> INFO {i + 1} </button>
                                                    ))}
                                                </div>
                                            )}
                                            <h4 style={{ color: '#ff4444' }}>⚠️ ALERTA</h4>
                                            <strong style={{ color: '#00ff88' }}>{n.titulo}</strong>
                                            {n.imagen_url && <img src={`http://localhost:5000/imagenes/${n.imagen_url}`} alt={n.titulo} style={{ width: '100%', borderRadius: '4px', marginTop: '5px' }} onError={handleImgError} />}
                                            <p style={{ fontSize: '11px', marginTop: '5px' }}>{n.cuerpo}</p>
                                        </div>
                                    </Popup>
                                </Marker>
                            );
                        })}

                        {/* ARCHIVOS USUARIOS */}
                        {vista === 'archivos' && archivos.map(a => (
                            <Marker key={`a-${a.id}`} position={[parseFloat(a.latitud), parseFloat(a.longitud)]} icon={idResaltado === a.id ? iconoResaltado : iconoArchivo}>
                                <Popup>
                                    <div className="popup-bunker">
                                        <h4 style={{ color: '#00d4ff' }}>📂 ARCHIVO DE AGENTE</h4>
                                        <img src={`http://localhost:5000/archivos-usuarios/${a.url_imagen}`} alt={a.titulo} style={{ width: '100%', borderRadius: '4px', border: '1px solid #00d4ff', marginBottom: '5px' }} onError={handleImgError} />
                                        <strong style={{ color: '#fff' }}>{a.titulo}</strong>
                                        <p style={{ fontSize: '11px', color: '#aaa' }}>{a.descripcion}</p>
                                        <small style={{ color: '#00d4ff' }}>FUERZA: {a.agente}</small>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* Lista Derecha */}
                <div className="panel-objetivos">
                    <h3 className="titulo-objetivos">
                        {vista === 'lugares' ? '🎯 OBJETIVOS' : vista === 'noticias' ? '🔥 ALERTAS' : '🔎 HALLAZGOS'}
                    </h3>
                    <div className="lista-scrollable">
                        {(vista === 'lugares' ? puntos : vista === 'noticias' ? noticias : archivos).map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => {
                                    setCentroMapa([parseFloat(item.latitud), parseFloat(item.longitud)]);
                                    setIdResaltado(item.id);
                                }}
                                className={`objetivo-item ${idResaltado === item.id ? 'sel-activo' : ''}`}
                                style={{
                                    borderLeft: idResaltado === item.id ? `4px solid ${vista === 'archivos' ? '#00d4ff' : vista === 'noticias' ? '#ff4444' : '#00ff41'}` : '4px solid transparent',
                                    background: idResaltado === item.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                    padding: '10px', cursor: 'pointer', marginBottom: '5px'
                                }}
                            >
                                <div style={{ color: idResaltado === item.id ? '#fff' : '#ccc', fontWeight: 'bold' }}>
                                    {item.nombre || item.titulo}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                    {vista === 'archivos' ? `Por: ${item.agente}` : item.ubicacion || 'Sector Desconocido'}
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