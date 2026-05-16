import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Link } from 'react-router-dom';
import { Star, Moon, Sun, Sparkles, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './horoscopo.css';

const Horoscopo = () => {
    const { t } = useLanguage();
    const [predicciones, setPredicciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    const signos = [
        { nombre: 'Aries', icono: '♈' },
        { nombre: 'Tauro', icono: '♉' },
        { nombre: 'Géminis', icono: '♊' },
        { nombre: 'Cáncer', icono: '♋' },
        { nombre: 'Leo', icono: '♌' },
        { nombre: 'Virgo', icono: '♍' },
        { nombre: 'Libra', icono: '♎' },
        { nombre: 'Escorpio', icono: '♏' },
        { nombre: 'Sagitario', icono: '♐' },
        { nombre: 'Capricornio', icono: '♑' },
        { nombre: 'Acuario', icono: '♒' },
        { nombre: 'Piscis', icono: '♓' }
    ];

    useEffect(() => {
        const obtenerHoroscopo = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/horoscopo`);
                setPredicciones(res.data);
                setCargando(false);
            } catch (err) {
                console.error("Error obteniendo el horóscopo:", err);
                setError(t('errorFallen'));
                setCargando(false);
            }
        };

        obtenerHoroscopo();
    }, []);

    if (cargando) return (
        <div className="horoscopo-container cargando">
            <div className="loader-astral"></div>
            <p>{t('horoscopoLoading')}</p>
        </div>
    );

    if (error) return (
        <div className="horoscopo-container error">
            <p>⚠️ {error}</p>
        </div>
    );

    return (
        <div className="horoscopo-container">
            <div className="horoscopo-nav">
                <Link to="/" className="btn-volver-bunker">
                    <ArrowLeft size={18} /> {t('horoscopoBack')}
                </Link>
            </div>
            
            <div className="horoscopo-header">
                <h1><Star className="icon-spin" /> {t('horoscopoTitle')} <Star className="icon-spin" /></h1>
                <p className="subtitle">{t('horoscopoSubtitle')}</p>
                <div className="header-decoration">
                    <Moon size={20} /> <Sparkles size={20} /> <Sun size={20} />
                </div>
            </div>

            <div className="signos-grid">
                {signos.map((s) => {
                    const prediccion = predicciones.find(p => p.signo.toLowerCase() === s.nombre.toLowerCase())?.prediccion;
                    return (
                        <div key={s.nombre} className="signo-card">
                            <div className="signo-icono">{s.icono}</div>
                            <h3>{s.nombre.toUpperCase()}</h3>
                            <div className="divider"></div>
                            <p>{prediccion || "Buscando en los archivos del destino..."}</p>
                        </div>
                    );
                })}
            </div>

            <div className="horoscopo-footer">
                <p>{t('horoscopoSyncDate')}: {new Date().toLocaleDateString()}</p>
                <small>{t('horoscopoWarning')}</small>
            </div>
        </div>
    );
};

export default Horoscopo;
