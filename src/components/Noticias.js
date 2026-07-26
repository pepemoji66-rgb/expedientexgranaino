import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Forms from './Forms';
import { useLanguage } from '../context/LanguageContext';
import BuscadorAZ, { filtrarItemsBunker } from './BuscadorAZ';
import { renderizarTextoConMedios } from '../utils/renderMedios';
import './noticias.css';
import API_BASE_URL from '../config';
import NoticiasExternas from './NoticiasExternas';
import Paginacion, { getPaginaGuardada } from './Paginacion';

const buildAmazonMaps = (todos) => {
    const keys = new Set();
    const links = new Map();
    
    if (Array.isArray(todos)) {
        todos.forEach(item => {
            const k = item.item_key;
            if (!k) return;
            
            const link = item.enlace_amazon || item.banner?.link || item.bibliografia?.[0]?.link;
            if (!link) return;
            
            keys.add(k);
            links.set(k, link);
            
            const id = k.split('-')[1];
            if (id) {
                if (k.startsWith('misterio') || k.startsWith('misterios_historicos')) {
                    keys.add(`misterio-${id}`);
                    keys.add(`misterios_historicos-${id}`);
                    links.set(`misterio-${id}`, link);
                    links.set(`misterios_historicos-${id}`, link);
                } else if (k.startsWith('caso') || k.startsWith('casos_abiertos')) {
                    keys.add(`caso-${id}`);
                    keys.add(`casos_abiertos-${id}`);
                    links.set(`caso-${id}`, link);
                    links.set(`casos_abiertos-${id}`, link);
                } else if (k.startsWith('exp') || k.startsWith('expedientes')) {
                    keys.add(`exp-${id}`);
                    keys.add(`expedientes-${id}`);
                    links.set(`exp-${id}`, link);
                    links.set(`expedientes-${id}`, link);
                } else if (k.startsWith('noticia') || k.startsWith('noticias')) {
                    keys.add(`noticia-${id}`);
                    keys.add(`noticias-${id}`);
                    links.set(`noticia-${id}`, link);
                    links.set(`noticias-${id}`, link);
                }
            }
        });
    }
    return { keys, links };
};

const Noticias = ({ userAuth }) => {
    const { t, forceTranslationUpdate, language } = useLanguage();
    // --- CONFIGURACIÓN DE SEÑAL MAESTRA ---

    const [noticias, setNoticias] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [letraSeleccionada, setLetraSeleccionada] = useState('TODOS');
    const [cargando, setCargando] = useState(true);
    const [noticiaSeleccionada, setNoticiaSeleccionada] = useState(null);
    const [amazonKeys, setAmazonKeys] = useState(new Set());
    const [amazonLinks, setAmazonLinks] = useState(new Map());
    const navigate = useNavigate();

    // --- LÓGICA DE PAGINACIÓN ---
    const [paginaActual, setPaginaActual] = useState(() => getPaginaGuardada('page_noticias'));
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
            titulo: "MUFON",
            url: "https://mufon.com/",
            desc: "Mutual UFO Network, la organización civil más antigua dedicada al reporte científico de OVNIs.",
            color: "#00d4ff"
        },
        {
            titulo: "GEIPAN (FRANCIA)",
            url: "http://www.geipan.fr/",
            desc: "Grupo de la Agencia Espacial Francesa (CNES) encargado del estudio de fenómenos aeroespaciales no identificados.",
            color: "#ff9900"
        }
    ];

    // Redirección directa al artículo si hay un ID en la URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const noticiaId = urlParams.get('id');
        if (noticiaId) {
            navigate(`/leer-historia/${noticiaId}?src=noticias`, { replace: true });
        }
    }, [navigate]);

    const obtenerNoticias = useCallback(async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/galeria/noticias-publicas`);
            if (res.data) setNoticias(res.data);
        } catch (err) {
            console.error("Error al obtener noticias:", err);
        } finally {
            setCargando(false);
            if (forceTranslationUpdate) forceTranslationUpdate();
        }
    }, [API_BASE_URL, forceTranslationUpdate]);

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, letraSeleccionada]);

    useEffect(() => {
        obtenerNoticias();

        // Cargar claves y enlaces de Amazon
        axios.get(`${API_BASE_URL}/api/amazon/todos`).then(res => {
            const { keys, links } = buildAmazonMaps(res.data);
            setAmazonKeys(keys);
            setAmazonLinks(links);
        }).catch(() => {});
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

    // --- CÁLCULOS DE FILTRADO Y PAGINACIÓN ---
    const noticiasFiltradas = filtrarItemsBunker(noticias, busqueda, letraSeleccionada);
    const indiceUltimoItem = paginaActual * noticiasPorPagina;
    const indicePrimerItem = indiceUltimoItem - noticiasPorPagina;

    const noticiasPaginadas = Array.isArray(noticiasFiltradas) ? noticiasFiltradas.slice(indicePrimerItem, indiceUltimoItem) : [];
    const totalPaginas = Array.isArray(noticiasFiltradas) ? Math.ceil(noticiasFiltradas.length / noticiasPorPagina) : 0;

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

            {/* BUSCADOR Y ÍNDICE A-Z TÁCTICO */}
            <BuscadorAZ 
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                letraSeleccionada={letraSeleccionada}
                onLetraChange={setLetraSeleccionada}
                totalResultados={noticiasFiltradas.length}
                placeholder="Buscar noticias por alerta, titular, ubicación..."
            />

            <div className="noticias-grid">
                {Array.isArray(noticiasPaginadas) && noticiasPaginadas.length > 0 ? (
                    noticiasPaginadas.map((item) => (
                        <div key={item.id} className="card-noticia fade-in" onClick={() => navigate(`/leer-historia/${item.id}?src=noticias`)}>
                            <div className="noticia-img-container" style={{ position: 'relative' }}>
                                <img
                                    src={getUrlImagen(item.imagen_url)}
                                    alt={item.titulo}
                                    className="noticia-miniatura"
                                    onError={(e) => { e.target.src = `https://placehold.co/400x250/000/00ff41?text=${t('newsNoImage')}`; }}
                                />
                                
                                {/* BADGE AMAZON */}
                                {(amazonKeys.has(`noticia-${item.id}`) || amazonKeys.has(`noticias-${item.id}`)) && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const link = amazonLinks.get(`noticia-${item.id}`) || amazonLinks.get(`noticias-${item.id}`);
                                            if (link) window.open(link, '_blank');
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '10px',
                                            left: '10px',
                                            background: 'linear-gradient(135deg,#ff9900,#e47911)',
                                            color: '#111',
                                            fontWeight: '900',
                                            fontSize: '0.65rem',
                                            fontFamily: 'monospace',
                                            letterSpacing: '0.5px',
                                            padding: '4px 8px',
                                            borderRadius: '3px',
                                            boxShadow: '0 0 10px rgba(255,153,0,0.8)',
                                            zIndex: 10,
                                            textTransform: 'uppercase',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        📚 RECOMENDADO
                                    </button>
                                )}
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

            <Paginacion paginaActual={paginaActual} totalPaginas={totalPaginas} onChange={setPaginaActual} storageKey="page_noticias" />

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
