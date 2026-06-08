import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AdSlot from './AdSlot';
import './misterioshistoricos.css';
import API_BASE_URL from '../config';

const MisteriosHistoricos = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [misterios, setMisterios] = useState([]);
    const [paginaActual, setPaginaActual] = useState(1);
    const misteriosPorPagina = 9;

    useEffect(() => {
        cargarMisterios();
    }, []);

    const cargarMisterios = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/misterios-historicos`);
            if (Array.isArray(res.data)) {
                setMisterios(res.data);
            }
        } catch (err) {
            console.error("❌ Error al cargar Misterios Históricos:", err);
        }
    };

    // Paginación
    const indiceUltimo = paginaActual * misteriosPorPagina;
    const indicePrimero = indiceUltimo - misteriosPorPagina;
    const misteriosPaginados = misterios.slice(indicePrimero, indiceUltimo);
    const totalPaginas = Math.ceil(misterios.length / misteriosPorPagina);

    return (
        <div className="misterios-container">
            {/* CABECERA TÉCNICA */}
            <div className="header-bunker-alert">
                <div className="alert-badge">// ARCHIVO ENCICLOPÉDICO DE MISTERIOS GLOBAL</div>
                <h1 className="cyber-title-main">{language === 'en' ? 'HISTORICAL MYSTERIES' : 'MISTERIOS HISTÓRICOS'}</h1>
                <p className="cyber-subtitle">
                    {language === 'en' 
                        ? 'Global puzzles, ancient secrets, and unexplained events compiled for deep analysis.' 
                        : 'Enigmas globales, secretos ancestrales y sucesos inexplicables recopilados para análisis profundo.'}
                </p>
            </div>

            {/* BOTONES DE NAVEGACIÓN */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    className="forms-btn-submit btn-volver-misterio"
                    style={{ width: 'auto', background: 'rgba(0,255,65,0.1)', color: 'var(--color-principal)', border: '1px solid var(--color-principal)' }}
                >
                    ⬅ {language === 'en' ? 'BACK' : 'VOLVER'}
                </button>
                <button 
                    onClick={() => navigate('/')} 
                    className="forms-btn-submit btn-volver-misterio"
                    style={{ width: 'auto', background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', border: '1px solid #00d4ff' }}
                >
                    🏠 {language === 'en' ? 'BUNKER HOME' : 'VOLVER A INICIO'}
                </button>
            </div>

            <AdSlot slotId="misterios-top" />

            {/* GRID DE MISTERIOS */}
            <div className="misterios-grid">
                {misteriosPaginados.length > 0 ? (
                    misteriosPaginados.map(m => {
                        const titulo = language === 'en' && m.titulo_en ? m.titulo_en : m.titulo;
                        const desc = language === 'en' && m.contenido_en ? m.contenido_en : m.contenido;
                        
                        return (
                            <div 
                                key={m.id} 
                                className="misterio-card glass-card"
                                onClick={() => navigate(`/leer-historia/${m.id}?src=misterios`)}
                            >
                                <div className="card-media-wrap">
                                    {m.imagen_url ? (
                                        <img 
                                            src={m.imagen_url.startsWith('http') ? m.imagen_url : `${API_BASE_URL}/imagenes/${m.imagen_url}`} 
                                            alt={titulo} 
                                            className="misterio-img"
                                            onError={(e) => { e.target.src = "https://placehold.co/400x250/000/00ff41?text=ENIGMA"; }}
                                        />
                                    ) : (
                                        <div className="misterio-placeholder-media">
                                            <span>👁️ ENIGMA</span>
                                        </div>
                                    )}
                                    <div className="misterio-badge-tag">ENIGMA</div>
                                </div>
                                <div className="card-body-wrap">
                                    <h3>{titulo?.toUpperCase()}</h3>
                                    <p className="snippet">
                                        {desc ? desc.replace(/<[^>]+>/g, '').substring(0, 150) + '...' : ''}
                                    </p>
                                    <div className="card-footer-misterio">
                                        <span>📍 {m.latitud && m.latitud !== 0 ? 'GEOLOCALIZADO' : 'GLOBAL'}</span>
                                        <span>📅 {new Date(m.fecha).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-misterios">
                        <span className="scanner-line"></span>
                        <p>{language === 'en' ? 'Accessing secure archive servers...' : 'Accediendo a servidores de archivo seguro...'}</p>
                    </div>
                )}
            </div>

            {/* PAGINACIÓN */}
            {totalPaginas > 1 && (
                <div className="paginacion-admin" style={{ marginTop: '30px' }}>
                    <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)}>
                        {language === 'en' ? 'BACK' : 'ATRÁS'}
                    </button>
                    <span>{language === 'en' ? `PAGE ${paginaActual} / ${totalPaginas}` : `PÁG ${paginaActual} / ${totalPaginas}`}</span>
                    <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(p => p + 1)}>
                        {language === 'en' ? 'NEXT' : 'SIGUIENTE'}
                    </button>
                </div>
            )}

            <AdSlot slotId="misterios-bottom" />
        </div>
    );
};

export default MisteriosHistoricos;
