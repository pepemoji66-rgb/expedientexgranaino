import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './archivosusuarios.css';
import { useNavigate } from 'react-router-dom';

const ArchivosUsuarios = () => {
    const [hallazgos, setHallazgos] = useState([]);
    const [archivo, setArchivo] = useState(null);
    const [datos, setDatos] = useState({ titulo: '', descripcion: '', latitud: '', longitud: '' });
    const [subiendo, setSubiendo] = useState(false);
    const navigate = useNavigate();

    // Recuperamos al usuario del localStorage para saber quién es
    const usuarioLogueado = JSON.parse(localStorage.getItem('usuario')) || {};

    useEffect(() => {
        cargarHallazgos();
    }, []);

    const cargarHallazgos = async () => {
        try {
            const res = await axios.get('http://localhost:5000/imagenes-publicas');
            setHallazgos(res.data);
        } catch (err) {
            console.error("❌ Error cargando archivos de agentes:", err);
        }
    };

    // --- LÓGICA PARA SUBIR ARCHIVOS ---
    const handleSubida = async (e) => {
        e.preventDefault();
        if (!archivo) return alert("Selecciona un archivo primero, hermano.");

        setSubiendo(true);
        const formData = new FormData();
        formData.append('imagen', archivo);
        formData.append('titulo', datos.titulo);
        formData.append('descripcion', datos.descripcion);
        formData.append('latitud', datos.latitud);
        formData.append('longitud', datos.longitud);
        formData.append('agente', usuarioLogueado.nombre || 'Agente Desconocido');

        try {
            await axios.post('http://localhost:5000/subir-hallazgo', formData);
            alert("✅ Hallazgo enviado al búnker. Pendiente de aprobación.");
            setDatos({ titulo: '', descripcion: '', latitud: '', longitud: '' });
            setArchivo(null);
            cargarHallazgos(); // Refrescar lista
        } catch (err) {
            console.error(err);
            alert("❌ Fallo en el envío de inteligencia.");
        } finally {
            setSubiendo(false);
        }
    };

    const verEnMapa = (dato) => {
        const payload = {
            id: dato.id,
            latitud: parseFloat(dato.latitud),
            longitud: parseFloat(dato.longitud),
            tipo: 'archivo',
            nombre: dato.titulo
        };
        localStorage.setItem('lugar_a_resaltar', JSON.stringify(payload));
        navigate('/lugares');
    };

    return (
        <div className="archivos-container">
            <h2 className="titulo-archivos">📂 ARCHIVOS DE CAMPO (INTELIGENCIA)</h2>

            {/* --- FORMULARIO DE SUBIDA (Solo para Agentes o Admin) --- */}
            {usuarioLogueado.id && (
                <div className="formulario-subida-bunker">
                    <h3 className="titulo-neon-chico">REGISTRAR NUEVO HALLAZGO</h3>
                    <form onSubmit={handleSubida} className="form-bunker">
                        <input type="text" placeholder="TÍTULO DEL HALLAZGO" value={datos.titulo} onChange={e => setDatos({ ...datos, titulo: e.target.value })} required />
                        <textarea placeholder="DESCRIPCIÓN DE LA EVIDENCIA" value={datos.descripcion} onChange={e => setDatos({ ...datos, descripcion: e.target.value })} />
                        <div className="coordenadas">
                            <input type="number" step="any" placeholder="LATITUD" value={datos.latitud} onChange={e => setDatos({ ...datos, latitud: e.target.value })} required />
                            <input type="number" step="any" placeholder="LONGITUD" value={datos.longitud} onChange={e => setDatos({ ...datos, longitud: e.target.value })} required />
                        </div>
                        <input type="file" onChange={e => setArchivo(e.target.files[0])} accept="image/*" required />
                        <button type="submit" className="btn-radar" disabled={subiendo}>
                            {subiendo ? "TRANSMITIENDO..." : "ENVIAR AL COMANDANTE"}
                        </button>
                    </form>
                </div>
            )}

            <hr className="divisor-bunker" />

            <div className="archivos-grid">
                {hallazgos.map(item => {
                    const rutaFoto = `http://localhost:5000/archivos-usuarios/${item.url_imagen}`;
                    return (
                        <div key={item.id} className="archivo-card">
                            <div className="contenedor-img-agente">
                                <img
                                    src={rutaFoto}
                                    alt={item.titulo}
                                    onClick={() => verEnMapa(item)}
                                    style={{ cursor: 'pointer', width: '100%', height: 'auto', display: 'block' }}
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mN8Xw8AAoMBX928o1oAAAAASUVORK5CYII=";
                                    }}
                                />
                            </div>
                            <div className="archivo-info">
                                <h3 className="titulo-neon-chico">{item.titulo}</h3>
                                <p className="agente-tag">🕵️ AGENTE: {item.agente}</p>
                                <button className="btn-radar" onClick={() => verEnMapa(item)}>
                                    📍 LOCALIZAR EN RADAR
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ArchivosUsuarios;