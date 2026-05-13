import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import './noticias_externas.css';

const NoticiasExternas = () => {
    const [noticias, setNoticias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(false);
    const [categoriaFiltro, setCategoriaFiltro] = useState('TODAS');
    const [expandidas, setExpandidas] = useState({});

    useEffect(() => {
        const obtenerNoticias = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/api/noticias-externas`);
                setNoticias(Array.isArray(res.data) ? res.data : []);
            } catch (err) {
                console.error("❌ Error en radar externo:", err);
                setError(true);
            } finally {
                setCargando(false);
            }
        };
        obtenerNoticias();
    }, []);

    const toggleExpand = (index) => {
        setExpandidas(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const categorias = ['TODAS', ...new Set(noticias.map(n => n.categoria))];
    
    const noticiasFiltradas = categoriaFiltro === 'TODAS' 
        ? noticias 
        : noticias.filter(n => n.categoria === categoriaFiltro);

    const formatearFecha = (fechaStr) => {
        try {
            const fecha = new Date(fechaStr);
            const ahora = new Date();
            const diff = ahora - fecha;
            const horas = Math.floor(diff / (1000 * 60 * 60));
            
            if (horas < 1) return 'Hace menos de 1 hora';
            if (horas < 24) return `Hace ${horas}h`;
            if (horas < 48) return 'Ayer';
            return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
        } catch {
            return '';
        }
    };

    if (cargando) return (
        <div className="radar-externo-widget cargando">
            <div className="radar-ext-loader"></div>
            <span>Escaneando frecuencias internacionales...</span>
        </div>
    );

    if (error || noticias.length === 0) return null;

    return (
        <div className="radar-externo-widget">
            <div className="radar-ext-header">
                <div className="radar-ext-badge">
                    <span className="radar-ext-pulse">📡</span>
                    <span className="radar-ext-label">RADAR DE INTELIGENCIA EXTERNA</span>
                </div>
                <span className="radar-ext-count">{noticias.length} señales</span>
            </div>

            {/* FILTROS POR CATEGORÍA */}
            <div className="radar-ext-filtros">
                {categorias.map(cat => (
                    <button 
                        key={cat}
                        className={`filtro-btn ${categoriaFiltro === cat ? 'activo' : ''}`}
                        onClick={() => setCategoriaFiltro(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* GRID DE NOTICIAS */}
            <div className="radar-ext-grid">
                {noticiasFiltradas.slice(0, 12).map((noticia, idx) => (
                    <div key={idx} className="card-ext-noticia">
                        <div className="card-ext-top">
                            <span className="card-ext-fuente">
                                {noticia.icono} {noticia.fuente}
                            </span>
                            <span className="card-ext-tiempo">
                                {formatearFecha(noticia.fecha_publicacion)}
                            </span>
                        </div>
                        
                        <h4 className="card-ext-titulo">{noticia.titulo}</h4>
                        
                        {expandidas[idx] && noticia.resumen && (
                            <p className="card-ext-resumen">{noticia.resumen}</p>
                        )}
                        
                        <div className="card-ext-acciones">
                            {noticia.resumen && (
                                <button 
                                    className="btn-ext-toggle"
                                    onClick={() => toggleExpand(idx)}
                                >
                                    {expandidas[idx] ? '[-]' : '[+]'}
                                </button>
                            )}
                            <a 
                                href={noticia.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn-ext-leer"
                            >
                                LEER FUENTE ➔
                            </a>
                        </div>
                        
                        <div className="card-ext-categoria">
                            <span className={`tag-cat tag-${noticia.categoria?.toLowerCase()}`}>
                                {noticia.categoria}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="radar-ext-footer">
                <div className="radar-ext-scanner"></div>
                <small>FUENTES: MUFON • THE DEBRIEF • SCIENCE ALERT • COAST TO COAST • SPACE.COM</small>
            </div>
        </div>
    );
};

export default NoticiasExternas;
