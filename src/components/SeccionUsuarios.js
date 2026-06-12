import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Forms from './Forms';
import API_BASE_URL from '../config';
import { safeLocalStorage } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';

const Seccionusuarios = ({ setAuth }) => {
    const { t, language } = useLanguage();
    const [esLogin, setEsLogin] = useState(true);
    const [datos, setDatos] = useState({
        nombre: '',
        email: '',
        password: '',
        ciudad: '',
        edad: ''
    });
    const [cargando, setCargando] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setCargando(true);

        // AJUSTE TÁCTICO: Sincronizamos con las rutas modulares del backend (/api/auth)
        const url = esLogin 
            ? `${API_BASE_URL}/api/auth/login-agente` 
            : `${API_BASE_URL}/api/auth/registro`;

        try {
            const res = await axios.post(url, datos);

            if (esLogin) {
                alert(t('successAuth') + ": " + (res.data.usuario?.nombre || "Agente Operativo"));

                if (setAuth) {
                    setAuth(res.data.usuario);
                    safeLocalStorage.setItem('agente_sesion', JSON.stringify(res.data.usuario));
                }
                navigate('/');
            } else {
                alert(t('successReg'));
                setEsLogin(true);
            }

            // Limpieza de datos
            setDatos({ nombre: '', email: '', password: '', ciudad: '', edad: '' });

        } catch (err) {
            console.error("Error en la conexión:", err);
            const msgError = err.response?.data?.mensaje || err.response?.data?.error || t('errorFallen');
            alert(`❌ ERROR: ${msgError}`);
        } finally {
            setCargando(false);
        }
    };

    const toggleModo = () => {
        setEsLogin(!esLogin);
        setDatos({ nombre: '', email: '', password: '', ciudad: '', edad: '' });
    };

    return (
        <div className="seccion-usuarios fade-in">
            <Forms
                title={esLogin ? t('loginTitle') : t('registerTitle')}
                subtitle={esLogin ? t('loginSubtitle') : t('registerSubtitle')}
                onSubmit={handleSubmit}
                onClear={() => setDatos({ nombre: '', email: '', password: '', ciudad: '', edad: '' })}
                btnText={cargando ? t('loading') : (esLogin ? t('loginTitle') : t('registerTitle'))}
            >
                <div style={{ background: 'rgba(255,177,0,0.1)', border: '1px solid #ffb100', padding: '15px', marginBottom: '20px', borderRadius: '5px', textAlign: 'center' }}>
                    <p style={{ color: '#ffb100', fontSize: '0.8rem', fontFamily: 'monospace', margin: 0 }}>
                        {language === 'en' 
                            ? "⚠️ ATTENTION: Content reading is public. To contribute material, you must register. This helps us filter spam and maintain the rigor of the topics. You can use an alias and a fake email if you want anonymity, but you must be of legal age. City is optional. All contributions will be reviewed by the Administrator."
                            : "⚠️ ATENCIÓN: La lectura de contenido es pública. Para aportar material, debes registrarte. Esto nos permite filtrar spam y mantener el rigor de los temas. Puedes usar un alias y un correo inventado si quieres anonimato, pero es obligatorio ser mayor de edad. La ciudad es opcional. Todas las aportaciones serán revisadas por el Administrador."}
                    </p>
                </div>

                {!esLogin && (
                    <div className="form-group">
                        <label htmlFor="nombre">{t('namePlaceholder')}</label>
                        <input
                            id="nombre"
                            type="text"
                            placeholder={t('namePlaceholder')}
                            value={datos.nombre}
                            onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
                            required
                        />
                    </div>
                )}

                {!esLogin && (
                    <div className="form-group">
                        <label htmlFor="ciudad">{t('cityPlaceholder')}</label>
                        <input
                            id="ciudad"
                            type="text"
                            placeholder={t('cityPlaceholder')}
                            value={datos.ciudad}
                            onChange={(e) => setDatos({ ...datos, ciudad: e.target.value })}
                        />
                    </div>
                )}

                {!esLogin && (
                    <div className="form-group">
                        <label htmlFor="edad">Edad (Debes ser mayor de 18)</label>
                        <input
                            id="edad"
                            type="number"
                            min="18"
                            max="120"
                            placeholder="Tu edad (Mín. 18)"
                            value={datos.edad}
                            onChange={(e) => setDatos({ ...datos, edad: e.target.value })}
                            required
                        />
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="email">{t('emailPlaceholder')}</label>
                    <input
                        id="email"
                        type="email"
                        placeholder={t('emailPlaceholder')}
                        value={datos.email}
                        onChange={(e) => setDatos({ ...datos, email: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">{t('passwordPlaceholder')}</label>
                    <input
                        id="password"
                        type="password"
                        placeholder={t('passwordPlaceholder')}
                        value={datos.password}
                        onChange={(e) => setDatos({ ...datos, password: e.target.value })}
                        required
                    />
                </div>

                <p style={{ textAlign: 'center', color: '#fff', fontSize: '0.85rem', marginTop: '15px' }}>
                    {esLogin ? t('noAccount') : t('hasAccount')}
                    <span
                        onClick={toggleModo}
                        role="button"
                        style={{
                            color: 'var(--color-principal)',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            fontWeight: 'bold'
                        }}
                    >
                        {esLogin ? t('registerLink') : t('loginLink')}
                    </span>
                </p>
            </Forms>
        </div>
    );
};

export default Seccionusuarios;
