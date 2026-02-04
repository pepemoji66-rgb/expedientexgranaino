import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

// 1. DEFINICIÓN DEL ICONO TÁCTICO
const iconoMisterio = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
});

const Lugares = () => {
    const [puntos, setPuntos] = useState([]);
    const [nuevoLugar, setNuevoLugar] = useState(null); 
    const [modoReporte, setModoReporte] = useState(false);
    
    // Estado para los textos y el ARCHIVO físico
    const [formData, setFormData] = useState({ 
        nombre: '', 
        descripcion: '', 
        archivoFoto: null, 
        barrio: '' 
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = () => {
        fetch('http://localhost:5000/lugares')
            .then(res => res.json())
            .then(data => {
                // Solo mostramos los aprobados en el radar público
                setPuntos(data.filter(p => p.estado === 'aprobado'));
            })
            .catch(err => console.error("Error al cargar puntos:", err));
    };

    // 2. DETECTOR DE CLICS
    const DetectorClics = () => {
        useMapEvents({
            click(e) {
                if (modoReporte) {
                    setNuevoLugar(e.latlng);
                }
            },
        });
        return null;
    };

    // 3. ENVÍO CON SUBIDA DE ARCHIVO (FormData)
    const manejarEnvio = async (e) => {
        e.preventDefault();

        // Creamos el paquete FormData para enviar el archivo real
        const dataEnvio = new FormData();
        dataEnvio.append('nombre', formData.nombre);
        dataEnvio.append('descripcion', formData.descripcion);
        dataEnvio.append('latitud', nuevoLugar.lat);
        dataEnvio.append('longitud', nuevoLugar.lng);
        dataEnvio.append('ubicacion', formData.barrio);
        dataEnvio.append('foto', formData.archivoFoto); // El archivo físico

        try {
            await axios.post('http://localhost:5000/lugares', dataEnvio, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("🚀 REPORTE ENVIADO. La imagen está en camino al búnker.");
            
            // Limpiamos todo
            setNuevoLugar(null);
            setModoReporte(false);
            setFormData({ nombre: '', descripcion: '', archivoFoto: null, barrio: '' });
            cargarDatos(); 
        } catch (err) {
            console.error(err);
            alert("❌ Error en la transmisión. Asegúrate de que el servidor acepte archivos.");
        }
    };

    return (
        <section className="seccion-lugares" style={{ padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
            <h2 className="titulo-lugares" style={{ 
                color: '#ff4d4d', textAlign: 'center', fontFamily: 'Orbitron, sans-serif',
                textShadow: '0 0 10px rgba(255, 77, 77, 0.5)', marginBottom: '20px'
            }}>
                📍 RADAR TÁCTICO DE GRANADA
            </h2>

            {/* BOTÓN CONTROLADOR */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {!modoReporte ? (
                    <button 
                        onClick={() => setModoReporte(true)}
                        style={{ padding: '12px 25px', background: '#00ff41', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer', fontFamily: 'Orbitron' }}
                    >
                        ➕ REGISTRAR NUEVO HALLAZGO
                    </button>
                ) : (
                    <div style={{ color: '#00ff41', animation: 'pulse 1.5s infinite' }}>
                        {nuevoLugar ? "🎯 UBICACIÓN SELECCIONADA" : "📡 HAZ CLIC EN EL MAPA PARA MARCAR EL OBJETIVO"}
                    </div>
                )}
            </div>

            <div className="contenedor-flex-mapa" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                
                {/* FORMULARIO LATERAL */}
                {nuevoLugar && (
                    <div className="formulario-lugar" style={{ 
                        background: '#222', padding: '20px', borderRadius: '15px', border: '2px solid #00ff41',
                        width: '350px', color: '#fff', boxShadow: '0 0 15px rgba(0, 255, 65, 0.2)'
                    }}>
                        <h3 style={{ color: '#00ff41', marginTop: 0 }}>📂 REPORTE DE CAMPO</h3>
                        <form onSubmit={manejarEnvio}>
                            <label style={{fontSize: '0.8rem', color: '#00ff41'}}>NOMBRE DEL SITIO</label>
                            <input type="text" placeholder="Ej: Tunel misterioso" required style={{width:'100%', marginBottom:'10px', padding:'10px', background: '#333', color: '#fff', border: '1px solid #444'}} 
                                onChange={e=>setFormData({...formData, nombre: e.target.value})} />
                            
                            <label style={{fontSize: '0.8rem', color: '#00ff41'}}>DESCRIPCIÓN</label>
                            <textarea placeholder="¿Qué ocurre aquí?" required style={{width:'100%', marginBottom:'10px', padding:'10px', background: '#333', color: '#fff', border: '1px solid #444', height: '80px'}} 
                                onChange={e=>setFormData({...formData, descripcion: e.target.value})} />
                            
                            <label style={{fontSize: '0.8rem', color: '#00ff41'}}>EVIDENCIA VISUAL (FOTO)</label>
                            <input type="file" accept="image/*" required style={{width:'100%', marginBottom:'15px', padding:'5px', color: '#00ff41'}} 
                                onChange={e => setFormData({...formData, archivoFoto: e.target.files[0]})} />
                            
                            <label style={{fontSize: '0.8rem', color: '#00ff41'}}>ZONA / BARRIO</label>
                            <input type="text" placeholder="Ej: Realejo" required style={{width:'100%', marginBottom:'20px', padding:'10px', background: '#333', color: '#fff', border: '1px solid #444'}} 
                                onChange={e=>setFormData({...formData, barrio: e.target.value})} />
                            
                            <button type="submit" style={{width:'100%', padding:'12px', background:'#00ff41', color: '#000', fontWeight:'bold', border:'none', borderRadius:'5px', cursor:'pointer'}}>SUBIR AL RADAR</button>
                            <button type="button" onClick={() => {setNuevoLugar(null); setModoReporte(false);}} style={{width:'100%', marginTop:'10px', background:'none', color:'red', border:'1px solid red', cursor:'pointer', padding: '5px'}}>ABORTAR</button>
                        </form>
                    </div>
                )}

                {/* MAPA */}
                <div className="mapa-contenedor" style={{ height: '600px', flex: 1, minWidth: '400px', borderRadius: '15px', overflow: 'hidden', border: '2px solid #333' }}>
                    <MapContainer center={[37.1773, -3.5986]} zoom={14} style={{ height: '100%', width: '100%' }}>
                        <DetectorClics />
                        <LayersControl position="topright">
                            <LayersControl.BaseLayer checked name="🗺️ Mapa"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /></LayersControl.BaseLayer>
                            <LayersControl.BaseLayer name="🛰️ Satélite"><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" /></LayersControl.BaseLayer>
                        </LayersControl>

                        {puntos.map(lugar => (
                            <Marker key={lugar.id} position={[parseFloat(lugar.latitud), parseFloat(lugar.longitud)]} icon={iconoMisterio}>
                                <Popup>
                                    <div style={{ textAlign: 'center', width: '200px' }}>
                                        <h3 style={{ margin: '5px 0', color: '#ff4d4d' }}>{lugar.nombre}</h3>
                                        <img src={`http://localhost:5000${lugar.imagen_url}`} alt={lugar.nombre} style={{ width: '100%', borderRadius: '8px' }} />
                                        <p style={{ fontSize: '0.85rem', margin: '10px 0' }}>{lugar.descripcion}</p>
                                        <strong style={{ fontSize: '0.7rem', color: '#666' }}>📍 {lugar.ubicacion}</strong>
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