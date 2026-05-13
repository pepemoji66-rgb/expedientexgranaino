import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Forms from './Forms';
import { renderizarTextoConMedios } from '../utils/renderMedios';
import './audios.css';
import API_BASE_URL from '../config';

const Audios = ({ userAuth }) => {
    // RED DE SEGURIDAD: Siempre inicializamos como array vacío
    const [audios, setAudios] = useState([]);
    const [titulo, setTitulo] = useState('');
    const [latitud, setLatitud] = useState('');
    const [longitud, setLongitud] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [tipoSubida, setTipoSubida] = useState('archivo');
    const [rutaExterna, setRutaExterna] = useState('');
    const [imagenUrl, setImagenUrl] = useState('');

    useEffect(() => {
        cargarAudios();
    }, []);

    const obtenerCoordenadas = () => {
        if (!navigator.geolocation) return alert("GPS NO DETECTADO.");
        navigator.geolocation.getCurrentPosition((pos) => {
            setLatitud(pos.coords.latitude.toFixed(6));
            setLongitud(pos.coords.longitude.toFixed(6));
        });
    };

    const cargarAudios = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/audios/audios-publicos`);
            if (res.data && Array.isArray(res.data)) {
                setAudios(res.data);
            } else {
                setAudios([]);
            }
        } catch (err) {
            console.error("❌ Error de conexión con el archivo sonoro:", err);
            setAudios([]);
        }
    };

    const handleSubirAudio = async (e) => {
        e.preventDefault();
        if (tipoSubida === 'archivo' && !archivo) return alert("Selecciona un archivo primero, hermano.");
        if (tipoSubida === 'enlace' && !rutaExterna) return alert("Pega un enlace o código iframe.");

        const formData = new FormData();
        if (tipoSubida === 'archivo') {
            formData.append('audio', archivo);
        } else {
            formData.append('ruta_externa', rutaExterna);
        }
        formData.append('titulo', titulo);
        formData.append('agente', userAuth?.nombre || 'AGENTE ANÓNIMO');
        formData.append('latitud', latitud || 0);
        formData.append('longitud', longitud || 0);
        formData.append('imagen_url', imagenUrl);

        try {
            await axios.post(`${API_BASE_URL}/api/audios/subir-audio`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert("✅ Psicofonía enviada. El Alto Mando debe revisarla.");
            setTitulo('');
            setLatitud('');
            setLongitud('');
            setArchivo(null);
            setRutaExterna('');
            cargarAudios();
        } catch (err) {
            console.error("Error en subida:", err);
            alert("❌ Fallo en la transmisión. Verifique su identidad de agente.");
        }
    };


    return (
        <div className="audios-page-wrapper">
            <h1 className="titulo-seccion">AUDIOS</h1>

            <div className="lista-audios-limpia">
                {Array.isArray(audios) && audios.length > 0 ? (
                    audios.map((aud) => {
                        const audioSrc = aud.ruta && aud.ruta.startsWith('http')
                            ? aud.ruta
                            : `${API_BASE_URL}/audios/${aud.ruta}`;

                        const esIframe = aud.ruta && aud.ruta.includes('<iframe');
                        const esYoutube = aud.ruta && (aud.ruta.includes('youtube.com') || aud.ruta.includes('youtu.be'));
                        const esSoloEnlace = aud.ruta && aud.ruta.startsWith('http') && !esIframe && !esYoutube && !aud.ruta.toLowerCase().endsWith('.mp3') && !aud.ruta.toLowerCase().endsWith('.wav');

                        return (
                            <div key={aud.id} className="audio-item-card">
                                <div className="audio-card-inner">
                                    <div className="audio-thumbnail-wrapper">
                                        <img 
                                            src={aud.imagen_url && aud.imagen_url !== '' 
                                                ? (aud.imagen_url.startsWith('http') ? aud.imagen_url : `${API_BASE_URL}/imagenes/${aud.imagen_url}`) 
                                                : `${API_BASE_URL}/imagenes/audio_default.png`} 
                                            alt={aud.titulo} 
                                        />
                                    </div>

                                    <div className="audio-content-info">
                                        <div className="info">
                                            <h3>{aud.titulo ? aud.titulo.toUpperCase() : 'REGISTRO SIN TÍTULO'}</h3>
                                            <div className="audio-meta-info">
                                                <div className="meta-tag">📁 {aud.agente || 'ARCHIVO'}</div>
                                                <div className="meta-tag">📍 {aud.latitud ? 'GEOLOCALIZADO' : 'SITIO RESERVADO'}</div>
                                            </div>
                                        </div>

                                        {esIframe || esYoutube ? (
                                            <div style={{ width: '100%', overflow: 'hidden', borderRadius: '4px' }}>
                                                {renderizarTextoConMedios(aud.ruta)}
                                            </div>
                                        ) : esSoloEnlace ? (
                                            <a href={aud.ruta} target="_blank" rel="noreferrer" className="btn-enlace-externo">
                                                🎧 ABRIR ARCHIVO EXTERNO
                                            </a>
                                        ) : (
                                            <audio controls crossOrigin="anonymous" className="reproductor-bunker">
                                                <source src={audioSrc} type="audio/mpeg" />
                                                SISTEMA NO COMPATIBLE
                                            </audio>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-hay-datos">
                        <p>📡 No hay registros aprobados o la base de datos está fuera de línea...</p>
                    </div>
                )}
            </div>

            <div style={{ height: '50px' }}></div>

            {userAuth && (
                <div className="form-fijo-abajo">
                    <Forms title="REGISTRAR NUEVA PRUEBA" onSubmit={handleSubirAudio}>
                        <div className="campo-form">
                            <label>TÍTULO DEL HALLAZGO</label>
                            <input
                                type="text"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                className="input-bunker"
                                placeholder="Ej: Psicofonía en sótano..."
                                required
                            />
                        </div>

                        <div className="campo-form">
                            <label>URL DE IMAGEN (OPCIONAL)</label>
                            <input
                                type="text"
                                value={imagenUrl}
                                onChange={(e) => setImagenUrl(e.target.value)}
                                className="input-bunker"
                                placeholder="https://mi-imagen.jpg"
                            />
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                            <div className="campo-form">
                                <label>LATITUD</label>
                                <input type="number" step="any" value={latitud} onChange={e => setLatitud(e.target.value)} className="input-bunker" placeholder="0.00" />
                            </div>
                            <div className="campo-form">
                                <label>LONGITUD</label>
                                <input type="number" step="any" value={longitud} onChange={e => setLongitud(e.target.value)} className="input-bunker" placeholder="0.00" />
                            </div>
                        </div>

                        <button type="button" onClick={obtenerCoordenadas} style={{
                            width: '100%', marginBottom: '15px', padding: '8px',
                            background: 'transparent', border: '1px solid var(--color-principal)', color: 'var(--color-principal)',
                            fontFamily: 'monospace', cursor: 'pointer', fontSize: '0.7rem'
                        }}>
                            🛰️ SCAN SECTOR (GPS)
                        </button>

                        <div className="campo-form">
                            <label>MÉTODO DE SUBIDA</label>
                            <select value={tipoSubida} onChange={e => setTipoSubida(e.target.value)} className="input-bunker" style={{marginBottom: '15px'}}>
                                <option value="archivo">SUBIR ARCHIVO (.MP3)</option>
                                <option value="enlace">ENLACE / IFRAME (iVoox, Spotify)</option>
                            </select>
                        </div>

                        {tipoSubida === 'archivo' ? (
                            <div className="campo-form">
                                <label>ARCHIVO (.MP3)</label>
                                <input
                                    type="file"
                                    key={archivo ? 'lleno' : 'vacio'}
                                    accept="audio/mpeg,audio/wav"
                                    onChange={(e) => setArchivo(e.target.files[0])}
                                    className="input-file-bunker"
                                    required={tipoSubida === 'archivo'}
                                />
                            </div>
                        ) : (
                            <div className="campo-form">
                                <label>CÓDIGO DE INSERCIÓN O ENLACE</label>
                                <textarea
                                    value={rutaExterna}
                                    onChange={(e) => setRutaExterna(e.target.value)}
                                    className="input-bunker"
                                    placeholder="Pega aquí el código <iframe...> de iVoox o Spotify"
                                    style={{ height: '80px', resize: 'vertical' }}
                                    required={tipoSubida === 'enlace'}
                                />
                            </div>
                        )}
                        <button type="submit" className="btn-enviar-bunker">
                            ENVIAR AL SERVIDOR
                        </button>
                    </Forms>
                </div>
            )}
        </div>
    );
};

export default Audios;
