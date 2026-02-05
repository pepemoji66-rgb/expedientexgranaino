import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// 1. ICONOS TÁCTICOS
const iconoMisterio = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Rojo estándar
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
});

const iconoResaltado = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/5693/5693831.png', // Cyan/Azul Neón
    iconSize: [45, 45], // Un poco más grande para que destaque
    iconAnchor: [22, 45],
    popupAnchor: [0, -45],
});

// Componente auxiliar para mover la cámara
const ActualizadorMapa = ({ centro }) => {
    const map = useMap();
    useEffect(() => {
        if (centro) {
            map.flyTo(centro, 16, { animate: true, duration: 2 });
        }
    }, [centro, map]);
    return null;
};

const Lugares = () => {
    const [puntos, setPuntos] = useState([]);
    const [nuevoLugar, setNuevoLugar] = useState(null); 
    const [modoReporte, setModoReporte] = useState(false);
    const [idResaltado, setIdResaltado] = useState(null);
    const [centroMapa, setCentroMapa] = useState([37.1773, -3.5986]);
    
    const [formData, setFormData] = useState({ 
        nombre: '', 
        descripcion: '', 
        archivoFoto: null, 
        barrio: '' 
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const res = await axios.get('http://localhost:5000/lugares');
            const aprobados = res.data.filter(p => p.estado === 'aprobado');
            setPuntos(aprobados);

            // ESCÁNER DE GALERÍA: ¿Venimos buscando algo?
            const buscadoId = localStorage.getItem('lugar_a_resaltar');
            if (buscadoId) {
                const puntoEncontrado = aprobados.find(p => p.id === parseInt(buscadoId));
                if (puntoEncontrado) {
                    setIdResaltado(puntoEncontrado.id);
                    setCentroMapa([parseFloat(puntoEncontrado.latitud), parseFloat(puntoEncontrado.longitud)]);
                    // Limpiamos el rastro para la próxima vez
                    localStorage.removeItem('lugar_a_resaltar');
                }
            }
        } catch (err) {
            console.error("Error al cargar puntos:", err);
        }
    };

    const DetectorClics = () => {
        useMapEvents({
            click(e) {
                if (modoReporte) setNuevoLugar(e.latlng);
            },
        });
        return null;
    };

    const manejarEnvio = async (e) => {
        e.preventDefault();
        const dataEnvio = new FormData();
        dataEnvio.append('nombre', formData.nombre);
        dataEnvio.append('descripcion', formData.descripcion);
        dataEnvio.append('latitud', nuevoLugar.lat);
        dataEnvio.append('longitud', nuevoLugar.lng);
        dataEnvio.append('ubicacion', formData.barrio);
        dataEnvio.append('foto', formData.archivoFoto);

        try {
            await axios.post('http://localhost:5000/lugares', dataEnvio);
            alert("🚀 REPORTE ENVIADO AL BÚNKER.");
            setNuevoLugar(null);
            setModoReporte(false);
            setFormData({ nombre: '', descripcion: '', archivoFoto: null, barrio: '' });
            cargarDatos(); 
        } catch (err) {
            alert("❌ Error en la transmisión.");
        }
    };

    return (
        <section className="seccion-lugares" style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
            <h2 className="titulo-lugares" style={{ color: '#00d4ff', textAlign: 'center', fontFamily: 'Orbitron', textShadow: '0 0 10px #00d4ff', marginBottom: '20px' }}>
                📍 RADAR TÁCTICO DE GRANADA
            </h2>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {!modoReporte ? (
                    <button onClick={() => setModoReporte(true)} style={{ padding: '12px 25px', background: '#00ff41', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer', fontFamily: 'Orbitron' }}>
                        ➕ REGISTRAR HALLAZGO
                    </button>
                ) : (
                    <div style={{ color: '#00ff41', fontWeight: 'bold' }}>
                        {nuevoLugar ? "🎯 OBJETIVO FIJADO" : "📡 SELECCIONA EL PUNTO EN EL MAPA"}
                    </div>
                )}
            </div>

            <div className="contenedor-flex-mapa" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {nuevoLugar && (
                    <div className="formulario-lugar" style={{ background: '#222', padding: '20px', borderRadius: '15px', border: '2px solid #00ff41', width: '350px', color: '#fff' }}>
                        <h3 style={{ color: '#00ff41' }}>📂 REPORTE DE CAMPO</h3>
                        <form onSubmit={manejarEnvio}>
                            <input type="text" placeholder="TÍTULO..." required style={{width:'100%', marginBottom:'10px', padding:'10px', background: '#333', color: '#fff', border: '1px solid #444'}} onChange={e=>setFormData({...formData, nombre: e.target.value})} />
                            <textarea placeholder="DESCRIPCIÓN..." required style={{width:'100%', marginBottom:'10px', padding:'10px', background: '#333', color: '#fff', border: '1px solid #444', height: '80px'}} onChange={e=>setFormData({...formData, descripcion: e.target.value})} />
                            <input type="file" accept="image/*" required style={{width:'100%', marginBottom:'15px', color: '#00ff41'}} onChange={e => setFormData({...formData, archivoFoto: e.target.files[0]})} />
                            <input type="text" placeholder="BARRIO..." required style={{width:'100%', marginBottom:'20px', padding:'10px', background: '#333', color: '#fff', border: '1px solid #444'}} onChange={e=>setFormData({...formData, barrio: e.target.value})} />
                            <button type="submit" style={{width:'100%', padding:'12px', background:'#00ff41', color: '#000', fontWeight:'bold', border:'none', borderRadius:'5px', cursor:'pointer'}}>SUBIR AL RADAR</button>
                            <button type="button" onClick={() => {setNuevoLugar(null); setModoReporte(false);}} style={{width:'100%', marginTop:'10px', background:'none', color:'red', border:'1px solid red', cursor:'pointer'}}>ABORTAR</button>
                        </form>
                    </div>
                )}

                <div className="mapa-contenedor" style={{ height: '600px', flex: 1, minWidth: '400px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #333' }}>
                    <MapContainer center={centroMapa} zoom={14} style={{ height: '100%', width: '100%' }}>
                        <ActualizadorMapa centro={centroMapa} />
                        <DetectorClics />
                        <LayersControl position="topright">
                            <LayersControl.BaseLayer checked name="🗺️ Mapa"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="🛰️ Satélite"><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /></LayersControl.BaseLayer>
                        </LayersControl>

                        {puntos.map(lugar => (
                            <Marker 
                                key={lugar.id} 
                                position={[parseFloat(lugar.latitud), parseFloat(lugar.longitud)]} 
                                icon={lugar.id === idResaltado ? iconoResaltado : iconoMisterio}
                            >
                                <Popup>
                                    <div style={{ textAlign: 'center', width: '200px' }}>
                                        <h3 style={{ margin: '5px 0', color: lugar.id === idResaltado ? '#00d4ff' : '#ff4d4d' }}>{lugar.nombre}</h3>
                                        <img src={`http://localhost:5000${lugar.imagen_url}`} alt={lugar.nombre} style={{ width: '100%', borderRadius: '8px' }} />
                                        <p style={{ fontSize: '0.85rem' }}>{lugar.descripcion}</p>
                                        <strong style={{ fontSize: '0.7rem' }}>📍 {lugar.ubicacion}</strong>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                </div>
            </div>
        </section>
    );
};

export default Lugares;