import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { renderizarTextoConMedios } from '../utils/renderMedios';
import './lecturahistoria.css';
import API_BASE_URL from '../config';
import { useLanguage } from '../context/LanguageContext';

const LecturaHistoria = () => {
    const { language, t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [historia, setHistoria] = useState(null);
    const [esRelatoAdmin, setEsRelatoAdmin] = useState(false);
    const [cargando, setCargando] = useState(true);
    
    // Recuperamos la identidad del agente para los permisos de borrado
    const sesion = localStorage.getItem('agente_sesion');
    const userAuth = sesion ? JSON.parse(sesion) : null;
    const esJefe = userAuth && (userAuth.rol === 'admin' || userAuth.email === 'archipegv2@gmail.com');

    const obtenerHistoria = async () => {
        try {
            setCargando(true);
            console.log(`📡 ESCANEANDO ARCHIVO ID: ${id}...`);

            // 1. Intentamos buscar primero en los Relatos del Administrador
            const resAdmin = await axios.get(`${API_BASE_URL}/api/expedientes/relatos-admin-publicos`);
            const encontradaAdmin = resAdmin.data.find(h => h.id == id);

            if (encontradaAdmin) {
                setHistoria(encontradaAdmin);
                setEsRelatoAdmin(true);
            } else {
                // 2. Si no es de admin, buscamos en los expedientes públicos de usuarios
                const resPublicos = await axios.get(`${API_BASE_URL}/api/expedientes/expedientes-publicos`);
                const encontradaPublica = resPublicos.data.find(h => h.id == id);
                
                if (encontradaPublica) {
                    setHistoria(encontradaPublica);
                    setEsRelatoAdmin(false);
                } else {
                    // 3. ¡EL PARCHE! Si no es expediente, buscamos en las NOTICIAS
                    const resNoticias = await axios.get(`${API_BASE_URL}/api/galeria/noticias-publicas`);
                    const encontradaNoticia = resNoticias.data.find(h => h.id == id);
                    
                    if (encontradaNoticia) {
                        setHistoria(encontradaNoticia);
                        setEsRelatoAdmin(false); // Tratamos noticia como registro estándar
                    } else {
                        setHistoria(null);
                    }
                }
            }
        } catch (err) {
            console.error("❌ Error al recuperar el relato del búnker", err);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0); // SUBIDA AUTOMÁTICA AL CARGAR
        obtenerHistoria();
    }, [id]);

    const eliminarEstaHistoria = async () => {
        const mensajeConfirm = esRelatoAdmin
            ? t('readConfirmDeleteAdmin')
            : t('readConfirmDeleteAgent');

        if (window.confirm(mensajeConfirm)) {
            try {
                // Usamos la ruta correspondiente según el tipo de relato
                const rutaBorrado = esRelatoAdmin 
                    ? `${API_BASE_URL}/api/expedientes/borrar-relato-admin/${id}` 
                    : `${API_BASE_URL}/api/expedientes/expedientes/${id}`;

                await axios.delete(rutaBorrado);
                alert(t('readDeleteSuccess'));
                navigate(-1);
            } catch (err) {
                alert(t('readDeleteError'));
            }
        }
    };

    if (cargando) return (
        <div className="admin-dashboard">
            <div className="radar-loader-container" style={{ marginTop: '100px' }}>
                <div className="radar-loader"></div>
                <p style={{ color: 'var(--color-principal)', textAlign: 'center', fontFamily: 'Courier New' }}>
                    {t('readDecrypting')}
                </p>
            </div>
        </div>
    );

    if (!historia) return (
        <div className="admin-dashboard">
            <div className="glass-card" style={{ marginTop: '100px', textAlign: 'center' }}>
                <p style={{ color: '#ff4444' }}>{t('readNotFound')}</p>
                <button onClick={() => navigate(-1)} className="forms-btn-submit" style={{ width: 'auto', marginTop: '20px' }}>
                    {t('readBack')}
                </button>
            </div>
        </div>
    );

    return (
        <div className="admin-dashboard fade-in">
            <div className="glass-card full-width" style={{ textAlign: 'left', marginTop: '50px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => navigate(-1)}
                        className="forms-btn-submit"
                        style={{ width: 'auto', background: '#222', padding: '10px 20px', cursor: 'pointer', border: '1px solid #444', borderRadius: '2px', fontWeight: 'bold' }}
                    >
                        ⬅ {t('readBack')}
                    </button>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {historia.latitud && historia.longitud && (
                            <button
                                onClick={() => navigate('/lugares', { state: { lat: historia.latitud, lng: historia.longitud, noticiaId: historia.id } })}
                                className="forms-btn-submit"
                                style={{ 
                                    width: 'auto', background: '#fff', color: '#000', 
                                    padding: '10px 20px', cursor: 'pointer', 
                                    border: '2px solid #000', borderRadius: '2px', 
                                    fontWeight: '900', boxShadow: '0 0 15px rgba(255,255,255,0.4)' 
                                }}
                            >
                                {t('readViewRadar')}
                            </button>
                        )}
                        
                        {esJefe && (
                            <button
                                onClick={eliminarEstaHistoria}
                                className="forms-btn-submit"
                                style={{ width: 'auto', background: '#8b0000', color: 'white', padding: '10px 20px', cursor: 'pointer', border: 'none', borderRadius: '2px', opacity: 0.8 }}
                            >
                                🗑️ {t('readDelete')}
                            </button>
                        )}
                    </div>
                </div>

                <h2 className="admin-title" style={{ textAlign: 'left', color: 'var(--color-principal)', borderBottom: '1px solid rgba(0,255,65,0.3)', paddingBottom: '15px' }}>
                    {historia.titulo ? historia.titulo.toUpperCase() : t('readNoTitle')}
                </h2>

                <div className="meta-lectura" style={{ color: '#aaa', fontFamily: 'Courier New', marginBottom: '25px', fontSize: '0.9rem' }}>
                    <p>ID_SERIAL: <span style={{ color: 'var(--color-principal)' }}>#{historia.id}</span></p>
                    <p>CLASIFICACIÓN: <span style={{ color: esRelatoAdmin ? 'var(--color-principal)' : '#ff9900' }}>
                        {esRelatoAdmin ? t('readAdminStory') : t('readAgentRegistry')}
                    </span></p>
                    <p>ORIGEN: <span style={{ color: '#fff' }}>
                        {(historia.usuario_nombre || historia.agente || t('readSystemCentral')).toUpperCase()}
                    </span></p>
                </div>

                {/* IMAGEN PRINCIPAL DE LA NOTICIA / EXPEDIENTE */}
                {(historia.imagen_url || historia.url_imagen) && (
                    <div className="portada-lectura" style={{ 
                        marginBottom: '30px', 
                        textAlign: 'center', 
                        background: '#050505', 
                        padding: '15px', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                        minHeight: '200px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative' // Necesario para el botón absoluto
                    }}>
                        {/* BOTÓN FLOTANTE SOBRE IMAGEN */}
                        {historia.latitud && historia.longitud && parseFloat(historia.latitud) !== 0 && (
                            <button
                                onClick={() => navigate('/lugares', { state: { lat: historia.latitud, lng: historia.longitud, noticiaId: historia.id } })}
                                style={{
                                    position: 'absolute',
                                    top: '30px',
                                    right: '30px',
                                    zIndex: 10,
                                    background: 'rgba(0,255,65,0.9)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '10px 15px',
                                    borderRadius: '4px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    boxShadow: '0 0 20px rgba(0,255,65,0.5)',
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem'
                                }}
                            >
                                {t('readLocateRadar')}
                            </button>
                        )}
                        <img 
                            src={
                                (historia.imagen_url && historia.imagen_url.startsWith('http')) 
                                ? historia.imagen_url 
                                : (historia.url_imagen && historia.url_imagen.startsWith('http'))
                                ? historia.url_imagen
                                : `${API_BASE_URL}/imagenes/${(historia.imagen_url || historia.url_imagen || '').split('/').pop()}`
                            } 
                            alt="Portada de la Evidencia"
                            style={{ 
                                maxWidth: '100%', 
                                maxHeight: '600px', 
                                objectFit: 'contain', 
                                boxShadow: '0 0 30px rgba(0,0,0,0.5)',
                                border: '1px solid #222'
                            }}
                            onLoad={(e) => { e.target.style.opacity = 1; }}
                            onError={(e) => { 
                                console.error("Fallo carga imagen:", e.target.src);
                                e.target.style.display = 'none'; 
                            }}
                        />
                    </div>
                )}

                <div className="cuerpo-historia" style={{
                    color: '#e0e0e0',
                    lineHeight: '1.8',
                    fontSize: '1.1rem',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'Courier New, serif',
                    background: 'rgba(0,0,0,0.4)',
                    padding: '30px',
                    borderRadius: '5px',
                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                }}>
                    {language === 'en' && (
                        <div style={{ marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                            <button 
                                onClick={async (e) => {
                                    const btn = e.currentTarget;
                                    btn.innerText = "📡 " + t('readTranslateWait').toUpperCase();
                                    
                                    try {
                                        const texto = historia.contenido || historia.cuerpo || "";
                                        const res = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent(texto)}`);
                                        const data = await res.json();
                                        const traducido = data[0].map(x => x[0]).join("");
                                        
                                        setHistoria({ ...historia, contenido: traducido, cuerpo: traducido });
                                        btn.style.display = 'none';
                                    } catch (err) {
                                        const urlTranslate = `https://translate.google.com/?sl=es&tl=en&text=${encodeURIComponent(historia.contenido || historia.cuerpo)}&op=translate`;
                                        window.open(urlTranslate, '_blank');
                                    }
                                }}
                                style={{
                                    background: 'var(--color-principal)',
                                    color: '#000',
                                    border: 'none',
                                    padding: '10px 20px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem',
                                    boxShadow: '0 0 15px rgba(0,255,65,0.4)'
                                }}
                            >
                                📡 {t('readTranslateStory')}
                            </button>
                        </div>
                    )}
                    {renderizarTextoConMedios(historia.contenido || historia.cuerpo || t('readNoContent'))}
                    
                    {historia.fuente_url && (
                        <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(0,255,65,0.1)', textAlign: 'center' }}>
                            <a 
                                href={historia.fuente_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn-technical-link highlight"
                                style={{ display: 'inline-block', textDecoration: 'none', padding: '12px 25px', background: 'rgba(0,255,65,0.05)', border: '1px solid var(--color-principal)', color: 'var(--color-principal)', fontWeight: 'bold', fontSize: '0.8rem', letterSpacing: '1px' }}
                            >
                                🌐 {t('readSource')}
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LecturaHistoria;
