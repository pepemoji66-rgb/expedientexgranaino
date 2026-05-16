import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './SobreNosotros.css';

const SobreNosotros = () => {
    const { t } = useLanguage();
    return (
        <div className="sobre-nosotros-container fade-in">
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
