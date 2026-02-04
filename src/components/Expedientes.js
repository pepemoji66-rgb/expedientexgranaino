import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './expedientes.css'; 

const Expedientes = () => {
    const [seccion, setSeccion] = useState('usuarios');
    const [datos, setDatos] = useState([]);
    const [relatoAbierto, setRelatoAbierto] = useState(null);
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [nuevoContenido, setNuevoContenido] = useState('');

    const cargarDatos = useCallback(async () => {
        try {
            const endpoint = seccion === 'usuarios'
                ? 'http://localhost:5000/expedientes-publicos' 
                : 'http://localhost:5000/relatos-administrador';
            
            const res = await axios.get(endpoint);
            console.log("⚡ Datos del búnker:", res.data);
            setDatos(res.data || []);
        } catch (err) {
            console.error("❌ Error en la aduana:", err);
            setDatos([]);
        }
    }, [seccion]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const enviarExpediente = async (e) => {
        e.preventDefault();
        const sesion = localStorage.getItem('usuario_sesion'); 
        const usuarioStorage = sesion ? JSON.parse(sesion) : { nombre: 'AGENTE ANÓNIMO' };

        try {
            await axios.post('http://localhost:5000/subir-expediente', {
                titulo: nuevoTitulo,
                contenido: nuevoContenido,
                usuario_nombre: usuarioStorage.nombre 
            });
            alert("🚀 EXPEDIENTE ENVIADO AL JEFE PARA REVISIÓN.");
            setNuevoTitulo('');
            setNuevoContenido('');
        } catch (err) {
            alert("❌ Error en la transmisión al Búnker.");
        }
    };

    return (
        <div className="experiencias-page">
            <header className="header-central">
                <h1 className="titulo-principal">ARCHIVO CENTRAL DE EXPEDIENTES</h1>
            </header>

            <div className="botones-superiores">
                <button 
                    className={`btn-main ${seccion === 'usuarios' ? 'active' : ''}`} 
                    onClick={() => setSeccion('usuarios')}
                >
                    INFORMES DE AGENTES
                </button>
                <button 
                    className={`btn-main admin-main ${seccion === 'jefe' ? 'active' : ''}`} 
                    onClick={() => setSeccion('jefe')}
                >
                    RELATOS DEL ADMINISTRADOR
                </button>
            </div>

            <div className={`tabla-container-pro ${seccion === 'jefe' ? 'admin-border' : ''}`}>
                <table className="tabla-pro">
                    <thead>
                        <tr>
                            <th>ORIGEN</th>
                            <th>TÍTULO</th>
                            <th>VER ARCHIVO</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.length > 0 ? (
                            datos.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        {seccion === 'jefe' 
                                            ? '🛡️ JEFE' 
                                            : `👤 ${item.usuario_nombre || 'AGENTE'}`
                                        }
                                    </td>
                                    <td>{item.titulo}</td>
                                    <td>
                                        <button className="btn-leer-pro" onClick={() => setRelatoAbierto(item)}>
                                            ABRIR
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                    📡 NO HAY EXPEDIENTES PUBLICADOS EN ESTA FRECUENCIA...
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {seccion === 'usuarios' && (
                <div className="contenedor-envio-expediente">
                    <h2 className="titulo-neon-p">REDACTAR NUEVO INFORME</h2>
                    <form onSubmit={enviarExpediente} className="form-expediente">
                        <input 
                            type="text" 
                            className="input-bunker" 
                            placeholder="TÍTULO DEL INFORME..." 
                            value={nuevoTitulo} 
                            onChange={(e) => setNuevoTitulo(e.target.value)} 
                            required 
                        />
                        <textarea 
                            className="textarea-bunker" 
                            placeholder="DESCRIPCIÓN DE LOS HECHOS..." 
                            value={nuevoContenido} 
                            onChange={(e) => setNuevoContenido(e.target.value)} 
                            required 
                        ></textarea>
                        <button type="submit" className="btn-enviar-expediente">SUBIR AL ARCHIVO</button>
                    </form>
                </div>
            )}

            {relatoAbierto && (
                <div className="modal-overlay" onClick={() => setRelatoAbierto(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 style={{color: '#00ff41'}}>{relatoAbierto.titulo}</h2>
                        <p style={{fontSize: '0.9rem', color: '#ccc'}}>
                            ORIGEN: {relatoAbierto.usuario_nombre || 'ADMINISTRADOR'}
                        </p>
                        <hr style={{borderColor: '#333'}} />
                        <div className="texto-relato-modal" style={{whiteSpace: 'pre-wrap', padding: '15px 0'}}>
                            {relatoAbierto.contenido}
                        </div>
                        <button onClick={() => setRelatoAbierto(null)} className="btn-main-modal">CERRAR ARCHIVO</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expedientes;