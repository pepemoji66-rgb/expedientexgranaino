import React, { useEffect } from 'react';

const AdSlot = ({ id, type = 'horizontal' }) => {
    
    useEffect(() => {
        const timer = setTimeout(() => {
            try {
                const container = document.getElementById(`ad-slot-${id}`);
                if (container && container.offsetWidth > 0) {
                    (window.adsbygoogle = window.adsbygoogle || []).push({});
                } else {
                    console.warn(`📡 [AD SENSE] El sector ${id} no tiene ancho disponible (width=0). Sintonización cancelada.`);
                }
            } catch (e) {
                console.error("📡 Error cargando frecuencia publicitaria:", e);
            }
        }, 1000); // Pequeño retardo para asegurar layout

        return () => clearTimeout(timer);
    }, [id]);

    const style = {
        margin: '20px auto',
        padding: '0',
        textAlign: 'center',
        minHeight: type === 'horizontal' ? '90px' : '250px',
        maxWidth: '100%',
        overflow: 'hidden'
    };

    return (
        <div className="ad-slot-container" id={`ad-slot-${id}`} style={style}>
            {/* UNIDAD DE ANUNCIO ADAPTATIVA - IDENTIDAD ca-pub-2318415961583536 */}
            <ins className="adsbygoogle"
                 style={{ display: 'block' }}
                 data-ad-client="ca-pub-2318415961583536"
                 data-ad-slot={id === 'footer-top' ? '8888888888' : '1234567890'} // Estos IDs se pueden afinar más tarde
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
        </div>
    );
};

export default AdSlot;
