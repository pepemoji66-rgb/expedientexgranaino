import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const ControlMusica = () => {
  // Ahora arranca en ON por defecto
  const [sonando, setSonando] = useState(true);
  const [audio] = useState(new Audio(`${API_BASE_URL}/audios-ambiente/misterio.mp3`));

  useEffect(() => {
    audio.volume = 0.2;
    audio.loop = true;

    if (sonando) {
      // Intentar reproducir automáticamente
      audio.play().catch(e => {
        console.log("Autoplay bloqueado por el navegador. Esperando interacción del usuario para iniciar el audio ambiente...");
      });

      // Registrar listeners para reproducir con la primera interacción del usuario en la web
      const iniciarEnInteraccion = () => {
        audio.play().then(() => {
          // Si se reproduce con éxito, removemos los listeners
          document.removeEventListener('click', iniciarEnInteraccion);
          document.removeEventListener('touchstart', iniciarEnInteraccion);
          document.removeEventListener('keydown', iniciarEnInteraccion);
        }).catch(e => {
          console.log("No se pudo iniciar el audio en interacción:", e);
        });
      };

      document.addEventListener('click', iniciarEnInteraccion);
      document.addEventListener('touchstart', iniciarEnInteraccion);
      document.addEventListener('keydown', iniciarEnInteraccion);

      return () => {
        audio.pause();
        document.removeEventListener('click', iniciarEnInteraccion);
        document.removeEventListener('touchstart', iniciarEnInteraccion);
        document.removeEventListener('keydown', iniciarEnInteraccion);
      };
    } else {
      audio.pause();
    }
  }, [sonando, audio]);

  const toggleMusica = (e) => {
    // Evitamos propagación para que el clic del botón no interactúe con el document listener
    e.stopPropagation();

    if (sonando) {
      audio.pause();
      setSonando(false);
    } else {
      setSonando(true);
      audio.play().catch(e => console.log("Error al activar audio:", e));
    }
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
