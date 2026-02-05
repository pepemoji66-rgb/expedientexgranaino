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
            const res = await axios.get('http://localhost:5000/videos-publicos');
            console.log("📺 DATOS RECUPERADOS:", res.data);
            // Aseguramos que el estado se actualice correctamente
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
            alert("🛸 MATERIAL ENVIADO: El Jefe revisará el hallazgo.");
            setNuevaUrl('');
            setTitulo('');
            cargarVideos(); 
        } catch (err) {
            alert("❌ Fallo en la transmisión");
        }
    };

    return (
        <div className="videos-container fade-in">
            <h1 className="titulo-seccion">SISTEMA DE VIGILANCIA</h1>

            <div className="grid-videos">
                {videos && videos.length > 0 ? (
                    videos.map((vid) => (
                        <div key={vid.id} className="video-card">
                            <div className="video-wrapper">
                                {vid.url && !vid.url.includes('http') ? (
                                    /* VÍDEO LOCAL */
                                    <video controls className="video-elemento">
                                        <source src={`/videos/${vid.url}.mp4`} type="video/mp4" />
                                        Tu navegador no soporta el formato de vídeo.
                                    </video>
                                ) : (
                                    /* VÍDEO YOUTUBE */
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
                                    FUENTE: {vid.usuario || vid.agente || 'DESCONOCIDO'}
                                </span>
                                <h3>{vid.titulo ? vid.titulo.toUpperCase() : 'AVISTAMIENTO SIN NOMBRE'}</h3>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="texto-vacio" style={{textAlign: 'center', width: '100%', color: '#ff4d4d'}}>
                        <p>📡 BUSCANDO SEÑAL... No hay vídeos aprobados en el sector.</p>
                        <small>Asegúrate de que el Administrador haya aprobado los vídeos en el panel.</small>
                    </div>
                )}
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