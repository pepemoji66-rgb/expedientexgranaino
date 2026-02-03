import React from 'react';
import './Indice.css';

const Indice = () => {
    return (
        <div className="indice-container">
            <h1 className="titulo-principal">EXPEDIENTEX GRANAINO</h1>
            <div className="radar-scanner">
                <div className="radar-line"></div>
                <div className="radar-circle c1"></div>
                <div className="radar-circle c2"></div>
                <div className="radar-circle c3"></div>
                <div className="radar-dot"></div>
            </div>
            <p className="radar-status">ESCÁNEO DE ACTIVIDAD PARANORMAL EN CURSO...</p>
        </div>
    );
};

export default Indice;