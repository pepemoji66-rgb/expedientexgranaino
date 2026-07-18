import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import BuscadorAZ, { filtrarItemsBunker } from './BuscadorAZ';
import AdSlot from './AdSlot';
import './misterioshistoricos.css';
import API_BASE_URL from '../config';

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

const MisteriosHistoricos = () => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [misterios, setMisterios] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [letraSeleccionada, setLetraSeleccionada] = useState('TODOS');
    const [paginaActual, setPaginaActual] = useState(1);
    const [amazonKeys, setAmazonKeys] = useState(new Set());
    const [amazonLinks, setAmazonLinks] = useState(new Map());
    const misteriosPorPagina = 9;

    useEffect(() => {
        setPaginaActual(1);
    }, [busqueda, letraSeleccionada]);

    useEffect(() => {
        cargarMisterios();

        // Cargar claves y enlaces de Amazon
        axios.get(`${API_BASE_URL}/api/amazon/todos`).then(res => {
            const { keys, links } = buildAmazonMaps(res.data);
            setAmazonKeys(keys);
            setAmazonLinks(links);
        }).catch(() => {});
    }, []);

    const cargarMisterios = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/misterios-historicos`);
            if (Array.isArray(res.data)) {
                setMisterios(res.data);
            }
        } catch (err) {
            console.error("❌ Error al cargar Misterios Históricos:", err);
        }
    };

    // Filtrado por palabra clave e índice A-Z + Paginación
    const misteriosFiltrados = filtrarItemsBunker(misterios, busqueda, letraSeleccionada);
    const indiceUltimo = paginaActual * misteriosPorPagina;
    const indicePrimero = indiceUltimo - misteriosPorPagina;
    const misteriosPaginados = misteriosFiltrados.slice(indicePrimero, indiceUltimo);
    const totalPaginas = Math.ceil(misteriosFiltrados.length / misteriosPorPagina);

    return (
        <div className="misterios-container">
            {/* CABECERA TÉCNICA */}
            <div className="header-bunker-alert">
                <div className="alert-badge">// ARCHIVO ENCICLOPÉDICO DE MISTERIOS GLOBAL</div>
                <h1 className="cyber-title-main">{language === 'en' ? 'HISTORICAL MYSTERIES' : 'MISTERIOS HISTÓRICOS'}</h1>
                <p className="cyber-subtitle">
                    {language === 'en' 
                        ? 'Global puzzles, ancient secrets, and unexplained events compiled for deep analysis.' 
                        : 'Enigmas globales, secretos ancestrales y sucesos inexplicables recopilados para análisis profundo.'}
                </p>
            </div>

            {/* BOTONES DE NAVEGACIÓN */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    className="forms-btn-submit btn-volver-misterio"
                    style={{ width: 'auto', background: 'rgba(0,255,65,0.1)', color: 'var(--color-principal)', border: '1px solid var(--color-principal)' }}
                >
                    ⬅ {language === 'en' ? 'BACK' : 'VOLVER'}
                </button>
                <button 
                    onClick={() => navigate('/')} 
                    className="forms-btn-submit btn-volver-misterio"
                    style={{ width: 'auto', background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff', border: '1px solid #00d4ff' }}
                >
                    🏠 {language === 'en' ? 'BUNKER HOME' : 'VOLVER A INICIO'}
                </button>
            </div>

            <AdSlot slotId="misterios-top" />

            {/* BUSCADOR Y ÍNDICE A-Z TÁCTICO */}
            <BuscadorAZ 
                busqueda={busqueda}
                onBusquedaChange={setBusqueda}
                letraSeleccionada={letraSeleccionada}
                onLetraChange={setLetraSeleccionada}
                totalResultados={misteriosFiltrados.length}
                placeholder="Buscar misterios históricos por enigma, título, cultura..."
            />

            {/* GRID DE MISTERIOS */}
            <div className="misterios-grid">
                {misteriosPaginados.length > 0 ? (
                    misteriosPaginados.map(m => {
                        const titulo = language === 'en' && m.titulo_en ? m.titulo_en : m.titulo;
                        const desc = language === 'en' && m.contenido_en ? m.contenido_en : m.contenido;
                        
                        return (
                            <div 
                                key={m.id} 
                                className="misterio-card glass-card"
                                onClick={() => navigate(`/leer-historia/${m.id}?src=misterios`)}
                            >
                                <div className="card-media-wrap" style={{ position: 'relative' }}>
                                    {m.imagen_url ? (
                                        <img 
                                            src={m.imagen_url.startsWith('http') ? m.imagen_url : `${API_BASE_URL}/imagenes/${m.imagen_url}`} 
                                            alt={titulo} 
                                            className="misterio-img"
                                            onError={(e) => { e.target.src = "https://placehold.co/400x250/000/00ff41?text=ENIGMA"; }}
                                        />
                                    ) : (
                                        <div className="misterio-placeholder-media">
                                            <span>👁️ ENIGMA</span>
                                        </div>
                                    )}
                                    <div className="misterio-badge-tag">ENIGMA</div>
                                    
                                    {/* BADGE AMAZON */}
                                    {(amazonKeys.has(`misterio-${m.id}`) || amazonKeys.has(`misterios_historicos-${m.id}`)) && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const link = amazonLinks.get(`misterio-${m.id}`) || amazonLinks.get(`misterios_historicos-${m.id}`);
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
                                            📚 {language === 'en' ? 'AMAZON BOOK' : 'LIBRO RECOMENDADO'}
                                        </button>
                                    )}
                                </div>
                                <div className="card-body-wrap">
                                    <h3>{titulo?.toUpperCase()}</h3>
                                    <p className="snippet">
                                        {desc ? desc.replace(/<[^>]+>/g, '').substring(0, 150) + '...' : ''}
                                    </p>
                                    <div className="card-footer-misterio">
                                        <span>📍 {m.latitud && m.latitud !== 0 ? 'GEOLOCALIZADO' : 'GLOBAL'}</span>
                                        <span>📅 {new Date(m.fecha).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-misterios">
                        <span className="scanner-line"></span>
                        <p>{language === 'en' ? 'Accessing secure archive servers...' : 'Accediendo a servidores de archivo seguro...'}</p>
                    </div>
                )}
            </div>

            {/* PAGINACIÓN */}
            {totalPaginas > 1 && (
                <div className="paginacion-admin" style={{ marginTop: '30px' }}>
                    <button disabled={paginaActual === 1} onClick={() => setPaginaActual(p => p - 1)}>
                        {language === 'en' ? 'BACK' : 'ATRÁS'}
                    </button>
                    <span>{language === 'en' ? `PAGE ${paginaActual} / ${totalPaginas}` : `PÁG ${paginaActual} / ${totalPaginas}`}</span>
                    <button disabled={paginaActual === totalPaginas} onClick={() => setPaginaActual(p => p + 1)}>
                        {language === 'en' ? 'NEXT' : 'SIGUIENTE'}
                    </button>
                </div>
            )}

            <AdSlot slotId="misterios-bottom" />
        </div>
    );
};

export default MisteriosHistoricos;
