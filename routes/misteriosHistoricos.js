const express = require('express');
const router = express.Router();
const db = require('../db');

module.exports = (upload) => {
    // --- OBTENER TODOS LOS MISTERIOS ---
    router.get('/', async (req, res) => {
        try {
            const misterios = await db.query("SELECT * FROM misterios_historicos WHERE estado = 'aprobado' ORDER BY fecha DESC");
            res.json(misterios);
        } catch (err) {
            console.error("❌ Error al obtener Misterios Históricos:", err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    // --- OBTENER TODOS LOS MISTERIOS (PARA ADMIN/EDICIÓN) ---
    router.get('/todos', async (req, res) => {
        try {
            const misterios = await db.query("SELECT * FROM misterios_historicos ORDER BY fecha DESC");
            res.json(misterios);
        } catch (err) {
            console.error("❌ Error al obtener todos los Misterios:", err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    // --- OBTENER MISTERIO POR ID ---
    router.get('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const misterios = await db.query("SELECT * FROM misterios_historicos WHERE id = ?", [id]);
            if (misterios.length === 0) {
                return res.status(404).json({ error: "Misterio no encontrado" });
            }
            res.json(misterios[0]);
        } catch (err) {
            console.error("❌ Error al obtener Misterio Histórico:", err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    // --- SUBIR UN MISTERIO ---
    router.post('/', upload ? upload.single('imagen') : (req, res, next) => next(), async (req, res) => {
        const { titulo, contenido, titulo_en, contenido_en, latitud, longitud } = req.body;
        const imagen_url = req.file ? (req.file.path || req.file.filename) : (req.body.imagen_url || null);
        
        if (!titulo || !contenido) {
            return res.status(400).json({ error: "Título y contenido son obligatorios." });
        }

        try {
            const query = `
                INSERT INTO misterios_historicos 
                (titulo, contenido, titulo_en, contenido_en, latitud, longitud, imagen_url, estado) 
                VALUES (?, ?, ?, ?, ?, ?, ?, 'aprobado')
            `;
            const valores = [titulo, contenido, titulo_en || null, contenido_en || null, latitud || 0, longitud || 0, imagen_url || null];
            
            await db.execute(query, valores);

            // 📸 AUTO-GALERÍA: Si hay imagen, la insertamos en la galería
            if (imagen_url) {
                try {
                    const sqlGaleria = "INSERT INTO imagenes (titulo, url_imagen, agente, descripcion, latitud, longitud, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, 'publica', NOW())";
                    await db.execute(sqlGaleria, [
                        titulo || 'Evidencia de Misterio Histórico',
                        imagen_url,
                        'Sistema',
                        `Imagen del misterio histórico: ${titulo || ''}`,
                        latitud || 0,
                        longitud || 0
                    ]);
                    console.log('📸 Imagen de misterio histórico añadida automáticamente a la galería.');
                } catch (galErr) {
                    console.warn('⚠️ No se pudo auto-insertar en galería (misterio):', galErr.message);
                }
            }

            res.status(201).json({ mensaje: "Misterio Histórico registrado con éxito." });
        } catch (err) {
            console.error("❌ Error al registrar Misterio Histórico:", err);
            res.status(500).json({ error: "Error interno del servidor" });
        }
    });

    // --- EDITAR UN MISTERIO ---
    router.put('/:id', upload ? upload.single('imagen') : (req, res, next) => next(), async (req, res) => {
        const { id } = req.params;
        const { titulo, contenido, titulo_en, contenido_en, latitud, longitud, fuente_url, url_externa } = req.body;
        const nombreArchivo = req.file ? (req.file.path || req.file.filename) : null;
        
        try {
            let query = "UPDATE misterios_historicos SET titulo = ?, contenido = ?, titulo_en = ?, contenido_en = ?, latitud = ?, longitud = ?, fuente_url = ?";
            let valores = [titulo, contenido, titulo_en || null, contenido_en || null, latitud || 0, longitud || 0, fuente_url || url_externa || null];

            if (nombreArchivo) {
                query += ", imagen_url = ?";
                valores.push(nombreArchivo);
            }

            query += " WHERE id = ?";
            valores.push(id);

            await db.execute(query, valores);

            // 📸 AUTO-GALERÍA: Si hay nueva imagen al editar
            if (nombreArchivo) {
                try {
                    const sqlGaleria = "INSERT INTO imagenes (titulo, url_imagen, agente, descripcion, latitud, longitud, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, 'publica', NOW())";
                    await db.execute(sqlGaleria, [
                        titulo || 'Evidencia de Misterio Histórico',
                        nombreArchivo,
                        'Sistema',
                        `Imagen actualizada del misterio: ${titulo || ''}`,
                        latitud || 0,
                        longitud || 0
                    ]);
                } catch (galErr) {
                    console.warn('⚠️ No se pudo auto-insertar en galería (edición misterio):', galErr.message);
                }
            }

            res.json({ mensaje: "Misterio actualizado con éxito." });
        } catch (err) {
            console.error("❌ Error al actualizar Misterio Histórico:", err);
            res.status(500).json({ error: "Error interno" });
        }
    });

    // --- ELIMINAR MISTERIO ---
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await db.execute("DELETE FROM misterios_historicos WHERE id = ?", [id]);
            res.json({ mensaje: "Misterio eliminado con éxito." });
        } catch (err) {
            console.error("❌ Error al eliminar Misterio Histórico:", err);
            res.status(500).json({ error: "Error interno" });
        }
    });

    // --- APROBAR MISTERIO ---
    router.put('/aprobar/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await db.execute("UPDATE misterios_historicos SET estado = 'aprobado' WHERE id = ?", [id]);
            res.json({ mensaje: "Misterio aprobado con éxito." });
        } catch (err) {
            console.error("❌ Error al aprobar Misterio Histórico:", err);
            res.status(500).json({ error: "Error interno" });
        }
    });

    return router;
};
