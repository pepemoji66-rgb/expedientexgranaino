import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Comentarios from './Comentarios';
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
                const [resExp, resNot, resCasos, resVideos, resMisterios] = await Promise.allSettled([
                    axios.get(`${API_BASE_URL}/api/expedientes/ultimos`),
                    axios.get(`${API_BASE_URL}/api/noticias/ultimas`),
                    axios.get(`${API_BASE_URL}/api/casos`),
                    axios.get(`${API_BASE_URL}/api/videos/publicos`),
                    axios.get(`${API_BASE_URL}/api/misterios-historicos`)
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

            {/* SECCIÓN EXPEDIENTES RECIENTES */}
            <div className="home-content-section">
                <div className="section-title-wrap">
                    <h2 className="section-title-neon">// {language === 'en' ? 'RECENT DOSSIERS' : 'EXPEDIENTES RECIENTES'}</h2>
                    <Link to="/expedientes" className="section-view-all">{language === 'en' ? 'VIEW ALL FILES ➔' : 'VER TODOS ➔'}</Link>
                </div>
                <div className="home-grid-cards">
                    {recentExpedientes.length > 0 ? (
                        recentExpedientes.map((exp) => (
                            <div key={exp.id} className="home-card expediente-card-home" onClick={() => navigate(`/leer-historia/${exp.id}`)}>
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
                            <div key={news.id} className="home-card news-card-home" onClick={() => navigate(`/leer-historia/${news.id}`)}>
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
                                <div key={caso.id} className="home-card caso-card-home" onClick={() => navigate(`/casos-abiertos?id=${caso.id}`)}>
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

            {/* PROMOCIÓN DE ADQUISICIÓN DE ARCHIPEG V3 */}
            <div style={{ textAlign: 'center', margin: '30px 0', opacity: 0.9 }}>
                <Link to="/archipeg" style={{
                    display: 'inline-flex', alignItems: 'center', gap: '8px',
                    backgroundColor: 'rgba(99, 91, 255, 0.1)', border: '1px solid rgba(99, 91, 255, 0.3)',
                    color: '#635bff', padding: '10px 22px', borderRadius: '20px',
                    textDecoration: 'none', fontSize: '0.9rem', fontWeight: 'bold', transition: 'all 0.3s ease',
                    fontFamily: 'Outfit, sans-serif'
                }} 
                onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'rgba(99, 91, 255, 0.2)'; e.currentTarget.style.boxShadow = '0 0 15px rgba(99, 91, 255, 0.3)'; }}
                onMouseOut={(e) => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.backgroundColor = 'rgba(99, 91, 255, 0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                    💻 <span>{language === 'en' ? 'Get Archipeg V3 - Sovereign Offline Software' : 'Adquirir Archipeg V3 - Software Offline Soberano'}</span>
                </Link>
            </div>

            <Comentarios userAuth={userAuth} />
        </div>
    );
};

export default Indice;