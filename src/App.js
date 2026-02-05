import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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

import './App.css';
import fondoAlhambra from './alhambra.jpg';

// --- 1. COMPONENTE DE MÚSICA ---
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
      audioRef.current.play().catch(e => console.log("Interacción necesaria para audio."));
    }
    setSonando(!sonando);
  };

  return (
    <button 
      onClick={toggleMusica} 
      style={{
        background: 'transparent',
        color: 'var(--color-principal)',
        border: '1px solid var(--color-principal)',
        padding: '8px 12px',
        cursor: 'pointer',
        fontFamily: 'monospace',
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        width: '100%'
      }}
    >
      {sonando ? '🔈 AMBIENTE ON' : '🔊 MÚSICA OFF'}
    </button>
  );
};

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const [tema, setTema] = useState('#00ff41');

  const ADMIN_EMAIL = 'expedientexpepe@moreno.com';

  const toggleMenu = () => setIsOpen(!isOpen);

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
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-principal', tema);
  }, [tema]);

  const actualizarAuth = (datos) => {
    if (datos) {
      localStorage.setItem('usuario_sesion', JSON.stringify(datos));
      setUserAuth(datos);
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
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        display: 'flex', 
        flexDirection: 'column'
      }}>

        {/* BOTÓN HAMBURGUESA */}
        <button onClick={toggleMenu} style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: '2000',
          background: 'rgba(0,0,0,0.8)', border: '1px solid var(--color-principal)',
          color: 'var(--color-principal)', width: '50px', height: '50px', cursor: 'pointer',
          borderRadius: '5px', fontSize: '20px'
        }}>
          {isOpen ? '✕' : '☰'}
        </button>

        {/* BARRA LATERAL (SIDEBAR) */}
        <nav style={{
          position: 'fixed', top: 0, right: isOpen ? '0' : '-300px',
          width: '300px', height: '100vh', background: 'rgba(0,0,0,0.95)',
          zIndex: '1500', transition: '0.4s', borderLeft: '2px solid var(--color-principal)',
          display: 'flex', flexDirection: 'column'
        }}>
          
          {/* ENLACES SUPERIORES */}
          <div style={{ flexGrow: 1, paddingTop: '80px', paddingLeft: '30px' }}>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '20px' }}><Link to="/" onClick={toggleMenu} style={{ color: 'white', textDecoration: 'none', textTransform: 'uppercase' }}>Inicio</Link></li>
              <li style={{ marginBottom: '20px' }}><Link to="/galeria" onClick={toggleMenu} style={{ color: 'white', textDecoration: 'none', textTransform: 'uppercase' }}>Galería</Link></li>
              <li style={{ marginBottom: '20px' }}><Link to="/videos" onClick={toggleMenu} style={{ color: 'white', textDecoration: 'none', textTransform: 'uppercase' }}>Vídeos</Link></li>
              <li style={{ marginBottom: '20px' }}><Link to="/expedientes" onClick={toggleMenu} style={{ color: 'white', textDecoration: 'none', textTransform: 'uppercase' }}>Expedientes</Link></li>
              <li style={{ marginBottom: '20px' }}><Link to="/lugares" onClick={toggleMenu} style={{ color: 'white', textDecoration: 'none', textTransform: 'uppercase' }}>Mapa Lugares</Link></li>
              <li style={{ marginBottom: '20px' }}><Link to="/chat" onClick={toggleMenu} style={{ color: 'white', textDecoration: 'none', textTransform: 'uppercase' }}>💬 Chat Táctico</Link></li>
              <li style={{ marginBottom: '20px' }}><Link to="/chat-ia" onClick={toggleMenu} style={{ color: '#00d4ff', textDecoration: 'none', fontWeight: 'bold', textTransform: 'uppercase' }}>🤖 Archivero IA</Link></li>
              
              {userAuth && (userAuth.email === ADMIN_EMAIL || userAuth.rol === 'admin') && (
                <li>
                  <Link to="/panel-mando" onClick={toggleMenu} style={{
                    color: '#ffd700', border: '1px dashed #ffd700', padding: '10px',
                    display: 'block', textAlign: 'center', background: 'rgba(255,215,0,0.1)',
                    fontWeight: 'bold', marginTop: '10px', textDecoration: 'none'
                  }}>
                    ⚡ PANEL DE MANDO
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* PIE DEL MENÚ (CONFIGURACIÓN) */}
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '5px' }}>
              <div onClick={() => setTema('#00ff41')} style={{background:'#00ff41', width:'22px', height:'22px', borderRadius:'50%', cursor:'pointer', border:'2px solid white'}}></div>
              <div onClick={() => setTema('#ff4444')} style={{background:'#ff4444', width:'22px', height:'22px', borderRadius:'50%', cursor:'pointer', border:'2px solid white'}}></div>
              <div onClick={() => setTema('#ffb100')} style={{background:'#ffb100', width:'22px', height:'22px', borderRadius:'50%', cursor:'pointer', border:'2px solid white'}}></div>
              <div onClick={() => setTema('#00d4ff')} style={{background:'#00d4ff', width:'22px', height:'22px', borderRadius:'50%', cursor:'pointer', border:'2px solid white'}}></div>
            </div>

            <ControlMusica />

            {userAuth && (
              <button onClick={cerrarSesion} style={{
                background: 'transparent', border: '1px solid #ff4444', color: '#ff4444',
                padding: '8px', cursor: 'pointer', fontFamily: 'monospace', textTransform: 'uppercase'
              }}>
                Finalizar Turno
              </button>
            )}
          </div>
        </nav>

        {/* CUERPO DE LA WEB */}
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={
              <div className="home-layout">
                <Indice userAuth={userAuth} />
                <Hero userAuth={userAuth} />
              </div>
            } />
            <Route path="/acceso" element={<SeccionUsuarios setAuth={actualizarAuth} />} />
            <Route path="/panel-mando" element={<PanelAdmin />} />
            <Route path="/expedientes" element={<Expedientes userAuth={userAuth} />} /> 
            <Route path="/lugares" element={<Lugares />} />
            <Route path="/videos" element={<Videos userAuth={userAuth} />} />
            <Route path="/galeria" element={<Galeria userAuth={userAuth} />} />
            <Route path="/leer-historia/:id" element={<LecturaHistoria />} />
            <Route path="/chat" element={<Chat usuarioActivo={userAuth} />} />
            <Route path="/chat-ia" element={<ChatIA />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;