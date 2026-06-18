const express = require('express');
const router = express.Router();
const db = require('../db');

module.exports = (upload) => {
    // --- OBTENER TODOS LOS CASOS (PÚBLICOS) ---
    router.get('/', async (req, res) => {
        try {
            const casos = await db.query("SELECT * FROM casos_abiertos WHERE estado = 'aprobado' ORDER BY fecha DESC");
            res.json(casos);
        } catch (err) {
            console.error("❌ Error al obtener Casos Abiertos:", err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    // --- OBTENER TODOS LOS CASOS (PARA ADMIN/EDICIÓN) ---
    router.get('/todos', async (req, res) => {
        try {
            const casos = await db.query("SELECT * FROM casos_abiertos ORDER BY fecha DESC");
            res.json(casos);
        } catch (err) {
            console.error("❌ Error al obtener todos los Casos Abiertos:", err);
            res.status(500).json({ error: "Error en el servidor" });
        }
    });

    // --- SUBIR UN CASO ABIERTO ---
    router.post('/', upload ? upload.single('imagen') : (req, res, next) => next(), async (req, res) => {
        const { titulo, contenido, titulo_en, contenido_en, latitud, longitud } = req.body;
        const imagen_url = req.file ? (req.file.path || req.file.filename) : (req.body.imagen_url || null);
    
    if (!titulo || !contenido) {
        return res.status(400).json({ error: "Título y contenido son obligatorios." });
    }

    try {
        const query = `
            INSERT INTO casos_abiertos 
            (titulo, contenido, titulo_en, contenido_en, latitud, longitud, imagen_url, estado) 
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')
        `;
        const valores = [titulo, contenido, titulo_en || null, contenido_en || null, latitud || 0, longitud || 0, imagen_url || null];
        
        await db.execute(query, valores);
        res.status(201).json({ mensaje: "Caso Abierto registrado con éxito." });
    } catch (err) {
        console.error("❌ Error al registrar Caso Abierto:", err);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

    // --- EDITAR UN CASO ABIERTO ---
    router.put('/:id', upload ? upload.single('imagen') : (req, res, next) => next(), async (req, res) => {
        const { id } = req.params;
    const { titulo, contenido, titulo_en, contenido_en, latitud, longitud, ubicacion, url_externa, fuente_url } = req.body;
    
    // Check if there is an image uploaded
    const nombreArchivo = req.file ? (req.file.path || req.file.filename) : null;
    
    try {
        let query = "UPDATE casos_abiertos SET titulo = ?, contenido = ?, titulo_en = ?, contenido_en = ?, latitud = ?, longitud = ?, fuente_url = ?";
        let valores = [titulo, contenido, titulo_en || null, contenido_en || null, latitud || 0, longitud || 0, fuente_url || url_externa || null];

        if (nombreArchivo) {
            query += ", imagen_url = ?";
            valores.push(nombreArchivo);
        }

        query += " WHERE id = ?";
        valores.push(id);

        await db.execute(query, valores);
        res.json({ mensaje: "Caso actualizado con éxito." });
    } catch (err) {
        console.error("❌ Error al actualizar Caso Abierto:", err);
        res.status(500).json({ error: "Error interno" });
    }
});

    // --- ELIMINAR CASO ABIERTO ---
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await db.execute("DELETE FROM casos_abiertos WHERE id = ?", [id]);
            res.json({ mensaje: "Caso eliminado con éxito." });
        } catch (err) {
            console.error("❌ Error al eliminar Caso Abierto:", err);
            res.status(500).json({ error: "Error interno" });
        }
    });

    // --- APROBAR CASO ABIERTO ---
    router.put('/aprobar/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await db.execute("UPDATE casos_abiertos SET estado = 'aprobado' WHERE id = ?", [id]);
            res.json({ mensaje: "Caso aprobado con éxito." });
        } catch (err) {
            console.error("❌ Error al aprobar Caso Abierto:", err);
            res.status(500).json({ error: "Error interno" });
        }
    });

    return router;
};
