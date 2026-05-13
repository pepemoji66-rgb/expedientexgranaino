import React from 'react';

/**
 * Función para transformar URLs de YouTube y códigos de iVoox en reproductores incrustados.
 * Esto permite añadir contenido multimedia simplemente pegando enlaces en el texto de las noticias o expedientes.
 */
export const renderizarTextoConMedios = (texto) => {
    if (!texto) return null;
    
    // Separamos el texto por saltos de línea para mantener los párrafos
    const lineas = texto.split('\n');
    
    return lineas.map((linea, indexLinea) => {
        // 1. Detección de IFRAMES de iVoox o YouTube pegados directamente
        const matchIframe = linea.match(/<iframe.*src="([^"]+)".*><\/iframe>/i);
        if (matchIframe) {
            const urlSrc = matchIframe[1];
            // Solo permitimos iframes de iVoox o Youtube por seguridad
            if (urlSrc.includes('ivoox.com') || urlSrc.includes('youtube.com') || urlSrc.includes('spotify.com')) {
                return (
                    <div key={indexLinea} className="embed-container" style={{ margin: '15px 0', width: '100%' }}>
                        <iframe 
                            src={urlSrc} 
                            width="100%" 
                            height={urlSrc.includes('ivoox') ? "200" : "315"} 
                            frameBorder="0" 
                            allowFullScreen 
                            scrolling="no"
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        ></iframe>
                    </div>
                );
            }
        }

        // 2. Detección de URLs de YouTube e IMÁGENES en texto plano
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const partes = linea.split(urlRegex);

        if (partes.length > 1) {
            return (
                <p key={indexLinea} style={{ minHeight: '1em', marginBottom: '10px' }}>
                    {partes.map((parte, indexParte) => {
                        // YouTube
                        if (parte.match(/(youtube\.com\/watch\?v=|youtu\.be\/)/)) {
                            const videoId = parte.includes('v=') 
                                ? parte.split('v=')[1]?.split('&')[0] 
                                : parte.split('youtu.be/')[1]?.split('?')[0];
                                
                            if (videoId) {
                                return (
                                    <span key={indexParte} style={{ display: 'block', margin: '15px 0' }}>
                                        <iframe 
                                            width="100%" 
                                            height="315" 
                                            src={`https://www.youtube.com/embed/${videoId}`} 
                                            frameBorder="0" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowFullScreen>
                                        </iframe>
                                    </span>
                                );
                            }
                        }
                        
                        // IMÁGENES (jpg, png, webp, gif)
                        if (parte.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
                            return (
                                <img 
                                    key={indexParte}
                                    src={parte} 
                                    alt="evidencia" 
                                    style={{ 
                                        maxWidth: '100%', 
                                        height: 'auto', 
                                        display: 'block', 
                                        margin: '20px auto',
                                        borderRadius: '4px',
                                        boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
                                    }} 
                                />
                            );
                        }

                        // Enlaces normales (no multimedia)
                        if (parte.startsWith('http')) {
                            return <a key={indexParte} href={parte} target="_blank" rel="noreferrer" style={{ color: 'var(--color-principal)' }}>{parte}</a>;
                        }

                        return <span key={indexParte}>{parte}</span>;
                    })}
                </p>
            );
        }

        // 3. Texto normal (si no tiene enlaces ni iframes)
        return <p key={indexLinea} style={{ minHeight: '1em', marginBottom: '10px' }}>{linea}</p>;
    });
};
