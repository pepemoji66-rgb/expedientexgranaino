import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Forms from './Forms';

const LoginUsuario = ({ setAuth }) => {
    const [datos, setDatos] = useState({ email: '', password: '' });
    const navigate = useNavigate();

    const enviarLogin = async (e) => {
        if (e) e.preventDefault();
        
        try {
            // 1. LLAMADA AL SERVIDOR
            const res = await axios.post('http://localhost:5000/login-agente', datos);
            
            // 2. EXTRAEMOS AL AGENTE
            const agenteLogueado = res.data.usuario;
            
            alert("✅ ACCESO AUTORIZADO: BIENVENIDO AGENTE " + agenteLogueado.nombre.toUpperCase());

            // 3. PERSISTENCIA: Guardamos en el baúl del navegador para que el Header lo vea
            localStorage.setItem('agente_sesion', JSON.stringify(agenteLogueado));

            // 4. ACTUALIZAMOS EL ESTADO GLOBAL (Para que el Header cambie los botones)
            if (setAuth) {
                setAuth(agenteLogueado);
            }
            
            // 5. LIMPIEZA Y NAVEGACIÓN
            setDatos({ email: '', password: '' });
            
            // Redirigimos al inicio o al panel según prefieras (aquí he puesto inicio como tenías)
            navigate('/inicio'); 

        } catch (err) {
            console.error("Error de login:", err);
            alert("❌ ERROR: Credenciales no válidas. El sistema ha bloqueado el intento.");
        }
    };

    return (
        <div className="login-bunker-wrapper fade-in">
            <Forms 
                title="IDENTIFICACIÓN DE AGENTE" 
                onSubmit={enviarLogin}
                onClear={() => setDatos({ email: '', password: '' })}
            >
                <div className="input-group-bunker">
                    <input 
                        type="email" 
                        placeholder="CORREO ELECTRÓNICO" 
                        value={datos.email} 
                        onChange={(e) => setDatos({...datos, email: e.target.value})} 
                        required 
                        className="input-neon"
                    />
                </div>
                <div className="input-group-bunker">
                    <input 
                        type="password" 
                        placeholder="CONTRASEÑA" 
                        value={datos.password} 
                        onChange={(e) => setDatos({...datos, password: e.target.value})} 
                        required 
                        className="input-neon"
                    />
                </div>
            </Forms>
        </div>
    );
};

export default LoginUsuario;