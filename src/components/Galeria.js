import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './galeria.css';
import Forms from './Forms'; 

const Galeria = ({ userAuth }) => {
    const [imagenes, setImagenes] = useState([]);
    const [paginaActual, setPaginaActual] = useState(1);
    const [fotoExpandida, setFotoExpandida] = useState(null);
    const navigate = useNavigate();

    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null); 
    const [nuevaDesc, setNuevaDesc] = useState('');

    const imagenesPorPagina = 6;

    const cargarImagenes = useCallback(async () => {
        try {
            const isAdmin = userAuth && (userAuth.rol === 'admin' || userAuth.email === 'expedientexpepe@moreno.com');
            
            const endpoint = isAdmin
                ? 'http://localhost:5000/admin/todas-las-imagenes'
                : 'http://localhost:5000/imagenes-publicas';

            const res = await axios.get(endpoint);
            setImagenes(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("❌ Error cargando el archivo:", err);
            setImagenes([]);
        }
    }, [userAuth]);

    useEffect(() => {
        cargarImagenes();
    }, [cargarImagenes]);

    const subirImagen = async (e) => {
        if (e) e.preventDefault(); 
        
        if (!userAuth) {
            alert("Acceso denegado. Registre sus credenciales.");
            return;
        }

        if (!archivoSeleccionado) {
            alert("Hermano, selecciona un archivo visual para el búnker.");
            return;
        }

        const formData = new FormData();
        formData.append('titulo', nuevoTitulo);
        formData.append('imagen', archivoSeleccionado); 
        formData.append('agente', userAuth.nombre || 'Agente Anónimo');
        formData.append('descripcion', nuevaDesc); 

        try {
            await axios.post('http://localhost:5000/subir-imagen', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            alert("🚀 EVIDENCIA ENVIADA AL ARCHIVO.");
            
            // Limpieza de estados
            setNuevoTitulo(''); 
            setArchivoSeleccionado(null); 
            setNuevaDesc('');
            
            // Recarga crucial para ver la nueva foto
            cargarImagenes();
        } catch (err) {
            console.error("Error en la subida:", err);
            alert("❌ FALLO EN LA CONEXIÓN.");
        }
    };

    const verEnMapa = (img) => {
        const payload = {
            id: img.id,
            nombre: img.titulo,
            latitud: img.latitud,
            longitud: img.longitud,
            imagen_url: img.url_imagen, 
            descripcion: img.descripcion,
            esDeGaleria: true
        };
        localStorage.setItem('lugar_a_resaltar', JSON.stringify(payload));
        navigate('/lugares');
    };

    const indiceUltima = paginaActual * imagenesPorPagina;
    const indicePrimera = indiceUltima - imagenesPorPagina;
    const imagenesActuales = imagenes.slice(indicePrimera, indiceUltima);

    return (
        <div className="galeria-page">
            <header className="galeria-header">
                <h1 className="titulo-neon">ARCHIVO VISUAL CLASIFICADO</h1>
                <p className="subtitle">GRANADA PARANORMAL - SECTOR ALHAMBRA</p>
            </header>

            {userAuth ? (
                <section className="contenedor-formulario-fijo">
                    <Forms 
                        title="REGISTRAR HALLAZGO"
                        subtitle="Aportar evidencia gráfica al sector"
                        onSubmit={subirImagen}
                        onClear={() => { setNuevoTitulo(''); setArchivoSeleccionado(null); setNuevaDesc(''); }}
                    >
                        <input 
                            type="text" 
                            placeholder="TÍTULO DE LA EVIDENCIA..." 
                            value={nuevoTitulo} 
                            onChange={e => setNuevoTitulo(e.target.value)} 
                            required 
                        />
                        <input 
                            type="file" 
                            accept="image/*"
                            className="input-file-bunker"
                            onChange={e => setArchivoSeleccionado(e.target.files[0])} 
                            required 
                        />
                        <textarea 
                            placeholder="DESCRIPCIÓN DE LA EVIDENCIA..." 
                            value={nuevaDesc} 
                            onChange={e => setNuevaDesc(e.target.value)} 
                            required
                        ></textarea>
                    </Forms>
                </section>
            ) : (
                <div style={{ textAlign: 'center', marginBottom: '30px', color: '#888' }}>
                    <p>ℹ️ Iniciando visor en modo lectura. Identifíquese para aportar evidencias.</p>
                </div>
            )}

            <div className="galeria-grid">
                {imagenesActuales.length > 0 ? (
                    imagenesActuales.map((img) => (
                        <div key={img.id} className="card-imagen" onClick={() => setFotoExpandida(img)}>
                            <div className="contenedor-img">
                                <img
                                    src={`/imagenes/${img.url_imagen}`}
                                    alt={img.titulo}
                                    onError={(e) => {
                                        // Si no está en public, intentamos pedirla al servidor directamente
                                        e.target.onerror = null; 
// Cambiamos la ruta para que apunte a la carpeta de archivos de usuarios
                                e.target.src = `http://localhost:5000/archivos-usuarios/${img.url_imagen}`;                                    }}
                                />
                                {img.estado === 'pendiente' && <span className="badge-pendiente">EN REVISIÓN</span>}
                            </div>
                            <div className="info-img">
                                <h3>{img.titulo}</h3>
                                <p className="agente-tag">FUENTE: {img.agente || 'Desconocido'}</p>
                            </div>
                        </div>
                    ))
                ) : (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center' }}>Cargando registros visuales...</p>
                )}
            </div>

            <div className="paginacion">
                {Array.from({ length: Math.ceil(imagenes.length / imagenesPorPagina) }, (_, i) => (
                    <button 
                        key={i} 
                        onClick={() => setPaginaActual(i + 1)} 
                        className={paginaActual === i + 1 ? 'active' : ''}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>

            {fotoExpandida && (
                <div className="modal-galeria-abierta" onClick={() => setFotoExpandida(null)}>
                    <div className="contenido-foto-grande" onClick={e => e.stopPropagation()}>
                        <button className="cerrar-modal" onClick={() => setFotoExpandida(null)}>×</button>
                        <img 
                            src={`/imagenes/${fotoExpandida.url_imagen}`} 
                            alt={fotoExpandida.titulo} 
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `http://localhost:5000/imagenes/${fotoExpandida.url_imagen}`;
                            }}
                        />
                        <div className="texto-foto-grande">
                            <h2 className="neon-text-blue">{fotoExpandida.titulo?.toUpperCase()}</h2>
                            <p className="desc-galeria">{fotoExpandida.descripcion}</p>
                            <div className="footer-modal-img">
                                <span className="fecha-modal">
                                    📅 {fotoExpandida.fecha ? new Date(fotoExpandida.fecha).toLocaleDateString() : 'Fecha desconocida'}
                                </span>
                                <button className="btn-ver-mapa" onClick={() => verEnMapa(fotoExpandida)}>
                                    📍 VER POSICIÓN EN RADAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Galeria;