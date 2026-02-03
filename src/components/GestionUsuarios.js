import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const GestionUsuarios = () => {
    const [usuarios, setUsuarios] = useState([]);
    const navigate = useNavigate();

    // Cargar la lista de agentes
    const obtenerUsuarios = async () => {
        try {
            const res = await axios.get('http://localhost:5000/usuarios');
            setUsuarios(res.data);
        } catch (err) {
            console.error("Error al obtener los agentes:", err);
        }
    };

    useEffect(() => {
        obtenerUsuarios();
    }, []);

    // Función para eliminar un agente
    const eliminarUsuario = async (id) => {
        if (window.confirm("¿ESTÁ SEGURO DE ELIMINAR A ESTE AGENTE DEL SISTEMA?")) {
            try {
                await axios.delete(`http://localhost:5000/eliminar-usuario/${id}`);
                obtenerUsuarios(); // Recargamos la lista
            } catch (err) {
                alert("Error al intentar eliminar el registro");
            }
        }
    };

    return (
        <div className="gestion-usuarios-container fade-in">
            <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                <button 
                    onClick={() => navigate('/')} 
                    className="btn-volver"
                    style={{ background: '#00ff41', color: '#000', border: 'none', padding: '10px 20px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    🏠 VOLVER A INICIO (WEB)
                </button>
            </div>

            <h2 className="neon-text-green" style={{ marginBottom: '20px' }}>PANEL DE CONTROL DE AGENTES</h2>
            
            <div className="tabla-responsive">
                <table className="tabla-agentes" style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(0,0,0,0.8)', color: '#00ff41' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #00ff41' }}>
                            <th style={{ padding: '15px' }}>ID</th>
                            <th style={{ padding: '15px' }}>NOMBRE</th>
                            <th style={{ padding: '15px' }}>EMAIL</th>
                            <th style={{ padding: '15px' }}>CIUDAD</th>
                            <th style={{ padding: '15px' }}>EDAD</th>
                            <th style={{ padding: '15px' }}>ACCIONES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.map((u) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #333' }}>
                                <td style={{ padding: '12px', textAlign: 'center' }}>{u.id}</td>
                                <td style={{ padding: '12px' }}>{u.nombre}</td>
                                <td style={{ padding: '12px' }}>{u.email}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>{u.ciudad}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>{u.edad}</td>
                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                    <button 
                                        onClick={() => eliminarUsuario(u.id)}
                                        style={{ background: '#ff0000', color: '#fff', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}
                                    >
                                        ELIMINAR
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GestionUsuarios;