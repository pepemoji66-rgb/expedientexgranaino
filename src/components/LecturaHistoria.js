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
            // CORRECCIÓN 1: 'expedientes-publicos' (sin la 'a' extra)
            const res = await axios.get('http://localhost:5000/expedientes-publicos');
            // Buscamos el ID. Usamos == por si uno es string y el otro número
            const encontrada = res.data.find(h => h.id == id);
            setHistoria(encontrada);
        } catch (err) {
            console.error("Error al recuperar el relato del búnker");
        }
    };

    useEffect(() => {
        obtenerHistoria();
    }, [id]);

    const eliminarEstaHistoria = async () => {
        if (window.confirm("¿Sultán, seguro que desea destruir este expediente para siempre?")) {
            try {
                // CORRECCIÓN 2: Usar la ruta que definimos en server.js (/expedientes/:id)
                await axios.delete(`http://localhost:5000/expedientes/${id}`);
                alert("Expediente eliminado del sistema.");
                navigate('/expedientes'); // Te devuelve a la lista
            } catch (err) {
                alert("Error al intentar eliminar el archivo secreto.");
            }
        }
    };

    if (!historia) return <div className="admin-dashboard"><p style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>Abriendo expediente clasificado...</p></div>;

    return (
        <div className="admin-dashboard fade-in">
            <div className="glass-card full-width" style={{textAlign: 'left', marginTop: '50px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="forms-btn-submit" 
                        style={{width: 'auto', background: '#333', padding: '10px 20px', cursor: 'pointer'}}
                    >
                        ⬅ VOLVER
                    </button>

                    <button 
                        onClick={eliminarEstaHistoria} 
                        className="forms-btn-submit" 
                        style={{width: 'auto', background: '#ff4444', color: 'white', padding: '10px 20px', cursor: 'pointer'}}
                    >
                        🗑️ ELIMINAR EXPEDIENTE
                    </button>
                </div>
                
                <h2 className="admin-title" style={{textAlign: 'left', color: '#00ff41', borderBottom: '1px solid #00ff41', paddingBottom: '10px'}}>
                    {historia.titulo ? historia.titulo.toUpperCase() : 'SIN TÍTULO'}
                </h2>
                
                <p style={{color: '#888', fontFamily: 'Courier New', marginBottom: '20px'}}>
                    ORIGEN DEL RELATO: <span style={{color: '#fff'}}>{(historia.usuario_nombre || 'ANÓNIMO').toUpperCase()}</span>
                </p>

                <div style={{
                    color: 'white', 
                    lineHeight: '1.8', 
                    fontSize: '1.2rem', 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'Courier New',
                    background: 'rgba(0,255,65,0.05)',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid rgba(0,255,65,0.1)'
                }}>
                    {historia.contenido}
                </div>
            </div>
        </div>
    );
};

export default LecturaHistoria;