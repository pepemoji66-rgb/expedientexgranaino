import React, { useState, useEffect } from 'react';
import './CookieBanner.css';

const CookieBanner = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consentimiento = localStorage.getItem('bunker_cookie_consent');
        if (!consentimiento) {
            // Mostrar después de un pequeño delay para efecto visual
            const timer = setTimeout(() => setVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const aceptarCookies = () => {
        localStorage.setItem('bunker_cookie_consent', 'accepted');
        setVisible(false);
    };

    const rechazarCookies = () => {
        localStorage.setItem('bunker_cookie_consent', 'rejected');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="cookie-banner-bunker">
            <div className="cookie-content">
                <div className="cookie-icon">🍪</div>
                <div className="cookie-text">
                    <span className="alert-text">PROTOCOLO DE RASTREO:</span> 
                    Este búnker utiliza cookies para analizar el tráfico táctico y personalizar la publicidad de AdSense. 
                    ¿Permite el uso de estas balizas de datos para mejorar la experiencia del agente?
                </div>
                <div className="cookie-buttons">
                    <button onClick={aceptarCookies} className="btn-cookie accept">AUTORIZAR</button>
                    <button onClick={rechazarCookies} className="btn-cookie reject">DENEGAR</button>
                    <a href="/cookies" className="cookie-link">MÁS INFO</a>
                </div>
            </div>
            <div className="scanner-line-cookie"></div>
        </div>
    );
};

export default CookieBanner;
