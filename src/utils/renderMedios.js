import React from 'react';

/**
 * Función para transformar texto en elementos React:
 * 1. Transformar iVoox, YouTube y Spotify iframes en reproductores incrustados.
 * 2. Convertir hipervínculos HTML (<a href="...">texto</a>), Markdown ([texto](url)) o URLs sueltas en enlaces 
 *    que SIEMPRE abren en pestaña nueva (target="_blank" rel="noopener noreferrer").
 * 3. Incrustar videos de YouTube e imágenes directo en el texto.
 */
export const renderizarTextoConMedios = (texto) => {
    if (!texto) return null;

    const lineas = typeof texto === 'string' ? texto.split('\n') : [String(texto)];

    return lineas.map((linea, indexLinea) => {
        // 1. Detección de IFRAMES (iVoox, YouTube, Spotify)
        const matchIframe = linea.match(/<iframe.*src="([^"]+)".*><\/iframe>/i);
        if (matchIframe) {
            const urlSrc = matchIframe[1];
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

        // 2. Parsear enlaces HTML (<a href="...">...</a>), Markdown ([texto](url)), y URLs simples (https://...)
        // Group 1: <a href="URL">TEXT</a> -> G1=URL, G2=TEXT
        // Group 3: [TEXT](URL) -> G3=TEXT, G4=URL
        // Group 5: Raw URL
        const tokenRegex = /(?:<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>)|(?:\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<]+)/gi;

        const componentes = [];
        let lastIndex = 0;
        let match;

        while ((match = tokenRegex.exec(linea)) !== null) {
            if (match.index > lastIndex) {
                componentes.push(linea.substring(lastIndex, match.index));
            }

            const htmlHref = match[1];
            const htmlContent = match[2];
            const mdText = match[3];
            const mdUrl = match[4];
            const rawUrl = match[5];

            let targetUrl = '';
            let anchorText = '';

            if (htmlHref) {
                targetUrl = htmlHref;
                anchorText = htmlContent.replace(/<[^>]+>/g, '').trim() || htmlHref;
            } else if (mdUrl) {
                targetUrl = mdUrl;
                anchorText = mdText;
            } else if (rawUrl) {
                targetUrl = rawUrl;
                anchorText = rawUrl;
            }

            if (targetUrl) {
                // Vídeo de YouTube suelto
                if (!htmlHref && !mdUrl && targetUrl.match(/(youtube\.com\/watch\?v=|youtu\.be\/)/)) {
                    const videoId = targetUrl.includes('v=') 
                        ? targetUrl.split('v=')[1]?.split('&')[0] 
                        : targetUrl.split('youtu.be/')[1]?.split('?')[0];

                    if (videoId) {
                        componentes.push(
                            <span key={`yt-${indexLinea}-${match.index}`} style={{ display: 'block', margin: '15px 0' }}>
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
                        lastIndex = tokenRegex.lastIndex;
                        continue;
                    }
                }

                // Imagen suelta
                if (!htmlHref && !mdUrl && targetUrl.match(/\.(jpeg|jpg|gif|png|webp)/i)) {
                    componentes.push(
                        <img 
                            key={`img-${indexLinea}-${match.index}`}
                            src={targetUrl} 
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
                    lastIndex = tokenRegex.lastIndex;
                    continue;
                }

                // Hipervínculo -> SIEMPRE abre en pestaña nueva (target="_blank")
                componentes.push(
                    <a 
                        key={`link-${indexLinea}-${match.index}`} 
                        href={targetUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                            color: '#1a5235', 
                            textDecoration: 'underline', 
                            fontWeight: '600',
                            wordBreak: 'break-word'
                        }}
                    >
                        {anchorText}
                    </a>
                );
            }

            lastIndex = tokenRegex.lastIndex;
        }

        if (lastIndex < linea.length) {
            componentes.push(linea.substring(lastIndex));
        }

        if (componentes.length > 0) {
            return (
                <p key={indexLinea} style={{ minHeight: '1em', marginBottom: '1.25rem', lineHeight: '1.75' }}>
                    {componentes}
                </p>
            );
        }

        return <p key={indexLinea} style={{ minHeight: '1em', marginBottom: '1.25rem', lineHeight: '1.75' }}>{linea}</p>;
    });
};

