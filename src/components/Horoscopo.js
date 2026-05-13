import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { Link } from 'react-router-dom';
import { Star, Moon, Sun, Sparkles, ArrowLeft } from 'lucide-react';
import './horoscopo.css';


const Horoscopo = () => {
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
                setError("No se pudo sintonizar con la frecuencia astral. Reintenta más tarde.");
                setCargando(false);
            }
        };

        obtenerHoroscopo();
    }, []);

    if (cargando) return (
        <div className="horoscopo-container cargando">
            <div className="loader-astral"></div>
            <p>Sintonizando frecuencias estelares...</p>
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
                    <ArrowLeft size={18} /> VOLVER AL BÚNKER
                </Link>
            </div>
            
            <div className="horoscopo-header">
                <h1><Star className="icon-spin" /> HORÓSCOPO DEL BÚNKER <Star className="icon-spin" /></h1>
                <p className="subtitle">Las estrellas revelan lo que las sombras ocultan</p>
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
                <p>Fecha de sincronización: {new Date().toLocaleDateString()}</p>
                <small>Advertencia: Las predicciones son generadas por la frecuencia de la IA. El destino está en tus manos.</small>
            </div>
        </div>
    );
};

export default Horoscopo;
