const express = require('express');
const router = express.Router();

module.exports = (db) => {

    // GET /api/ruleta/aleatorio?categoria=expedientes|casos|misterios|noticias|sorpresa
    router.get('/aleatorio', async (req, res) => {
        try {
            const categoria = (req.query.categoria || 'sorpresa').toLowerCase();

            // Definición de tablas y sus consultas
            const tablas = {
                expedientes: {
                    query: "SELECT id, titulo, contenido, imagen_url, fecha, 'expedientes' AS categoria FROM expedientes WHERE (estado = 'aprobado' OR estado = 'publicado' OR estado = 'publicada' OR estado = 'activo') ORDER BY RAND() LIMIT 1",
                    src: 'expedientes'
                },
                casos: {
                    query: "SELECT id, titulo, contenido, imagen_url, fecha, 'casos' AS categoria FROM casos_abiertos WHERE estado = 'aprobado' ORDER BY RAND() LIMIT 1",
                    src: 'casos'
                },
                misterios: {
                    query: "SELECT id, titulo, contenido, imagen_url, fecha, 'misterios' AS categoria FROM misterios_historicos WHERE estado = 'aprobado' ORDER BY RAND() LIMIT 1",
                    src: 'misterios'
                },
                noticias: {
                    query: "SELECT id, titulo, cuerpo AS contenido, imagen_url, fecha, 'noticias' AS categoria FROM noticias WHERE estado = 'aprobado' ORDER BY RAND() LIMIT 1",
                    src: 'noticias'
                }
            };

            let resultado = null;

            // 15% de probabilidad de incluir el Dossier Especial de Atarfe si es expedientes o sorpresa
            if ((categoria === 'expedientes' || categoria === 'sorpresa') && Math.random() < 0.15) {
                resultado = {
                    id: 'atarfe-dossier',
                    titulo: '🛸 DOSSIER ESPECIAL: Avistamiento OVNI de Atarfe y Albolote',
                    contenido: 'Investigación técnica de campo, mapa interactivo, testimonios de testigos y expediente desclasificado completo del histórico avistamiento OVNI registrado en el sector de Atarfe (Granada).',
                    imagen_url: 'assets/ovni-mulhacen-1958.png',
                    categoria: 'expedientes',
                    fecha: new Date().toISOString(),
                    src: 'especial-atarfe'
                };
            } else if (categoria === 'sorpresa') {
                // Elegir una tabla al azar
                const claves = Object.keys(tablas);
                const tablaAleatoria = claves[Math.floor(Math.random() * claves.length)];
                const config = tablas[tablaAleatoria];
                const rows = await db.query(config.query);
                if (rows && rows.length > 0) {
                    resultado = rows[0];
                    resultado.src = config.src;
                }
            } else {
                const config = tablas[categoria];
                if (!config) {
                    return res.status(400).json({ error: 'Categoría no válida. Usa: expedientes, casos, misterios, noticias o sorpresa.' });
                }
                const rows = await db.query(config.query);
                if (rows && rows.length > 0) {
                    resultado = rows[0];
                    resultado.src = config.src;
                }
            }

            if (!resultado) {
                return res.status(404).json({ error: 'No se encontraron artículos en esta categoría.' });
            }

            // Truncar contenido a 300 caracteres para la vista previa
            if (resultado.contenido && resultado.contenido.length > 300) {
                // Limpiar HTML básico antes de truncar
                const textoLimpio = resultado.contenido
                    .replace(/<[^>]*>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>');
                resultado.contenido = textoLimpio.substring(0, 300) + '...';
            } else if (resultado.contenido) {
                resultado.contenido = resultado.contenido.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
            }

            res.json(resultado);

        } catch (err) {
            console.error('❌ Error en la Ruleta del Búnker:', err);
            res.status(500).json({ error: 'Error interno al girar la ruleta.' });
        }
    });

    return router;
};
