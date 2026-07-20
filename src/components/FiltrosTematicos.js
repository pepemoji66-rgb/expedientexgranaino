import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FiltrosTematicos.css';

const BOTONES_FILTRO = [
    { id: 'todos', label: 'TODOS' },
    { id: 'ovnis', label: 'OVNIS' },
    { id: 'cronica_negra', label: 'CRÓNICA NEGRA' },
    { id: 'misterios', label: 'MISTERIOS HISTÓRICOS' },
    { id: 'galeria', label: 'GALERÍA VISUAL', isShortcut: true }
];

const FiltrosTematicos = ({ filtroActivo = 'todos', onFiltroChange }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleButtonClick = (item) => {
        if (item.isShortcut) {
            if (location.pathname !== '/galeria') {
                navigate('/galeria');
                return;
            }
        }
        if (onFiltroChange) {
            onFiltroChange(item.id);
        }
    };

    return (
        <div className="filtros-tematicos-container">
            <div className="filtros-carrusel-scroll">
                <div className="filtros-buttons-wrapper">
                    {BOTONES_FILTRO.map((item) => {
                        const isSelected = filtroActivo === item.id || (item.id === 'galeria' && location.pathname === '/galeria');
                        return (
                            <button
                                key={item.id}
                                type="button"
                                className={`btn-filtro-tematico ${isSelected ? 'active' : ''} ${item.isShortcut ? 'btn-shortcut-galeria' : ''}`}
                                onClick={() => handleButtonClick(item)}
                            >
                                <span className="btn-filtro-text">{item.label}</span>
                                <div className="glow-line-bottom"></div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FiltrosTematicos;
