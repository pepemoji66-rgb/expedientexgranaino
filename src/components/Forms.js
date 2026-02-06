import React from 'react';
import './forms.css'; // Aquí es donde tienes el CSS que me acabas de mandar

const Forms = ({ title, subtitle, children, onSubmit, onClear }) => {
    return (
        <div className="forms-overlay fade-in">
            <div className="forms-container">
                {/* Cabecera usando tus clases */}
                <h2 className="forms-title">{title}</h2>
                {subtitle && <p className="forms-subtitle">{subtitle}</p>}

                {/* Formulario que acepta imágenes */}
                <form onSubmit={onSubmit} encType="multipart/form-data">
                    
                    {/* Aquí caen los inputs de Noticias, Login, etc. */}
                    {children}
                    
                    {/* Botonera usando tus nombres de clase */}
                    <div className="forms-actions">
                        <button type="submit" className="forms-btn-submit">
                            ENVIAR SEÑAL
                        </button>
                        
                        <div className="forms-row">
                            <button type="button" className="forms-btn-clear" onClick={onClear}>
                                ABORTAR
                            </button>
                            {/* He añadido el botón home por si lo necesitas, si no, se puede quitar */}
                            <button type="button" className="forms-btn-home" onClick={() => window.location.href='/'}>
                                INICIO
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Forms;