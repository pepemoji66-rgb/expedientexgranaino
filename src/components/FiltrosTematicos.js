import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './FiltrosTematicos.css';

const BOTONES_FILTRO = [
    { id: 'todos', label: 'TODOS' },
    { id: 'ovnis', label: 'OVNIS Y EXPEDIENTES' },
    { id: 'noticias', label: 'NOTICIAS' },
    { id: 'cronica_negra', label: 'CRÓNICA NEGRA' },
    { id: 'misterios', label: 'MISTERIOS HISTÓRICOS' },
    { id: 'galeria', label: 'GALERÍA VISUAL', isShortcut: true }
];

const FiltrosTematicos = ({ filtroActivo = 'todos', onFiltroChange, hideShortcut = false }) => {
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

    const botonesVisibles = hideShortcut 
        ? BOTONES_FILTRO.filter(b => !b.isShortcut)
        : BOTONES_FILTRO;

    return (
        <div className="filtros-tematicos-container">
            <div className="filtros-carrusel-scroll">
                <div className="filtros-buttons-wrapper">
                    {botonesVisibles.map((item) => {
                        const isSelected = filtroActivo === item.id || (!hideShortcut && item.id === 'galeria' && location.pathname === '/galeria');
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
