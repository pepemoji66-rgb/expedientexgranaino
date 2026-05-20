import React, { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Shield, HardDrive, Map, Users, Calendar, Image as ImageIcon, Video, Lock, Download, Mail, Smartphone } from 'lucide-react';
import './archipeg.css';

const Archipeg = () => {
    const { t, language } = useLanguage();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="archipeg-page fade-in">
            <div className="archipeg-hero">
                <div className="archipeg-badge">PROYECTO SECRETO DESCLASIFICADO</div>
                <h1 className="archipeg-title">ARCHIPEG V3.0</h1>
                <p className="archipeg-subtitle">
                    {language === 'en' 
                        ? "The definitive offline system to organize and protect your digital life without depending on the cloud."
                        : "El sistema offline definitivo para organizar y proteger tu vida digital sin depender de la nube."}
                </p>
            </div>

            <div className="archipeg-main-container">
                {/* SECCIÓN DE PRIVACIDAD Y CONCEPTO */}
                <div className="archipeg-concept-box">
                    <Shield size={48} className="concept-icon" />
                    <h2>{language === 'en' ? "100% PRIVATE & OFFLINE" : "100% PRIVADO Y FUERA DE LA RED"}</h2>
                    <p>
                        {language === 'en'
                            ? "Tired of big tech companies scanning your family and intimate photos in the cloud? Archipeg is designed to run directly from your external hard drive. No internet connection required, no cloud uploads, no spying. Everything stays in your hands."
                            : "¿Cansado de que las grandes corporaciones escaneen tus fotos familiares e íntimas en la nube? Archipeg está diseñado para ejecutarse directamente desde tu disco duro extraíble. Sin internet, sin subidas a la nube, sin espionaje. Todo queda en tus manos."}
                    </p>
                </div>

                {/* CARACTERÍSTICAS TÁCTICAS */}
                <h3 className="section-heading">{language === 'en' ? "TACTICAL FEATURES" : "CARACTERÍSTICAS TÁCTICAS"}</h3>
                <div className="features-grid">
                    <div className="feature-card">
                        <HardDrive className="f-icon" />
                        <h4>{language === 'en' ? "PORTABLE" : "PORTABILIDAD TOTAL"}</h4>
                        <p>{language === 'en' ? "Install it on a USB or External HDD. Take your library anywhere." : "Llévalo en un USB o Disco Duro Externo. Tu biblioteca siempre contigo."}</p>
                    </div>
                    <div className="feature-card">
                        <Calendar className="f-icon" />
                        <h4>{language === 'en' ? "TIMELINE" : "LÍNEA TEMPORAL"}</h4>
                        <p>{language === 'en' ? "Organize perfectly by date, month, and year instantly." : "Organización perfecta por fecha, mes y año de forma instantánea."}</p>
                    </div>
                    <div className="feature-card">
                        <Map className="f-icon" />
                        <h4>{language === 'en' ? "INTERACTIVE MAP" : "MAPA INTERACTIVO"}</h4>
                        <p>{language === 'en' ? "Geolocate your memories in a completely private internal map." : "Geolocaliza tus recuerdos en un mapa interno totalmente privado."}</p>
                    </div>
                    <div className="feature-card">
                        <Users className="f-icon" />
                        <h4>{language === 'en' ? "PEOPLE & EVENTS" : "PERSONAS Y EVENTOS"}</h4>
                        <p>{language === 'en' ? "Tag people and create specific events." : "Etiqueta a personas y crea eventos específicos."}</p>
                    </div>
                </div>

                {/* ZONA DE DESCARGA Y COMPRA */}
                <div className="acquisition-zone">
                    <div className="demo-box">
                        <div className="demo-header">
                            <Download size={28} />
                            <h3>{language === 'en' ? "DOWNLOAD DEMO" : "DESCARGAR VERSIÓN DEMO"}</h3>
                        </div>
                        <p className="demo-desc">
                            {language === 'en' 
                                ? "Try the power of Archipeg for free. Limited to archiving 50 images and 10 videos." 
                                : "Prueba la potencia de Archipeg totalmente gratis. Limitado a archivar 50 imágenes y 10 vídeos."}
                        </p>
                        <a href="mailto:archipegv2@gmail.com?subject=Solicitud DEMO Archipeg" className="btn-demo">
                            {language === 'en' ? "REQUEST DEMO (FREE)" : "SOLICITAR DEMO (GRATIS)"}
                        </a>
                        <small>{language === 'en' ? "* Send us an email and we will reply with the demo." : "* Envíanos un correo y te la mandamos al instante."}</small>
                    </div>

                    <div className="pro-box">
                        <div className="pro-header">
                            <Lock size={28} />
                            <h3>{language === 'en' ? "ARCHIPEG UNLIMITED" : "ARCHIPEG SIN LÍMITES"}</h3>
                            <span className="price-tag">5€</span>
                        </div>
                        <p className="pro-desc">
                            {language === 'en' 
                                ? "Unlock the absolute control of your digital life forever. Single payment, no subscriptions." 
                                : "Desbloquea el control absoluto de tu vida digital para siempre. Pago único, sin suscripciones mensuales."}
                        </p>
                        
                        <div className="payment-instructions">
                            <h4>{language === 'en' ? "HOW TO GET IT:" : "CÓMO CONSEGUIRLO:"}</h4>
                            <ol>
                                <li>
                                    <Mail className="inst-icon" size={18}/> 
                                    {language === 'en' ? "Send an email requesting the PRO version." : "Envía un correo solicitando la versión PRO."}
                                </li>
                                <li>
                                    <Smartphone className="inst-icon" size={18}/> 
                                    {language === 'en' ? "We will reply with secure payment instructions." : "Te responderemos con las instrucciones de pago seguro."}
                                </li>
                                <li>
                                    <Lock className="inst-icon" size={18}/> 
                                    {language === 'en' ? "After verification, we will send the full EXE." : "Tras verificarlo, te enviaremos el EXE completo a tu correo."}
                                </li>
                            </ol>
                        </div>
                    </div>
                </div>

                <div className="archipeg-footer">
                    <p>SYSTEM ENGINEERED BY ARCHIPEG - EXPEDIENTE X GRANAÍNO BASE</p>
                </div>
            </div>
        </div>
    );
};

export default Archipeg;
