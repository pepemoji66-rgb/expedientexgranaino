import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Forms from './Forms';
import './videos.css'; // El CSS sí va en minúsculas como me pediste

const Videos = ({ userAuth }) => {
    const [videos, setVideos] = useState([]);
    const [nuevaUrl, setNuevaUrl] = useState('');
    const [titulo, setTitulo] = useState('');

    useEffect(() => {
        const cargarVideos = async () => {
            try {
                const res = await axios.get('http://localhost:5000/videos');
                setVideos(res.data);
            } catch (err) {
                console.error("Error al conectar con la base de datos");
            }
        };
        cargarVideos();
    }, []);

    const handleSubirVideo = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/subir-video', {
                titulo: titulo,
                url: nuevaUrl,
                agente: userAuth?.nombre || 'ANÓNIMO',
                estado: 'pendiente'
            });
            alert("🛸 MATERIAL ENVIADO: En revisión por el Administrador.");
            setNuevaUrl('');
            setTitulo('');
        } catch (err) {
            alert("❌ Error en la transmisión");
        }
    };

    return (
        <div className="videos-container fade-in">
            <h1 className="titulo-seccion">SISTEMA DE VIGILANCIA</h1>

            <div className="grid-videos">
                {videos.map((vid) => (
                    <div key={vid.id} className={`video-card ${vid.agente === 'ADMIN' ? 'admin-video' : ''}`}>
                        <div className="video-wrapper">
                            {!vid.url.includes('http') ? (
                                <video controls className="video-elemento">
                                    <source src={`/videos/${vid.url}.mp4`} type="video/mp4" />
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
                                {vid.agente === 'ADMIN' ? 'JEFE' : `AGENTE: ${vid.agente}`}
                            </span>
                            <h3>{vid.titulo.toUpperCase()}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {userAuth && (
                <div className="subir-video-seccion">
                    <Forms title="REPORTAR AVISTAMIENTO" onSubmit={handleSubirVideo}>
                        <input type="text" placeholder="TÍTULO" value={titulo} onChange={(e) => setTitulo(e.target.value)} required />
                        <input type="text" placeholder="ID (EJ: 5) O URL" value={nuevaUrl} onChange={(e) => setNuevaUrl(e.target.value)} required />
                    </Forms>
                </div>
            )}
        </div>
    );
};

export default Videos;