import React, { useState } from 'react';
import axios from 'axios';
import './Reporte.css';

const Reporte = ({ userAuth }) => {
    const [datos, setDatos] = useState({
        titulo: '',
        descripcion: '',
        lugar: '',
        videoUrl: '' // Nuevo campo para el enlace del vídeo
    });

    const enviarReporte = async (e) => {
        e.preventDefault();

        // Añadimos el nombre del agente al informe automáticamente
        const informeCompleto = {
            ...datos,
            agente: userAuth ? userAuth.nombre : "Anónimo",
            fecha: new Date().toLocaleString()
        };

        try {
            await axios.post('http://localhost:5000/reportar', informeCompleto);
            alert("⚠️ INFORME RECIBIDO. La central procesará el vídeo y la descripción.");
            setDatos({ titulo: '', descripcion: '', lugar: '', videoUrl: '' }); // Limpiamos
        } catch (err) {
            alert("❌ Error en la señal. El búnker no ha podido recibir los datos.");
        }
    };

    // Si el usuario no está logueado, le lanzamos el aviso
    if (!userAuth) {
        return (
            <div className="registro-card" style={{ textAlign: 'center', padding: '40px' }}>
                <h3 className="titulo-seccion" style={{ color: '#ff4444' }}>ACCESO RESTRINGIDO</h3>
                <p style={{ color: '#fff', fontFamily: 'Courier New' }}>
                    Debes estar identificado como AGENTE para reportar un avistamiento.
                </p>
            </div>
        );
    }

    return (
        <div className="registro-card">
            <h3 className="titulo-seccion">REPORTAR AVISTAMIENTO</h3>
            <p style={{ color: 'var(--color-principal)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '20px' }}>
                AGENTE INFORMANTE: {userAuth.nombre.toUpperCase()}
            </p>

            <form onSubmit={enviarReporte} className="formulario-agente">
                <input
                    type="text"
                    placeholder="¿Qué has visto? (Título del suceso)"
                    className="input-paranormal"
                    value={datos.titulo}
                    onChange={e => setDatos({ ...datos, titulo: e.target.value })}
                    required
                />
                <input
                    type="text"
                    placeholder="Lugar exacto (ej: Cumbres Verdes, Lanjarón...)"
                    className="input-paranormal"
                    value={datos.lugar}
                    onChange={e => setDatos({ ...datos, lugar: e.target.value })}
                    required
                />
                <input
                    type="url"
                    placeholder="Enlace al vídeo (YouTube, Drive, Dropbox...)"
                    className="input-paranormal"
                    value={datos.videoUrl}
                    onChange={e => setDatos({ ...datos, videoUrl: e.target.value })}
                />
                <textarea
                    placeholder="Describe el suceso y lo que se ve en el vídeo..."
                    className="input-paranormal"
                    style={{ height: '100px', resize: 'none' }}
                    value={datos.descripcion}
                    onChange={e => setDatos({ ...datos, descripcion: e.target.value })}
                    required
                />
                <button type="submit" className="boton-enviar">ENVIAR PRUEBAS A LA CENTRAL</button>
            </form>
        </div>
    );
};

export default Reporte;