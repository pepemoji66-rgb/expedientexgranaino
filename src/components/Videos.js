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
            const res = await axios.get('http://localhost:5000/api/videos');
            setVideos(res.data);
        } catch (err) {
            console.error("❌ Error al conectar con el servidor:", err);
        }
    };

    const handleSubirVideo = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/api/videos', {
                titulo: titulo,
                url: nuevaUrl,
                usuario: userAuth?.nombre || 'ANÓNIMO'
            });
            alert("Vídeo enviado correctamente al archivo.");
            setNuevaUrl('');
            setTitulo('');
            cargarVideos();
        } catch (err) {
            console.error("Error al subir:", err);
            alert("❌ Error al subir el contenido");
        }
    };

    return (
        <div className="videos-container fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* 1. CABECERA */}
            <h1 className="titulo-seccion">ARCHIVO AUDIOVISUAL</h1>

            {/* 2. ZONA DE VÍDEOS (Contenedor Flexible) */}
            <div className="grid-videos" style={{ flex: '1' }}>
                {videos && videos.length > 0 ? (
                    videos.map((vid) => (
                        <div key={vid.id} className="video-card">
                            <div className="video-wrapper">
                                {vid.url && !vid.url.includes('http') ? (
                                    <video controls className="video-elemento" key={vid.url}>
                                        <source src={`http://localhost:5000/ver-videos/${vid.url}`} type="video/mp4" />
                                        Tu navegador no soporta el formato de vídeo.
                                    </video>
                                ) : (
                                    <iframe
                                        src={vid.url ? vid.url.replace("watch?v=", "embed/").split("&")[0] : ""}
                                        title={vid.titulo}
                                        frameBorder="0"
                                        allowFullScreen
                                    ></iframe>
                                )}
                            </div>
                            <div className="video-info">
                                <span className="agente-tag">
                                    PUBLICADO POR: {vid.usuario || vid.agente || 'ARCHIVO'}
                                </span>
                                <h3>{vid.titulo ? vid.titulo.toUpperCase() : 'VÍDEO SIN TÍTULO'}</h3>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="texto-vacio" style={{ textAlign: 'center', width: '100%', color: '#888', padding: '50px' }}>
                        <p>No hay vídeos disponibles en este momento.</p>
                    </div>
                )}
            </div>

            {/* 3. SECCIÓN DE APORTACIONES (Anclada al final) */}
            <div className="seccion-aportaciones" style={{ marginTop: '100px', width: '100%', position: 'relative', clear: 'both' }}>
                {userAuth ? (
                    <div className="subir-video-seccion" style={{ position: 'relative', zIndex: '1' }}>
                        <Forms title="COMPARTIR VÍDEO" onSubmit={handleSubirVideo}>
                            <input
                                type="text"
                                placeholder="TÍTULO DEL VÍDEO"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                placeholder="ARCHIVO (ej: 1.mp4) O URL YOUTUBE"
                                value={nuevaUrl}
                                onChange={(e) => setNuevaUrl(e.target.value)}
                                required
                            />
                        </Forms>
                    </div>
                ) : (
                    <div className="aviso-registro-videos" style={{ padding: '40px', textAlign: 'center', borderTop: '1px dashed var(--color-principal)' }}>
                        <p style={{ color: '#aaa', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            Para aportar su propio material audiovisual, por favor <strong style={{ color: 'var(--color-principal)' }}>inicie sesión</strong>.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Videos;