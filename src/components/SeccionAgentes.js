import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Forms from './Forms';

const SeccionAgentes = ({ setAuth }) => {
    const [esLogin, setEsLogin] = useState(true);
    const [datos, setDatos] = useState({ nombre: '', email: '', password: '', ciudad: '', edad: '' });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const url = esLogin ? 'http://localhost:5000/login-agente' : 'http://localhost:5000/registro';
        
        try {
            const res = await axios.post(url, datos);
            alert("✅ ACCESO CONFIRMADO: " + (res.data.usuario?.nombre || "Agente Operativo"));
            
            if (esLogin && setAuth) {
                setAuth(res.data.usuario);
            }
            
            setDatos({ nombre: '', email: '', password: '', ciudad: '', edad: '' });
            navigate('/'); 

        } catch (err) {
            alert("❌ ERROR: Credenciales no válidas o agente no registrado.");
        }
    };

    const toggleModo = () => {
        setEsLogin(!esLogin);
        setDatos({ nombre: '', email: '', password: '', ciudad: '', edad: '' });
    };

    return (
        <div className="seccion-agentes fade-in">
            <Forms 
                title={esLogin ? "IDENTIFICACIÓN DE AGENTE" : "ALTA EN EL SISTEMA"} 
                subtitle={esLogin ? "Introduzca sus credenciales de acceso" : "Cree una nueva ficha de agente"}
                onSubmit={handleSubmit}
                onClear={() => setDatos({ nombre: '', email: '', password: '', ciudad: '', edad: '' })}
            >
                {!esLogin && (
                    <input type="text" placeholder="NOMBRE COMPLETO" value={datos.nombre} onChange={(e) => setDatos({...datos, nombre: e.target.value})} required />
                )}
                
                {!esLogin && (
                    <div className="forms-row">
                        <input type="text" placeholder="CIUDAD" value={datos.ciudad} onChange={(e) => setDatos({...datos, ciudad: e.target.value})} style={{flex: 2}} />
                        <input type="number" placeholder="EDAD" value={datos.edad} onChange={(e) => setDatos({...datos, edad: e.target.value})} style={{flex: 1}} />
                    </div>
                )}

                <input type="email" placeholder="CORREO ELECTRÓNICO" value={datos.email} onChange={(e) => setDatos({...datos, email: e.target.value})} required />
                <input type="password" placeholder="CONTRASEÑA" value={datos.password} onChange={(e) => setDatos({...datos, password: e.target.value})} required />
                
                <p style={{textAlign: 'center', color: '#fff', fontSize: '0.8rem', marginTop: '10px'}}>
                    {esLogin ? "¿No tienes credenciales? " : "¿Ya eres agente? "}
                    <span onClick={toggleModo} style={{color: '#00ff41', cursor: 'pointer', textDecoration: 'underline'}}>Pincha aquí</span>
                </p>
            </Forms>
        </div>
    );
};

export default SeccionAgentes;