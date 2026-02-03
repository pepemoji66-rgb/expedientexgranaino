import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Forms from './Forms';

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
            alert("✅ REGISTRO COMPLETADO CON ÉXITO: " + (res.data.mensaje || "Agente dado de alta"));
            
            // LIMPIEZA TOTAL DEL ESTADO
            setDatos(estadoInicial);
            
            // REDIRECCIÓN DIRECTA AL INICIO PARA QUE EL USUARIO VEA EL MENÚ
            navigate('/');
        } catch (err) {
            alert(err.response?.data?.mensaje || "Error al procesar el alta del agente.");
        }
    };

    const limpiarFormulario = () => {
        setDatos(estadoInicial);
    };

    return (
        <Forms 
            title="ALTA DE NUEVO AGENTE" 
            subtitle="Introduzca los datos para el registro oficial en la base de datos"
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
    );
};

export default Registro;