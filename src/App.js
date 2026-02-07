import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
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
import ChatIA from './components/ChatIA';
import Noticias from './components/Noticias'; 
// IMPORTANTE: Importamos el nuevo componente
import ArchivosUsuarios from './components/ArchivosUsuarios'; 

import './App.css';
import fondoAlhambra from './alhambra.jpg';

const ControlMusica = () => {
  const [sonando, setSonando] = useState(false);
  const audioRef = useRef(new Audio('/audio/misterio.mp3'));

  useEffect(() => {
    audioRef.current.volume = 0.2; 
    audioRef.current.loop = true;
  }, []);

  const toggleMusica = () => {
    if (sonando) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.log("Interacción necesaria."));
    }
    setSonando(!sonando);
  };

  return (
    <button onClick={toggleMusica} style={{
        background: 'transparent', color: 'var(--color-principal)',
        border: '1px solid var(--color-principal)', padding: '8px',
        cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.7rem', width: '100%'
      }}>
      {sonando ? '🔈 AMBIENTE ON' : '🔊 MÚSICA OFF'}
    </button>
  );
};

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const [tema, setTema] = useState('#00ff41');
  
  // --- RADAR CENTRAL DE CONTADORES ---
  const [stats, setStats] = useState({
    usuarios: 0,
    imagenes: 0,
    videos: 0,
    noticias: 0,
    expedientes: 0,
    lugares: 0
  });

  const ADMIN_EMAIL = 'expedientexpepe@moreno.com';
  
  const toggleMenu = () => setIsOpen(!isOpen);

  // Función para cargar contadores (El Radar) actualizado para archivos públicos
  const cargarContadores = useCallback(async () => {
    try {
      const [resU, resI, resV, resN, resE, resL] = await Promise.all([
        axios.get('http://localhost:5000/usuarios'),
        axios.get('http://localhost:5000/imagenes-publicas'),
        axios.get('http://localhost:5000/admin/todos-los-videos'),
        axios.get('http://localhost:5000/admin/todas-noticias'),
        axios.get('http://localhost:5000/expedientes'),
        axios.get('http://localhost:5000/lugares')
      ]);

      setStats({
        usuarios: resU.data.length,
        imagenes: resI.data.length, // Estos son los archivos de usuarios aprobados
        videos: resV.data.length,
        noticias: resN.data.length,
        expedientes: resE.data.length,
        lugares: resL.data.length
      });
    } catch (err) {
      console.log("Error en el barrido del radar central.");
    }
  }, []);

  useEffect(() => {
    const sesionGuardada = localStorage.getItem('usuario_sesion');
    if (sesionGuardada) {
      try {
        const datos = JSON.parse(sesionGuardada);
        setUserAuth(datos);
      } catch (e) {
        localStorage.removeItem('usuario_sesion');
      }
    }
    cargarContadores();
  }, [cargarContadores]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-principal', tema);
  }, [tema]);

  const actualizarAuth = (datos) => {
    if (datos) {
      localStorage.setItem('usuario_sesion', JSON.stringify(datos));
      setUserAuth(datos);
      cargarContadores(); 
    }
  };

  const cerrarSesion = () => {
    if (window.confirm("¿FINALIZAR TURNO DE GUARDIA?")) {
      localStorage.removeItem('usuario_sesion');
      setUserAuth(null);
      setIsOpen(false);
      window.location.href = '/'; 
    }
  };

  return (
    <Router>
      <div className="App" style={{
        backgroundImage: `url(${fondoAlhambra})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundAttachment: 'fixed', minHeight: '100vh',
        display: 'flex', flexDirection: 'column'
      }}>

        <button onClick={toggleMenu} style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: '2500',
          background: 'rgba(0,0,0,0.9)', border: '1px solid var(--color-principal)',
          color: 'var(--color-principal)', width: '50px', height: '50px', cursor: 'pointer',
          borderRadius: '5px', fontSize: '24px', display: 'flex', 
          alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(0,0,0,0.5)'
        }}>
          {isOpen ? '✕' : '☰'}
        </button>

        <nav style={{
          position: 'fixed', top: 0, right: isOpen ? '0' : '-320px',
          width: '300px', height: '100vh', background: 'rgba(0,0,0,0.98)',
          zIndex: '2000', transition: '0.4s ease-in-out', borderLeft: '2px solid var(--color-principal)',
          display: 'flex', flexDirection: 'column', boxShadow: '-10px 0 20px rgba(0,0,0,0.8)'
        }}>
          
          <div style={{ flexGrow: 1, paddingTop: '80px', paddingLeft: '30px' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {/* Rutas actualizadas: Se añade /archivos-usuarios */}
              {[
                {path: "/", label: "Inicio"},
                {path: "/galeria", label: "Galería"},
                {path: "/archivos-usuarios", label: "Archivos de Agentes"}, // <-- LA NUEVA PESTAÑA
                {path: "/videos", label: "Vídeos"},
                {path: "/expedientes", label: "Expedientes"},
                {path: "/lugares", label: "Mapa"},
                {path: "/noticias", label: "Noticias"},
                {path: "/chat", label: "Chat Táctico"},
                {path: "/chat-ia", label: "Archivero IA"}
              ].map((route) => (
                <li key={route.path} style={{ marginBottom: '18px' }}>
                  <Link to={route.path} onClick={toggleMenu} style={{ 
                    color: 'white', textDecoration: 'none', textTransform: 'uppercase', 
                    fontSize: '0.9rem', fontFamily: 'monospace', letterSpacing: '1px'
                  }}>
                    [ {route.label} ]
                  </Link>
                </li>
              ))}
              
              {(!userAuth || (userAuth.email !== ADMIN_EMAIL && userAuth.rol !== 'admin')) && (
                <li style={{ marginTop: '25px', paddingRight: '30px' }}>
                  <Link to="/acceso" onClick={toggleMenu} style={{
                    color: 'white', border: '1px solid white',
                    padding: '12px', display: 'block', textAlign: 'center',
                    background: 'rgba(255,255,255,0.05)', fontWeight: 'bold', textDecoration: 'none',
                    fontSize: '0.8rem', fontFamily: 'monospace'
                  }}>
                    {userAuth ? '👤 MI PERFIL AGENTE' : '🔑 ACCESO AGENTES'}
                  </Link>
                </li>
              )}

              {userAuth && (userAuth.email === ADMIN_EMAIL || userAuth.rol === 'admin') && (
                <li style={{ marginTop: '25px', paddingRight: '30px' }}>
                  <Link to="/panel-mando" onClick={toggleMenu} style={{
                    color: 'var(--color-principal)', border: '1px solid var(--color-principal)',
                    padding: '12px', display: 'block', textAlign: 'center',
                    background: 'rgba(0,255,65,0.1)', fontWeight: 'bold', textDecoration: 'none'
                  }}>
                    ⚡ PANEL DE MANDO
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around' }}>
              {['#00ff41', '#ff4444', '#ffb100', '#00d4ff'].map(c => (
                <div key={c} onClick={() => setTema(c)} style={{
                  background: c, width: '22px', height: '22px', borderRadius: '50%', 
                  cursor: 'pointer', border: '2px solid white'
                }}></div>
              ))}
            </div>
            <ControlMusica />
            {userAuth && (
              <button onClick={cerrarSesion} style={{
                background: 'transparent', border: '1px solid #ff4444', color: '#ff4444',
                padding: '10px', cursor: 'pointer', textTransform: 'uppercase', fontFamily: 'monospace'
              }}>
                Finalizar Turno
              </button>
            )}
          </div>
        </nav>

        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={
              <div className="home-layout">
                <Indice userAuth={userAuth} stats={stats} /> 
                <Hero userAuth={userAuth} />
              </div>
            } />
            <Route path="/acceso" element={<SeccionUsuarios setAuth={actualizarAuth} />} />
            <Route path="/panel-mando" element={<PanelAdmin />} />
            <Route path="/expedientes" element={<Expedientes userAuth={userAuth} />} /> 
            <Route path="/lugares" element={<Lugares />} />
            <Route path="/videos" element={<Videos userAuth={userAuth} />} />
            <Route path="/galeria" element={<Galeria userAuth={userAuth} />} />
            
            {/* NUEVA RUTA CONECTADA */}
            <Route path="/archivos-usuarios" element={<ArchivosUsuarios />} />
            
            <Route path="/leer-historia/:id" element={<LecturaHistoria />} />
            <Route path="/chat" element={<Chat usuarioActivo={userAuth} />} />
            <Route path="/chat-ia" element={<ChatIA />} />
            <Route path="/noticias" element={<Noticias userAuth={userAuth} />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;