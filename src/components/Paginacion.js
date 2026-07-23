import React from 'react';
import { safeLocalStorage } from '../utils/storage';
import './Paginacion.css';

/**
 * Componente de paginación reutilizable para el Búnker.
 * Muestra botones de página numerados con elipsis (...) para rangos grandes.
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
