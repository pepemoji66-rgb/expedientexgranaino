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
            // 1. LLAMADA AL SERVIDOR (Ruta unificada a /login-usuario)
            const res = await axios.post('http://localhost:5000/login-usuario', datos);
            
            // 2. EXTRAEMOS AL USUARIO
            const usuarioLogueado = res.data.usuario;
            
            alert("✅ ACCESO AUTORIZADO: BIENVENIDO AL BÚNKER, " + usuarioLogueado.nombre.toUpperCase());

            // 3. PERSISTENCIA: Guardamos con el nuevo nombre unificado
            localStorage.setItem('usuario_sesion', JSON.stringify(usuarioLogueado));

            // 4. ACTUALIZAMOS EL ESTADO GLOBAL
            if (setAuth) {
                setAuth(usuarioLogueado);
            }
            
            // 5. LIMPIEZA Y NAVEGACIÓN
            setDatos({ email: '', password: '' });
            
            // Redirigimos al panel de administración directamente
            navigate('/admin'); 

        } catch (err) {
            console.error("Error de login:", err);
            alert("❌ ERROR: Credenciales no válidas. El sistema ha bloqueado el intento.");
        }
    };

    return (
        <div className="login-bunker-wrapper fade-in">
            <Forms 
                title="IDENTIFICACIÓN DE USUARIO" 
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