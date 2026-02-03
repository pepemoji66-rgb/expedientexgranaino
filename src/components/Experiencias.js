import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './experiencias.css';

const Experiencias = () => {
    const [seccion, setSeccion] = useState('usuarios');
    const [datos, setDatos] = useState([]);
    const [relatoAbierto, setRelatoAbierto] = useState(null);
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [nuevoContenido, setNuevoContenido] = useState('');

    const cargarDatos = useCallback(async () => {
        try {
            const endpoint = seccion === 'usuarios'
                ? 'http://localhost:5000/historias-publicadas'
                : 'http://localhost:5000/ver-comunicados-jefe';
            const res = await axios.get(endpoint);
            setDatos(res.data || []);
        } catch (err) {
            console.error("❌ Error en la conexión:", err.message);
            setDatos([]);
        }
    }, [seccion]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const enviarHistoria = async (e) => {
        e.preventDefault();
        const sesion = localStorage.getItem('agente_sesion');
        const usuarioStorage = sesion ? JSON.parse(sesion) : { nombre: 'AGENTE ANÓNIMO' };

        try {
            await axios.post('http://localhost:5000/publicar-historia', {
                titulo: nuevoTitulo,
                contenido: nuevoContenido,
                agente: usuarioStorage.nombre
            });
            alert("🚀 INFORME RECIBIDO Y PUBLICADO.");
            setNuevoTitulo('');
            setNuevoContenido('');
            cargarDatos();
        } catch (err) {
            alert("❌ ERROR en la transmisión.");
        }
    };

    return (
        <div className="experiencias-page">
            <header className="header-central">
                <h1 className="titulo-principal">CENTRAL DE EXPEDIENTES</h1>
            </header>

            <div className="botones-superiores">
                <button 
                    className={`btn-main ${seccion === 'usuarios' ? 'active' : ''}`} 
                    onClick={() => setSeccion('usuarios')}
                >
                    EXPEDIENTES USUARIOS
                </button>
                <button 
                    className={`btn-main admin-main ${seccion === 'jefe' ? 'active' : ''}`} 
                    onClick={() => setSeccion('jefe')}
                >
                    RELATOS JEFE
                </button>
            </div>

            <div className="radar-decorativo">
                <div className="radar-line"></div>
            </div>

            <div className={`tabla-container-pro ${seccion === 'jefe' ? 'admin-border' : ''}`}>
                <table className="tabla-pro">
                    <thead>
                        <tr>
                            <th>ORIGEN</th>
                            <th>TÍTULO</th>
                            <th>ACCIÓN</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.length > 0 ? datos.map((item) => (
                            <tr key={item.id}>
                                <td className={seccion === 'jefe' ? 'text-magenta' : ''}>
                                    {seccion === 'jefe' ? '🛡️ COMUNICADO' : `👤 ${item.usuario_nombre || 'AGENTE'}`}
                                </td>
                                <td>{item.titulo}</td>
                                <td>
                                    <button 
                                        className={`btn-leer-pro ${seccion === 'jefe' ? 'admin-bg' : ''}`} 
                                        onClick={() => setRelatoAbierto(item)}
                                    >
                                        ABRIR
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="3" style={{textAlign:'center', padding:'20px'}}>NO HAY REGISTROS EN ESTE SECTOR</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {seccion === 'usuarios' && (
                <div className="contenedor-envio-expediente">
                    <h2 className="titulo-neon-p">REDACTAR NUEVO INFORME</h2>
                    <form onSubmit={enviarHistoria} className="form-expediente">
                        <input 
                            type="text" 
                            className="input-bunker" 
                            placeholder="TÍTULO DEL HALLAZGO..." 
                            value={nuevoTitulo} 
                            onChange={(e) => setNuevoTitulo(e.target.value)} 
                            required 
                        />
                        <textarea 
                            className="textarea-bunker" 
                            placeholder="ESCRIBE AQUÍ TU EXPERIENCIA DETALLADA..." 
                            value={nuevoContenido} 
                            onChange={(e) => setNuevoContenido(e.target.value)} 
                            required 
                        ></textarea>
                        <div className="container-btn-envio">
                            <button type="submit" className="btn-enviar-expediente">SUBIR AL BÚNKER</button>
                        </div>
                    </form>
                </div>
            )}

            {relatoAbierto && (
                <div className="modal-overlay" onClick={() => setRelatoAbierto(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 style={{ color: seccion === 'jefe' ? '#ff00ff' : 'var(--color-principal)' }}>
                            {relatoAbierto.titulo}
                        </h2>
                        <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                            REGISTRO DE: {relatoAbierto.usuario_nombre || 'SISTEMA'}
                        </p>
                        <hr style={{ borderColor: '#333', margin: '20px 0' }} />
                        <div className="texto-relato-modal" style={{ whiteSpace: 'pre-wrap', color: 'white' }}>
                            {relatoAbierto.contenido}
                        </div>
                        <button onClick={() => setRelatoAbierto(null)} className="btn-main-modal">CERRAR EXPEDIENTE</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Experiencias;