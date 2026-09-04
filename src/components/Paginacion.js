import React, { useState } from 'react';
import { safeLocalStorage } from '../utils/storage';
import './Paginacion.css';

/**
 * Componente de paginación reutilizable para el Búnker.
 * Muestra botones de página numerados con elipsis (...) para rangos grandes.
 * Incluye campo "Ir a página" para saltar directamente a cualquier página.
 * Guarda la página actual en sessionStorage para restaurarla al volver atrás.
 *
 * Props:
 *   paginaActual - Número de página actual (1-indexed)
 *   totalPaginas  - Total de páginas
 *   onChange      - Callback (nuevaPagina) => void
 *   storageKey    - Clave para sessionStorage (ej: 'page_expedientes')
 *   scrollToTop   - Si debe hacer scroll arriba al cambiar (default: true)
 */
const Paginacion = ({ paginaActual, totalPaginas, onChange, storageKey, scrollToTop = true }) => {
    const [inputPagina, setInputPagina] = useState('');

    if (totalPaginas <= 1) return null;

    const cambiarPagina = (nuevaPagina) => {
        if (nuevaPagina < 1 || nuevaPagina > totalPaginas || nuevaPagina === paginaActual) return;
        onChange(nuevaPagina);
        if (storageKey) {
            try { sessionStorage.setItem(storageKey, String(nuevaPagina)); } catch (e) { /* ignore */ }
        }
        if (scrollToTop) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const irAPagina = () => {
        const num = parseInt(inputPagina, 10);
        if (!isNaN(num) && num >= 1 && num <= totalPaginas) {
            cambiarPagina(num);
            setInputPagina('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') irAPagina();
    };

    // Genera los números de página visibles con elipsis
    const generarPaginas = () => {
        const paginas = [];
        const maxVisible = 7; // Máximo de botones numéricos visibles

        if (totalPaginas <= maxVisible) {
            // Mostrar todas las páginas
            for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
        } else {
            // Siempre mostrar la primera
            paginas.push(1);

            if (paginaActual > 3) {
                paginas.push('...');
            }

            // Rango alrededor de la página actual
            const inicio = Math.max(2, paginaActual - 1);
            const fin = Math.min(totalPaginas - 1, paginaActual + 1);

            for (let i = inicio; i <= fin; i++) {
                paginas.push(i);
            }

            if (paginaActual < totalPaginas - 2) {
                paginas.push('...');
            }

            // Siempre mostrar la última
            paginas.push(totalPaginas);
        }

        return paginas;
    };

    const paginas = generarPaginas();

    return (
        <div className="paginacion-bunker-v2">
            <button
                className="pag-btn pag-nav"
                disabled={paginaActual === 1}
                onClick={() => cambiarPagina(paginaActual - 1)}
                title="Página anterior"
            >
                ◀ ATRÁS
            </button>

            <div className="pag-numeros">
                {paginas.map((p, idx) =>
                    p === '...' ? (
                        <span key={`dots-${idx}`} className="pag-dots">···</span>
                    ) : (
                        <button
                            key={p}
                            className={`pag-btn pag-num ${p === paginaActual ? 'pag-activa' : ''}`}
                            onClick={() => cambiarPagina(p)}
                            disabled={p === paginaActual}
                        >
                            {p}
                        </button>
                    )
                )}
            </div>

            <button
                className="pag-btn pag-nav"
                disabled={paginaActual === totalPaginas}
                onClick={() => cambiarPagina(paginaActual + 1)}
                title="Página siguiente"
            >
                SIGUIENTE ▶
            </button>

            {/* Campo para saltar directamente a cualquier página */}
            {totalPaginas > 7 && (
                <div className="pag-ir-a" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'monospace' }}>Ir a:</span>
                    <input
                        type="number"
                        min="1"
                        max={totalPaginas}
                        value={inputPagina}
                        onChange={(e) => setInputPagina(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Pág."
                        style={{
                            width: '55px',
                            padding: '6px 8px',
                            background: '#111',
                            border: '1px solid #444',
                            color: '#fff',
                            fontSize: '0.8rem',
                            fontFamily: 'monospace',
                            borderRadius: '3px',
                            textAlign: 'center'
                        }}
                    />
                    <button
                        onClick={irAPagina}
                        style={{
                            padding: '6px 10px',
                            background: 'var(--color-principal)',
                            color: '#000',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            fontFamily: 'monospace'
                        }}
                    >
                        ▶
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * Hook para leer la página guardada en sessionStorage.
 * Usar: const paginaInicial = usePaginaGuardada('page_expedientes');
 */
export const getPaginaGuardada = (storageKey) => {
    try {
        const saved = sessionStorage.getItem(storageKey);
        if (saved) {
            const num = parseInt(saved, 10);
            if (!isNaN(num) && num >= 1) return num;
        }
    } catch (e) { /* ignore */ }
    return 1;
};

export default Paginacion;

