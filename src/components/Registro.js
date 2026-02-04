import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Forms from './Forms';
import './registro.css'; 

const Registro = () => {
    const estadoInicial = {
        nombre: '',
        email: '',
        password: '',
        ciudad: '',
        edad: ''
    };

    const [datos, setDatos] = useState(estadoInicial);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/registro', datos);
            alert("✅ REGISTRO COMPLETADO: " + (res.data.mensaje || "Agente dado de alta"));
            setDatos(estadoInicial);
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.mensaje || "Error en el alta del agente.");
        }
    };

    const limpiarFormulario = () => {
        setDatos(estadoInicial);
    };

    // Estilo extra para asegurar que los radares floten por encima de todo
    const estiloRadarSuperior = { zIndex: 9999, pointerEvents: 'none' };

   return (
        <div className="registro-page" style={{ position: 'relative' }}>
            
            {/* RADAR IZQUIERDO */}
            <div className="decoracion-brujula left" style={estiloRadarSuperior}>
                <div className="radar-line"></div>
                <div style={{ position: 'absolute', top: '120px', width: '150px', color: '#00ff41', fontSize: '0.6rem', fontFamily: 'monospace', textAlign: 'center' }}>
                    <p>SISTEMA ACTIVO</p>
                    <p>SCAN SECTOR 7G</p>
                </div>
            </div>

            {/* FORMULARIO CENTRAL */}
            <div className="formulario-contenedor" style={{ position: 'relative', zIndex: 1 }}>
                <Forms 
                    title="ALTA DE NUEVO AGENTE" 
                    subtitle="Introduzca los datos para el registro oficial"
                    onSubmit={handleSubmit}
                    onClear={limpiarFormulario}
                >
                    <input 
                        type="text" 
                        placeholder="NOMBRE COMPLETO" 
                        value={datos.nombre} 
                        onChange={(e) => setDatos({...datos, nombre: e.target.value})} 
                        required 
                    />
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            placeholder="CIUDAD" 
                            value={datos.ciudad} 
                            onChange={(e) => setDatos({...datos, ciudad: e.target.value})} 
                            required 
                            style={{ flex: 2 }}
                        />
                        <input 
                            type="number" 
                            placeholder="EDAD" 
                            value={datos.edad} 
                            onChange={(e) => setDatos({...datos, edad: e.target.value})} 
                            required 
                            style={{ flex: 1 }}
                        />
                    </div>

                    <input 
                        type="email" 
                        placeholder="EMAIL OPERATIVO" 
                        value={datos.email} 
                        onChange={(e) => setDatos({...datos, email: e.target.value})} 
                        required 
                    />
                    
                    <input 
                        type="password" 
                        placeholder="CONTRASEÑA SEGURA" 
                        value={datos.password} 
                        onChange={(e) => setDatos({...datos, password: e.target.value})} 
                        autoComplete="new-password"
                        required 
                    />
                </Forms>
            </div>

            {/* RADAR DERECHO - Limpio de errores */}
            <div className="decoracion-brujula right" style={estiloRadarSuperior}>
                <div className="radar-line"></div>
                <div style={{ position: 'absolute', top: '120px', width: '180px', color: '#00ff41', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                    <p>ESTADO: ESPERANDO DATOS</p>
                    <p>NIVEL: RECLUTA</p>
                    <p>ENCRIPTACION: ACTIVA</p>
                </div>
            </div>

        </div>
    );
};

export default Registro;