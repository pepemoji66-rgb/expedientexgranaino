import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';
import { safeLocalStorage } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import './seccion-acceso.css';

const Seccionusuarios = ({ setAuth }) => {
    const { language } = useLanguage();
    const [esLogin, setEsLogin] = useState(true);
    const [datos, setDatos] = useState({ nombre: '', email: '', password: '', ciudad: '' });
    const [cargando, setCargando] = useState(false);
    const [mensajeOk, setMensajeOk] = useState('');
    const [mensajeError, setMensajeError] = useState('');
    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [erroresCampo, setErroresCampo] = useState({});
    const navigate = useNavigate();
    const primerInputRef = useRef(null);

    // Auto-focus al primer campo al cambiar de modo
    useEffect(() => {
        if (primerInputRef.current) primerInputRef.current.focus();
    }, [esLogin]);

    const validarCampo = (name, value) => {
        if (name === 'nombre' && !esLogin && value.trim().length < 2) {
            return language === 'en' ? 'Alias must have at least 2 characters' : 'El alias debe tener al menos 2 caracteres';
        }
        if (name === 'email' && esLogin && !value.trim()) {
            return language === 'en' ? 'Required' : 'Obligatorio';
        }
        if (name === 'password' && value.length > 0 && value.length < 6) {
            return language === 'en' ? 'Minimum 6 characters' : 'Mínimo 6 caracteres';
        }
        return '';
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDatos(prev => ({ ...prev, [name]: value }));
        // Limpiar error del campo cuando el usuario empieza a escribir
        if (erroresCampo[name]) {
            setErroresCampo(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleBlur = (e) => {
        const { name, value } = e.target;
        const error = validarCampo(name, value);
        if (error) setErroresCampo(prev => ({ ...prev, [name]: error }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMensajeOk('');
        setMensajeError('');
        setCargando(true);

        const url = esLogin
            ? `${API_BASE_URL}/api/auth/login-agente`
            : `${API_BASE_URL}/api/auth/registro`;

        try {
            const res = await axios.post(url, datos);

            if (esLogin) {
                const agente = res.data.usuario;
                setMensajeOk(`✅ ${language === 'en' ? 'WELCOME, AGENT' : 'BIENVENIDO, AGENTE'} ${agente?.nombre?.toUpperCase() || 'OPERATIVO'}`);
                if (setAuth) {
                    setAuth(agente);
                    safeLocalStorage.setItem('agente_sesion', JSON.stringify(agente));
                }
                setTimeout(() => navigate('/'), 1500);
            } else {
                setMensajeOk(language === 'en'
                    ? '✅ REGISTERED! Switching to login...'
                    : '✅ ¡REGISTRADO! Cambiando a acceso...');
                setDatos({ nombre: '', email: '', password: '', ciudad: '' });
                setTimeout(() => { setEsLogin(true); setMensajeOk(''); }, 2200);
            }
        } catch (err) {
            console.error("Error en la conexión:", err);
            const msgError = err.response?.data?.mensaje || err.response?.data?.error ||
                (language === 'en' ? 'Connection error. Try again.' : 'Error de conexión. Inténtalo de nuevo.');
            setMensajeError(`❌ ${msgError}`);
        } finally {
            setCargando(false);
        }
    };

    const toggleModo = () => {
        setEsLogin(!esLogin);
        setDatos({ nombre: '', email: '', password: '', ciudad: '' });
        setMensajeOk('');
        setMensajeError('');
        setErroresCampo({});
    };

    const beneficios = language === 'en'
        ? ['🛸 Post UFO sightings', '📁 Access classified dossiers', '🎖️ Earn agent ranks', '💬 Comment & vote evidence', '🔔 Get real-time alerts']
        : ['🛸 Publicar avistamientos OVNI', '📁 Acceder a dossiers clasificados', '🎖️ Ganar rangos de agente', '💬 Comentar y votar evidencias', '🔔 Recibir alertas en tiempo real'];

    return (
        <div className="acceso-page fade-in">

            {/* PANEL IZQUIERDO: Beneficios */}
            <div className="acceso-beneficios">
                <div className="acceso-logo-bunker">
                    <div className="acceso-radar-ring"></div>
                    <div className="acceso-radar-ring delay1"></div>
                    <div className="acceso-radar-dot"></div>
                </div>
                <h2 className="acceso-beneficios-titulo">
                    {language === 'en' ? 'JOIN THE NETWORK' : 'ÚNETE A LA RED'}
                </h2>
                <p className="acceso-beneficios-sub">
                    {language === 'en'
                        ? 'Classified access for field agents'
                        : 'Acceso clasificado para agentes de campo'}
                </p>
                <ul className="acceso-beneficios-lista">
                    {beneficios.map((b, i) => (
                        <li key={i} className="acceso-beneficio-item" style={{ animationDelay: `${i * 0.1}s` }}>
                            {b}
                        </li>
                    ))}
                </ul>
                <div className="acceso-anonimo-badge">
                    🔒 {language === 'en' ? '100% Anonymous · No real data needed' : '100% Anónimo · Sin datos reales'}
                </div>
            </div>

            {/* PANEL DERECHO: Formulario */}
            <div className="acceso-form-panel">
                {/* TABS */}
                <div className="acceso-tabs" role="tablist">
                    <button
                        role="tab"
                        aria-selected={esLogin}
                        className={`acceso-tab ${esLogin ? 'active' : ''}`}
                        onClick={() => !esLogin && toggleModo()}
                    >
                        {language === 'en' ? '🔑 ACCESS' : '🔑 ACCEDER'}
                    </button>
                    <button
                        role="tab"
                        aria-selected={!esLogin}
                        className={`acceso-tab ${!esLogin ? 'active' : ''}`}
                        onClick={() => esLogin && toggleModo()}
                    >
                        {language === 'en' ? '📋 REGISTER' : '📋 REGISTRARSE'}
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="acceso-form" noValidate>

                    {/* MENSAJES DE ESTADO */}
                    {mensajeOk && (
                        <div className="acceso-msg acceso-msg-ok" role="alert">
                            {mensajeOk}
                        </div>
                    )}
                    {mensajeError && (
                        <div className="acceso-msg acceso-msg-error" role="alert">
                            {mensajeError}
                        </div>
                    )}

                    {/* ALIAS (solo en registro) */}
                    {!esLogin && (
                        <div className={`acceso-field ${erroresCampo.nombre ? 'field-error' : ''}`}>
                            <label htmlFor="acc-nombre">
                                {language === 'en' ? 'ALIAS / CODENAME' : 'ALIAS / NOMBRE CLAVE'}
                            </label>
                            <input
                                id="acc-nombre"
                                name="nombre"
                                type="text"
                                value={datos.nombre}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder={language === 'en' ? 'Agent X, Investigator72...' : 'Agente X, Investigador72...'}
                                required
                                ref={!esLogin ? primerInputRef : null}
                                autoComplete="username"
                            />
                            {erroresCampo.nombre && <span className="field-error-msg">{erroresCampo.nombre}</span>}
                        </div>
                    )}

                    {/* ALIAS O EMAIL (login) / EMAIL OPCIONAL (registro) */}
                    <div className={`acceso-field ${erroresCampo.email ? 'field-error' : ''}`}>
                        <label htmlFor="acc-email">
                            {esLogin
                                ? (language === 'en' ? 'ALIAS OR EMAIL' : 'ALIAS O EMAIL')
                                : (language === 'en' ? 'EMAIL (OPTIONAL — for password recovery)' : 'EMAIL (OPCIONAL — para recuperar contraseña)')}
                        </label>
                        <input
                            id="acc-email"
                            name="email"
                            type="text"
                            value={datos.email}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            placeholder={esLogin
                                ? (language === 'en' ? 'Your alias or email...' : 'Tu alias o correo...')
                                : (language === 'en' ? 'optional@secreto.com' : 'opcional@secreto.com')}
                            required={esLogin}
                            ref={esLogin ? primerInputRef : null}
                            autoComplete={esLogin ? 'username' : 'email'}
                        />
                        {erroresCampo.email && <span className="field-error-msg">{erroresCampo.email}</span>}
                    </div>

                    {/* CONTRASEÑA con toggle */}
                    <div className={`acceso-field ${erroresCampo.password ? 'field-error' : ''}`}>
                        <label htmlFor="acc-password">
                            {language === 'en' ? 'ENCRYPTION CODE (PASSWORD)' : 'CÓDIGO DE ENCRIPTACIÓN (CONTRASEÑA)'}
                        </label>
                        <div className="acceso-password-wrapper">
                            <input
                                id="acc-password"
                                name="password"
                                type={mostrarPassword ? 'text' : 'password'}
                                value={datos.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                placeholder="••••••••"
                                required
                                autoComplete={esLogin ? 'current-password' : 'new-password'}
                                minLength={6}
                            />
                            <button
                                type="button"
                                className="acceso-toggle-pass"
                                onClick={() => setMostrarPassword(v => !v)}
                                aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                                {mostrarPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                        {erroresCampo.password && <span className="field-error-msg">{erroresCampo.password}</span>}
                        {/* Indicador de fuerza solo en registro */}
                        {!esLogin && datos.password.length > 0 && (
                            <div className="acceso-pass-strength">
                                <div
                                    className={`acceso-pass-bar ${datos.password.length < 6 ? 'weak' : datos.password.length < 10 ? 'medium' : 'strong'}`}
                                    style={{ width: `${Math.min(100, (datos.password.length / 12) * 100)}%` }}
                                ></div>
                                <span className="acceso-pass-label">
                                    {datos.password.length < 6
                                        ? (language === 'en' ? 'Weak' : 'Débil')
                                        : datos.password.length < 10
                                            ? (language === 'en' ? 'Medium' : 'Media')
                                            : (language === 'en' ? 'Strong' : 'Fuerte')}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* CIUDAD (solo en registro, completamente opcional) */}
                    {!esLogin && (
                        <div className="acceso-field">
                            <label htmlFor="acc-ciudad">
                                {language === 'en' ? 'SECTOR / CITY (OPTIONAL)' : 'SECTOR / CIUDAD (OPCIONAL)'}
                            </label>
                            <input
                                id="acc-ciudad"
                                name="ciudad"
                                type="text"
                                value={datos.ciudad}
                                onChange={handleChange}
                                placeholder={language === 'en' ? 'Granada, Sevilla...' : 'Granada, Sevilla...'}
                                autoComplete="address-level2"
                            />
                        </div>
                    )}

                    {/* BOTÓN PRINCIPAL */}
                    <button
                        type="submit"
                        className={`acceso-btn-submit ${cargando ? 'loading' : ''}`}
                        disabled={cargando}
                    >
                        {cargando
                            ? (language === 'en' ? '⏳ VALIDATING...' : '⏳ VALIDANDO...')
                            : esLogin
                                ? (language === 'en' ? '🔑 ESTABLISH CONNECTION' : '🔑 ESTABLECER CONEXIÓN')
                                : (language === 'en' ? '🛸 JOIN THE BUNKER' : '🛸 UNIRSE AL BÚNKER')}
                    </button>

                    {/* SWITCH LOGIN/REGISTRO */}
                    <p className="acceso-switch-modo">
                        {esLogin
                            ? (language === 'en' ? "No account yet? " : "¿Sin credenciales aún? ")
                            : (language === 'en' ? "Already an agent? " : "¿Ya eres agente? ")}
                        <button type="button" className="acceso-switch-btn" onClick={toggleModo}>
                            {esLogin
                                ? (language === 'en' ? 'REGISTER FREE' : 'REGISTRO GRATUITO')
                                : (language === 'en' ? 'LOG IN' : 'IDENTIFICARSE')}
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Seccionusuarios;
