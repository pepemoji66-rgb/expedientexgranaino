import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './lecturahistoria.css';

const LecturaHistoria = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [historia, setHistoria] = useState(null);
    const [esRelatoAdmin, setEsRelatoAdmin] = useState(false); // Para saber de qué tabla borrar

    const obtenerHistoria = async () => {
        try {
            // 1. Intentamos buscar primero en los Relatos del Administrador
            const resAdmin = await axios.get('http://localhost:5000/relatos-admin-publicos');
            const encontradaAdmin = resAdmin.data.find(h => h.id == id);

            if (encontradaAdmin) {
                setHistoria(encontradaAdmin);
                setEsRelatoAdmin(true);
            } else {
                // 2. Si no es de admin, buscamos en los expedientes públicos de usuarios
                const resPublicos = await axios.get('http://localhost:5000/expedientes-publicos');
                const encontradaPublica = resPublicos.data.find(h => h.id == id);
                setHistoria(encontradaPublica);
                setEsRelatoAdmin(false);
            }
        } catch (err) {
            console.error("❌ Error al recuperar el relato del búnker", err);
        }
    };

    useEffect(() => {
        obtenerHistoria();
    }, [id]);

    const eliminarEstaHistoria = async () => {
        const mensajeConfirm = esRelatoAdmin 
            ? "¿Sultán, seguro que desea destruir su propio relato para siempre?" 
            : "¿Seguro que desea eliminar este expediente de usuario?";

        if (window.confirm(mensajeConfirm)) {
            try {
                // Usamos la ruta correspondiente según el tipo de relato
                const rutaBorrado = esRelatoAdmin 
                    ? `http://localhost:5000/borrar-relato-admin/${id}` 
                    : `http://localhost:5000/expedientes/${id}`;

                await axios.delete(rutaBorrado);
                alert("Expediente eliminado del sistema.");
                navigate(-1); // Volver a la pantalla anterior
            } catch (err) {
                alert("Error al intentar eliminar el archivo secreto.");
            }
        }
    };

    if (!historia) return (
        <div className="admin-dashboard">
            <p style={{color: 'white', textAlign: 'center', marginTop: '50px'}}>
                Buscando en los archivos clasificados...
            </p>
        </div>
    );

    return (
        <div className="admin-dashboard fade-in">
            <div className="glass-card full-width" style={{textAlign: 'left', marginTop: '50px'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
                    <button 
                        onClick={() => navigate(-1)} 
                        className="forms-btn-submit" 
                        style={{width: 'auto', background: '#333', padding: '10px 20px', cursor: 'pointer', border: '1px solid #555'}}
                    >
                        ⬅ VOLVER
                    </button>

                    <button 
                        onClick={eliminarEstaHistoria} 
                        className="forms-btn-submit" 
                        style={{width: 'auto', background: '#ff4444', color: 'white', padding: '10px 20px', cursor: 'pointer', border: 'none'}}
                    >
                        🗑️ ELIMINAR EXPEDIENTE
                    </button>
                </div>
                
                <h2 className="admin-title" style={{textAlign: 'left', color: '#00ff41', borderBottom: '1px solid #00ff41', paddingBottom: '10px'}}>
                    {historia.titulo ? historia.titulo.toUpperCase() : 'SIN TÍTULO'}
                </h2>
                
                <p style={{color: '#888', fontFamily: 'Courier New', marginBottom: '20px'}}>
                    TIPO DE ARCHIVO: <span style={{color: esRelatoAdmin ? '#00ff41' : '#ff9900'}}>
                        {esRelatoAdmin ? 'RELATO DEL ADMINISTRADOR' : 'EXPEDIENTE DE AGENTE'}
                    </span>
                    <br />
                    AUTOR: <span style={{color: '#fff'}}>
                        {(historia.usuario_nombre || 'ADMINISTRADOR').toUpperCase()}
                    </span>
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
                    {/* Mostramos 'contenido' o 'cuerpo' según lo que venga de la DB */}
                    {historia.contenido || historia.cuerpo || "Archivo sin contenido legible."}
                </div>
            </div>
        </div>
    );
};

export default LecturaHistoria;