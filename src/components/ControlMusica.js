import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const ControlMusica = () => {
  // ARRANCA EN OFF — el usuario decide cuándo activar la música
  const [sonando, setSonando] = useState(false);
  const [audio] = useState(new Audio(`${API_BASE_URL}/audios-ambiente/misterio.mp3`));

  useEffect(() => {
    audio.volume = 0.2;
    audio.loop = true;

    // NO hacemos autoplay — respetamos la experiencia del usuario
    return () => { 
      audio.pause(); 
    };
  }, [audio]);

  const toggleMusica = () => {
    if (sonando) {
      audio.pause();
    } else {
      audio.play().catch(e => console.log("Error al activar audio:", e));
    }
    setSonando(!sonando);
  };

  return (
    <div className="music-control-wrapper">
      <button 
          onClick={toggleMusica} 
          className={`btn-musica-top ${sonando ? 'is-playing' : 'is-muted'}`}
          title={sonando ? 'SILENCIAR CANAL DE AUDIO' : 'ACTIVAR MÚSICA AMBIENTE'}
      >
        <span className="music-icon">{sonando ? '🔊' : '🎵'}</span>
        <span className="music-text">{sonando ? 'AUDIO: ON' : 'MÚSICA AMBIENTE'}</span>
      </button>
      {/* Eliminado el popup intrusivo a petición del usuario */}
    </div>
  );
};

export default ControlMusica;
