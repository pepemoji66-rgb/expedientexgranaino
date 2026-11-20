import React from 'react';
import './BuscadorAZ.css';

const ABECEDARIO = [
    'TODOS', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 
    'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 
    'U', 'V', 'W', 'X', 'Y', 'Z', '#'
];

/**
 * Normaliza un texto para búsquedas: pasa a minúsculas, elimina etiquetas HTML,
 * quita tildes/diéresis y colapsa espacios múltiples.
 */
export const normalizarTextoBusqueda = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

const escaparRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Calcula la puntuación de relevancia de un elemento frente a una consulta de búsqueda.
 * Devuelve 0 si no coincide, o un número > 0 cuanto mayor sea la relevancia:
 * - Prioridad 1 (1000+ pts): Coincidencia exacta de número de expediente / ID (ej: "125", "#125", "id 125", "expediente 125")
 * - Prioridad 2 (200-600 pts): Coincidencia en el título (frase completa o todas las palabras sueltas)
 * - Prioridad 3 (100+ pts): Coincidencia en ubicación / autor / email
 * - Prioridad 4 (10-50 pts): Coincidencia dentro del cuerpo / contenido del artículo
 */
export const calcularRelevanciaBusqueda = (item, rawQuery) => {
    if (!item) return 0;
    const qRaw = String(rawQuery || '').trim();
    if (!qRaw) return 1;

    const itemIdStr = String(item.id ?? item._id ?? '').trim();
    const tituloNorm = normalizarTextoBusqueda(item.titulo || item.nombre || item.nombre_usuario || '');
    const ubicacionNorm = normalizarTextoBusqueda(
        [item.ubicacion, item.ciudad, item.email, item.usuario_nombre, item.autor].filter(Boolean).join(' ')
    );
    const contenidoNorm = normalizarTextoBusqueda(
        item.contenido || item.cuerpo || item.descripcion || item.mensaje || ''
    );

    // 1. Detectar si el usuario busca un número de expediente / ID (ej: "45", "#45", "id 45", "expediente 45", "caso 45")
    const matchIdQuery = qRaw.match(/^(?:#|id[:\s#]*|exp(?:ediente)?[:\s#]*|caso[:\s#]*|misterio[:\s#]*|noticia[:\s#]*|registro[:\s#]*)?(\d+)$/i);
    if (matchIdQuery) {
        const idBuscado = matchIdQuery[1];
        const tienePrefijoExplicito = /^#|^(?:id|exp|caso|misterio|noticia|registro)/i.test(qRaw);

        if (itemIdStr === idBuscado) {
            return 1000; // Coincidencia exacta de ID
        }
        if (tienePrefijoExplicito) {
            // Si puso expresamente "#45" o "ID 45", buscar solo por ID o mención literal del número en el título
            if (itemIdStr.startsWith(idBuscado)) return 600;
            if (tituloNorm.includes(idBuscado)) return 300;
            return 0;
        }
        // Si puso solo el número "45", priorizar ID que empiece por 45, luego título, luego contenido
        if (itemIdStr.startsWith(idBuscado)) return 550;
        if (tituloNorm.includes(idBuscado)) return 300;
        if (contenidoNorm.includes(idBuscado)) return 40;
        return 0;
    }

    // 2. Búsqueda textual inteligente (insensible a tildes y soporta varias palabras salteadas)
    const qNorm = normalizarTextoBusqueda(qRaw);
    if (!qNorm) return 1;

    const tokens = qNorm.split(' ').filter(Boolean);
    const textoCompleto = `${itemIdStr} ${tituloNorm} ${ubicacionNorm} ${contenidoNorm}`;

    // Todas las palabras buscadas deben existir en algún lugar del registro
    for (const tok of tokens) {
        const tokLimpio = tok.replace(/^#/, '');
        if (!tokLimpio) continue;
        if (!textoCompleto.includes(tokLimpio)) {
            return 0;
        }
    }

    let score = 10;

    // Coincidencia exacta o de frase en el título
    if (tituloNorm === qNorm) {
        score += 500;
    } else if (tituloNorm.startsWith(qNorm)) {
        score += 350;
    } else if (tituloNorm.includes(qNorm)) {
        score += 250;
    }

    // Evaluar cuántas de las palabras buscadas están en el título
    let tokensEnTitulo = 0;
    let tokensEnUbicacion = 0;
    for (const tok of tokens) {
        const tokLimpio = tok.replace(/^#/, '');
        if (!tokLimpio) continue;

        if (itemIdStr === tokLimpio) {
            score += 400;
        }

        if (tituloNorm.includes(tokLimpio)) {
            tokensEnTitulo++;
            score += 45;
            // Bonus si coincide como palabra completa dentro del título
            const regexPalabra = new RegExp(`(^|\\s|[^a-z0-9])${escaparRegExp(tokLimpio)}($|\\s|[^a-z0-9])`);
            if (regexPalabra.test(tituloNorm)) {
                score += 25;
            }
        }

        if (ubicacionNorm.includes(tokLimpio)) {
            tokensEnUbicacion++;
            score += 30;
        }
    }

    if (tokens.length > 0 && tokensEnTitulo === tokens.length) {
        score += 180; // Todas las palabras buscadas están en el título
    }
    if (tokens.length > 0 && tokensEnUbicacion === tokens.length) {
        score += 90;
    }
    if (contenidoNorm.includes(qNorm)) {
        score += 25; // Frase exacta dentro del contenido
    }

    return score;
};

/**
 * Normaliza un título quitando signos de apertura y artículos iniciales (El, La, Los, Las, Un, Una)
 * para realizar una búsqueda alfabética natural (incluyendo vocales con tilde).
 */
export const obtenerLetraInicial = (titulo) => {
    if (!titulo || typeof titulo !== 'string') return '#';
    let t = titulo
        .trim()
        .replace(/^[¿¡"'«»“”‘’(\[-]+\s*/, '')
        .toUpperCase();

    // Normalizar vocales acentuadas conservando la Ñ
    t = t
        .replace(/[ÁÀÄÂ]/g, 'A')
        .replace(/[ÉÈËÊ]/g, 'E')
        .replace(/[ÍÌÏÎ]/g, 'I')
        .replace(/[ÓÒÖÔ]/g, 'O')
        .replace(/[ÚÙÜÛ]/g, 'U');

    // Quitar artículos comunes en español
    t = t.replace(/^(EL|LA|LOS|LAS|UN|UNA|UNOS|UNAS)\s+/, '').trim();

    const primera = t.charAt(0);
    if (/[A-ZÑ]/.test(primera)) {
        return primera;
    }
    return '#';
};

/**
 * Función helper para filtrar y ordenar una lista por palabra clave / ID e inicial alfabética
 */
export const filtrarItemsBunker = (items, busqueda, letraSeleccionada) => {
    if (!Array.isArray(items)) return [];

    const query = (busqueda || '').trim();

    const filtrados = [];

    items.forEach((item, index) => {
        const titulo = item.titulo || item.nombre || '';

        // 1. Filtro por letra inicial
        if (letraSeleccionada && letraSeleccionada !== 'TODOS') {
            const inicial = obtenerLetraInicial(titulo);
            if (letraSeleccionada === '#') {
                if (/[A-ZÑ]/.test(inicial)) return;
            } else {
                if (inicial !== letraSeleccionada) return;
            }
        }

        // 2. Filtro por palabra clave o ID
        if (query) {
            const relevancia = calcularRelevanciaBusqueda(item, query);
            if (relevancia <= 0) return;
            filtrados.push({ item, relevancia, index });
        } else {
            filtrados.push({ item, relevancia: 1, index });
        }
    });

    // Si hay una búsqueda activa, ordenar por relevancia (ID -> Título -> Contenido) manteniendo orden original en empates
    if (query) {
        filtrados.sort((a, b) => {
            if (b.relevancia !== a.relevancia) return b.relevancia - a.relevancia;
            return a.index - b.index;
        });
    }

    return filtrados.map(entry => entry.item);
};

const BuscadorAZ = ({ 
    busqueda, 
    onBusquedaChange, 
    letraSeleccionada, 
    onLetraChange, 
    totalResultados,
    placeholder = "Buscar por título, nº de expediente (#ID), contenido, lugar..."
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
                    <span>{totalResultados} {totalResultados === 1 ? 'ARTÍCULO' : 'ARTÍCULOS'}</span>
                    {hayFiltroActivo && (
                        <button type="button" className="btn-reset-filtros" onClick={handleReset}>
                            LIMPIAR FILTROS
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
