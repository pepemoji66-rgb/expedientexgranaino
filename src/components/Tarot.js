import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import './tarot.css';
import backImg from '../assets/tarot/back.jpg';
import genericImg from '../assets/tarot/generic.jpg';

const Tarot = () => {
    const { t } = useLanguage();
    const [baraja, setBaraja] = useState([]);
    const [seleccionadas, setSeleccionadas] = useState([]);
    const [resultado, setResultado] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarBaraja();
    }, []);

    const cargarBaraja = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/tarot/baraja`);
            setBaraja(res.data);
            setResultado(null);
            setSeleccionadas([]);
        } catch (err) {
            setError(t('errorFallen'));
        }
    };

    const toggleCarta = (id) => {
        if (resultado) return; // Si ya hay resultado, no se puede elegir más

        if (seleccionadas.includes(id)) {
            setSeleccionadas(seleccionadas.filter(item => item !== id));
        } else {
            if (seleccionadas.length < 5) {
                setSeleccionadas([...seleccionadas, id]);
            }
        }
    };

    const realizarTirada = async () => {
        if (seleccionadas.length !== 5) return;
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/tarot/tirada`, { seleccionados: seleccionadas });
            setResultado(res.data);
        } catch (err) {
            setError("Error al procesar la energía de las cartas.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tarot-page">
            <header className="header-tarot">
                <h1 className="titulo-neon">{t('tarotTitle')}</h1>
                <p className="subtitulo">{t('tarotSubtitle')}</p>
            </header>

            <div className="ritual-area">
                <div className="tarot-deck">
                    {baraja.map((carta, index) => {
                        const isSelected = seleccionadas.includes(carta.id);
                        // Buscamos si esta carta está en la tirada resultado
                        const indexEnSeleccion = seleccionadas.indexOf(carta.id);
                        const resultInfo = (resultado && indexEnSeleccion !== -1) ? resultado.tirada[indexEnSeleccion] : null;
                        
                        return (
                            <div 
                                key={index} 
                                className={`tarot-card-container ${isSelected ? 'is-selected' : ''}`}
                                onClick={() => !resultado && toggleCarta(carta.id)}
                            >
                                <div className={`tarot-card ${resultInfo ? 'flipped' : ''} ${isSelected ? 'selected' : ''}`}>
                                    <div className="tarot-card-back" style={{ backgroundImage: `url(${backImg})` }}></div>
                                    <div className="tarot-card-front" style={{ backgroundImage: `url(${genericImg})` }}>
                                        {resultInfo && (
                                            <div className="info-revelada">
                                                <span className="posicion-label">{resultInfo.posicion}</span>
                                                <span className="card-name-label">{resultInfo.nombre}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!resultado && (
                    <div className="controles-tarot">
                        <p>{seleccionadas.length} / 5 {t('tarotCardsChosen')}</p>
                        <button 
                            className="btn-tarot" 
                            onClick={realizarTirada} 
                            disabled={seleccionadas.length !== 5 || loading}
                        >
                            {loading ? t('tarotSyncing') : t('tarotReveal')}
                        </button>
                    </div>
                )}
            </div>

            {resultado && (
                <div className="resultado-tarot fade-in">
                    <div className="resumen-final">
                        <h3>{t('tarotMessage')}</h3>
                        <p className="resumen-texto">{resultado.resumen}</p>
                        
                        <div className="detalles-tirada">
                            {resultado.tirada.map((item, idx) => (
                                <div key={idx} className="detalle-item">
                                    <strong>{item.posicion}:</strong> {item.significado}
                                </div>
                            ))}
                        </div>

                        <button className="btn-tarot" onClick={cargarBaraja} style={{ marginTop: '30px' }}>{t('tarotNewRitual')}</button>
                    </div>
                </div>
            )}

            {error && <p className="error-tarot">{error}</p>}
        </div>
    );
};

export default Tarot;
