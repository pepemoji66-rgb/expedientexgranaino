import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMapEvents, useMap } from 'react-leaflet';
import { useLocation } from 'react-router-dom'; 
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import './paneladmin.css';

// --- CONFIGURACIÓN DE ICONOS ---
const iconoRojo = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const iconoResaltado = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [1, -34],
    shadowSize: [45, 45]
});

const iconoAlerta = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/564/564619.png',
    iconSize: [35, 35],
    popupAnchor: [1, -34]
});

const ActualizadorMapa = ({ centro }) => {
    const map = useMap();
    const prevCentroRef = useRef(null);

    useEffect(() => {
        if (centro && JSON.stringify(centro) !== JSON.stringify(prevCentroRef.current)) {
            map.flyTo(centro, 15, { animate: true, duration: 2.0 });
            prevCentroRef.current = centro;

            const timer = setTimeout(() => {
                map.eachLayer((layer) => {
                    if (layer instanceof L.Marker) {
                        const latLng = layer.getLatLng();
                        if (Math.abs(latLng.lat - centro[0]) < 0.0001 && Math.abs(latLng.lng - centro[1]) < 0.0001) {
                            layer.openPopup();
                        }
                    }
                });
            }, 2200);
            return () => clearTimeout(timer);
        }
    }, [centro, map]);
    return null;
};

const Lugares = () => {
    const location = useLocation(); 
    const [puntos, setPuntos] = useState([]);
    const [noticias, setNoticias] = useState([]);
    const [nuevoLugar, setNuevoLugar] = useState(null); 
    const [modoReporte, setModoReporte] = useState(false);
    const [idResaltado, setIdResaltado] = useState(null);
    const [centroMapa, setCentroMapa] = useState([37.1773, -3.5986]);
    
    const [formData, setFormData] = useState({ 
        nombre: '', descripcion: '', archivoFoto: null, barrio: '' 
    });

    const cargarDatos = useCallback(async () => {
        try {
            const [resLugares, resNoticias] = await Promise.all([
                axios.get('http://localhost:5000/lugares'),
                axios.get('http://localhost:5000/admin/todas-noticias')
            ]);

            const listaLugares = Array.isArray(resLugares.data) ? resLugares.data : [];
            const listaNoticias = Array.isArray(resNoticias.data) ? resNoticias.data : [];

            const aprobados = listaLugares.filter(p => p.estado === 'aprobado');
            const noticiasGeo = listaNoticias.filter(n => n.latitud && n.longitud && n.estado === 'aprobado');
            
            setPuntos(aprobados);
            setNoticias(noticiasGeo);

            if (noticiasGeo.length > 0) {
                const ultimaN = [...noticiasGeo].sort((a, b) => Number(b.id) - Number(a.id))[0];
                setCentroMapa([parseFloat(ultimaN.latitud), parseFloat(ultimaN.longitud)]);
                setIdResaltado('noticia-' + ultimaN.id);
            }
        } catch (err) { 
            console.error("❌ Error de radar", err); 
        }
    }, []);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const irAObjetivo = (lat, lng, id, tipo) => {
        const coords = [parseFloat(lat), parseFloat(lng)];
        setCentroMapa(coords);
        setIdResaltado(tipo === 'noticia' ? 'noticia-' + id : id);
    };

    const DetectorClics = () => {
        useMapEvents({ click(e) { if (modoReporte) setNuevoLugar(e.latlng); } });
        return null;
    };

    const manejarEnvio = async (e) => {
        e.preventDefault();
        const d = new FormData();
        d.append('nombre', formData.nombre); 
        d.append('descripcion', formData.descripcion);
        d.append('latitud', nuevoLugar.lat); 
        d.append('longitud', nuevoLugar.lng);
        d.append('ubicacion', formData.barrio); 
        if (formData.archivoFoto) d.append('foto', formData.archivoFoto);
        
        try {
            await axios.post('http://localhost:5000/lugares', d);
            alert("Reporte enviado al búnker.");
            setNuevoLugar(null); 
            setModoReporte(false); 
            cargarDatos(); 
        } catch (err) { alert("Error en el envío."); }
    };

    return (
        <section className="panel-admin-container fade-in">
            <h2 className="titulo-neon">RADAR ESTRATÉGICO DE POSICIONES</h2>
            
            <div style={{ textAlign: 'center', marginBottom: '15px', display: 'flex', justifyContent: 'center', gap: '15px' }}>
                <div className="pagi-info">DATOS CARGADOS: {puntos.length + noticias.length}</div>
                <button onClick={() => { setModoReporte(!modoReporte); setNuevoLugar(null); }} className="btn-pagi" style={{ background: modoReporte ? '#ff4444' : '#00ff00', color: '#000' }}>
                    {modoReporte ? '❌ CANCELAR' : '➕ REGISTRAR PUNTO'}
                </button>
            </div>

            <div className="interfaz-radar" style={{ display: 'flex', gap: '20px', height: '75vh', position: 'relative' }}>
                
                {/* --- MAPA --- */}
                <div className="mapa-wrapper" style={{ flex: 1, borderRadius: '15px', border: '2px solid #00f3ff', overflow: 'hidden', position: 'relative' }}>
                    
                    {/* MODAL: Ahora está fuera del MapContainer para evitar el error removeChild */}
                    {nuevoLugar && (
                        <div style={{ position: 'absolute', zIndex: 1000, top: '20px', left: '20px', width: '250px', background: 'rgba(0,0,0,0.9)', border: '2px solid #00ff00', padding: '15px', borderRadius: '10px', boxShadow: '0 0 15px #00ff00' }}>
                            <h3 style={{ color: '#00ff00', fontSize: '14px', margin: '0 0 10px 0' }}>COORDENADAS FIJADAS</h3>
                            <form onSubmit={manejarEnvio}>
                                <input type="text" placeholder="TÍTULO..." className="input-bunker" required onChange={e=>setFormData({...formData, nombre: e.target.value})} />
                                <input type="text" placeholder="BARRIO/ZONA..." className="input-bunker" required onChange={e=>setFormData({...formData, barrio: e.target.value})} />
                                <button type="submit" className="btn-ok" style={{ width: '100%', marginTop: '10px' }}>REGISTRAR</button>
                            </form>
                        </div>
                    )}

                    <MapContainer center={centroMapa} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <ActualizadorMapa centro={centroMapa} />
                        <DetectorClics />
                        <LayersControl position="topright">
                            <LayersControl.BaseLayer checked name="Callejero"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="Satélite"><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /></LayersControl.BaseLayer>
                        </LayersControl>

                        {puntos.map(l => (
                            <Marker key={`lugar-${l.id}`} position={[parseFloat(l.latitud), parseFloat(l.longitud)]} icon={l.id === idResaltado ? iconoResaltado : iconoRojo}>
                                <Popup>
                                    <div className="popup-bunker">
                                        <h4>{l.nombre}</h4>
                                        <p>{l.descripcion}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {noticias.map(n => (
                            <Marker key={`noticia-${n.id}`} position={[parseFloat(n.latitud), parseFloat(n.longitud)]} icon={idResaltado === 'noticia-'+n.id ? iconoResaltado : iconoAlerta}>
                                <Popup>
                                    <div className="popup-bunker">
                                        <strong style={{color:'red'}}>⚠️ ALERTA</strong>
                                        <h4>{n.titulo}</h4>
                                        <p>{n.cuerpo}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>

                {/* --- COLUMNA DERECHA --- */}
                <div className="lista-objetivos" style={{ width: '320px', overflowY: 'auto', background: 'rgba(0, 20, 40, 0.9)', padding: '15px', borderRadius: '15px', border: '1px solid #00f3ff' }}>
                    <h3 style={{ color: '#00f3ff', fontSize: '1.1rem', borderBottom: '1px solid #00f3ff', paddingBottom: '10px', textAlign: 'center', marginBottom: '10px' }}>🎯 OBJETIVOS</h3>
                    
                    {noticias.map(n => (
                        <div key={`list-n-${n.id}`} 
                             onClick={() => irAObjetivo(n.latitud, n.longitud, n.id, 'noticia')}
                             style={{ 
                                padding: '12px', cursor: 'pointer', borderBottom: '1px solid #1a3a4a', 
                                background: idResaltado === 'noticia-'+n.id ? 'rgba(255, 204, 0, 0.1)' : 'transparent',
                                borderLeft: idResaltado === 'noticia-'+n.id ? '4px solid #ffcc00' : '4px solid transparent'
                             }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <small style={{ color: '#ff4444', fontWeight: 'bold' }}>⚠️ ALERTA</small>
                            </div>
                            <div style={{ color: '#fff', fontSize: '0.95rem' }}>{n.titulo}</div>
                            <div style={{ color: '#00f3ff', fontSize: '0.75rem', marginTop: '4px' }}>📍 {n.ubicacion || 'Zona desconocida'}</div>
                        </div>
                    ))}

                    {puntos.map(l => (
                        <div key={`list-l-${l.id}`} 
                             onClick={() => irAObjetivo(l.latitud, l.longitud, l.id, 'lugar')}
                             style={{ 
                                padding: '12px', cursor: 'pointer', borderBottom: '1px solid #1a3a4a',
                                background: idResaltado === l.id ? 'rgba(0, 255, 0, 0.05)' : 'transparent',
                                borderLeft: idResaltado === l.id ? '4px solid #00ff00' : '4px solid transparent'
                             }}>
                            <small style={{ color: '#00ff00', fontWeight: 'bold' }}>📍 LUGAR</small>
                            <div style={{ color: '#fff' }}>{l.nombre}</div>
                            <div style={{ color: '#888', fontSize: '0.75rem' }}>📍 {l.ubicacion || 'Área táctica'}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Lugares;