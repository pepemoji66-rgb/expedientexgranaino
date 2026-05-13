import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Forms from './Forms';
import API_BASE_URL from '../config';

// --- CONFIGURACIÓN DE CONEXIÓN AL BÚNKER ---
const Seccionusuarios = ({ setAuth }) => {
    const [esLogin, setEsLogin] = useState(true);
    const [datos, setDatos] = useState({
        nombre: '',
        email: '',
        password: '',
        ciudad: '',
        edad: ''
    });
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setCargando(true);

        // AJUSTE TÁCTICO: Sincronizamos con las rutas modulares del backend (/api/auth)
        const url = esLogin 
            ? `${API_BASE_URL}/api/auth/login-agente` 
            : `${API_BASE_URL}/api/auth/registro`;

        try {
            const res = await axios.post(url, datos);

            if (esLogin) {
                alert("✅ ACCESO CONFIRMADO: " + (res.data.usuario?.nombre || "Agente Operativo"));

                if (setAuth) {
                    setAuth(res.data.usuario);
                    localStorage.setItem('agente_sesion', JSON.stringify(res.data.usuario));
                }
                navigate('/');
            } else {
                alert("✅ ¡LISTO! Te has unido a la red del Búnker. Ya puedes iniciar sesión con tus credenciales.");
                setEsLogin(true);
            }

            // Limpieza de datos
            setDatos({ nombre: '', email: '', password: '', ciudad: '', edad: '' });

        } catch (err) {
            console.error("Error en la conexión:", err);
            const msgError = err.response?.data?.mensaje || err.response?.data?.error || "Fallo en el servidor del búnker.";
            alert(`❌ ERROR: ${msgError}`);
        } finally {
            setCargando(false);
        }
    };

    const toggleModo = () => {
        setEsLogin(!esLogin);
        setDatos({ nombre: '', email: '', password: '', ciudad: '', edad: '' });
    };

    return (
        <div className="seccion-usuarios fade-in">
            <Forms
                title={esLogin ? "IDENTIFICACIÓN DE AGENTE" : "ALTA EN EL SISTEMA"}
                subtitle={esLogin ? "Introduzca sus credenciales de acceso" : "Únete a la red de investigación"}
                onSubmit={handleSubmit}
                onClear={() => setDatos({ nombre: '', email: '', password: '', ciudad: '', edad: '' })}
                btnText={cargando ? "PROCESANDO..." : (esLogin ? "ENTRAR AL BÚNKER" : "UNIRSE AL BÚNKER")}
            >
                {!esLogin && (
                    <input
                        type="text"
                        placeholder="TU NOMBRE O ALIAS"
                        value={datos.nombre}
                        onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                        required
                    />
                )}

                {!esLogin && (
                    <input
                        type="text"
                        placeholder="CIUDAD (OPCIONAL)"
                        value={datos.ciudad}
                        onChange={(e) => setDatos({ ...datos, ciudad: e.target.value })}
                    />
                )}

                <input
                    type="email"
                    placeholder="CORREO ELECTRÓNICO"
                    value={datos.email}
                    onChange={(e) => setDatos({ ...datos, email: e.target.value })}
                    required
                />

                <input
                    type="password"
                    placeholder="CONTRASEÑA"
                    value={datos.password}
                    onChange={(e) => setDatos({ ...datos, password: e.target.value })}
                    required
                />

                <p style={{ textAlign: 'center', color: '#fff', fontSize: '0.85rem', marginTop: '15px' }}>
                    {esLogin ? "¿No tienes credenciales todavía? " : "¿Ya eres agente oficial? "}
                    <span
                        onClick={toggleModo}
                        style={{
                            color: 'var(--color-principal)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: 'bold'
                        }}
                    >
                        {esLogin ? "Regístrate aquí" : "Inicia sesión"}
                    </span>
                </p>
            </Forms>
        </div>
    );
};

export default Seccionusuarios;
