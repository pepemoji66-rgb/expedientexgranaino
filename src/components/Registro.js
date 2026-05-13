import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Forms from './Forms';
import API_BASE_URL from '../config';
import './registro.css'; 

const Registro = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nombre: '',
        email: '',
        password: '',
        ciudad: ''
    });

    const [mensaje, setMensaje] = useState('');
    const [cargando, setCargando] = useState(false);

    const manejarCambio = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const manejarRegistro = async (e) => {
        e.preventDefault();
        setCargando(true);
        setMensaje("🛰️ ENVIANDO SOLICITUD AL SISTEMA...");

        try {
            // Sincronizamos con el búnker centralizado
            const res = await axios.post(`${API_BASE_URL}/api/auth/registro`, formData);

            if (res.status === 201 || res.status === 200) {
                setMensaje("✅ SOLICITUD RECIBIDA, HERMANO. YA PUEDES IDENTIFICARTE.");
                setTimeout(() => navigate('/acceso'), 3000);
            }
        } catch (err) {
            console.error("Error en registro:", err);
            setMensaje(err.response?.data?.error || "❌ ERROR EN LA MATRIZ. INTÉNTALO DE NUEVO.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="panel-admin-container fade-in">
            <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px' }} className="form-subida-admin glass-card">
                <h2 className="titulo-neon" style={{ textAlign: 'center' }}>ALISTAMIENTO</h2>
                <p style={{ color: 'var(--color-principal)', textAlign: 'center', fontSize: '0.9rem', marginBottom: '10px' }}>
                    Únete a la red de investigación. Tu acceso debe ser validado.
                </p>

                <div style={{ background: 'rgba(0, 255, 65, 0.1)', border: '1px solid #00ff41', color: '#00ff41', padding: '10px', borderRadius: '5px', textAlign: 'center', marginBottom: '20px', fontSize: '0.85rem' }}>
                    🔒 <strong>100% ANÓNIMO:</strong> Solo necesitamos tu Alias y Contraseña. El Búnker no rastrea tu IP ni exige datos personales reales.
                </div>

                <form onSubmit={manejarRegistro} className="form-interior">
                    <label>TU NOMBRE O ALIAS:</label>
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={manejarCambio}
                        required
                        placeholder="Agente X"
                    />

                    <label>CORREO ELECTRÓNICO (TOTALMENTE OPCIONAL):</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={manejarCambio}
                        placeholder="Solo si quieres recuperar la contraseña luego..."
                    />

                    <label>CÓDIGO DE ENCRIPTACIÓN (CONTRASEÑA):</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={manejarCambio}
                        required
                        placeholder="********"
                    />

                    <label>CIUDAD (OPCIONAL):</label>
                    <input
                        type="text"
                        name="ciudad"
                        value={formData.ciudad}
                        onChange={manejarCambio}
                        placeholder="Tu sector..."
                    />

                    <button type="submit" className="btn-ok-subir" style={{ width: '100%', marginTop: '10px' }} disabled={cargando}>
                        {cargando ? "PROCESANDO..." : "UNIRSE AL BÚNKER"}
                    </button>
                </form>

                {mensaje && (
                    <div className="mensaje-status" style={{ marginTop: '20px', textAlign: 'center' }}>
                        {mensaje}
                    </div>
                )}

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#b18904', cursor: 'pointer', textDecoration: 'underline' }}>
                        Ya tengo credenciales
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Registro;
