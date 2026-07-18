import React from 'react';
import './BuscadorAZ.css';

const ABECEDARIO = [
    'TODOS', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 
    'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 
    'U', 'V', 'W', 'X', 'Y', 'Z', '#'
];

/**
 * Normaliza un título quitando artículos iniciales (El, La, Los, Las, Un, Una)
 * para realizar una búsqueda alfabética natural.
 */
export const obtenerLetraInicial = (titulo) => {
    if (!titulo || typeof titulo !== 'string') return '#';
    let t = titulo.trim().toUpperCase();
    
    // Quitar artículos comunes en español
    t = t.replace(/^(EL|LA|LOS|LAS|UN|UNA|UNOS|UNAS)\s+/, '');
    
    const primera = t.charAt(0);
    if (/[A-ZÑ]/.test(primera)) {
        return primera;
    }
    return '#';
};

/**
 * Función helper para filtrar una lista por palabra clave e inicial alfabética
 */
export const filtrarItemsBunker = (items, busqueda, letraSeleccionada) => {
    if (!Array.isArray(items)) return [];
    
    const query = (busqueda || '').trim().toLowerCase();

    return items.filter(item => {
        const titulo = item.titulo || item.nombre || '';
        const contenido = item.contenido || item.cuerpo || item.descripcion || '';
        const ubicacion = item.ubicacion || '';

        // 1. Filtro por letra inicial
        if (letraSeleccionada && letraSeleccionada !== 'TODOS') {
            const inicial = obtenerLetraInicial(titulo);
            if (letraSeleccionada === '#') {
                if (/[A-ZÑ]/.test(inicial)) return false;
            } else {
                if (inicial !== letraSeleccionada) return false;
            }
        }

        // 2. Filtro por palabra clave
        if (query) {
            const matchTitulo = titulo.toLowerCase().includes(query);
            const matchContenido = contenido.toLowerCase().includes(query);
            const matchUbicacion = ubicacion.toLowerCase().includes(query);
            if (!matchTitulo && !matchContenido && !matchUbicacion) {
                return false;
            }
        }

        return true;
    });
};

const BuscadorAZ = ({ 
    busqueda, 
    onBusquedaChange, 
    letraSeleccionada, 
    onLetraChange, 
    totalResultados,
    placeholder = "Buscar por título, contenido, lugar..."
}) => {

    const handleReset = () => {
        onBusquedaChange('');
        onLetraChange('TODOS');
    };

    const hayFiltroActivo = busqueda || (letraSeleccionada && letraSeleccionada !== 'TODOS');

    return (
        <div className="buscador-az-container">
            <div className="buscador-az-header">
                <div className="buscador-input-wrap">
                    <span className="buscador-icon">🔍</span>
                    <input 
                        type="text"
                        value={busqueda}
                        onChange={(e) => onBusquedaChange(e.target.value)}
                        placeholder={placeholder}
                        className="buscador-input"
                    />
                    {busqueda && (
                        <button type="button" className="btn-clear-input" onClick={() => onBusquedaChange('')}>
                            ✖
                        </button>
                    )}
                </div>

                <div className="buscador-counter-badge">
                    <span>📡 {totalResultados} {totalResultados === 1 ? 'EVIDENCIA' : 'EVIDENCIAS'}</span>
                    {hayFiltroActivo && (
                        <button type="button" className="btn-reset-filtros" onClick={handleReset}>
                            🔄 LIMPIAR FILTROS
                        </button>
                    )}
                </div>
            </div>

            {/* BARRA ALFABÉTICA A-Z */}
            <div className="abecedario-scroll-container">
                <div className="abecedario-bar">
                    {ABECEDARIO.map((letra) => {
                        const isSelected = (letraSeleccionada === letra) || (!letraSeleccionada && letra === 'TODOS');
                        return (
                            <button
                                key={letra}
                                type="button"
                                className={`letra-btn ${isSelected ? 'active' : ''}`}
                                onClick={() => onLetraChange(letra)}
                            >
                                {letra}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default BuscadorAZ;
