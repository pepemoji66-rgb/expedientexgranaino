import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';

// Estilos del Mapa
import 'leaflet/dist/leaflet.css';

// Componentes del Búnker
import Indice from './components/Indice';
import Hero from './components/Hero';
import SeccionUsuarios from './components/SeccionUsuarios';
import Expedientes from './components/Expedientes';
import PanelAdmin from './components/PanelAdmin';
import LecturaHistoria from './components/LecturaHistoria';
import Footer from './components/Footer';
import Videos from './components/Videos';
import Galeria from './components/Galeria';
import Lugares from './components/Lugares';
import CasosAbiertos from './components/CasosAbiertos';
import Noticias from './components/Noticias';
import PoliticaPrivacidad from './components/PoliticaPrivacidad';
import PoliticaCookies from './components/PoliticaCookies';
import AvisoLegal from './components/AvisoLegal';
import Horoscopo from './components/Horoscopo';
import { X } from 'lucide-react';
import TopNavbar from './components/TopNavbar';

import CookieBanner from './components/CookieBanner';
import SobreNosotros from './components/SobreNosotros';
import AtarfeDossier from './components/AtarfeDossier';
import Archipeg from './components/Archipeg';
import MisteriosHistoricos from './components/MisteriosHistoricos';
import BibliotecaBunker from './components/BibliotecaBunker';
import ColaboradoresBunker from './components/ColaboradoresBunker';
import { useLanguage } from './context/LanguageContext';
import { safeLocalStorage } from './utils/storage';

import { API_BASE_URL, ADMIN_EMAIL } from './config';



// Estilos propios y fondo
import './App.css';
import fondoAlhambra from './alhambra.jpg';

// --- CONFIGURACIÓN DE CONEXIÓN ---
// API_BASE_URL se importa desde config.js para mayor flexibilidad

// --- RESTAURAR SCROLL AL CAMBIAR DE RUTA ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// --- FOOTER CONDICIONAL: Se oculta en pantallas completas como el mapa ---
const FooterCondicional = (props) => {
  const { pathname } = useLocation();
  // Rutas donde NO queremos Footer (pantalla completa)
  const rutasSinFooter = ['/lugares'];
  if (rutasSinFooter.includes(pathname)) return null;
  return <Footer {...props} />;
};



function App() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const [tema, setTema] = useState('#ffffff');
  const [visitasTotales, setVisitasTotales] = useState(0);
  const [comentariosNuevos, setComentariosNuevos] = useState(0);
  const [ultimoComentario, setUltimoComentario] = useState(null);
  const [mostrarToastComentario, setMostrarToastComentario] = useState(false);
  const ultimoIdComentarioVisto = React.useRef(null);

  const [stats, setStats] = useState({
    usuarios: 0,
    imagenes: 0,
    videos: 0,
    noticias: 0,
    expedientes: 0,
    lugares: 0,
    audios: 0,
    visitas_totales: 0
  });

  // EL JEFE DEL BÚNKER (Cargado de config/env)
  const toggleMenu = () => setIsOpen(!isOpen);
  //guardado//
  const cargarContadores = useCallback(async () => {
    try {
      console.log("📡 RADAR: Rastreando actividad en el sector...");
      const resultados = await Promise.allSettled([
        axios.get(`${API_BASE_URL}/api/usuarios`),
        axios.get(`${API_BASE_URL}/api/galeria/imagenes-publicas`),
        axios.get(`${API_BASE_URL}/api/videos/publicos`),
        axios.get(`${API_BASE_URL}/api/galeria/noticias-publicas`),
        axios.get(`${API_BASE_URL}/api/expedientes`),
        axios.get(`${API_BASE_URL}/api/lugares-publicos`),
        axios.get(`${API_BASE_URL}/api/visitas`)
      ]);

      const datos = resultados.map(r => r.status === 'fulfilled' ? r.value.data : []);

      setStats({
        usuarios: Array.isArray(datos[0]) ? datos[0].length : 0,
        imagenes: Array.isArray(datos[1]) ? datos[1].length : 0,
        videos: Array.isArray(datos[2]) ? datos[2].length : 0,
        noticias: Array.isArray(datos[3]) ? datos[3].length : 0,
        expedientes: Array.isArray(datos[4]) ? datos[4].length : 0,
        lugares: Array.isArray(datos[5]) ? datos[5].length : 0,
        audios: 0,
        visitas_totales: datos[6]?.cuenta || 0
      });

    } catch (err) {
      console.error("❌ ERROR CRÍTICO EN EL RADAR:", err);
    }
  }, []);

  useEffect(() => {
    // RECUPERAR SESIÓN: Unificado para evitar el limbo
    const sesionGuardada = safeLocalStorage.getItem('agente_sesion');
    if (sesionGuardada) {
      try {
        const datosSesion = JSON.parse(sesionGuardada);
        console.log("🔍 DEPURE: Datos del agente ->", datosSesion);
        setUserAuth(datosSesion);
      } catch (e) {
        safeLocalStorage.removeItem('agente_sesion');
      }
    }
    cargarContadores();
    
    // Registrar visita al entrar y cargar todo
    axios.post(`${API_BASE_URL}/api/visitas`)
      .then(res => {
        setVisitasTotales(res.data.cuenta);
        cargarContadores();
      })
      .catch(err => {
        console.log("Radar de visitas desactivado", err);
        cargarContadores();
      });

    // 💬 RADAR DE COMENTARIOS NUEVOS — Polling cada 60 segundos
    const comprobarComentariosNuevos = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/comentarios/ultimo`);
        const ultimo = res.data;
        if (!ultimo) return;
        // Primera carga: guardamos el ID sin notificar
        if (ultimoIdComentarioVisto.current === null) {
          ultimoIdComentarioVisto.current = ultimo.id;
          return;
        }
        // Si hay un comentario más nuevo, notificamos
        if (ultimo.id > ultimoIdComentarioVisto.current) {
          const cantidad = ultimo.id - ultimoIdComentarioVisto.current;
          setComentariosNuevos(cantidad);
          setUltimoComentario(ultimo);
          setMostrarToastComentario(true);
          // El toast se auto-cierra a los 8 segundos
          setTimeout(() => setMostrarToastComentario(false), 8000);
        }
      } catch (e) {}
    };

    const intervaloComentarios = setInterval(comprobarComentariosNuevos, 60000);
    comprobarComentariosNuevos(); // Primera comprobación inmediata
    return () => clearInterval(intervaloComentarios);
  }, [cargarContadores]);

  // Función para convertir Hex a RGB para las variables CSS
  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  useEffect(() => {
    // Aplicar el color del tema globalmente (Hex y RGB)
    document.documentElement.style.setProperty('--color-principal', tema);
    document.documentElement.style.setProperty('--rgb-principal', hexToRgb(tema));
  }, [tema]);

  const actualizarAuth = (datos) => {
    if (datos) {
      safeLocalStorage.setItem('agente_sesion', JSON.stringify(datos));
      setUserAuth(datos);
      cargarContadores();
    }
  };

  const cerrarSesion = () => {
    if (window.confirm(t('sysLogoutConfirm'))) {
      safeLocalStorage.removeItem('agente_sesion');
      setUserAuth(null);
      setIsOpen(false);
      window.location.href = '/';
    }
  };

  return (
    <Router>
      <ScrollToTop />
    <div className={`App theme-${tema}`} style={{
        backgroundColor: '#020408',
        backgroundAttachment: 'fixed',
      }}>


      <div className="app-container" style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* BARRA DE NAVEGACIÓN HORIZONTAL (PC + MÓVIL) */}
        <TopNavbar userAuth={userAuth} toggleMenu={toggleMenu} isOpen={isOpen} cerrarSesion={cerrarSesion} />
 
        {/* BARRA DE NAVEGACIÓN LATERAL */}
        <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
          {/* BOTÓN DE CIERRE TÁCTICO */}
          <button className="sidebar-close-btn" onClick={toggleMenu} aria-label="Cerrar Menú">
            <X size={28} />
          </button>
          <div style={{ flexGrow: 1, paddingTop: '40px', paddingLeft: '30px', overflowY: 'auto' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {[
                { path: "/", label: t('navHome') },
                { path: "/galeria", label: t('navGallery') },
                { path: "/videos", label: t('navVideos') },
                { path: "/noticias", label: t('navNews') },
                { path: "/expedientes", label: t('navFiles') },
                { path: "/especial-atarfe", label: t('sysSidebarDossier') },
                { path: "/lugares", label: t('navMap') },
                { path: "/horoscopo", label: t('navHoroscope') },
                { path: "/casos-abiertos", label: "💀 TRUE CRIME" },
                { path: "/misterios-historicos", label: "👁️ " + t('navMysteries') },
                { path: "/biblioteca", label: "📚 BIBLIOTECA DEL BÚNKER" },
                { path: "/colaboradores", label: "🏅 COLABORADORES" },
                { path: "/archipeg", label: "💻 ARCHIPEG V3" }
              ].map((route) => (
                <li key={route.path} style={{ marginBottom: '15px' }}>
                  <Link to={route.path} onClick={toggleMenu} className="nav-link" style={{
                    color: 'white', textDecoration: 'none', textTransform: 'uppercase',
                    fontSize: '0.85rem', fontFamily: 'monospace', letterSpacing: '1px',
                    display: 'block', transition: '0.3s'
                  }}>
                    <span style={{ color: 'var(--color-principal)' }}>&gt;</span> {route.label}
                  </Link>
                </li>
              ))}


              <li style={{ marginTop: '30px', paddingRight: '30px' }}>
                <Link to="/acceso" onClick={toggleMenu} style={{
                  color: 'white',
                  padding: '12px', display: 'block', textAlign: 'center',
                  background: 'rgba(var(--rgb-principal), 0.05)',
                  border: '1px solid rgba(var(--rgb-principal), 0.2)',
                  fontWeight: 'bold', textDecoration: 'none',
                  fontSize: '0.8rem', fontFamily: 'monospace', borderRadius: '4px'
                }}>
                  {userAuth ? `${t('sysAgentLabel')} ${userAuth.nombre?.toUpperCase()}` : `🔑 ${t('sysAccessBunker')}`}
                </Link>
              </li>

              {/* RECONOCIMIENTO DEL JEFE: La Llave Maestra de Pepe */}
              {userAuth && (
                (userAuth.email && userAuth.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) ||
                userAuth.rol === 'admin'
              ) && (
                  <li style={{ marginTop: '20px', paddingRight: '30px' }}>
                    <Link to="/panel-mando" onClick={toggleMenu} style={{
                      color: 'var(--color-principal)', border: '2px solid var(--color-principal)',
                      padding: '12px', display: 'block', textAlign: 'center',
                      background: 'rgba(var(--rgb-principal), 0.1)', fontWeight: 'bold', textDecoration: 'none',
                      borderRadius: '4px', boxShadow: '0 0 15px rgba(var(--rgb-principal), 0.3)'
                    }}>
                      {t('sysControlPanel')}
                    </Link>
                  </li>
                )}
            </ul>
          </div>

          {/* CONTROL DE TEMA Y MÚSICA BAJO EL MENÚ - ASEGURAMOS VISIBILIDAD */}
          <div className="sidebar-footer">
            {userAuth && (
              <button onClick={cerrarSesion} className="btn-logout">
                🔴 {t('sysLogoutBtn')}
              </button>
            )}
            <div className="theme-selector-container">

              <p className="sidebar-footer-label" style={{ marginBottom: '8px', fontSize: '10px', color: '#666' }}>{t('sysVisualFreq')}</p>
              <div className="theme-selector" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                {['#00d4ff', '#00ff41', '#ff4444', '#ffb100', '#ff00ff'].map(c => (
                  <div key={c} onClick={() => setTema(c)} className={`theme-dot ${tema === c ? 'active' : ''}`} style={{ 
                    width: '18px', height: '18px', borderRadius: '50%', background: c, cursor: 'pointer', border: tema === c ? '2px solid #fff' : '1px solid transparent' 
                  }}></div>
                ))}
              </div>
            </div>
          </div>
        </nav>

        {/* CONTENIDO PRINCIPAL - ELIMINAMOS PADDING Y OVERFLOW PARA QUE EL MAPA SEA PERFECTO */}
        <main className="main-content-bunker">
          <div className="routes-wrapper">
            <Routes>
              <Route path="/" element={
                <div className="home-layout">
                  <Hero userAuth={userAuth} />
                  <Indice userAuth={userAuth} stats={stats} setTema={setTema} />
                </div>
              } />
              <Route path="/acceso" element={<SeccionUsuarios setAuth={actualizarAuth} />} />
              <Route 
                path="/panel-mando" 
                element={
                  userAuth && (userAuth.rol === 'admin' || userAuth.email?.toLowerCase() === ADMIN_EMAIL?.toLowerCase()) 
                    ? <PanelAdmin /> 
                    : <Navigate to="/" replace /> 
                } 
              />
              <Route path="/expedientes" element={<Expedientes userAuth={userAuth} />} />
              <Route path="/lugares" element={<Lugares />} />
              <Route path="/videos" element={<Videos userAuth={userAuth} />} />
              <Route path="/horoscopo" element={<Horoscopo />} />

              <Route path="/galeria" element={<Galeria userAuth={userAuth} />} />
              <Route path="/leer-historia/:id" element={<LecturaHistoria userAuth={userAuth} />} />
              <Route path="/casos-abiertos" element={<CasosAbiertos userAuth={userAuth} />} />
              <Route path="/misterios-historicos" element={<MisteriosHistoricos />} />
              <Route path="/noticias" element={<Noticias userAuth={userAuth} />} />
              <Route path="/privacidad" element={<PoliticaPrivacidad />} />
              <Route path="/cookies" element={<PoliticaCookies />} />
               <Route path="/legal" element={<AvisoLegal />} />
               <Route path="/sobre-nosotros" element={<SobreNosotros />} />
               <Route path="/especial-atarfe" element={<AtarfeDossier />} />
               <Route path="/archipeg" element={<Archipeg userAuth={userAuth} />} />
               <Route path="/biblioteca" element={<BibliotecaBunker />} />
               <Route path="/colaboradores" element={<ColaboradoresBunker userAuth={userAuth} />} />

            </Routes>
          </div>
          <FooterCondicional visitasTotales={visitasTotales || stats.visitas_totales} />
        </main>
      </div>
    </div>
    <CookieBanner />

      {/* 💬 TOAST DE NUEVO COMENTARIO */}
      {mostrarToastComentario && ultimoComentario && (
        <div
          onClick={() => {
            // Navegar al expediente del comentario
            const key = ultimoComentario.item_key || '';
            let ruta = '/expedientes';
            let id = null;
            if (key.startsWith('misterio-')) { ruta = '/leer-historia'; id = key.replace('misterio-', ''); ruta += `/${id}?src=misterios`; }
            else if (key.startsWith('caso-')) { ruta = '/leer-historia'; id = key.replace('caso-', ''); ruta += `/${id}?src=casos`; }
            else if (key.startsWith('noticia-')) { ruta = '/leer-historia'; id = key.replace('noticia-', ''); ruta += `/${id}?src=noticias`; }
            else if (key.startsWith('exp-')) { ruta = '/leer-historia'; id = key.replace('exp-', ''); ruta += `/${id}?src=expedientes`; }
            setComentariosNuevos(0);
            setMostrarToastComentario(false);
            ultimoIdComentarioVisto.current = ultimoComentario.id;
            window.location.href = id ? ruta : '/expedientes';
          }}
          style={{
            position: 'fixed', bottom: '25px', right: '25px', zIndex: 99999,
            background: 'linear-gradient(135deg, #0a0a0a, #111)',
            border: '1px solid var(--color-principal)',
            boxShadow: '0 0 30px rgba(0,255,65,0.3), 0 4px 20px rgba(0,0,0,0.8)',
            borderRadius: '6px', padding: '15px 20px', maxWidth: '320px',
            cursor: 'pointer', animation: 'slideInRight 0.4s ease-out',
            fontFamily: 'Courier New, monospace'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.2rem' }}>💬</span>
            <span style={{ color: 'var(--color-principal)', fontWeight: '900', fontSize: '0.75rem', letterSpacing: '1px' }}>
              NUEVO COMENTARIO DE AGENTE
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setMostrarToastComentario(false); }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1rem' }}
            >✕</button>
          </div>
          <p style={{ color: '#fff', fontSize: '0.8rem', margin: '0 0 6px 0', fontWeight: 'bold' }}>
            👤 {(ultimoComentario.agente || 'Agente Anónimo').toUpperCase()}
          </p>
          <p style={{ color: '#aaa', fontSize: '0.75rem', margin: '0 0 10px 0', lineHeight: '1.4' }}>
            "{(ultimoComentario.mensaje || '').substring(0, 80)}{ultimoComentario.mensaje?.length > 80 ? '...' : ''}"
          </p>
          <div style={{ color: 'var(--color-principal)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px' }}>
            👁️ VER COMENTARIO →
          </div>
        </div>
      )}
  </Router>
);

}

export default App;

