import React, { useState } from 'react';
import axios from 'axios';
import './Reporte.css';
import API_BASE_URL from '../config';


const Reporte = ({ userAuth }) => {
    // URL CENTRAL DEL BÚNKER
    const API_URL = 'https://expedientexgranaino.onrender.com/';

    // Estado inicial para limpiar el formulario tras el envío
    const estadoInicial = {
        titulo: '',
        descripcion: '',
        lugar: '',
        videoUrl: ''
    };

    const [datos, setDatos] = useState(estadoInicial);
    const [enviando, setEnviando] = useState(false);

    const enviarReporte = async (e) => {
        e.preventDefault();
        setEnviando(true);

        // Construcción del informe con metadatos del agente
        const informeCompleto = {
            ...datos,
            agente: userAuth ? userAuth.nombre : "Anónimo",
            fecha: new Date().toLocaleString()
        };

        try {
            // Envío de la señal al búnker (Ruta de vídeos)
            await axios.post(`${API_BASE_URL}/api/videos/`, {
                titulo: datos.titulo,
                url: datos.videoUrl,
                usuario_nombre: userAuth ? userAuth.nombre : "Anónimo",
                descripcion: datos.descripcion, // El búnker puede procesarlo si se actualiza
                lugar: datos.lugar
            });

            alert("⚠️ INFORME RECIBIDO, HERMANO. La central procesará las pruebas.");

            // Limpieza de los campos tras éxito
            setDatos(estadoInicial);
        } catch (err) {
            console.error("Error en reporte:", err);
            alert("❌ Error en la señal. El búnker no ha podido recibir los datos.");
        } finally {
            setEnviando(false);
        }
    };

    // --- PROTECCIÓN DE RUTA (Interfaz de bloqueo si no hay login) ---
    if (!userAuth) {
        return (
            <div className="registro-card fade-in" style={{ textAlign: 'center', padding: '40px', marginTop: '20px' }}>
                <h3 className="titulo-seccion" style={{ color: '#ff4444' }}>ACCESO RESTRINGIDO</h3>
                <div style={{ margin: '20px 0', border: '1px dashed #ff4444', padding: '10px' }}>
                    <p style={{ color: '#fff', fontFamily: 'Courier New', fontSize: '0.9rem' }}>
                        ERROR: CREDENCIALES NO DETECTADAS EN EL SECTOR
                    </p>
                </div>
                <p style={{ color: '#ccc', fontFamily: 'Courier New' }}>
                    Debes estar identificado como AGENTE para reportar un avistamiento a la central.
                </p>
            </div>
        );
    }

    // --- INTERFAZ DEL REPORTE ---
    return (
        <div className="registro-card fade-in">
            <h3 className="titulo-seccion">INFORME DE AVISTAMIENTO</h3>
            <p style={{
                color: 'var(--color-principal)',
                fontSize: '0.8rem',
                textAlign: 'center',
                marginBottom: '20px',
                letterSpacing: '2px',
                fontFamily: 'Courier New'
            }}>
                AGENTE INFORMANTE: {userAuth.nombre.toUpperCase()}
            </p>

            <form onSubmit={enviarReporte} className="formulario-agente">
                <div className="campo-reporte">
                    <label>TÍTULO DEL SUCESO:</label>
                    <input
                        type="text"
                        placeholder="¿Qué has detectado?"
                        className="input-paranormal"
                        value={datos.titulo}
                        onChange={e => setDatos({ ...datos, titulo: e.target.value })}
                        required
                    />
                </div>

                <div className="campo-reporte">
                    <label>LOCALIZACIÓN:</label>
                    <input
                        type="text"
                        placeholder="Ej: Sierra Nevada, Barranco del Abogado..."
                        className="input-paranormal"
                        value={datos.lugar}
                        onChange={e => setDatos({ ...datos, lugar: e.target.value })}
                        required
                    />
                </div>

                <div className="campo-reporte">
                    <label>EVIDENCIA DIGITAL (URL):</label>
                    <input
                        type="url"
                        placeholder="Enlace a vídeo (YouTube, Drive, etc.)"
                        className="input-paranormal"
                        value={datos.videoUrl}
                        onChange={e => setDatos({ ...datos, videoUrl: e.target.value })}
                    />
                </div>

                <div className="campo-reporte">
                    <label>DESCRIPCIÓN DE LOS HECHOS:</label>
                    <textarea
                        placeholder="Detalla lo ocurrido con precisión cronológica..."
                        className="input-paranormal"
                        style={{ height: '120px', resize: 'none' }}
                        value={datos.descripcion}
                        onChange={e => setDatos({ ...datos, descripcion: e.target.value })}
                        required
                    />
                </div>

                <button type="submit" className="boton-enviar" disabled={enviando}>
                    {enviando ? "TRANSMITIENDO..." : "ENVIAR PRUEBAS A LA CENTRAL"}
                </button>
            </form>
        </div>
    );
};

export default Reporte;
