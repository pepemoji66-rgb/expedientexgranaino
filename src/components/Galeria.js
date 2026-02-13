import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './galeria.css';
import Forms from './Forms'; 

const Galeria = ({ userAuth }) => {
    const [registros, setRegistros] = useState({
        'lugares': [],
        'imagenes': [],
        'archivos-usuarios': []
    });
    
    const [pestanaActiva, setPestanaActiva] = useState('lugares'); 
    const [paginaActual, setPaginaActual] = useState(1);
    const [fotoExpandida, setFotoExpandida] = useState(null);
    const [mostrarForm, setMostrarForm] = useState(false); 
    const navigate = useNavigate();

    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null); 
    const [nuevaDesc, setNuevaDesc] = useState('');

    const imagenesPorPagina = 6;

    const config = {
        'lugares': { 
            urlBase: 'http://localhost:5000/lugares/', 
            columna: 'imagen_url',
            etiqueta: 'SECTOR LUGARES'
        },
        'imagenes': { 
            urlBase: 'http://localhost:5000/imagenes/', 
            columna: 'imagen_url', 
            etiqueta: 'ALERTA NOTICIAS'
        },
        'archivos-usuarios': { 
            urlBase: 'http://localhost:5000/archivos-usuarios/', 
            columna: 'url_imagen', 
            etiqueta: 'EVIDENCIA AGENTE'
        }
    };

    const cargarImagenes = useCallback(async () => {
        try {
            const isAdmin = userAuth && (userAuth.rol === 'admin' || userAuth.email === 'expedientexpepe@moreno.com');
            
            const [resL, resN, resA] = await Promise.all([
                axios.get('http://localhost:5000/lugares'),
                axios.get('http://localhost:5000/admin/todas-noticias'),
                axios.get(isAdmin ? 'http://localhost:5000/admin/todas-las-imagenes' : 'http://localhost:5000/imagenes-publicas')
            ]);

            setRegistros({
                'lugares': Array.isArray(resL.data) ? resL.data : [],
                'imagenes': Array.isArray(resN.data) ? resN.data : [],
                'archivos-usuarios': Array.isArray(resA.data) ? resA.data : []
            });
        } catch (err) {
            console.error("❌ Error cargando el búnker:", err);
            setRegistros({ 'lugares': [], 'imagenes': [], 'archivos-usuarios': [] });
        }
    }, [userAuth]);

    useEffect(() => {
        cargarImagenes();
    }, [cargarImagenes]);

    const subirImagen = async (e) => {
        if (e) e.preventDefault(); 
        if (!userAuth) { alert("Acceso denegado."); return; }
        if (!archivoSeleccionado) { alert("Hermano, selecciona un archivo."); return; }

        const formData = new FormData();
        formData.append('titulo', nuevoTitulo);
        formData.append('imagen', archivoSeleccionado); 
        formData.append('agente', userAuth.nombre || 'Agente Anónimo');
        formData.append('descripcion', nuevaDesc); 

        try {
            await axios.post('http://localhost:5000/subir-imagen', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("🚀 EVIDENCIA ENVIADA.");
            setNuevoTitulo(''); setArchivoSeleccionado(null); setNuevaDesc('');
            setMostrarForm(false); 
            cargarImagenes();
        } catch (err) {
            console.error("Error en la subida:", err);
            alert("❌ FALLO EN LA CONEXIÓN.");
        }
    };

    const verEnMapa = (img) => {
        const conf = config[pestanaActiva];
        const payload = {
            id: img.id,
            nombre: img.titulo || img.nombre,
            latitud: img.latitud,
            longitud: img.longitud,
            imagen_url: img[conf.columna], 
            descripcion: img.descripcion || img.cuerpo || img.descripcionclon,
            esDeGaleria: true
        };
        localStorage.setItem('lugar_a_resaltar', JSON.stringify(payload));
        navigate('/lugares');
    };

    const confActual = config[pestanaActiva];
    const listaActual = registros[pestanaActiva] || [];
    const imagenesActuales = listaActual.slice((paginaActual - 1) * imagenesPorPagina, paginaActual * imagenesPorPagina);

    return (
        <div className="galeria-page">
            <header className="galeria-header">
                <h1 className="titulo-neon">ARCHIVO VISUAL CLASIFICADO</h1>
                <p className="subtitle">ESTADO: CONECTADO AL PUERTO 5000</p>
            </header>

            <div className="pestanas-galeria" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
                {['lugares', 'imagenes', 'archivos-usuarios'].map(f => (
                    <button 
                        key={f}
                        onClick={() => { setPestanaActiva(f); setPaginaActual(1); setMostrarForm(false); }}
                        className={pestanaActiva === f ? 'active' : ''}
                        style={{
                            background: pestanaActiva === f ? '#00ff41' : '#111',
                            color: pestanaActiva === f ? '#000' : '#00ff41',
                            border: '2px solid #00ff41', padding: '10px 20px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                    >
                        📁 {f.toUpperCase()}
                    </button>
                ))}
            </div>

            {userAuth && pestanaActiva === 'archivos-usuarios' && (
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <button 
                        onClick={() => setMostrarForm(!mostrarForm)}
                        style={{
                            background: '#000', color: '#00ff41', border: '1px solid #00ff41',
                            padding: '10px 25px', cursor: 'pointer', fontFamily: 'monospace'
                        }}
                    >
                        {mostrarForm ? '✖ CANCELAR REGISTRO' : '➕ AÑADIR NUEVO HALLAZGO'}
                    </button>
                </div>
            )}

            {mostrarForm && userAuth && pestanaActiva === 'archivos-usuarios' && (
                <section className="contenedor-formulario-fijo">
                    <Forms 
                        title="REGISTRAR HALLAZGO" 
                        onSubmit={subirImagen} 
                        onClear={() => { 
                            setNuevoTitulo(''); 
                            setArchivoSeleccionado(null); 
                            setNuevaDesc('');
                            setMostrarForm(false); // <--- ESTO ES LO QUE HACE QUE EL BOTÓN ABORTAR FUNCIONE
                        }}
                    >
                        <input type="text" placeholder="TÍTULO..." value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} required />
                        <input type="file" accept="image/*" onChange={e => setArchivoSeleccionado(e.target.files[0])} required />
                        <textarea placeholder="DESCRIPCIÓN..." value={nuevaDesc} onChange={e => setNuevaDesc(e.target.value)} required />
                    </Forms>
                </section>
            )}

            <div className="galeria-grid">
                {imagenesActuales.length > 0 ? (
                    imagenesActuales.map((img) => {
                        const nombreArchivo = img[confActual.columna];
                        const rutaImg = nombreArchivo ? `${confActual.urlBase}${nombreArchivo}` : null;

                        return (
                            <div key={img.id} className="card-imagen" onClick={() => rutaImg && setFotoExpandida({ ...img, rutaCompleta: rutaImg })}>
                                <div className="contenedor-img">
                                    {rutaImg ? (
                                        <img src={rutaImg} alt={img.titulo || img.nombre} />
                                    ) : (
                                        <div className="placeholder-vacio">⚠️ SIN RUTA</div>
                                    )}
                                    <span className="badge-sector">{confActual.etiqueta}</span>
                                </div>
                                <div className="info-img">
                                    <h3>{img.titulo || img.nombre}</h3>
                                    <p className="agente-tag">FUENTE: {img.agente || 'Sistema'}</p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '50px', color: '#00ff41' }}>
                        📡 NO HAY DATOS VISUALES DETECTADOS EN ESTE SECTOR...
                    </p>
                )}
            </div>

            {fotoExpandida && (
                <div className="modal-galeria-abierta" onClick={() => setFotoExpandida(null)}>
                    <div className="contenido-foto-grande" onClick={e => e.stopPropagation()}>
                        <button className="cerrar-modal" onClick={() => setFotoExpandida(null)}>×</button>
                        <img src={fotoExpandida.rutaCompleta} alt="Evidencia" />
                        <div className="texto-foto-grande">
                            <h2 className="neon-text-blue">{(fotoExpandida.titulo || fotoExpandida.nombre)?.toUpperCase()}</h2>
                            <p className="desc-galeria">{fotoExpandida.descripcion || fotoExpandida.cuerpo || fotoExpandida.descripcionclon}</p>
                            <div className="footer-modal-img">
                                <span>📅 {fotoExpandida.fecha ? new Date(fotoExpandida.fecha).toLocaleDateString() : 'Desconocida'}</span>
                                <button className="btn-ver-mapa" onClick={() => verEnMapa(fotoExpandida)}>📍 VER EN RADAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Galeria;