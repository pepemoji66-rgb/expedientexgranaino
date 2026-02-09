import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './archivosusuarios.css';
import { useNavigate } from 'react-router-dom';

const ArchivosUsuarios = () => {
    const [hallazgos, setHallazgos] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const cargarHallazgos = async () => {
            try {
                // Llamada al backend
                const res = await axios.get('http://localhost:5000/imagenes-publicas');
                setHallazgos(res.data);
            } catch (err) {
                console.error("❌ Error cargando archivos de agentes:", err);
            }
        };
        cargarHallazgos();
    }, []);

    const verEnMapa = (dato) => {
        const payload = {
            id: dato.id,
            latitud: parseFloat(dato.latitud),
            longitud: parseFloat(dato.longitud),
            tipo: 'archivo',
            nombre: dato.titulo
        };
        localStorage.setItem('lugar_a_resaltar', JSON.stringify(payload));
        navigate('/lugares');
    };

    return (
        <div className="archivos-container">
            <h2 className="titulo-archivos">📂 ARCHIVOS DE CAMPO (INTELIGENCIA)</h2>
            <div className="archivos-grid">
                {hallazgos.map(item => {
                    // Ruta al puerto 5000
                    const rutaFoto = `http://localhost:5000/archivos-usuarios/${item.url_imagen}`;

                    return (
                        <div key={item.id} className="archivo-card">
                            <div className="contenedor-img-agente">
                                {/* --- AQUÍ ESTÁ EL BLOQUE CORREGIDO --- */}
                                <img 
                                    src={rutaFoto} 
                                    alt={item.titulo} 
                                    onClick={() => verEnMapa(item)}
                                    style={{ cursor: 'pointer', width: '100%', height: 'auto', display: 'block' }}
                                    onError={(e) => {
                                        // Evita que el error se repita infinitamente
                                        e.target.onerror = null; 
                                        // Ponemos un color gris de fondo si no hay imagen
                                        e.target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8Xw8AAoMBX928o1oAAAAASUVORK5CYII=";
                                        console.warn("⚠️ No se encontró el archivo físico en:", rutaFoto);
                                    }}
                                />
                                {/* -------------------------------------- */}
                            </div>
                            <div className="archivo-info">
                                <h3 className="titulo-neon-chico">{item.titulo}</h3>
                                <p className="agente-tag">🕵️ AGENTE: {item.agente}</p>
                                <button className="btn-radar" onClick={() => verEnMapa(item)}>
                                    📍 LOCALIZAR EN RADAR
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ArchivosUsuarios;