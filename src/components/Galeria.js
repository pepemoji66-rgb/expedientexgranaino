import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './galeria.css';

const Galeria = ({ userAuth }) => {
    const [imagenes, setImagenes] = useState([]);
    const [paginaActual, setPaginaActual] = useState(1);
    const [fotoExpandida, setFotoExpandida] = useState(null);
    const navigate = useNavigate();

    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [nuevaUrl, setNuevaUrl] = useState('');
    const [nuevaDesc, setNuevaDesc] = useState('');

    const imagenesPorPagina = 6;

    const cargarImagenes = useCallback(async () => {
        try {
            const isAdmin = userAuth?.rol === 'admin' || userAuth?.email === 'expedientexpepe@moreno.com';
            const endpoint = isAdmin
                ? 'http://localhost:5000/admin/todas-las-imagenes'
                : 'http://localhost:5000/imagenes-publicas';

            const res = await axios.get(endpoint);
            setImagenes(res.data);
        } catch (err) {
            console.error("❌ Error cargando el archivo:", err);
        }
    }, [userAuth]);

    useEffect(() => {
        cargarImagenes();
    }, [cargarImagenes]);

    const subirImagen = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/subir-imagen', {
                titulo: nuevoTitulo,
                url: nuevaUrl,
                descripcion: nuevaDesc,
                agente: userAuth?.nombre || 'Agente Anónimo'
            });
            alert("🚀 EVIDENCIA ENVIADA AL BÚNKER.");
            setNuevoTitulo(''); setNuevaUrl(''); setNuevaDesc('');
            cargarImagenes();
        } catch (err) {
            alert("❌ FALLO EN LA CONEXIÓN.");
        }
    };

    const verEnMapa = (idLugar) => {
        localStorage.setItem('lugar_a_resaltar', idLugar);
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

            {userAuth && (
                <section className="form-subida-img" style={{ maxWidth: '600px', margin: '0 auto 40px' }}>
                    <h2 className="titulo-form">REGISTRAR HALLAZGO</h2>
                    <form onSubmit={subirImagen}>
                        <div className="input-group-galeria">
                            <input type="text" placeholder="TÍTULO..." value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} required />
                            <input type="text" placeholder="ARCHIVO (ej: fantasma.jpg)..." value={nuevaUrl} onChange={e => setNuevaUrl(e.target.value)} required />
                        </div>
                        <textarea placeholder="DESCRIPCIÓN DE LA EVIDENCIA..." value={nuevaDesc} onChange={e => setNuevaDesc(e.target.value)} required></textarea>
                        <button type="submit" className="btn-neon-img">SUBIR AL BÚNKER</button>
                    </form>
                </section>
            )}

            <div className="galeria-grid">
                {imagenesActuales.map((img) => (
                    <div key={img.id} className="card-imagen" onClick={() => setFotoExpandida(img)}>
                        <div className="contenedor-img">
                            <img
                                /* VOLVEMOS A LA RUTA DEL PROFE: Carpeta public/imagenes */
                                src={`/imagenes/${img.url_imagen}`}
                                alt={img.titulo}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://via.placeholder.com/400x300?text=ARCHIVO+NO+ENCONTRADO';
                                }}
                            />
                            {img.estado === 'pendiente' && <span className="badge-pendiente">EN REVISIÓN</span>}
                        </div>
                        <div className="info-img">
                            <h3>{img.titulo}</h3>
                            <p className="agente-tag">FUENTE: {img.agente || 'Desconocido'}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="paginacion">
                {Array.from({ length: Math.ceil(imagenes.length / imagenesPorPagina) }, (_, i) => (
                    <button key={i} onClick={() => setPaginaActual(i + 1)} className={paginaActual === i + 1 ? 'active' : ''}>
                        {i + 1}
                    </button>
                ))}
            </div>

            {fotoExpandida && (
                <div className="modal-galeria-abierta" onClick={() => setFotoExpandida(null)}>
                    <div className="contenido-foto-grande" onClick={e => e.stopPropagation()}>
                        <button className="cerrar-modal" onClick={() => setFotoExpandida(null)}>×</button>
                        
                        {/* ARREGLADO AQUÍ TAMBIÉN: Ruta relativa */}
                        <img 
                            src={`/imagenes/${fotoExpandida.url_imagen}`} 
                            alt={fotoExpandida.titulo} 
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/600x400?text=ERROR+AL+CARGAR';
                            }}
                        />
                        
                        <div className="texto-foto-grande">
                            <h2 className="neon-text-blue">{fotoExpandida.titulo.toUpperCase()}</h2>
                            <p className="desc-galeria">{fotoExpandida.descripcion}</p>
                            
                            <div className="footer-modal-img">
                                <span className="fecha-modal">📅 {new Date(fotoExpandida.fecha).toLocaleDateString()}</span>
                                <button 
                                    className="btn-ver-mapa"
                                    onClick={() => verEnMapa(fotoExpandida.lugar_id || fotoExpandida.id)}
                                >
                                    📍 VER EN EL RADAR
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