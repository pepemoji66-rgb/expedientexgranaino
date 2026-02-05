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
            // Cargamos siempre los vídeos públicos para todos
            const res = await axios.get('http://localhost:5000/videos-publicos');
            setVideos(res.data); 
        } catch (err) {
            console.error("❌ Error al conectar con el servidor");
        }
    };

    const handleSubirVideo = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/subir-video', {
                titulo: titulo,
                url: nuevaUrl,
                usuario: userAuth?.nombre || 'ANÓNIMO'
            });
            alert("Vídeo enviado correctamente para revisión.");
            setNuevaUrl('');
            setTitulo('');
            cargarVideos(); 
        } catch (err) {
            alert("❌ Error al subir el contenido");
        }
    };

    return (
        <div className="videos-container fade-in">
            {/* Título más serio y profesional */}
            <h1 className="titulo-seccion">ARCHIVO AUDIOVISUAL</h1>

            <div className="grid-videos">
                {videos && videos.length > 0 ? (
                    videos.map((vid) => (
                        <div key={vid.id} className="video-card">
                            <div className="video-wrapper">
                                {vid.url && !vid.url.includes('http') ? (
                                    <video controls className="video-elemento" key={vid.url}>
                                        <source src={`/videos/${vid.url}.mp4`} type="video/mp4" />
                                        <source src={`/videos/${vid.url}`} type="video/mp4" />
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
                    <div className="texto-vacio" style={{textAlign: 'center', width: '100%', color: '#888'}}>
                        <p>No hay vídeos disponibles en este momento.</p>
                    </div>
                )}
            </div>

            {/* Lógica de registro para aportar material */}
            <div className="seccion-aportaciones" style={{ marginTop: '40px', textAlign: 'center' }}>
                {userAuth ? (
                    <div className="subir-video-seccion">
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
                                placeholder="URL DE YOUTUBE O NOMBRE DEL ARCHIVO" 
                                value={nuevaUrl} 
                                onChange={(e) => setNuevaUrl(e.target.value)} 
                                required 
                            />
                        </Forms>
                    </div>
                ) : (
                    <div className="aviso-registro-videos" style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <p style={{ color: '#aaa', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            Para aportar su propio material audiovisual a esta colección, 
                            por favor <strong style={{color: 'var(--color-principal)'}}>inicie sesión</strong> o regístrese.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Videos;