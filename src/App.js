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
import Chat from './components/Chat';
import Noticias from './components/Noticias';
import Audios from './components/Audios';
import PoliticaPrivacidad from './components/PoliticaPrivacidad';
import PoliticaCookies from './components/PoliticaCookies';
import AvisoLegal from './components/AvisoLegal';
import Horoscopo from './components/Horoscopo';
import CartaAstral from './components/CartaAstral';
import Tarot from './components/Tarot';
import { X } from 'lucide-react';
import TopNavbar from './components/TopNavbar';

import CookieBanner from './components/CookieBanner';
import SobreNosotros from './components/SobreNosotros';
import AtarfeDossier from './components/AtarfeDossier';


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
  const [isOpen, setIsOpen] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const [tema, setTema] = useState('#ffffff');
  const [visitasTotales, setVisitasTotales] = useState(0);

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
  // --- CARGA DE DATOS DEL RADAR (CONTADORES) ---
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
        axios.get(`${API_BASE_URL}/api/audios/audios-publicos`),
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
        audios: Array.isArray(datos[6]) ? datos[6].length : 0,
        visitas_totales: datos[7]?.cuenta || 0
      });

    } catch (err) {
      console.error("❌ ERROR CRÍTICO EN EL RADAR:", err);
    }
  }, []);

  useEffect(() => {
    // RECUPERAR SESIÓN: Unificado para evitar el limbo
    const sesionGuardada = localStorage.getItem('agente_sesion');
    if (sesionGuardada) {
      try {
        const datosSesion = JSON.parse(sesionGuardada);
        console.log("🔍 DEPURE: Datos del agente ->", datosSesion);
        setUserAuth(datosSesion);
      } catch (e) {
        localStorage.removeItem('agente_sesion');
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
      localStorage.setItem('agente_sesion', JSON.stringify(datos));
      setUserAuth(datos);
      cargarContadores();
    }
  };

  const cerrarSesion = () => {
    if (window.confirm("¿FINALIZAR TURNO DE GUARDIA, AGENTE?")) {
      localStorage.removeItem('agente_sesion');
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
                { path: "/", label: "Inicio" },
                { path: "/galeria", label: "Galería de Fotos" },
                { path: "/videos", label: "Vídeos" },
                { path: "/noticias", label: "Noticias" },
                { path: "/audios", label: "Audios" },
                { path: "/expedientes", label: "Expedientes X" },
                { path: "/especial-atarfe", label: "⚠️ Dossier Atarfe" },
                { path: "/lugares", label: "Mapa de Lugares" },
                ...(userAuth ? [
                  { path: "/horoscopo", label: "Horóscopo Diario" },
                  { path: "/tarot", label: "El Oráculo (Tarot)" }
                ] : []),

                { path: "/chat", label: "Canal Táctico" }


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
                  {userAuth ? `👤 AGENTE: ${userAuth.nombre?.toUpperCase()}` : '🔑 ACCESO AL BÚNKER'}
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
                      ⚡ PANEL DE MANDO
                    </Link>
                  </li>
                )}
            </ul>
          </div>

          {/* CONTROL DE TEMA Y MÚSICA BAJO EL MENÚ - ASEGURAMOS VISIBILIDAD */}
          <div className="sidebar-footer">
            {userAuth && (
              <button onClick={cerrarSesion} className="btn-logout">
                🔴 DESCONECTAR AGENTE
              </button>
            )}
            <div className="theme-selector-container">

              <p className="sidebar-footer-label" style={{ marginBottom: '8px', fontSize: '10px', color: '#666' }}>FRECUENCIA VISUAL</p>
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
              <Route path="/tarot" element={<Tarot />} />
              <Route path="/carta-astral" element={<CartaAstral />} />

              <Route path="/galeria" element={<Galeria userAuth={userAuth} />} />
              <Route path="/leer-historia/:id" element={<LecturaHistoria />} />
              <Route path="/chat" element={<Chat usuarioActivo={userAuth} />} />
              <Route path="/noticias" element={<Noticias userAuth={userAuth} />} />
              <Route path="/audios" element={<Audios userAuth={userAuth} />} />
              <Route path="/privacidad" element={<PoliticaPrivacidad />} />
              <Route path="/cookies" element={<PoliticaCookies />} />
               <Route path="/legal" element={<AvisoLegal />} />
               <Route path="/sobre-nosotros" element={<SobreNosotros />} />
               <Route path="/especial-atarfe" element={<AtarfeDossier />} />

            </Routes>
          </div>
          <FooterCondicional visitasTotales={visitasTotales || stats.visitas_totales} />
        </main>
      </div>
    </div>
    <CookieBanner />
  </Router>
);

}

export default App;

