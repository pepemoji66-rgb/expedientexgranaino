import React, { useEffect, useRef } from 'react';

/**
 * Componente publicitario de Adsterra
 * format: 'native' (Bandera nativa adaptativa) | 'banner300' (300x250)
 */
const AdSlot = ({ id, format = 'native', type = 'horizontal' }) => {
    const bannerRef = useRef(null);

    useEffect(() => {
        const container = bannerRef.current;
        if (!container) return;

        // Limpiar contenido previo para evitar duplicados en SPA
        container.innerHTML = '';

        // Solo cargamos el Banner estándar limpio 300x250
        const confScript = document.createElement('script');
        confScript.type = 'text/javascript';
        confScript.text = `
            atOptions = {
                'key' : 'f61bc684b935d4955ff3ceb4cbbb3078',
                'format' : 'iframe',
                'height' : 250,
                'width' : 300,
                'params' : {}
            };
        `;
        const invokeScript = document.createElement('script');
        invokeScript.type = 'text/javascript';
        invokeScript.src = 'https://www.highrevenueformat.com/f61bc684b935d4955ff3ceb4cbbb3078/invoke.js';

        container.appendChild(confScript);
        container.appendChild(invokeScript);
    }, [id]);

    const style = {
        margin: '25px auto',
        padding: '10px 0',
        textAlign: 'center',
        minHeight: format === 'banner300' ? '260px' : '100px',
        maxWidth: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    };

    return (
        <div 
            className="ad-slot-container" 
            id={`ad-slot-${id}`} 
            style={style} 
            ref={bannerRef}
        />
    );
};

export default AdSlot;

