import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Indice from './components/Indice';
import Hero from './components/Hero';
import SeccionAgentes from './components/SeccionAgentes';
import Experiencias from './components/Experiencias';
import PanelAdmin from './components/PanelAdmin';
import LecturaHistoria from './components/LecturaHistoria';
import Footer from './components/Footer';
import Videos from './components/Videos';
import Galeria from './components/Galeria';
import './App.css';

import fondoAlhambra from './alhambra.jpg';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const [tema, setTema] = useState('#00ff41');

  const ADMIN_EMAIL = 'expedientexpepe@moreno.com';

  const toggleMenu = () => setIsOpen(!isOpen);

  // 1. CARGA DE SESIÓN (Se ejecuta solo una vez al inicio)
  useEffect(() => {
    const sesionGuardada = localStorage.getItem('agente_sesion');
    if (sesionGuardada && !userAuth) { // Solo actualiza si no hay userAuth ya puesto
      try {
        setUserAuth(JSON.parse(sesionGuardada));
      } catch (e) {
        console.error("Error sesión");
      }
    }
  }, []); // Corchetes vacíos aquí también

  // 2. CONTROL DE ATMÓSFERA (Solo cambia cuando el tema cambia)
  useEffect(() => {
    document.documentElement.style.setProperty('--color-principal', tema);
  }, [tema]);

  const actualizarAuth = (datos) => {
    if (datos) {
      localStorage.setItem('agente_sesion', JSON.stringify(datos));
      setUserAuth(datos);
    }
  };

  const accesoMaestro = () => {
    const sesionAdmin = {
      email: ADMIN_EMAIL,
      nombre: 'Pepe Moreno',
      rol: 'admin'
    };
    actualizarAuth(sesionAdmin);
    setIsOpen(false);
    alert("IDENTIFICACIÓN ACEPTADA. BIENVENIDO, JEFE PEPE.");
  };

  const cerrarSesion = () => {
    if (window.confirm("¿FINALIZAR TURNO DE GUARDIA?")) {
      localStorage.removeItem('agente_sesion');
      setUserAuth(null);
      setIsOpen(false);
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
        display: 'flex', flexDirection: 'column'
      }}>

        {/* BOTÓN HAMBURGUESA */}
        <button className={`hamburger-fix ${isOpen ? 'active' : ''}`} onClick={toggleMenu} style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: '2000',
          background: 'rgba(0,0,0,0.8)', border: '1px solid var(--color-principal)',
          color: 'var(--color-principal)', width: '50px', height: '50px', cursor: 'pointer'
        }}>
          {isOpen ? '✕' : '☰'}
        </button>

        {/* MENÚ LATERAL */}
        <nav className={`sidebar-right ${isOpen ? 'open' : ''}`} style={{
          position: 'fixed', top: 0, right: isOpen ? '0' : '-300px',
          width: '300px', height: '100vh', background: 'rgba(0,0,0,0.95)',
          zIndex: '1500', transition: '0.4s', borderLeft: '2px solid var(--color-principal)'
        }}>
          <ul className="nav-links" style={{ listStyle: 'none', padding: '80px 20px' }}>
            <li><Link to="/" onClick={toggleMenu}>INICIO</Link></li>
            <li><Link to="/acceso" onClick={toggleMenu}>ACCESO USUARIOS</Link></li>

            {userAuth && (
              <li style={{ padding: '10px 0', borderBottom: '1px solid rgba(0,255,65,0.2)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-principal)', display: 'block' }}>
                  AGENTE: {userAuth.nombre.toUpperCase()}
                </span>
                <button onClick={cerrarSesion} style={{
                  background: 'none', border: 'none', color: '#ff4444',
                  cursor: 'pointer', display: 'block', padding: '5px 0',
                  font: 'inherit', fontSize: '0.8rem', fontWeight: 'bold'
                }}>
                  ( CERRAR SESIÓN )
                </button>
              </li>
            )}

            <li><Link to="/experiencias" onClick={toggleMenu}>EXPEDIENTES</Link></li>
            <li><Link to="/videos" onClick={toggleMenu}>VIDEOS</Link></li>
            <li><Link to="/galeria" onClick={toggleMenu}>GALERÍA</Link></li>

            <li style={{ margin: '20px 0' }}><hr style={{ opacity: 0.2, borderColor: 'var(--color-principal)' }} /></li>

            {/* PANEL DE MANDO PEPE */}
            {userAuth && (userAuth.email === ADMIN_EMAIL || userAuth.rol === 'admin') && (
              <li>
                <Link to="/panel-mando" onClick={toggleMenu} style={{
                  color: '#ffd700', border: '1px dashed #ffd700',
                  padding: '10px', display: 'block', textAlign: 'center',
                  background: 'rgba(255,215,0,0.1)', fontWeight: 'bold'
                }}>
                  ⚡ PANEL DE MANDO
                </Link>
              </li>
            )}

            <li style={{ marginTop: '10px' }}>
              <label style={{ color: 'var(--color-principal)', fontSize: '0.7rem' }}>ATMÓSFERA:</label>
              <select onChange={(e) => setTema(e.target.value)} value={tema} style={{ width: '100%', background: '#000', color: 'var(--color-principal)', border: '1px solid var(--color-principal)' }}>
                <option value="#00ff41">VERDE MATRIX</option>
                <option value="#ff4444">ROJO ALERTA</option>
                <option value="#ffb100">ÁMBAR ARCHIVO</option>
                <option value="#00d4ff">AZUL ESPECTRO</option>
              </select>
            </li>

            {!userAuth && (
              <li style={{ marginTop: '50px' }}>
                <button onClick={accesoMaestro} style={{ opacity: 0, cursor: 'default' }}>.</button>
              </li>
            )}
          </ul>
        </nav>

        {/* CONTENIDO PRINCIPAL */}
        <main style={{ flex: 1 }}>
          <main style={{ flex: 1 }}>
            <main style={{ flex: 1 }}>
              <Routes>
                <Route path="/" element={<div className="home-layout"><Indice /><Hero /></div>} />
                <Route path="/acceso" element={<SeccionAgentes setAuth={actualizarAuth} />} />

                {/* HEMOS QUITADO EL "userAuth ?" PARA CORTAR EL BUCLE */}
                <Route path="/panel-mando" element={<PanelAdmin />} />
                <Route path="/experiencias" element={<Experiencias />} />
                <Route path="/videos" element={<Videos userAuth={userAuth} />} />
                <Route path="/galeria" element={<Galeria userAuth={userAuth} />} />

                <Route path="/leer-historia/:id" element={<LecturaHistoria />} />
              </Routes>
            </main>
          </main>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;