import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './SobreNosotros.css';

const SobreNosotros = () => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    return (
        <div className="sobre-nosotros-container fade-in">
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        background: 'rgba(0, 212, 255, 0.1)',
                        color: '#00d4ff',
                        border: '1px solid #00d4ff',
                        padding: '8px 18px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem'
                    }}
                >
                    🏠 INICIO
                </button>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: '#111',
                        color: '#ccc',
                        border: '1px solid #333',
                        padding: '8px 18px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        fontFamily: 'monospace',
                        fontSize: '0.75rem'
                    }}
                >
                    ⬅ VOLVER
                </button>
            </div>
            <h1 className="titulo-neon">{t('aboutTitle')}</h1>
            
            <section className="sobre-seccion">
                <h2 className="subtitulo-bunker">{t('aboutWhatIs')}</h2>
                <p>
                    {t('aboutWhatIsDesc1')}
                </p>
                <p>
                    {t('aboutWhatIsDesc2')}
                </p>
            </section>

            <div className="decor-line"></div>

            <section className="sobre-seccion">
                <h2 className="subtitulo-bunker">{t('aboutOrigin')}</h2>
                <div className="perfil-investigador">
                    <div className="perfil-foto-card">
                        <div className="foto-frame-tactico">
                            <img 
                                src="/jose-moreno-investigador.jpg" 
                                alt="José Moreno Jiménez - Fundador e Investigador de Expediente X Granaíno" 
                                className="foto-fundador-bunker" 
                            />
                            <div className="badge-fundador-bunker">
                                <span className="badge-nombre">🛡️ JOSÉ MORENO JIMÉNEZ</span>
                                <span className="badge-cargo">FUNDADOR E INVESTIGADOR JEFE</span>
                            </div>
                        </div>
                    </div>
                    <div className="perfil-info">
                        <p>
                            {t('aboutOriginDesc1')}
                        </p>
                        <p>
                            {t('aboutOriginDesc2')}
                        </p>
                    </div>
                </div>
            </section>

            <section className="sobre-seccion">
                <h2 className="subtitulo-bunker">{t('aboutMethodology')}</h2>
                <p>
                    {t('aboutMethodologyDesc1')}
                </p>
                <p>
                    {t('aboutMethodologyDesc2')}
                </p>
            </section>


            <section className="sobre-seccion stats-bunker">
                <div className="stat-card">
                    <h3>{t('aboutMission')}</h3>
                    <p>{t('aboutMissionDesc')}</p>
                </div>
                <div className="stat-card">
                    <h3>{t('aboutVision')}</h3>
                    <p>{t('aboutVisionDesc')}</p>
                </div>

                <div className="stat-card">
                    <h3>{t('aboutValues')}</h3>
                    <p>{t('aboutValuesDesc')}</p>
                </div>
            </section>

            <div className="contacto-directo">
                <p>{t('aboutContact')}</p>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '10px' }}>
                    <a href="mailto:archipegv2@gmail.com" className="btn-contacto-pro">EMAIL</a>
                    <a href="https://x.com/PEPE1318057" target="_blank" rel="noopener noreferrer" className="btn-contacto-pro" style={{ background: '#000', borderColor: '#333' }}>X (TWITTER)</a>
                    <a href="https://www.instagram.com/expedientexgranaino/" target="_blank" rel="noopener noreferrer" className="btn-contacto-pro" style={{ background: '#e1306c', borderColor: '#c13584' }}>INSTAGRAM</a>
                </div>
            </div>
        </div>
    );
};

export default SobreNosotros;
