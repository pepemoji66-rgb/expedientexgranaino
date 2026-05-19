import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Forms from './Forms';
import { useLanguage } from '../context/LanguageContext';
import { renderizarTextoConMedios } from '../utils/renderMedios';
import './noticias.css';
import API_BASE_URL from '../config';
import NoticiasExternas from './NoticiasExternas';

const Noticias = ({ userAuth }) => {
    const { t } = useLanguage();
    // --- CONFIGURACIÓN DE SEÑAL MAESTRA ---

    const [noticias, setNoticias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
    const navigate = useNavigate();

    // --- LÓGICA DE PAGINACIÓN ---
    const [paginaActual, setPaginaActual] = useState(1);
    const noticiasPorPagina = 12;

    const [nuevaNoticia, setNuevaNoticia] = useState({
        titulo: '',
        cuerpo: '',
        nivel_alerta: 'Bajo',
        ubicacion: '',
        latitud: null,
        longitud: null,
        fuente_url: ''
    });

    const [imagen, setImagen] = useState(null);
    const [buscandoLoc, setBuscandoLoc] = useState(false);

    // --- INTELIGENCIA EXTERNA (LINKS RECOMENDADOS) ---
    const inteligenciaExterna = [
        {
            titulo: "AARO (PENTÁGONO)",
            url: "https://www.aaro.mil/",
            desc: "Oficina oficial del Departamento de Defensa de EE.UU. para la desclasificación de FANI/UAP.",
            color: "#00ff41"
        },
        {
            titulo: "IKER JIMÉNEZ (OFICIAL)",
            url: "https://www.ikerjimenez.com/",
            desc: "El portal de referencia del misterio en España y Cuarto Milenio.",
            color: "#00d4ff"
        },
        {
            titulo: "ESPACIO EN BLANCO (RTVE)",
            url: "https://www.rtve.es/play/audios/espacio-en-blanco/",
            desc: "Mítico programa de radio sobre enigmas y otras realidades.",
            color: "#ffb100"
        },
        {
            titulo: "EL COLEGIO INVISIBLE",
            url: "https://www.ondacero.es/programas/colegio-invisible/",
            desc: "Investigaciones periodísticas sobre lo inexplicable.",
            color: "#ff4444"
        }
    ];

    const obtenerNoticias = useCallback(async () => {
        try {
            setCargando(true);
            // Sintonizamos la frecuencia de noticias públicas aprobadas
            const res = await axios.get(`${API_BASE_URL}/api/galeria/noticias-publicas`);
            setNoticias(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error("❌ ERROR AL CARGAR TELETIPO:", err);
            setNoticias([]);
        } finally {
            setCargando(false);
        }
    }, [API_BASE_URL]);

    useEffect(() => {
        obtenerNoticias();
    }, [obtenerNoticias]);

    // --- LÓGICA DE BÚSQUEDA DE SATÉLITE (GEOLOCALIZACIÓN) ---
    const buscarDireccion = async (texto) => {
        setNuevaNoticia(prev => ({ ...prev, ubicacion: texto }));

        if (texto.length > 5) {
            setBuscandoLoc(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(texto + ", Granada")}&limit=1`,
                    { headers: { 'User-Agent': 'ExpedienteX_Bunker_Granada' } }
                );
                const data = await response.json();
                if (data && data.length > 0) {
                    setNuevaNoticia(prev => ({
                        ...prev,
                        latitud: parseFloat(data[0].lat),
                        longitud: parseFloat(data[0].lon)
                    }));
                    console.log("📍 COORDENADAS FIJADAS POR SATÉLITE");
                }
            } catch (error) {
                console.warn("⚠️ Fallo en el satélite Nominatim:", error);
            } finally {
                setBuscandoLoc(false);
            }
        }
    };

    const enviarPropuesta = async (e) => {
        if (e) e.preventDefault();

        const formData = new FormData();
        formData.append('titulo', nuevaNoticia.titulo);
        formData.append('cuerpo', nuevaNoticia.cuerpo);
        formData.append('nivel_alerta', nuevaNoticia.nivel_alerta);
        formData.append('ubicacion', nuevaNoticia.ubicacion);
        formData.append('latitud', nuevaNoticia.latitud || '');
        formData.append('longitud', nuevaNoticia.longitud || '');
        formData.append('agente', userAuth?.nombre || 'Anónimo');
        formData.append('fuente_url', nuevaNoticia.fuente_url || '');
        if (imagen) formData.append('imagen', imagen);

        try {
            // Enviamos propuesta al búnker (Sector Galería)
            await axios.post(`${API_BASE_URL}/api/galeria/proponer-noticia`, formData);
            alert(t('newsReportSent'));
            setNuevaNoticia({ titulo: '', cuerpo: '', nivel_alerta: 'Bajo', ubicacion: '', latitud: null, longitud: null, fuente_url: '' });
            setImagen(null);
            obtenerNoticias();
        } catch (err) {
            alert(t('newsError'));
        }
    };

    // --- CÁLCULOS DE PAGINACIÓN ---
    const indiceUltimoItem = paginaActual * noticiasPorPagina;
    const indicePrimerItem = indiceUltimoItem - noticiasPorPagina;

    const noticiasPaginadas = Array.isArray(noticias) ? noticias.slice(indicePrimerItem, indiceUltimoItem) : [];
    const totalPaginas = Array.isArray(noticias) ? Math.ceil(noticias.length / noticiasPorPagina) : 0;

    // Función para limpiar la ruta de la imagen
    const getUrlImagen = (imgRaw) => {
        if (!imgRaw) return "/img-default.jpg";
        if (imgRaw.startsWith('http')) return imgRaw;
        const nombreArchivo = imgRaw.split('/').pop();
        return `${API_BASE_URL}/imagenes/${nombreArchivo}`;
    };

    if (cargando) return (
        <div className="cargando-bunker">
            <div className="radar-loader"></div>
            <p>{t('newsSystemScanning')}</p>
        </div>
    );

    return (
        <section className="noticias-page">
            <header className="header-noticias">
                <h1 className="titulo-noticias">{t('newsGlobalAlerts')}</h1>
                <div className="linea-decorativa"></div>
            </header>

            <div className="noticias-grid">
                {Array.isArray(noticiasPaginadas) && noticiasPaginadas.length > 0 ? (
                    noticiasPaginadas.map((item) => (
                        <div key={item.id} className="card-noticia fade-in" onClick={() => navigate(`/leer-historia/${item.id}`)}>
                            <div className="noticia-img-container">
                                <img
                                    src={getUrlImagen(item.imagen_url)}
                                    alt={item.titulo}
                                    className="noticia-miniatura"
                                    onError={(e) => { e.target.src = `https://placehold.co/400x250/000/00ff41?text=${t('newsNoImage')}`; }}
                                />
                            </div>
                            <div className="noticia-contenido">
                                <div className="noticia-meta">
                                    <span className={`noticia-alerta alerta-${item.nivel_alerta?.toLowerCase()}`}>
                                        {item.nivel_alerta?.toUpperCase() || 'BAJO'}
                                    </span>
                                </div>
                                <h3 className="noticia-titulo">{item.titulo}</h3>
                                <div className="noticia-footer">📍 {item.ubicacion}</div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-noticias-bunker">
                        <div className="radar-buscando"></div>
                        <p>{t('newsNoAlerts')}</p>
                    </div>
                )}
            </div>

            {totalPaginas > 1 && (
                <div className="paginacion-bunker">
                    <button disabled={paginaActual === 1} onClick={() => { setPaginaActual(paginaActual - 1); window.scrollTo(0, 0); }}>{t('newsPrev')}</button>
                    <span className="pagi-info">{paginaActual} / {totalPaginas}</span>
                    <button disabled={paginaActual === totalPaginas} onClick={() => { setPaginaActual(paginaActual + 1); window.scrollTo(0, 0); }}>{t('newsNext')}</button>
                </div>
            )}

            {/* SECCIÓN DE INTELIGENCIA EXTERNA (PARA QUE NO SE VEA SOLO) */}
            <div className="inteligencia-externa-container">
                <h2 className="titulo-seccion-secundaria">{t('newsExternalIntel')}</h2>
                <div className="grid-inteligencia">
                    {inteligenciaExterna.map((link, idx) => (
                        <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" className="card-externa" style={{ borderColor: link.color }}>
                            <h4 style={{ color: link.color }}>{link.label || link.titulo}</h4>
                            <p>{link.desc}</p>
                            <span className="link-arrow" style={{ color: link.color }}>{t('newsAccess')} ➔</span>
                        </a>
                    ))}
                </div>
            </div>

            {/* FEED RSS EN VIVO - NOTICIAS EXTERNAS */}
            <NoticiasExternas />



            {userAuth && (
                <div className="contenedor-form-noticia">
                    <Forms title={t('reportEvidence')} onSubmit={enviarPropuesta} onClear={() => { }}>
                        <input type="text" placeholder={t('newsTitle')} value={nuevaNoticia.titulo} onChange={e => setNuevaNoticia({ ...nuevaNoticia, titulo: e.target.value })} required />
                        <div className="form-grupo-tactico">
                            <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem' }}>{t('newsLocation')}</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    placeholder={t('newsLocationPlaceholder')}
                                    value={nuevaNoticia.ubicacion}
                                    onChange={e => setNuevaNoticia({ ...nuevaNoticia, ubicacion: e.target.value })}
                                    required
                                />
                                <button type="button" onClick={() => buscarDireccion(nuevaNoticia.ubicacion)} style={{ background: 'var(--color-principal)', color: '#000', border: 'none', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold' }}>
                                    {buscandoLoc ? '...' : t('newsSearch')}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                            <div>
                                <label style={{ color: 'var(--color-principal)', fontSize: '0.6rem' }}>{t('latLong')}</label>
                                <input type="number" step="any" value={nuevaNoticia.latitud || ''} onChange={e => setNuevaNoticia({ ...nuevaNoticia, latitud: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ color: 'var(--color-principal)', fontSize: '0.6rem' }}>{t('latLong')}</label>
                                <input type="number" step="any" value={nuevaNoticia.longitud || ''} onChange={e => setNuevaNoticia({ ...nuevaNoticia, longitud: e.target.value })} />
                            </div>
                        </div>

                        <div style={{ marginTop: '15px' }}>
                            <label style={{ color: '#00d4ff', fontSize: '0.7rem' }}>{t('newsSource')}</label>
                            <input
                                type="url"
                                placeholder="https://www.nasa.gov/..."
                                value={nuevaNoticia.fuente_url || ''}
                                onChange={e => setNuevaNoticia({ ...nuevaNoticia, fuente_url: e.target.value })}
                                style={{ border: '1px solid #00d4ff' }}
                            />
                        </div>

                        <div style={{ marginTop: '15px' }}>
                            <label className="label-file">{t('newsVisual')}</label>
                            <input type="file" onChange={e => setImagen(e.target.files[0])} />
                        </div>

                        <div style={{ marginTop: '15px' }}>
                            <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem', display: 'block', marginBottom: '5px' }}>{t('newsLevel')}</label>
                            <select value={nuevaNoticia.nivel_alerta} onChange={e => setNuevaNoticia({ ...nuevaNoticia, nivel_alerta: e.target.value })}>
                                <option value="Bajo">Nivel: {t('newsLevelLow').toUpperCase()}</option>
                                <option value="Medio">Nivel: {t('newsLevelMed').toUpperCase()}</option>
                                <option value="Alto">Nivel: {t('newsLevelHigh').toUpperCase()}</option>
                                <option value="CRÍTICO">Nivel: {t('newsLevelCrit').toUpperCase()}</option>
                            </select>
                        </div>

                        <textarea placeholder={t('newsDesc')} value={nuevaNoticia.cuerpo} onChange={e => setNuevaNoticia({ ...nuevaNoticia, cuerpo: e.target.value })} required style={{ marginTop: '15px' }} />
                    </Forms>
                </div>
            )}


        </section>
    );
};

export default Noticias;
