import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero = ({ userAuth }) => {
    return (
        <section className="hero-container">
            <div className="hero-content">
                
                {/* POEMA PRINCIPAL */}
                <div className="poema-container">
                    <p className="poema-linea">Bajo el embrujo de una noche sin fin,</p>
                    <p className="poema-linea">donde las sombras bailan en el Albaicín,</p>
                    <p className="poema-linea">la Alhambra suspira secretos, mudo temor.<br /></p>
                    <p className="poema-linea">¡Bienvenido al búnker, buscador del horror!</p>
                </div>

                {/* INFORMACIÓN DE ACCESO PARA EL USUARIO */}
                <div className="seccion-informativa">
                    {!userAuth ? (
                        <div className="nota-informativa" style={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            border: '1px solid var(--color-principal)',
                            padding: '20px',
                            borderRadius: '10px',
                            boxShadow: '0 0 15px rgba(0,0,0,0.5)'
                        }}>
                            <p className="texto-serio" style={{ marginBottom: '10px' }}>
                                Usted está accediendo como <strong style={{color: 'var(--color-principal)'}}>Visitante</strong>. 
                                Las secciones de consulta están disponibles para su visualización libre.
                            </p>
                            <p className="texto-serio">
                                Para participar activamente o aportar sus hallazgos, 
                                es necesario completar el {' '}
                                <Link to="/acceso" style={{ 
                                    color: 'var(--color-principal)', 
                                    fontWeight: 'bold',
                                    textDecoration: 'underline',
                                    textTransform: 'uppercase'
                                }}>
                                    Registro de Usuario
                                </Link>.
                            </p>
                        </div>
                    ) : (
                        <div className="estado-sesion" style={{
                            border: '1px solid var(--color-principal)',
                            padding: '15px',
                            background: 'rgba(0, 255, 65, 0.05)'
                        }}>
                            <p>Sesión activa: <strong style={{color: 'var(--color-principal)'}}>{userAuth.nombre}</strong></p>
                        </div>
                    )}
                </div>

            </div>
        </section>
    );
};

export default Hero;