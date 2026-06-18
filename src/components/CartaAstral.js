import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import { useLanguage } from '../context/LanguageContext';
import { safeLocalStorage } from '../utils/storage';
import './cartaAstral.css';

const CartaAstral = () => {
    const { t } = useLanguage();
    const [userAuth, setUserAuth] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [carta, setCarta] = useState(null);
    
    // Form states
    const [fecha, setFecha] = useState('');
    const [dia, setDia] = useState('');
    const [mes, setMes] = useState('');
    const [anyo, setAnyo] = useState('');
    const [hora, setHora] = useState('12:00');
    const [ciudad, setCiudad] = useState('');
    const [coords, setCoords] = useState({ lat: 0, lon: 0 });
    const [buscandoCiudad, setBuscandoCiudad] = useState(false);

    useEffect(() => {
        const sesion = safeLocalStorage.getItem('agente_sesion');
        if (sesion) {
            const user = JSON.parse(sesion);
            setUserAuth(user);
            // Intentar cargar carta existente
            cargarCarta(user.email);
        }
    }, []);

    const cargarCarta = async (email) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/carta-astral/mi-carta`, { email });
            // Solo pre-rellenamos el formulario para que la pantalla aparezca "limpia" (sin el mensaje anterior)
            if (res.data.datos_nacimiento) {
                const f = res.data.datos_nacimiento.fecha || '';
                setFecha(f);
                if (f) {
                    const parts = f.split('-');
                    if (parts.length === 3) {
                        setAnyo(parts[0]);
                        setMes(parts[1]);
                        setDia(parts[2]);
                    }
                }
                setHora(res.data.datos_nacimiento.hora_nacimiento || '12:00');
                setCiudad(res.data.datos_nacimiento.ciudad || '');
            }
            // NO hacemos setCarta(res.data) para que no se vea el resultado viejo al entrar
        } catch (err) {
            console.log("No hay datos previos:", err.response?.data?.error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (dia && mes && anyo) {
            setFecha(`${anyo}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`);
        }
    }, [dia, mes, anyo]);

    const buscarCiudad = async () => {
        if (!ciudad) return;
        setBuscandoCiudad(true);
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${ciudad}`);
            if (res.data && res.data.length > 0) {
                const { lat, lon, display_name } = res.data[0];
                setCoords({ lat: parseFloat(lat), lon: parseFloat(lon) });
                setCiudad(display_name);
                alert(`📍 Ubicación detectada: ${display_name}`);
            } else {
                alert("❌ Ciudad no encontrada en el radar.");
            }
        } catch (err) {
            alert("❌ Error buscando coordenadas.");
        } finally {
            setBuscandoCiudad(false);
        }
    };

    const generarCarta = async (e) => {
        e.preventDefault();
        if (!fecha || coords.lat === 0) {
            return alert("Por favor, selecciona una ciudad válida y la fecha.");
        }

        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE_URL}/api/carta-astral/mi-carta`, {
                email: userAuth?.email || 'anonimo@bunker.com',
                fecha_nacimiento: fecha,
                hora_nacimiento: hora,
                ciudad_nacimiento: ciudad,
                lat_nacimiento: coords.lat,
                lon_nacimiento: coords.lon
            });
            setCarta(res.data);
        } catch (err) {
            setError(t('errorFallen'));
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="carta-astral-page">
            <header className="header-astral">
                <h1 className="titulo-neon">{t('astralTitle')}</h1>
                <p className="subtitulo">{t('astralSubtitle')}</p>
            </header>

            {loading && (
                <div className="cargando-astral">
                    <div className="spinner"></div>
                    <p>CALCULANDO POSICIONES PLANETARIAS...</p>
                </div>
            )}

            {!loading && !carta && (
                <div className="formulario-astral">
                    <h3>{t('birthCity')}</h3>
                    <form onSubmit={generarCarta}>
                        <div className="form-group">
                            <label>{t('birthDate')}</label>
                            <div className="date-selector-3col">
                                <select value={dia} onChange={e => setDia(e.target.value)} required>
                                    <option value="" disabled>{t('day') || 'Día'}</option>
                                    {[...Array(31)].map((_, i) => (
                                        <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{i+1}</option>
                                    ))}
                                </select>
                                <select value={mes} onChange={e => setMes(e.target.value)} required>
                                    <option value="" disabled>{t('month') || 'Mes'}</option>
                                    {[...Array(12)].map((_, i) => (
                                        <option key={i+1} value={(i+1).toString().padStart(2, '0')}>{t(`month${i+1}`)}</option>
                                    ))}
                                </select>
                                <select value={anyo} onChange={e => setAnyo(e.target.value)} required>
                                    <option value="" disabled>{t('year') || 'Año'}</option>
                                    {[...Array(new Date().getFullYear() - 1920 + 1)].map((_, i) => {
                                        const y = new Date().getFullYear() - i;
                                        return <option key={y} value={y.toString()}>{y}</option>
                                    })}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="hora">{t('birthTime')}</label>
                            <input id="hora" type="time" value={hora} onChange={e => setHora(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="ciudad">{t('birthCity')}</label>
                            <div className="input-with-btn">
                                <input 
                                    id="ciudad"
                                    type="text" 
                                    value={ciudad} 
                                    onChange={e => setCiudad(e.target.value)} 
                                    placeholder={t('cityExample')}
                                    required
                                />
                                <button type="button" onClick={buscarCiudad} disabled={buscandoCiudad} aria-label="Search City">
                                    {buscandoCiudad ? '...' : '🔍'}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn-generar">{t('tuneButton')}</button>
                    </form>
                </div>
            )}

            {!loading && carta && (
                <div className="resultados-astral">
                    <div className="grid-posiciones">
                        {carta.posiciones.map((p, idx) => (
                            <div key={idx} className="item-posicion">
                                <span className="planeta">{p.nombre}</span>
                                <span className="signo">{p.signo}</span>
                            </div>
                        ))}
                    </div>

                    <div className="interpretacion-ia">
                        <h3>📜 EL ARCHIVO DE TU ALMA</h3>
                        <div className="texto-ia">
                            {carta.interpretacion.split('\n').map((line, i) => (
                                <p key={i}>{line}</p>
                            ))}
                        </div>
                    </div>

                    <button className="btn-reset" onClick={() => setCarta(null)}>
                        RECALCULAR DATOS
                    </button>
                </div>
            )}

            {error && <p className="error-astral">{error}</p>}
        </div>
    );
};

export default CartaAstral;
