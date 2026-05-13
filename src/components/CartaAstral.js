import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './cartaAstral.css';

const CartaAstral = () => {
    const [userAuth, setUserAuth] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [carta, setCarta] = useState(null);
    
    // Form states
    const [fecha, setFecha] = useState('');
    const [hora, setHora] = useState('12:00');
    const [ciudad, setCiudad] = useState('');
    const [coords, setCoords] = useState({ lat: 0, lon: 0 });
    const [buscandoCiudad, setBuscandoCiudad] = useState(false);

    useEffect(() => {
        const sesion = localStorage.getItem('agente_sesion');
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
                setFecha(res.data.datos_nacimiento.fecha || '');
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
                email: userAuth.email,
                fecha_nacimiento: fecha,
                hora_nacimiento: hora,
                ciudad_nacimiento: ciudad,
                lat_nacimiento: coords.lat,
                lon_nacimiento: coords.lon
            });
            setCarta(res.data);
        } catch (err) {
            setError("Error al sincronizar con las estrellas.");
        } finally {
            setLoading(false);
        }
    };

    if (!userAuth) {
        return (
            <div className="carta-astral-page">
                <div className="mensaje-no-auth">
                    <h2>⚠️ ACCESO RESTRINGIDO</h2>
                    <p>Debes estar identificado en el búnker para acceder a tu frecuencia astral.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="carta-astral-page">
            <header className="header-astral">
                <h1 className="titulo-neon">CARTA ASTRAL DEL AGENTE</h1>
                <p className="subtitulo">Descifrando las coordenadas de tu destino</p>
            </header>

            {loading && (
                <div className="cargando-astral">
                    <div className="spinner"></div>
                    <p>CALCULANDO POSICIONES PLANETARIAS...</p>
                </div>
            )}

            {!loading && !carta && (
                <div className="formulario-astral">
                    <h3>Introduce tus coordenadas de origen</h3>
                    <form onSubmit={generarCarta}>
                        <div className="form-group">
                            <label>Fecha de Nacimiento</label>
                            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Hora (Si la sabes)</label>
                            <input type="time" value={hora} onChange={e => setHora(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Ciudad de Origen</label>
                            <div className="input-with-btn">
                                <input 
                                    type="text" 
                                    value={ciudad} 
                                    onChange={e => setCiudad(e.target.value)} 
                                    placeholder="Ej: Granada, España"
                                    required
                                />
                                <button type="button" onClick={buscarCiudad} disabled={buscandoCiudad}>
                                    {buscandoCiudad ? '...' : '🔍'}
                                </button>
                            </div>
                        </div>
                        <button type="submit" className="btn-generar">SINTONIZAR CARTA</button>
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
