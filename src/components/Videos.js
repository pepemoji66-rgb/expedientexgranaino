import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Forms from './Forms';
import './videos.css';

const Videos = ({ userAuth }) => {
    const [videos, setVideos] = useState([]);
    const [nuevaUrl, setNuevaUrl] = useState('');
    const [titulo, setTitulo] = useState('');

    useEffect(() => {
        cargarVideos();
    }, []);

    const cargarVideos = async () => {
        try {
            // RUTA ACTUALIZADA: Ahora pedimos solo los aprobados
            const res = await axios.get('http://localhost:5000/videos-publicos');
            setVideos(res.data);
        } catch (err) {
            console.error("Error al conectar con la base de datos");
        }
    };

    const handleSubirVideo = async (e) => {
        e.preventDefault();
        try {
            // RUTA ACTUALIZADA: Enviamos al búnker para revisión
            await axios.post('http://localhost:5000/subir-video', {
                titulo: titulo,
                url: nuevaUrl,
                usuario: userAuth?.nombre || 'ANÓNIMO', // Cambiado agente por usuario
                estado: 'pendiente'
            });
            alert("🛸 MATERIAL ENVIADO: En revisión por el Administrador.");
            setNuevaUrl('');
            setTitulo('');
            cargarVideos(); // Recargamos por si acaso
        } catch (err) {
            alert("❌ Error en la transmisión");
        }
    };

    return (
        <div className="videos-container fade-in">
            <h1 className="titulo-seccion">SISTEMA DE VIGILANCIA</h1>

            <div className="grid-videos">
                {videos.length > 0 ? videos.map((vid) => (
                    <div key={vid.id} className={`video-card ${vid.usuario === 'ADMIN' ? 'admin-video' : ''}`}>
                        <div className="video-wrapper">
                            {!vid.url.includes('http') ? (
                                <video controls className="video-elemento">
                                    {/* Ajuste de ruta estática al servidor */}
                                    <source src={`http://localhost:5000/videos/${vid.url}.mp4`} type="video/mp4" />
                                </video>
                            ) : (
                                <iframe
                                    src={vid.url.replace("watch?v=", "embed/")}
                                    title={vid.titulo}
                                    frameBorder="0"
                                    allowFullScreen
                                ></iframe>
                            )}
                        </div>
                        <div className="video-info">
                            <span className="agente-tag">
                                {vid.usuario === 'ADMIN' ? 'JEFE' : `USUARIO: ${vid.usuario || vid.agente}`}
                            </span>
                            <h3>{vid.titulo.toUpperCase()}</h3>
                        </div>
                    </div>
                )) : <p className="texto-vacio">No hay registros de video aprobados en el sistema.</p>}
            </div>

            {userAuth && (
                <div className="subir-video-seccion">
                    <Forms title="REPORTAR AVISTAMIENTO" onSubmit={handleSubirVideo}>
                        <input 
                            type="text" 
                            placeholder="TÍTULO DEL HALLAZGO" 
                            value={titulo} 
                            onChange={(e) => setTitulo(e.target.value)} 
                            required 
                        />
                        <input 
                            type="text" 
                            placeholder="URL DE YOUTUBE O NOMBRE DEL ARCHIVO" 
                            value={nuevaUrl} 
                            onChange={(e) => setNuevaUrl(e.target.value)} 
                            required 
                        />
                    </Forms>
                </div>
            )}
        </div>
    );
};

export default Videos;