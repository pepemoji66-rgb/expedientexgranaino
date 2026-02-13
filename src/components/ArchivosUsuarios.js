import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './archivosusuarios.css'; 

const ArchivosUsuarios = () => {
    const [hallazgos, setHallazgos] = useState([]);
    const [archivo, setArchivo] = useState(null);
    const [form, setForm] = useState({ 
        titulo: '', 
        desc: '', 
        lugar: '', 
        lat: '0', 
        lon: '0' 
    });
    const [subiendo, setSubiendo] = useState(false);
    const navigate = useNavigate();

    // Obtener nombre del agente desde la sesión
    const agenteActual = JSON.parse(localStorage.getItem('usuario_sesion'))?.nombre || 'Agente Desconocido';

    useEffect(() => {
        cargarHallazgos();
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(pos => {
                setForm(f => ({ 
                    ...f, 
                    lat: pos.coords.latitude.toFixed(6), 
                    lon: pos.coords.longitude.toFixed(6) 
                }));
            });
        }
    }, []);

    const cargarHallazgos = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/archivos-usuarios');
            setHallazgos(res.data);
        } catch (err) { 
            console.error("Error cargando archivos", err); 
        }
    };

    const handleSubir = async (e) => {
        e.preventDefault();
        if (!archivo) return alert("Sube una prueba visual, hermano.");
        setSubiendo(true);

        const formData = new FormData();
        formData.append('archivo', archivo);
        formData.append('titulo', form.titulo);
        formData.append('descripcion', form.desc);
        formData.append('ubicacion', form.lugar);
        formData.append('latitud', form.lat);
        formData.append('longitud', form.lon);
        formData.append('agente', agenteActual);

        try {
            await axios.post('http://localhost:5000/api/archivos-usuarios', formData);
            alert("✅ Hallazgo transmitido al Búnker.");
            setForm({ ...form, titulo: '', desc: '', lugar: '' });
            setArchivo(null);
            cargarHallazgos();
        } catch (err) {
            alert("❌ Error de transmisión.");
        } finally { 
            setSubiendo(false); 
        }
    };

    const verMapa = (h) => {
        localStorage.setItem('lugar_a_resaltar', JSON.stringify({
            id: h.id, 
            latitud: parseFloat(h.latitud), 
            longitud: parseFloat(h.longitud), 
            tipo: 'hallazgo', 
            nombre: h.titulo
        }));
        navigate('/lugares');
    };

    return (
        <div className="archivos-container">
            <h1 className="titulo-neon">📡 REGISTRO DE CAMPO</h1>
            
            {/* FORMULARIO ESTRECHO Y REDONDEADO */}
            <div className="form-bunker-wrapper">
                <form onSubmit={handleSubir} className="form-bunker">
                    <div className="form-group">
                        <label>TÍTULO DEL ARCHIVO</label>
                        <input 
                            type="text" 
                            value={form.titulo} 
                            onChange={(e) => setForm({...form, titulo: e.target.value})} 
                            placeholder="Ej: Objeto no identificado..." 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>UBICACIÓN / LUGAR</label>
                        <input 
                            type="text" 
                            value={form.lugar} 
                            onChange={(e) => setForm({...form, lugar: e.target.value})} 
                            placeholder="Coordenadas o zona..." 
                            required 
                        />
                    </div>

                    <div className="form-group">
                        <label>EVIDENCIA VISUAL</label>
                        <input 
                            type="file" 
                            onChange={(e) => setArchivo(e.target.files[0])} 
                            className="file-input"
                            accept="image/*,video/*"
                        />
                    </div>

                    <div className="form-group">
                        <label>DESCRIPCIÓN DE LA ANOMALÍA</label>
                        <textarea 
                            value={form.desc} 
                            onChange={(e) => setForm({...form, desc: e.target.value})} 
                            placeholder="Relate lo sucedido..."
                        ></textarea>
                    </div>

                    <button type="submit" disabled={subiendo} className="btn-enviar">
                        {subiendo ? 'TRANSMITIENDO...' : 'ENVIAR AL BÚNKER'}
                    </button>
                    
                    <div className="form-footer">
                        <button type="button" onClick={() => navigate('/')} className="btn-secundario">INICIO</button>
                        <button type="button" onClick={() => navigate('/radar')} className="btn-secundario">RADAR</button>
                    </div>
                </form>
            </div>

            <hr className="neon-divider" />

            {/* GRID DE HALLAZGOS ABAJO */}
            <div className="hallazgos-grid">
                {hallazgos.map(h => (
                    <div key={h.id} className="card-hallazgo">
                        <img src={`http://localhost:5000/archivos-usuarios/${h.nombre_archivo}`} alt={h.titulo} />
                        <div className="card-info">
                            <h3>{h.titulo}</h3>
                            <p className="agente-tag">Por: {h.agente}</p>
                            <button onClick={() => verMapa(h)} className="btn-mapa">VER EN RADAR</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ArchivosUsuarios;