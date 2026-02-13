import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './galeria.css';
import Forms from './Forms'; 

const Galeria = ({ userAuth }) => {
    // --- ESTADOS ORIGINALES ---
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

    // Estados del Formulario
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null); 
    const [nuevaDesc, setNuevaDesc] = useState('');

    const imagenesPorPagina = 6;

    // --- CONFIGURACIÓN DE RUTAS (Sincronizado con tus carpetas) ---
    const config = {
        'lugares': { 
            urlBase: 'http://localhost:5000/lugares/', 
            columna: 'imagen_url',
            etiqueta: 'SECTOR LUGARES'
        },
        'imagenes': { 
            urlBase: 'http://localhost:5000/imagenes/', 
            columna: 'url_imagen', 
            etiqueta: 'ALERTA NOTICIAS'
        },
        'archivos-usuarios': { 
            urlBase: 'http://localhost:5000/imagenes/', 
            columna: 'url_imagen', 
            etiqueta: 'EVIDENCIA AGENTE'
        }
    };

    // --- CARGAR DATOS (Recuperando toda la lógica de filtrado) ---
    const cargarImagenes = useCallback(async () => {
        try {
            console.log("📡 ESCANEANDO SECTORES...");
            const isAdmin = userAuth && (userAuth.rol === 'admin' || userAuth.email === 'expedientexpepe@moreno.com');
            
            const [resL, resN, resA] = await Promise.all([
                axios.get('http://localhost:5000/lugares'),
                axios.get('http://localhost:5000/admin/todas-noticias'),
                axios.get(isAdmin ? 'http://localhost:5000/admin/todas-las-imagenes' : 'http://localhost:5000/imagenes-publicas')
            ]);

            // Mapeo exhaustivo para no perder datos
            setRegistros({
                'lugares': Array.isArray(resL.data) ? resL.data : [],
                'imagenes': Array.isArray(resN.data) ? resN.data : [],
                'archivos-usuarios': Array.isArray(resA.data) ? resA.data : []
            });
            console.log("✅ SECTORES CARGADOS");
        } catch (err) {
            console.error("❌ ERROR CRÍTICO EN EL BÚNKER:", err);
            setRegistros({ 'lugares': [], 'imagenes': [], 'archivos-usuarios': [] });
        }
    }, [userAuth]);

    useEffect(() => {
        cargarImagenes();
    }, [cargarImagenes]);

    // --- LÓGICA DE SUBIDA (Recuperando FormData completo) ---
    const subirImagen = async (e) => {
        if (e) e.preventDefault(); 
        if (!userAuth) { alert("Acceso denegado. Identifíquese."); return; }
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
            alert("🚀 EVIDENCIA REGISTRADA EN LA BASE DE DATOS.");
            setNuevoTitulo(''); 
            setArchivoSeleccionado(null); 
            setNuevaDesc('');
            setMostrarForm(false); 
            cargarImagenes();
        } catch (err) {
            console.error("Error en la subida:", err);
            alert("❌ FALLO EN LA TRANSMISIÓN.");
        }
    };

    // --- SISTEMA DE NAVEGACIÓN AL RADAR ---
    const verEnMapa = (img) => {
        const conf = config[pestanaActiva];
        const payload = {
            id: img.id,
            nombre: img.titulo || img.nombre,
            latitud: img.latitud,
            longitud: img.longitud,
            imagen_url: img[conf.columna] || img.url_imagen || img.imagen, 
            descripcion: img.descripcion || img.cuerpo || img.descripcionclon,
            esDeGaleria: true
        };
        localStorage.setItem('lugar_a_resaltar', JSON.stringify(payload));
        navigate('/lugares');
    };

    // --- MANEJO DE ERRORES DE IMAGEN (ANTI-BUCLE) ---
    const handleImgError = (e) => {
        e.target.onerror = null; // Detiene el bucle
        e.target.src = "https://via.placeholder.com/500x350?text=ARCHIVO+NO+ENCONTRADO";
    };

    // --- CÁLCULOS DE RENDERIZADO Y PAGINACIÓN ---
    const confActual = config[pestanaActiva];
    const listaActual = registros[pestanaActiva] || [];
    
    // Paginación
    const totalPaginas = Math.ceil(listaActual.length / imagenesPorPagina);
    const indiceUltima = paginaActual * imagenesPorPagina;
    const indicePrimera = indiceUltima - imagenesPorPagina;
    const imagenesActuales = listaActual.slice(indicePrimera, indiceUltima);

    return (
        <div className="galeria-page">
            <header className="galeria-header">
                <div className="linea-neon-superior"></div>
                <h1 className="titulo-neon">ARCHIVO VISUAL CLASIFICADO</h1>
                <p className="subtitle">NIVEL DE ACCESO: {userAuth?.rol?.toUpperCase() || 'INVITADO'} | PUERTO 5000</p>
            </header>

            {/* --- SELECTOR DE PESTAÑAS (Las que se habían perdido) --- */}
            <nav className="pestanas-galeria-container">
                <div className="pestanas-galeria-wrapper">
                    {['lugares', 'imagenes', 'archivos-usuarios'].map(f => (
                        <button 
                            key={f}
                            onClick={() => { 
                                setPestanaActiva(f); 
                                setPaginaActual(1); 
                                setMostrarForm(false); 
                            }}
                            className={`btn-pestana-moderno ${pestanaActiva === f ? 'active' : ''}`}
                        >
                            <span className="icon-folder">📁</span>
                            <span className="text-folder">{f.replace('-', ' ').toUpperCase()}</span>
                            {pestanaActiva === f && <div className="indicator-neon"></div>}
                        </button>
                    ))}
                </div>
            </nav>

            {/* --- BOTÓN DE ACCIÓN PARA SUBIR --- */}
            {userAuth && pestanaActiva === 'archivos-usuarios' && (
                <div className="admin-actions-bar">
                    <button 
                        onClick={() => setMostrarForm(!mostrarForm)}
                        className="btn-add-hallazgo"
                    >
                        {mostrarForm ? '✖ ABORTAR OPERACIÓN' : '➕ REGISTRAR NUEVA EVIDENCIA'}
                    </button>
                </div>
            )}

            {/* --- FORMULARIO DE REGISTRO --- */}
            {mostrarForm && userAuth && pestanaActiva === 'archivos-usuarios' && (
                <section className="contenedor-formulario-fijo animate-slide-down">
                    <Forms 
                        title="NUEVO HALLAZGO EN SECTOR" 
                        onSubmit={subirImagen} 
                        onClear={() => { 
                            setNuevoTitulo(''); 
                            setArchivoSeleccionado(null); 
                            setNuevaDesc('');
                            setMostrarForm(false);
                        }}
                    >
                        <div className="form-group-moderno">
                            <label>TÍTULO DEL HALLAZGO</label>
                            <input type="text" placeholder="Ej: Anomalía detectada en Sector 7..." value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} required />
                        </div>
                        <div className="form-group-moderno">
                            <label>ARCHIVO VISUAL (.JPG, .PNG)</label>
                            <input type="file" accept="image/*" onChange={e => setArchivoSeleccionado(e.target.files[0])} required />
                        </div>
                        <div className="form-group-moderno">
                            <label>NOTAS DE CAMPO</label>
                            <textarea placeholder="Describa lo hallado con detalle..." value={nuevaDesc} onChange={e => setNuevaDesc(e.target.value)} required />
                        </div>
                    </Forms>
                </section>
            )}

            {/* --- GRID DE IMÁGENES PRINCIPAL --- */}
            <main className="galeria-main-content">
                <div className="galeria-grid">
                    {imagenesActuales.length > 0 ? (
                        imagenesActuales.map((img) => {
                            const nombreArchivo = img[confActual.columna] || img.url_imagen || img.imagen;
                            const rutaImg = nombreArchivo ? `${confActual.urlBase}${nombreArchivo}` : null;

                            return (
                                <article 
                                    key={img.id} 
                                    className="card-imagen-completa" 
                                    onClick={() => rutaImg && setFotoExpandida({ ...img, rutaCompleta: rutaImg })}
                                >
                                    <div className="contenedor-img-wrapper">
                                        {rutaImg ? (
                                            <img src={rutaImg} alt={img.titulo || img.nombre} onError={handleImgError} />
                                        ) : (
                                            <div className="placeholder-vacio-box">⚠️ SECTOR SIN IMAGEN</div>
                                        )}
                                        <div className="overlay-card">
                                            <span className="badge-sector-mini">{confActual.etiqueta}</span>
                                        </div>
                                    </div>
                                    <div className="info-img-footer">
                                        <h3>{img.titulo || img.nombre}</h3>
                                        <div className="meta-info">
                                            <span className="agente-tag">👤 {img.agente || img.usuario_nombre || 'SISTEMA'}</span>
                                            <span className="fecha-tag">📅 {img.fecha ? new Date(img.fecha).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                    ) : (
                        <div className="no-data-alert">
                            <div className="radar-loader"></div>
                            <p>📡 ESCANEANDO... NO SE DETECTAN REGISTROS EN ESTE SECTOR.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* --- CONTROLES DE PAGINACIÓN --- */}
            {totalPaginas > 1 && (
                <footer className="galeria-pagination">
                    <button 
                        disabled={paginaActual === 1} 
                        onClick={() => { setPaginaActual(p => p - 1); window.scrollTo(0,0); }}
                        className="btn-pag-nav"
                    > ◄ ANTERIOR </button>
                    
                    <div className="pag-numbers">
                        {Array.from({ length: totalPaginas }, (_, i) => (
                            <button 
                                key={i + 1} 
                                onClick={() => { setPaginaActual(i + 1); window.scrollTo(0,0); }}
                                className={`btn-pag-num ${paginaActual === i + 1 ? 'active' : ''}`}
                            > {i + 1} </button>
                        ))}
                    </div>

                    <button 
                        disabled={paginaActual === totalPaginas} 
                        onClick={() => { setPaginaActual(p => p + 1); window.scrollTo(0,0); }}
                        className="btn-pag-nav"
                    > SIGUIENTE ► </button>
                </footer>
            )}

            {/* --- MODAL DE EXPANSIÓN (Full Detalles) --- */}
            {fotoExpandida && (
                <div className="modal-galeria-abierta fade-in" onClick={() => setFotoExpandida(null)}>
                    <div className="contenido-foto-grande-full" onClick={e => e.stopPropagation()}>
                        <button className="cerrar-modal-neon" onClick={() => setFotoExpandida(null)}>×</button>
                        
                        <div className="modal-split-view">
                            <div className="modal-img-container">
                                <img src={fotoExpandida.rutaCompleta} alt="Evidencia Full" onError={handleImgError} />
                            </div>
                            
                            <div className="modal-text-content">
                                <header>
                                    <span className="tag-alerta">{confActual.etiqueta}</span>
                                    <h2 className="neon-text-blue">{(fotoExpandida.titulo || fotoExpandida.nombre)?.toUpperCase()}</h2>
                                </header>
                                
                                <div className="body-text">
                                    <p className="desc-galeria-full">
                                        {fotoExpandida.descripcion || fotoExpandida.cuerpo || fotoExpandida.descripcionclon || "No existen notas adicionales para este registro."}
                                    </p>
                                </div>

                                <footer className="modal-footer-btns">
                                    <div className="data-meta">
                                        <p><strong>REGISTRO:</strong> #{fotoExpandida.id}</p>
                                        <p><strong>ORIGEN:</strong> {fotoExpandida.agente || 'ARCHIVO CENTRAL'}</p>
                                    </div>
                                    <button className="btn-action-map" onClick={() => verEnMapa(fotoExpandida)}>
                                        📍 LOCALIZAR EN RADAR
                                    </button>
                                </footer>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Galeria;