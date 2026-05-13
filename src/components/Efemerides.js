import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './efemerides.css';

const Efemerides = () => {
    const [efemeride, setEfemeride] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [expandido, setExpandido] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        const obtenerEfemeride = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/efemerides`);
                setEfemeride(res.data);
            } catch (err) {
                console.error("❌ Error obteniendo efeméride:", err);
                setError(true);
            } finally {
                setCargando(false);
            }
        };
        obtenerEfemeride();
    }, []);

    if (cargando) return (
        <div className="efemerides-widget cargando">
            <div className="efemerides-loader"></div>
            <span>Desclasificando archivos históricos...</span>
        </div>
    );

    if (error || !efemeride) return null;

    const iconoCategoria = {
        'OVNI': '🛸',
        'PARANORMAL': '👻',
        'CONSPIRACIÓN': '🕵️',
        'CRIPTOZOOLOGÍA': '🦎',
        'DESCLASIFICACIÓN': '📂',
        'ARQUEOLOGÍA': '🏛️'
    };

    const icono = iconoCategoria[efemeride.categoria] || '📜';
    const textoPreview = efemeride.contenido?.substring(0, 180) + '...';
    const fechaHoy = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });

    return (
        <div className="efemerides-widget">
            <div className="efemerides-header">
                <div className="efemerides-badge">
                    <span className="efemerides-icon-pulse">{icono}</span>
                    <span className="efemerides-label">HOY EN LA HISTORIA X</span>
                </div>
                <span className="efemerides-fecha">{fechaHoy}</span>
            </div>

            <div className="efemerides-body">
                <h3 className="efemerides-titulo">{efemeride.titulo}</h3>
                
                <div className="efemerides-meta">
                    {efemeride.anio_evento && efemeride.anio_evento > 0 && (
                        <span className="meta-tag año">📅 {efemeride.anio_evento}</span>
                    )}
                    {efemeride.ubicacion && (
                        <span className="meta-tag ubicacion">📍 {efemeride.ubicacion}</span>
                    )}
                    {efemeride.categoria && (
                        <span className="meta-tag categoria">{icono} {efemeride.categoria}</span>
                    )}
                </div>

                <div className={`efemerides-contenido ${expandido ? 'expandido' : ''}`}>
                    <p>{expandido ? efemeride.contenido : textoPreview}</p>
                </div>

                <button 
                    className="btn-expandir-efemeride"
                    onClick={() => setExpandido(!expandido)}
                >
                    {expandido ? '[-] CLASIFICAR ARCHIVO' : '[+] DESCLASIFICAR INFORME COMPLETO'}
                </button>
            </div>

            <div className="efemerides-footer">
                <div className="efemerides-scanner-line"></div>
                <small>ARCHIVO DESCLASIFICADO — EXPEDIENTEXGRANAINO</small>
            </div>
        </div>
    );
};

export default Efemerides;
