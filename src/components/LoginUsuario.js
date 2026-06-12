import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './login.css';
import API_BASE_URL from '../config';
import { safeLocalStorage } from '../utils/storage';

const LoginUsuario = ({ setUserAuth }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate();

    const manejarLogin = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            // --- SINCRONIZACIÓN TÁCTICA ---
            // Conectamos con el servidor usando la URL base centralizada y el prefijo de auth
            const res = await axios.post(`${API_BASE_URL}/api/auth/login-usuario`, {
                email,
                password
            });

            if (res.data && res.data.usuario) {
                const agente = res.data.usuario;

                // 1. GUARDAR EN EL ALMACÉN LOCAL (localStorage)
                // Usamos 'agente_sesion' para que coincida con el resto del sistema
                safeLocalStorage.setItem('agente_sesion', JSON.stringify(agente));

                // 2. ACTUALIZAR EL ESTADO GLOBAL
                setUserAuth(agente);

                // 3. MOSTRAR MENSAJE DE ASCENSO O RANGO ACTUAL
                if (res.data.ascenso) {
                    alert(`🚀 ¡ASCENSO AUTORIZADO!\n\nEnhorabuena, ${agente.nombre.toUpperCase()}.\nEl Alto Mando ha valorado tu trabajo en el Búnker y has ascendido al rango de: ${agente.rango.toUpperCase()}`);
                } else {
                    alert(`✅ BIENVENIDO AL BÚNKER, AGENTE ${agente.nombre.toUpperCase()}\nRango actual: ${agente.rango.toUpperCase()}`);
                }
                navigate('/');
            } else {
                setError("❌ CREDENCIALES RECHAZADAS POR EL SISTEMA.");
            }
        } catch (err) {
            console.error("Error en el acceso:", err);
            // Si es 404, es que la ruta sigue sin coincidir con el server.js
            const msg = err.response?.status === 404
                ? "❌ ERROR 404: RUTA NO ENCONTRADA EN EL SERVIDOR."
                : (err.response?.data?.mensaje || err.response?.data?.error || "❌ ERROR DE CONEXIÓN.");
            setError(msg);
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="login-page-container fade-in">
            <div className="login-box glass-card">
                <h2 className="titulo-neon">ACCESO AL ARCHIVO CENTRAL</h2>
                <p className="subtitulo-tactico">IDENTIFÍQUESE PARA CONTINUAR</p>

                <form onSubmit={manejarLogin} className="login-form">
                    <div className="input-group">
                        <label>ALIAS O EMAIL:</label>
                        <input
                            type="text"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Agente X o correo@secreto.com"
                            required
                            className="input-tactico"
                        />
                    </div>

                    <div className="input-group">
                        <label>CÓDIGO DE ENCRIPTACIÓN:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            required
                            className="input-tactico"
                        />
                    </div>

                    {error && <p className="error-mensaje-parpadeo">{error}</p>}

                    <button
                        type="submit"
                        className="btn-acceso-total"
                        disabled={cargando}
                    >
                        {cargando ? 'VALIDANDO IDENTIDAD...' : 'ESTABLECER CONEXIÓN'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>¿No tienes rango? <span onClick={() => navigate('/registro')} className="link-neon">SOLICITAR REGISTRO</span></p>
                </div>
            </div>
        </div>
    );
};

export default LoginUsuario;