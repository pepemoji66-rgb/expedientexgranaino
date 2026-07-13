import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import NoticiasExternas from './NoticiasExternas';
import { useLanguage } from '../context/LanguageContext';
import { API_BASE_URL } from '../config';
import './Indice.css';

const Indice = ({ userAuth, stats, setTema }) => {
    const { t, language } = useLanguage();
    const navigate = useNavigate();
    const [showDossier, setShowDossier] = useState(false);

    // Estados para previsualización de contenidos ("Chicha")
    const [recentExpedientes, setRecentExpedientes] = useState([]);
    const [recentNoticias, setRecentNoticias] = useState([]);
    const [recentCasos, setRecentCasos] = useState([]);
    const [recentVideos, setRecentVideos] = useState([]);
    const [recentMisterios, setRecentMisterios] = useState([]);
    const [comentariosRecientes, setComentariosRecientes] = useState([]);
    const [loadingContent, setLoadingContent] = useState(true);

    const coloresDisponibles = [
        { hex: '#00d4ff', label: 'CIAN' },
        { hex: '#00ff41', label: 'VERDE' },
        { hex: '#ff4444', label: 'ROJO' },
        { hex: '#ffb100', label: 'ORO' },
        { hex: '#ff00ff', label: 'ACENTO' }
    ];

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                setLoadingContent(true);
                const [resExp, resNot, resCasos, resVideos, resMisterios, resComs] = await Promise.allSettled([
                    axios.get(`${API_BASE_URL}/api/expedientes/ultimos`),
                    axios.get(`${API_BASE_URL}/api/noticias/ultimas`),
                    axios.get(`${API_BASE_URL}/api/casos`),
                    axios.get(`${API_BASE_URL}/api/videos/publicos`),
                    axios.get(`${API_BASE_URL}/api/misterios-historicos`),
                    axios.get(`${API_BASE_URL}/api/comentarios/recientes`)
                ]);

                if (resExp.status === 'fulfilled' && Array.isArray(resExp.value.data)) {
                    setRecentExpedientes(resExp.value.data);
                }
                if (resNot.status === 'fulfilled' && Array.isArray(resNot.value.data)) {
                    setRecentNoticias(resNot.value.data);
                }
                if (resCasos.status === 'fulfilled' && Array.isArray(resCasos.value.data)) {
                    setRecentCasos(resCasos.value.data.slice(0, 3));
                }
                if (resVideos.status === 'fulfilled' && Array.isArray(resVideos.value.data)) {
                    setRecentVideos(resVideos.value.data.slice(0, 3));
                }
                if (resMisterios.status === 'fulfilled' && Array.isArray(resMisterios.value.data)) {
                    setRecentMisterios(resMisterios.value.data.slice(0, 3));
                }
                if (resComs.status === 'fulfilled' && Array.isArray(resComs.value.data)) {
                    setComentariosRecientes(resComs.value.data);
                }
            } catch (err) {
                console.error("Error loading home page content:", err);
            } finally {
                setLoadingContent(false);
            }
        };
        fetchHomeData();
    }, []);

    return (
        <div className="indice-container">
            {/* CABECERA TÉCNICA DE MONITORIZACIÓN */}
            <div className="monitoring-header">
                <div className="radar-status-mini">
                    <span className="pulse-dot"></span>
                    {t('systemActive')}
                </div>
                <div className="system-clock">
                    {new Date().toLocaleDateString()} | GMT+1
                </div>
            </div>

            {/* NOTA DE DIRECTIVA DE INVESTIGACIÓN (SEO & UX) */}
            <div className="cases-disclaimer-box">
                <div className="disclaimer-header">
                    <span>{t('casesDisclaimerTitle')}</span>
                </div>
                <div className="disclaimer-body">
                    <p>{t('casesDisclaimerText')}</p>
                </div>
            </div>

            {/* AVISO DE AFILIADOS DE AMAZON */}
            <div className="cases-disclaimer-box amazon-disclosure-box" style={{ 
                marginTop: '15px', 
                border: '1px solid #ff9900', 
                background: 'rgba(255, 153, 0, 0.03)',
                boxShadow: '0 0 10px rgba(255, 153, 0, 0.1)'
            }}>
                <div className="disclaimer-header" style={{ color: '#ff9900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚠️ {language === 'en' ? 'IMPORTANT NOTICE (AFFILIATES)' : 'AVISO IMPORTANTE (DIVULGACIÓN DE AFILIADOS)'}</span>
                </div>
                <div className="disclaimer-body" style={{ color: '#ccc', fontSize: '0.8rem', lineHeight: '1.4' }}>
                    <p style={{ marginBottom: '8px' }}>
                        {language === 'en' 
                            ? 'The books, movies and products recommended in the Bunker are suggestions from the author to deepen your knowledge of mysteries and files. You are under no obligation to buy them when clicking, nor will you pay a single cent more (the price is exactly the same).'
                            : 'Los libros, películas y productos recomendados en el Búnker son sugerencias del autor para profundizar en los misterios y expedientes. No tienes ninguna obligación de comprarlos al hacer clic, ni pagarás un céntimo de más por hacerlo (el precio es exactamente el mismo).'}
                    </p>
                    <p>
                        {language === 'en'
                            ? 'In fact, once you enter Amazon through any of our links, any normal purchase you decide to make on the platform (even if it is something completely different from the recommended book) also helps us. Amazon provides the Bunker chief with a small commission percentage that goes entirely to cover page maintenance expenses (server, domain, and development). Your collaboration is of great help to keep the archive open and we will be infinitely grateful!'
                            : 'De hecho, una vez que entras a Amazon a través de cualquiera de nuestros enlaces, cualquier compra habitual que decidas hacer en la plataforma (aunque sea algo totalmente diferente al libro recomendado) también nos ayuda. Amazon aporta al jefe del Búnker un pequeño porcentaje que se destina íntegramente a cubrir los gastos de mantenimiento de la página (servidor, dominio y desarrollo tecnológico). ¡Tu colaboración es de gran ayuda para mantener el archivo abierto y te estaremos infinitamente agradecidos!'} 🛸🛰️
                    </p>
                </div>
            </div>

            {/* SECCIÓN DE ACCESO INMEDIATO (UX PRIORITARIA) */}
            <div className="quick-access-gates">
                <Link to="/lugares" className="gate-card map-gate">
                    <div className="gate-glow"></div>
                    <div className="gate-icon">🗺️</div>
                    <div className="gate-content">
                        <h3>{language === 'en' ? 'WORLD RADAR (INTERACTIVE MAP)' : 'RADAR MUNDIAL (MAPA INTERACTIVO)'}</h3>
                        <p>{language === 'en' ? 'Visualize, filter and locate UFO sightings and paranormal anomalies geolocalized in real-time.' : 'Visualiza, filtra y localiza avistamientos OVNI y anomalías paranormales geolocalizados en tiempo real.'}</p>
                        <span className="gate-action-btn">{language === 'en' ? 'LAUNCH RADAR ➔' : 'INICIAR RADAR ➔'}</span>
                    </div>
                </Link>
                <Link to="/expedientes" className="gate-card files-gate">
                    <div className="gate-glow"></div>
                    <div className="gate-icon">📂</div>
                    <div className="gate-content">
                        <h3>{language === 'en' ? 'CLASSIFIED DOSSIERS' : 'EXPEDIENTES CLASIFICADOS'}</h3>
                        <p>{language === 'en' ? 'Explore original reports submitted by field agents and official Command files.' : 'Explora los informes originales aportados por agentes de campo y los expedientes oficiales de Comandancia.'}</p>
                        <span className="gate-action-btn">{language === 'en' ? 'OPEN DOSSIERS ➔' : 'ABRIR EXPEDIENTES ➔'}</span>
                    </div>
                </Link>
                <Link to="/biblioteca" className="gate-card" style={{borderColor: '#ffb100'}}>
                    <div className="gate-glow" style={{background: 'radial-gradient(circle at 50% 50%, rgba(255, 177, 0, 0.15) 0%, transparent 60%)'}}></div>
                    <div className="gate-icon" style={{color: '#ffb100'}}>📚</div>
                    <div className="gate-content">
                        <h3 style={{color: '#ffb100'}}>{language === 'en' ? 'RECOMMENDED BIBLIOGRAPHY' : 'BIBLIOTECA DEL BÚNKER'}</h3>
                        <p>{language === 'en' ? 'Discover our selection of essential books to investigate anomalous phenomena and historical mysteries.' : 'Descubre nuestra selección de libros imprescindibles para investigar fenómenos anómalos y misterios históricos.'}</p>
                        <span className="gate-action-btn" style={{color: '#ffb100', borderTopColor: 'rgba(255, 177, 0, 0.2)'}}>{language === 'en' ? 'ENTER LIBRARY ➔' : 'ENTRAR A LA BIBLIOTECA ➔'}</span>
                    </div>
                </Link>
            </div>

            {/* --- SECCIÓN REUBICADA: PROTOCOLOS Y SOBRE MÍ --- */}
            <div className="bunker-protocols-top">
                <div className="protocol-links-grid">
                    <Link to="/privacidad" className="protocol-link">{t('navPrivacy')}</Link>
                    <Link to="/cookies" className="protocol-link">{t('navCookies')}</Link>
                    <Link to="/legal" className="protocol-link">{t('navLegal')}</Link>
                    <Link to="/sobre-nosotros" className="protocol-link">{t('navAboutProject')}</Link>
                </div>
                
                <div className="dossier-section-top">
                    <button 
                        className={`btn-dossier-tech ${showDossier ? 'open' : ''}`}
                        onClick={() => setShowDossier(!showDossier)}
                    >
                        {showDossier ? t('dossierClose') : t('dossierOpen')}
                    </button>

                    {showDossier && (
                        <div className="dossier-content-tech fade-in">
                            <h3>{t('dossierTitle')}</h3>
                            <p>
                                {t('dossierDesc1')}
                            </p>
                            <p>
                                {t('dossierDesc2')}
                            </p>
                            <div className="dossier-actions-personal">
                                <Link to="/especial-atarfe" className="btn-technical-link highlight">
                                    {t('dossierViewAtarfe')}
                                </Link>
                                <Link to="/sobre-nosotros" className="btn-technical-link">
                                    {t('dossierFullProtocols')}
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* SECCIÓN PREVISUALIZACIONES DE CONTENIDO ("CHICHA" PARA ADSENSE Y UX) */}
            <div className="home-sections-divider">// {language === 'en' ? 'DECLASS CENTRAL CORE' : 'NÚCLEO CENTRAL DE DESCLASIFICACIÓN'}</div>

            {/* ÚLTIMAS TRANSMISIONES / COMENTARIOS DE AGENTES */}
            {comentariosRecientes.length > 0 && (
                <div className="home-content-section" style={{ marginBottom: '45px' }}>
                    <div className="section-title-wrap">
                        <h2 className="section-title-neon" style={{ color: 'var(--color-principal)', textShadow: '0 0 10px rgba(0, 255, 65, 0.2)' }}>
                            // {language === 'en' ? 'INCOMING LOG / RECENT AGENT TRANSMISSIONS' : 'REGISTRO DE TRANSMISIONES / APORTACIONES RECIENTES'}
                        </h2>
                    </div>
                    <div style={{
                        background: 'rgba(5, 7, 12, 0.75)',
                        border: '1px solid rgba(var(--rgb-principal), 0.15)',
                        borderRadius: '4px',
                        padding: '20px',
                        fontFamily: 'monospace',
                        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.9)'
                    }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {comentariosRecientes.map((c, i) => {
                                const parts = (c.item_key || '').split('-');
                                const tipo = parts[0];
                                const id = parts[1];
                                const srcParam = tipo === 'exp' ? 'expedientes' : tipo === 'caso' ? 'casos' : tipo === 'misterio' ? 'misterios' : 'noticias';
                                const linkUrl = `/leer-historia/${id}?src=${srcParam}`;
                                
                                return (
                                    <div key={c.id} 
                                         onClick={() => navigate(linkUrl)}
                                         style={{
                                             borderBottom: i < comentariosRecientes.length - 1 ? '1px dashed rgba(255,255,255,0.05)' : 'none',
                                             paddingBottom: i < comentariosRecientes.length - 1 ? '15px' : '0',
                                             cursor: 'pointer',
                                             display: 'flex',
                                             flexDirection: 'column',
                                             gap: '6px',
                                             transition: 'all 0.2s ease'
                                         }}
                                         onMouseEnter={(e) => {
                                             e.currentTarget.style.opacity = 0.9;
                                             e.currentTarget.style.paddingLeft = '5px';
                                         }}
                                         onMouseLeave={(e) => {
                                             e.currentTarget.style.opacity = 1;
                                             e.currentTarget.style.paddingLeft = '0';
                                         }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '0.78rem' }}>
                                            <span style={{ color: 'var(--color-principal)', fontWeight: 'bold' }}>
                                                📟 [AGENTE_{c.agente.toUpperCase()}]
                                            </span>
                                            <span style={{ color: '#666', fontSize: '0.7rem' }}>
                                                {new Date(c.fecha).toLocaleString()}
                                            </span>
                                        </div>
                                        <div style={{ color: '#eee', fontSize: '0.85rem', paddingLeft: '15px', borderLeft: '2px solid var(--color-principal)', margin: '4px 0', lineBreak: 'anywhere' }}>
                                            "{c.mensaje}"
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#8892b0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <span>🎯 {language === 'en' ? 'TARGET:' : 'OBJETIVO:'}</span>
                                            <span style={{ color: '#00d4ff', textDecoration: 'underline' }}>{c.titulo_articulo?.toUpperCase() || 'VER EVIDENCIA'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN EXPEDIENTES RECIENTES */}
            <div className="home-content-section">
                <div className="section-title-wrap">
                    <h2 className="section-title-neon">// {language === 'en' ? 'RECENT DOSSIERS' : 'EXPEDIENTES RECIENTES'}</h2>
                    <Link to="/expedientes" className="section-view-all">{language === 'en' ? 'VIEW ALL FILES ➔' : 'VER TODOS ➔'}</Link>
                </div>
                <div className="home-grid-cards">
                    {recentExpedientes.length > 0 ? (
                        recentExpedientes.map((exp) => (
                            <div key={exp.id} className="home-card expediente-card-home" onClick={() => navigate(`/leer-historia/${exp.id}?src=expedientes`)}>
                                {exp.imagen_url ? (
                                    <div className="card-image-wrap">
                                        <img src={exp.imagen_url.startsWith('http') ? exp.imagen_url : `${API_BASE_URL}/imagenes/${exp.imagen_url}`} alt={exp.titulo} />
                                    </div>
                                ) : (
                                    <div className="card-image-placeholder-home">
                                        <span>📁 DOSSIER</span>
                                    </div>
                                )}
                                <div className="card-info-wrap">
                                    <span className="card-category">📁 {exp.tipo?.toUpperCase() || 'AGENTE'}</span>
                                    <h3>{exp.titulo || 'SIN TITULO'}</h3>
                                    <p className="card-snippet">{exp.contenido ? exp.contenido.replace(/<[^>]+>/g, '').substring(0, 120) + '...' : ''}</p>
                                    <div className="card-footer-info">
                                        <span>👤 {exp.usuario_nombre || 'Anónimo'}</span>
                                        <span>📅 {exp.fecha ? new Date(exp.fecha).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-content-indicator">{language === 'en' ? 'Scanning for recent files...' : 'Escaneando expedientes recientes...'}</p>
                    )}
                </div>
            </div>

            {/* SECCIÓN ÚLTIMAS NOTICIAS */}
            <div className="home-content-section">
                <div className="section-title-wrap">
                    <h2 className="section-title-neon">// {language === 'en' ? 'LATEST NEWS' : 'ÚLTIMAS NOTICIAS'}</h2>
                    <Link to="/noticias" className="section-view-all">{language === 'en' ? 'VIEW ALL NEWS ➔' : 'VER TODAS ➔'}</Link>
                </div>
                <div className="home-grid-cards">
                    {recentNoticias.length > 0 ? (
                        recentNoticias.map((news) => (
                            <div key={news.id} className="home-card news-card-home" onClick={() => navigate(`/leer-historia/${news.id}?src=noticias`)}>
                                <div className="card-image-wrap">
                                    <img 
                                        src={news.imagen_url ? (news.imagen_url.startsWith('http') ? news.imagen_url : `${API_BASE_URL}/imagenes/${news.imagen_url.split('/').pop()}`) : "/img-default.jpg"} 
                                        alt={news.titulo}
                                        onError={(e) => { e.target.src = `https://placehold.co/400x250/000/00ff41?text=NOTICIA`; }}
                                    />
                                    <span className={`card-badge-alert alert-${news.nivel_alerta?.toLowerCase()}`}>
                                        {news.nivel_alerta?.toUpperCase() || 'BAJO'}
                                    </span>
                                </div>
                                <div className="card-info-wrap">
                                    <h3>{news.titulo}</h3>
                                    <p className="card-snippet">{news.cuerpo ? news.cuerpo.replace(/<[^>]+>/g, '').substring(0, 120) + '...' : ''}</p>
                                    <div className="card-footer-info">
                                        <span>📍 {news.ubicacion || 'Sector Central'}</span>
                                        <span>📅 {news.fecha ? new Date(news.fecha).toLocaleDateString() : ''}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="no-content-indicator">{language === 'en' ? 'Scanning for news alerts...' : 'Escaneando alertas de noticias...'}</p>
                    )}
                </div>
            </div>

            {/* SECCIÓN CASOS ABIERTOS (TRUE CRIME) */}
            <div className="home-content-section">
                <div className="section-title-wrap">
                    <h2 className="section-title-neon">// {language === 'en' ? 'OPEN CASES (TRUE CRIME)' : 'CASOS ABIERTOS (TRUE CRIME)'}</h2>
                    <Link to="/casos-abiertos" className="section-view-all">{language === 'en' ? 'VIEW ALL CASES ➔' : 'VER TODOS ➔'}</Link>
                </div>
                <div className="home-grid-cards">
                    {recentCasos.length > 0 ? (
                        recentCasos.map((caso) => {
                            const tituloMostrar = language === 'en' && caso.titulo_en ? caso.titulo_en : caso.titulo;
                            const contenidoMostrar = language === 'en' && caso.contenido_en ? caso.contenido_en : caso.contenido;
                            return (
                                <div key={caso.id} className="home-card caso-card-home" onClick={() => navigate(`/leer-historia/${caso.id}?src=casos`)}>
                                    <div className="card-image-wrap">
                                        {caso.imagen_url ? (
                                            <img src={caso.imagen_url.startsWith('http') ? caso.imagen_url : `${API_BASE_URL}/imagenes/${caso.imagen_url}`} alt={tituloMostrar} />
                                        ) : (
                                            <div className="caso-image-placeholder-home">💀 NO EVIDENCE AVAILABLE</div>
                                        )}
                                        <span className="card-badge-unsolved">UNSOLVED</span>
                                    </div>
                                    <div className="card-info-wrap">
                                        <h3>{tituloMostrar?.toUpperCase()}</h3>
                                        <p className="card-snippet" dangerouslySetInnerHTML={{ __html: contenidoMostrar ? contenidoMostrar.replace(/<[^>]+>/g, '').substring(0, 120) + '...' : '' }}></p>
                                        <div className="card-footer-info">
                                            <span>📍 {caso.latitud && caso.latitud !== 0 ? 'COORDENADAS FIJADAS' : 'ARCHIVO CENTRAL'}</span>
                                            <span>📅 {caso.fecha ? new Date(caso.fecha).toLocaleDateString() : ''}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="no-content-indicator">{language === 'en' ? 'Scanning for unsolved cases...' : 'Escaneando misterios sin resolver...'}</p>
                    )}
                </div>
            </div>

            {/* SECCIÓN MISTERIOS HISTÓRICOS */}
            <div className="home-content-section">
                <div className="section-title-wrap">
                    <h2 className="section-title-neon">// {language === 'en' ? 'HISTORICAL MYSTERIES' : 'MISTERIOS HISTÓRICOS'}</h2>
                    <Link to="/misterios-historicos" className="section-view-all">{language === 'en' ? 'VIEW ALL ENIGMAS ➔' : 'VER TODOS ➔'}</Link>
                </div>
                <div className="home-grid-cards">
                    {recentMisterios.length > 0 ? (
                        recentMisterios.map((misterio) => {
                            const tituloMostrar = language === 'en' && misterio.titulo_en ? misterio.titulo_en : misterio.titulo;
                            const contenidoMostrar = language === 'en' && misterio.contenido_en ? misterio.contenido_en : misterio.contenido;
                            return (
                                <div key={misterio.id} className="home-card misterio-card-home" onClick={() => navigate(`/leer-historia/${misterio.id}?src=misterios`)}>
                                    <div className="card-image-wrap">
                                        {misterio.imagen_url ? (
                                            <img src={misterio.imagen_url.startsWith('http') ? misterio.imagen_url : `${API_BASE_URL}/imagenes/${misterio.imagen_url}`} alt={tituloMostrar} />
                                        ) : (
                                            <div className="misterio-image-placeholder-home">👁️ MYSTERY</div>
                                        )}
                                        <span className="card-badge-unsolved">ENIGMA</span>
                                    </div>
                                    <div className="card-info-wrap">
                                        <h3>{tituloMostrar?.toUpperCase()}</h3>
                                        <p className="card-snippet">{contenidoMostrar ? contenidoMostrar.replace(/<[^>]+>/g, '').substring(0, 120) + '...' : ''}</p>
                                        <div className="card-footer-info">
                                            <span>📍 {misterio.latitud && misterio.latitud !== 0 ? 'COORDENADAS GPS' : 'ARCHIVO HISTÓRICO'}</span>
                                            <span>📅 {misterio.fecha ? new Date(misterio.fecha).toLocaleDateString() : ''}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="no-content-indicator">{language === 'en' ? 'Scanning for historical enigmas...' : 'Escaneando enigmas históricos...'}</p>
                    )}
                </div>
            </div>

            {/* SECCIÓN VÍDEOS CLASIFICADOS */}
            <div className="home-content-section">
                <div className="section-title-wrap">
                    <h2 className="section-title-neon">// {language === 'en' ? 'CLASSIFIED VIDEOS' : 'VÍDEOS CLASIFICADOS'}</h2>
                    <Link to="/videos" className="section-view-all">{language === 'en' ? 'VIEW ALL VIDEOS ➔' : 'VER TODOS ➔'}</Link>
                </div>
                <div className="home-grid-cards">
                    {recentVideos.length > 0 ? (
                        recentVideos.map((vid) => {
                            const primerCaptura = vid.capturas && vid.capturas.trim() !== '' ? vid.capturas.split(',')[0].trim() : '';
                            const bgUrl = primerCaptura 
                                ? (primerCaptura.startsWith('http') ? primerCaptura : `${API_BASE_URL}/imagenes/${primerCaptura}`)
                                : `${API_BASE_URL}/imagenes/video_default.png`;
                            return (
                                <div key={vid.id} className="home-card video-card-home" onClick={() => navigate(`/videos?id=${vid.id}`)}>
                                    <div className="card-image-wrap video-thumb-wrap">
                                        <img src={bgUrl} alt={vid.titulo} onError={(e) => { e.target.src = `https://placehold.co/400x250/000/00ff41?text=VIDEO`; }} />
                                        <div className="play-button-overlay">▶</div>
                                    </div>
                                    <div className="card-info-wrap">
                                        <span className="card-category">📼 {vid.usuario ? `AGENTE: ${vid.usuario.toUpperCase()}` : 'ALTO MANDO'}</span>
                                        <h3>{vid.titulo?.toUpperCase()}</h3>
                                        <p className="card-snippet">{vid.descripcion ? vid.descripcion.replace(/<[^>]+>/g, '').substring(0, 120) + '...' : 'Evidencia audiovisual desclasificada por la red de observadores.'}</p>
                                        <div className="card-footer-info">
                                            <span>📍 GRANADA - GLOBAL</span>
                                            <span>📅 {vid.fecha ? new Date(vid.fecha).toLocaleDateString() : ''}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="no-content-indicator">{language === 'en' ? 'Scanning for video records...' : 'Escaneando registros en vídeo...'}</p>
                    )}
                </div>
            </div>

            {/* SECCIÓN RADAR VISUAL */}
            <div className="radar-section">
                <div className="radar-scanner technical">
                    <div className="radar-line"></div>
                    <div className="radar-circle c1"></div>
                    <div className="radar-circle c2"></div>
                    <div className="radar-circle c3"></div>
                </div>
                
                <div className="intel-summary-technical">
                    <div className="intel-item">
                        <span className="intel-status-label">{t('systemStatusLabel')}</span>
                        <span className="intel-status-value">{t('systemStatusValue')}</span>
                    </div>
                    <div className="intel-item">
                        <span className="intel-status-label">{t('sectorLabel')}</span>
                        <span className="intel-status-value">{t('sectorValue')}</span>
                    </div>
                    <div className="intel-item">
                        <span className="intel-status-label">{t('accessLevelLabel')}</span>
                        <span className="intel-status-value">{userAuth ? t('accessLevelAgent') : t('accessLevelVisitor')}</span>
                    </div>
                </div>
            </div>

            {/* TELETIPO DE INTELIGENCIA */}
            <div className="intel-ticker">
                <div className="ticker-label">{t('recentIntel')}</div>
                <div className="ticker-wrapper">
                    <div className="ticker-content">
                        {t('tickerText')}
                    </div>
                </div>
            </div>

            {/* CALIBRACIÓN DE FRECUENCIA */}
            <div className="frequency-calibration">
                <span className="calib-label">{t('visualCalibration')}</span>
                <div className="calib-dots">
                    {coloresDisponibles.map(c => (
                        <div 
                            key={c.hex}
                            onClick={() => setTema(c.hex)}
                            className={`calib-dot ${c.hex === stats.tema ? 'active' : ''}`}
                            style={{ backgroundColor: c.hex }}
                            title={c.label}
                        ></div>
                    ))}
                </div>
            </div>

            {/* GAMIFICACIÓN DE RANGOS */}
            <div className="gamification-banner" style={{ background: 'rgba(0, 212, 255, 0.05)', border: '1px solid var(--color-principal)', padding: '15px', marginBottom: '20px', textAlign: 'center', borderRadius: '5px' }}>
                <h3 style={{ color: 'var(--color-principal)', margin: '0 0 10px 0', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '2px', textShadow: '0 0 5px var(--color-principal)' }}>{t('rankSystemTitle')}</h3>
                <p style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 10px 0' }}>
                    {t('rankSystemDesc')}
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#ccc' }}>
                    {t('rankLevels')}
                </div>
            </div>

            {/* ACCIONES TÁCTICAS */}
            <div className="tactical-actions-grid">
                <Link to="/lugares" className="btn-tactical map">
                    <span className="btn-icon">🗺️</span>
                    <span className="btn-text">{t('accessWorldRadar')}</span>
                </Link>
                <Link to="/expedientes" className="btn-tactical report">
                    <span className="btn-icon">📝</span>
                    <span className="btn-text">{t('reportExperience')}</span>
                </Link>
                <Link to="/acceso" className="btn-tactical register">
                    <span className="btn-icon">🔑</span>
                    <span className="btn-text">{t('freeAgentRegister')}</span>
                </Link>
                <Link to="/videos" className="btn-tactical media">
                    <span className="btn-icon">📷</span>
                    <span className="btn-text">{t('contributeMedia')}</span>
                </Link>
            </div>

            {/* RADAR DE INTELIGENCIA EXTERNA */}
            <NoticiasExternas />

            {/* BANNER PROMOCIONAL ARCHIPEG PRO */}
            <div className="archipeg-promo-banner">
                <div className="archipeg-promo-glow"></div>
                <div className="archipeg-promo-content">
                    <div className="archipeg-promo-icon">💻</div>
                    <div className="archipeg-promo-text">
                        <h3 className="archipeg-promo-title">ARCHIPEG PRO</h3>
                        <p className="archipeg-promo-subtitle">
                            {language === 'en' 
                                ? 'Your Digital Bunker — Organize your photos & videos from your hard drive. 100% private, no cloud.' 
                                : 'Tu Búnker Digital — Organiza tus fotos y vídeos desde tu disco duro. 100% privado, sin nube.'}
                        </p>
                    </div>
                    <div className="archipeg-promo-actions">
                        <Link to="/archipeg" className="archipeg-promo-btn primary">
                            {language === 'en' ? 'DISCOVER' : 'DESCUBRIR'} ➔
                        </Link>
                        <a href="https://buy.stripe.com/5kQ28r4UU9jT9YndSl3Ru00" target="_blank" rel="noopener noreferrer" className="archipeg-promo-btn secondary">
                            💳 {language === 'en' ? 'GET IT (5€)' : 'ADQUIRIR (5€)'}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Indice;