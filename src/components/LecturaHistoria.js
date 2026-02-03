import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './lecturahistoria.css';

const LecturaHistoria = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [historia, setHistoria] = useState(null);

    const obtenerHistoria = async () => {
        try {
            const res = await axios.get('http://localhost:5000/historias-publicadas');
            const encontrada = res.data.find(h => h.id === parseInt(id));
            setHistoria(encontrada);
        } catch (err) {
            console.error("Error al recuperar el relato del búnker");
        }
    };

    useEffect(() => {
        obtenerHistoria();
    }, [id]);

    // FUNCIÓN PARA BORRAR SI NO NOS CONVENCE
    const eliminarEstaHistoria = async () => {
        if (window.confirm("¿Sultán, seguro que desea destruir este expediente para siempre?")) {
            try {
                await axios.delete(`http://localhost:5000/eliminar-historia/${id}`);
                alert("Expediente eliminado del sistema.");
                navigate('/panel-mando'); // Te devuelve al panel de control
            } catch (err) {
                alert("Error al intentar eliminar el archivo secreto.");
            }
        }
    };

    if (!historia) return <div className="admin-dashboard"><p style={{color: 'white'}}>Abriendo expediente...</p></div>;

    return (
        <div className="admin-dashboard fade-in">
            <div className="glass-card full-width" style={{textAlign: 'left', marginTop: '50px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="forms-btn-submit" 
                        style={{width: 'auto', background: '#333', padding: '10px 20px'}}
                    >
                        ⬅ VOLVER
                    </button>

                    {/* BOTÓN ELIMINAR (SOLO PARA EL JEFE) */}
                    <button 
                        onClick={eliminarEstaHistoria} 
                        className="forms-btn-submit" 
                        style={{width: 'auto', background: '#ff4444', color: 'white', padding: '10px 20px'}}
                    >
                        🗑️ ELIMINAR EXPEDIENTE
                    </button>
                </div>
                
                <h2 className="admin-title" style={{textAlign: 'left', color: '#00ff41', borderBottom: '1px solid #00ff41', paddingBottom: '10px'}}>
                    {historia.titulo.toUpperCase()}
                </h2>
                
                <p style={{color: '#888', fontFamily: 'Courier New', marginBottom: '20px'}}>
                    ORIGEN DEL RELATO: <span style={{color: '#fff'}}>{historia.usuario_nombre.toUpperCase()}</span>
                </p>

                <div style={{
                    color: 'white', 
                    lineHeight: '1.8', 
                    fontSize: '1.2rem', 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'Courier New',
                    background: 'rgba(0,255,65,0.05)',
                    padding: '20px',
                    borderRadius: '10px'
                }}>
                    {historia.contenido}
                </div>
            </div>
        </div>
    );
};

export default LecturaHistoria;