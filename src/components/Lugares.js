import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const iconoMisterio = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', 
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35],
});

const iconoResaltado = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/5693/5693831.png', 
    iconSize: [45, 45],
    iconAnchor: [22, 45],
    popupAnchor: [0, -45],
});

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
        nombre: '', descripcion: '', archivoFoto: null, barrio: '' 
    });

    const cargarDatos = async () => {
        try {
            const res = await axios.get('http://localhost:5000/lugares');
            let aprobados = res.data.filter(p => p.estado === 'aprobado');

            const itemGuardado = localStorage.getItem('lugar_a_resaltar');
            
            if (itemGuardado) {
                // Intentamos parsear por si es el objeto de la galería
                try {
                    const data = JSON.parse(itemGuardado);
                    
                    if (data.esDeGaleria) {
                        // Es una imagen de la galería con coordenadas nuevas
                        const puntoTemporal = {
                            id: 'gal-' + data.id,
                            nombre: data.nombre,
                            latitud: data.latitud,
                            longitud: data.longitud,
                            imagen_url: '/imagenes/' + data.imagen_url,
                            descripcion: data.descripcion,
                            ubicacion: 'ARCHIVO GALERÍA'
                        };
                        aprobados.push(puntoTemporal);
                        setIdResaltado(puntoTemporal.id);
                        setCentroMapa([parseFloat(data.latitud), parseFloat(data.longitud)]);
                    } else {
                        // Es un ID de lugar normal (por si acaso)
                        const p = aprobados.find(x => x.id === parseInt(data));
                        if (p) {
                            setIdResaltado(p.id);
                            setCentroMapa([parseFloat(p.latitud), parseFloat(p.longitud)]);
                        }
                    }
                } catch (e) {
                    // Si no es JSON, es un ID normal de la tabla lugares
                    const p = aprobados.find(x => x.id === parseInt(itemGuardado));
                    if (p) {
                        setIdResaltado(p.id);
                        setCentroMapa([parseFloat(p.latitud), parseFloat(p.longitud)]);
                    }
                }
                localStorage.removeItem('lugar_a_resaltar');
            }
            setPuntos(aprobados);
        } catch (err) {
            console.error("Error al cargar puntos:", err);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const DetectorClics = () => {
        useMapEvents({
            click(e) { if (modoReporte) setNuevoLugar(e.latlng); },
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
            alert("🚀 REPORTE ENVIADO.");
            setNuevoLugar(null); setModoReporte(false);
            cargarDatos(); 
        } catch (err) { alert("❌ Error en la transmisión."); }
    };

    return (
        <section className="seccion-lugares" style={{ padding: '20px', backgroundColor: '#0a0a0a', minHeight: '100vh' }}>
            <h2 style={{ color: '#00ff41', textAlign: 'center', fontFamily: 'Orbitron', textShadow: '0 0 10px #00ff41' }}>
                📍 RADAR TÁCTICO DE GRANADA
            </h2>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {!modoReporte ? (
                    <button onClick={() => setModoReporte(true)} style={{ padding: '12px 25px', background: '#00ff41', color: '#000', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: 'pointer', fontFamily: 'Orbitron' }}>
                        ➕ REGISTRAR HALLAZGO
                    </button>
                ) : (
                    <div style={{ color: '#00ff41', fontWeight: 'bold' }}>🎯 SELECCIONA EL PUNTO EN EL MAPA</div>
                )}
            </div>

            <div className="contenedor-flex-mapa" style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {nuevoLugar && (
                    <div className="formulario-lugar" style={{ background: '#111', padding: '20px', borderRadius: '15px', border: '2px solid #00ff41', width: '350px', color: '#fff' }}>
                        <h3 style={{ color: '#00ff41' }}>📂 REPORTE DE CAMPO</h3>
                        <form onSubmit={manejarEnvio}>
                            <input type="text" placeholder="TÍTULO..." required style={{width:'100%', marginBottom:'10px', background:'#222', color:'#fff', border:'1px solid #444', padding:'8px'}} onChange={e=>setFormData({...formData, nombre: e.target.value})} />
                            <textarea placeholder="DESCRIPCIÓN..." required style={{width:'100%', marginBottom:'10px', background:'#222', color:'#fff', border:'1px solid #444', padding:'8px', height:'80px'}} onChange={e=>setFormData({...formData, descripcion: e.target.value})} />
                            <input type="file" accept="image/*" required style={{width:'100%', marginBottom:'15px', color:'#00ff41'}} onChange={e => setFormData({...formData, archivoFoto: e.target.files[0]})} />
                            <input type="text" placeholder="BARRIO..." required style={{width:'100%', marginBottom:'20px', background:'#222', color:'#fff', border:'1px solid #444', padding:'8px'}} onChange={e=>setFormData({...formData, barrio: e.target.value})} />
                            <button type="submit" style={{width:'100%', padding:'12px', background:'#00ff41', color:'#000', fontWeight:'bold', border:'none', borderRadius:'5px', cursor:'pointer'}}>SUBIR AL RADAR</button>
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
                                        <h3 style={{ margin: '5px 0' }}>{lugar.nombre}</h3>
                                        <img 
                                            src={lugar.imagen_url.startsWith('http') || lugar.imagen_url.startsWith('/imagenes/') ? lugar.imagen_url : `http://localhost:5000${lugar.imagen_url}`} 
                                            alt={lugar.nombre} 
                                            style={{ width: '100%', borderRadius: '8px', margin: '10px 0' }} 
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = 'https://via.placeholder.com/200x150?text=ARCHIVO+NO+ENCONTRADO';
                                            }}
                                        />
                                        <p style={{ fontSize: '0.85rem' }}>{lugar.descripcion}</p>
                                        <strong style={{ fontSize: '0.7rem' }}>📍 {lugar.ubicacion}</strong>
                                        <div style={{ color: 'red', fontWeight: 'bold', fontSize: '0.6rem', marginTop: '5px' }}>QSL CONTACT VERIFIED</div>
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