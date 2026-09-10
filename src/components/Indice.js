import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import FiltrosTematicos from './FiltrosTematicos';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../config';
import './Indice.css';

const Indice = ({ userAuth, stats, setTema, tema }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();

    // 8 artículos más recientes unificados
    const [ultimosArticulos, setUltimosArticulos] = useState([]);
    const [comentariosRecientes, setComentariosRecientes] = useState([]);
    const [loadingContent, setLoadingContent] = useState(true);
    const [filtroTematico, setFiltroTematico] = useState('todos');

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setLoadingContent(true);
                const [resExp, resNot, resCasos, resMisterios, resComs] = await Promise.allSettled([
                    axios.get(`${API_BASE_URL}/api/expedientes/ultimos`),
                    axios.get(`${API_BASE_URL}/api/noticias/ultimas`),
                    axios.get(`${API_BASE_URL}/api/casos`),
                    axios.get(`${API_BASE_URL}/api/misterios-historicos`),
                    axios.get(`${API_BASE_URL}/api/comentarios/recientes`)
                ]);

                let articulosUnificados = [];

                // 1. EXPEDIENTES
                if (resExp.status === 'fulfilled' && Array.isArray(resExp.value.data)) {
                    resExp.value.data.forEach(item => {
                        const img = item.imagen_url 
                            ? (item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`)
                            : null;
                        articulosUnificados.push({
                            id: item.id,
                            titulo: item.titulo || 'Sin título',
                            contenido: item.contenido || item.cuerpo || '',
                            imagen: img,
                            seccion: 'expediente',
                            seccionLabel: 'EXPEDIENTE',
                            seccionColor: '#1e3a2b',
                            fecha: item.fecha,
                            timestamp: new Date(item.fecha || 0).getTime(),
                            autor: item.usuario_nombre || 'José Moreno',
                            link: `/leer-historia/${item.id}?src=expedientes`
                        });
                    });
                }

                // 2. NOTICIAS
                if (resNot.status === 'fulfilled' && Array.isArray(resNot.value.data)) {
                    resNot.value.data.forEach(item => {
                        const img = item.imagen_url 
                            ? (item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url.split('/').pop()}`)
                            : null;
                        articulosUnificados.push({
                            id: item.id,
                            titulo: item.titulo || 'Noticia de última hora',
                            contenido: item.cuerpo || item.contenido || '',
                            imagen: img,
                            seccion: 'noticia',
                            seccionLabel: 'NOTICIA',
                            seccionColor: '#1e293b',
                            fecha: item.fecha,
                            timestamp: new Date(item.fecha || 0).getTime(),
                            autor: 'Redacción',
                            link: `/leer-historia/${item.id}?src=noticias`
                        });
                    });
                }

                // 3. TRUE CRIME (CASOS ABIERTOS)
                if (resCasos.status === 'fulfilled' && Array.isArray(resCasos.value.data)) {
                    resCasos.value.data.forEach(item => {
                        const img = item.imagen_url 
                            ? (item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`)
                            : null;
                        const tit = (language === 'en' && item.titulo_en) ? item.titulo_en : item.titulo;
                        const desc = (language === 'en' && item.contenido_en) ? item.contenido_en : item.contenido;
                        articulosUnificados.push({
                            id: item.id,
                            titulo: tit || 'Caso Abierto',
                            contenido: desc || '',
                            imagen: img,
                            seccion: 'caso',
                            seccionLabel: 'TRUE CRIME',
                            seccionColor: '#b91c1c',
                            fecha: item.fecha,
                            timestamp: new Date(item.fecha || 0).getTime(),
                            autor: 'José Moreno',
                            link: `/leer-historia/${item.id}?src=casos`
                        });
                    });
                }

                // 4. MISTERIOS HISTÓRICOS
                if (resMisterios.status === 'fulfilled' && Array.isArray(resMisterios.value.data)) {
                    resMisterios.value.data.forEach(item => {
                        const img = item.imagen_url 
                            ? (item.imagen_url.startsWith('http') ? item.imagen_url : `${API_BASE_URL}/imagenes/${item.imagen_url}`)
                            : null;
                        const tit = (language === 'en' && item.titulo_en) ? item.titulo_en : item.titulo;
                        const desc = (language === 'en' && item.contenido_en) ? item.contenido_en : item.contenido;
                        articulosUnificados.push({
                            id: item.id,
                            titulo: tit || 'Misterio Histórico',
                            contenido: desc || '',
                            imagen: img,
                            seccion: 'misterio',
                            seccionLabel: 'MISTERIOS HISTÓRICOS',
                            seccionColor: '#9a3412',
                            fecha: item.fecha,
                            timestamp: new Date(item.fecha || 0).getTime(),
                            autor: 'José Moreno',
                            link: `/leer-historia/${item.id}?src=misterios`
                        });
                    });
                }

                // Ordenar por fecha cronológica descendente (los más recientes primero)
                articulosUnificados.sort((a, b) => b.timestamp - a.timestamp);

                // Tomar los 8 más recientes para la portada principal
                setUltimosArticulos(articulosUnificados.slice(0, 8));

                if (resComs.status === 'fulfilled' && Array.isArray(resComs.value.data)) {
                    setComentariosRecientes(resComs.value.data.slice(0, 4));
                }
            } catch (err) {
                console.error("Error loading home page content:", err);
            } finally {
                setLoadingContent(false);
            }
        };
        fetchHomeData();
    }, [language]);

    // Filtrar si el usuario pulsa algún filtro temático
    const articulosAMostrar = filtroTematico === 'todos'
        ? ultimosArticulos
        : filtroTematico === 'ovnis'
            ? ultimosArticulos.filter(a => a.seccion === 'expediente')
            : filtroTematico === 'noticias'
                ? ultimosArticulos.filter(a => a.seccion === 'noticia')
                : filtroTematico === 'cronica_negra'
                    ? ultimosArticulos.filter(a => a.seccion === 'caso')
                    : filtroTematico === 'misterios'
                        ? ultimosArticulos.filter(a => a.seccion === 'misterio')
                        : ultimosArticulos;

    const articuloPrincipal = articulosAMostrar.length > 0 ? articulosAMostrar[0] : null;
    const articulosSecundarios = articulosAMostrar.length > 1 ? articulosAMostrar.slice(1, 8) : [];

    const limpiarSnippet = (texto, maxLen = 140) => {
        if (!texto) return '';
        const sinHtml = texto.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ');
        if (sinHtml.length <= maxLen) return sinHtml;
        return sinHtml.substring(0, maxLen).trim() + '...';
    };

    return (
        <div className="indice-editorial-container">
            {/* BARRA DE FILTROS TEMÁTICOS EDITORIAL (ARRIBA DEL TODO) */}
            <FiltrosTematicos filtroActivo={filtroTematico} onFiltroChange={setFiltroTematico} />

            {/* BARRA DE FECHA Y EDICIÓN */}
            <div className="editorial-edition-bar">
                <span className="editorial-edition-date">
                    {new Date().toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long', 
                        year: 'numeric' 
                    }).toUpperCase()}
                </span>
                <span className="editorial-edition-tag">
                    {language === 'en' ? 'EDITION ARCHIVE · UNEXPLAINED DOSSIERS' : 'EDICIÓN DIGITAL · ARCHIVO DEL MISTERIO'}
                </span>
            </div>

            {/* SECCIÓN PRINCIPAL DE PORTADA (8 ARTÍCULOS) */}
            <section className="editorial-frontpage">
                <div className="editorial-section-header">
                    <h2 className="editorial-section-title">
                        {language === 'en' ? 'LATEST EDITIONS' : 'ÚLTIMAS PUBLICACIONES'}
                    </h2>
                    <span className="editorial-section-subtitle">
                        {language === 'en' ? 'The 8 most recent investigations and chronicles' : 'Los 8 artículos más recientes del archivo'}
                    </span>
                </div>

                {loadingContent ? (
                    <div className="editorial-loading">
                        <p>{language === 'en' ? 'Loading latest investigations...' : 'Cargando las últimas publicaciones...'}</p>
                    </div>
                ) : articulosAMostrar.length === 0 ? (
                    <div className="editorial-empty">
                        <p>{language === 'en' ? 'No articles found in this category.' : 'No se han encontrado publicaciones en esta sección.'}</p>
                    </div>
                ) : (
                    <>
                        {/* ARTÍCULO PRINCIPAL (#1 DE 8 - FORMATO GRAN TITULAR) */}
                        {articuloPrincipal && (
                            <article 
                                className="editorial-lead-story" 
                                onClick={() => navigate(articuloPrincipal.link)}
                            >
                                <div className="lead-story-image-wrap">
                                    {articuloPrincipal.imagen ? (
                                        <img 
                                            src={articuloPrincipal.imagen} 
                                            alt={articuloPrincipal.titulo} 
                                            loading="eager"
                                        />
                                    ) : (
                                        <div className="lead-story-placeholder">
                                            <span>DOCUMENTACIÓN FOTOGRÁFICA</span>
                                        </div>
                                    )}
                                    <span 
                                        className="lead-story-badge"
                                        style={{ backgroundColor: articuloPrincipal.seccionColor }}
                                    >
                                        {articuloPrincipal.seccionLabel}
                                    </span>
                                </div>

                                <div className="lead-story-content">
                                    <span className="lead-story-kicker">
                                        {articuloPrincipal.seccionLabel} · REPORTAJE PRINCIPAL
                                    </span>
                                    <h3 className="lead-story-title">
                                        {articuloPrincipal.titulo}
                                    </h3>
                                    <p className="lead-story-excerpt">
                                        {limpiarSnippet(articuloPrincipal.contenido, 260)}
                                    </p>
                                    <div className="lead-story-meta">
                                        <span className="lead-story-author">Por {articuloPrincipal.autor}</span>
                                        <span className="lead-story-divider">·</span>
                                        <span className="lead-story-date">
                                            {articuloPrincipal.fecha ? new Date(articuloPrincipal.fecha).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                                        </span>
                                    </div>
                                    <div className="lead-story-cta">
                                        <span className="btn-read-lead">
                                            {language === 'en' ? 'READ FULL DOSSIER' : 'LEER ARTÍCULO COMPLETO'} →
                                        </span>
                                    </div>
                                </div>
                            </article>
                        )}

                        {/* ARTÍCULOS SECUNDARIOS (#2 A #8 - GRID EDITORIAL DE 3 COLUMNAS) */}
                        {articulosSecundarios.length > 0 && (
                            <div className="editorial-articles-grid">
                                {articulosSecundarios.map((art) => (
                                    <article 
                                        key={`${art.seccion}-${art.id}`} 
                                        className="editorial-card"
                                        onClick={() => navigate(art.link)}
                                    >
                                        <div className="editorial-card-image-wrap">
                                            {art.imagen ? (
                                                <img 
                                                    src={art.imagen} 
                                                    alt={art.titulo} 
                                                    loading="lazy" 
                                                />
                                            ) : (
                                                <div className="editorial-card-placeholder">
                                                    <span>{art.seccionLabel}</span>
                                                </div>
                                            )}
                                            <span 
                                                className="editorial-card-badge"
                                                style={{ backgroundColor: art.seccionColor }}
                                            >
                                                {art.seccionLabel}
                                            </span>
                                        </div>

                                        <div className="editorial-card-body">
                                            <h4 className="editorial-card-title">
                                                {art.titulo}
                                            </h4>
                                            <p className="editorial-card-excerpt">
                                                {limpiarSnippet(art.contenido, 110)}
                                            </p>
                                            <div className="editorial-card-meta">
                                                <span className="editorial-card-author">{art.autor}</span>
                                                <span className="editorial-card-divider">·</span>
                                                <span className="editorial-card-date">
                                                    {art.fecha ? new Date(art.fecha).toLocaleDateString(language === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short' }) : ''}
                                                </span>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* SECCIÓN: NOTAS Y TRANSMISIONES RECIENTES DE LECTORES */}
            {comentariosRecientes.length > 0 && (
                <section className="editorial-transmissions-section">
                    <div className="editorial-section-header">
                        <h3 className="editorial-section-title">
                            {language === 'en' ? 'READERS & AGENTS TRANSMISSIONS' : 'TRANSMISIONES Y COMENTARIOS DE LECTORES'}
                        </h3>
                    </div>

                    <div className="editorial-comments-grid">
                        {comentariosRecientes.map((c) => {
                            const parts = (c.item_key || '').split('-');
                            const tipo = parts[0];
                            const id = parts[1];
                            const srcParam = tipo === 'exp' ? 'expedientes' : tipo === 'caso' ? 'casos' : tipo === 'misterio' ? 'misterios' : 'noticias';
                            const linkUrl = `/leer-historia/${id}?src=${srcParam}`;

                            return (
                                <div 
                                    key={c.id} 
                                    className="editorial-comment-card"
                                    onClick={() => navigate(linkUrl)}
                                >
                                    <div className="comment-card-header">
                                        <span className="comment-author">
                                            {c.agente ? c.agente.toUpperCase() : 'LECTOR'}
                                        </span>
                                        <span className="comment-date">
                                            {new Date(c.fecha).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <p className="comment-text">"{c.mensaje}"</p>
                                    <div className="comment-target">
                                        <span>En: </span>
                                        <span className="comment-target-title">
                                            {c.titulo_articulo || 'Ver expediente'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* TARJETA EDITORIAL DEL FUNDADOR */}
            <section className="editorial-author-block">
                <div className="author-block-avatar">
                    <img 
                        src="/jose-moreno-investigador.jpg" 
                        alt="José Moreno Jiménez" 
                    />
                </div>
                <div className="author-block-info">
                    <span className="author-block-role">
                        {language === 'en' ? 'CREATOR & WEB DEVELOPER' : 'CREADOR Y DESARROLLADOR DE LA PLATAFORMA'}
                    </span>
                    <h4 className="author-block-name">José Moreno Jiménez</h4>
                    <p className="author-block-bio">
                        {language === 'en' 
                            ? 'Specialist in ufology, historical anomalies, and unsolved criminal cases in southern Spain. Directing the independent documentary archive Expediente X Granaíno.' 
                            : 'Especialista en ufología, anomalías históricas y casos sin resolver en el sur de España. Creador y gestor del archivo documental independiente Expediente X Granaíno.'}
                    </p>
                    <Link to="/sobre-nosotros" className="author-block-link">
                        {language === 'en' ? 'Read full author dossier →' : 'Conocer más sobre el proyecto y trayectoria →'}
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default Indice;