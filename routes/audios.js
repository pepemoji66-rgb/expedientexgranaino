const express = require('express');
const router = express.Router();

// Exportamos una función que recibe 'db' (LibSQL) y 'upload' desde el server.js
module.exports = (db, upload) => {

    // 1. OBTENER TODOS LOS AUDIOS (Para el Panel y la App)
    router.get('/', async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const offset = (page - 1) * limit;

        const sqlData = "SELECT id, titulo, ruta, aprobado, agente, latitud, longitud, fecha_subida, imagen_url FROM audios ORDER BY id DESC LIMIT ? OFFSET ?";
        const sqlCount = "SELECT COUNT(*) as total FROM audios";

        try {
            const countResult = await db.query(sqlCount);
            const results = await db.query(sqlData, [limit, offset]);

            const audiosCorregidos = results.map(audio => ({
                ...audio,
                ruta: audio.ruta && audio.ruta.startsWith('http') ? audio.ruta : `/uploads/audios/${audio.ruta}`
            }));

            res.json({
                data: audiosCorregidos,
                pagination: {
                    totalItems: countResult[0].total,
                    currentPage: page,
                    itemsPerPage: limit
                }
            });
        } catch (err) {
            console.error("❌ ERROR GET AUDIOS:", err);
            res.status(200).json({ data: [], pagination: {} });
        }
    });

    // 1b. OBTENER AUDIOS PÚBLICOS (Para el Mapa)
    router.get('/audios-publicos', async (req, res) => {
        try {
            const sql = "SELECT * FROM audios WHERE aprobado = 1 ORDER BY id DESC";
            const results = await db.query(sql);
            res.json(results);
        } catch (err) {
            res.status(200).json([]);
        }
    });

    // 2. REGISTRAR NUEVA PSICOFONÍA (POST)
    router.post('/subir-audio', upload.single('audio'), async (req, res) => {
            const { titulo, agente, latitud, longitud, ruta_externa, imagen_url } = req.body;
            const ruta = req.file ? req.file.filename : (ruta_externa || null);
    
            if (!ruta) return res.status(400).json({ error: "No se ha detectado el archivo de audio o enlace." });
    
            try {
                const userResult = await db.query("SELECT aprobado FROM usuarios WHERE nombre = ?", [agente]);
                
                if (userResult.length === 0 || userResult[0].aprobado !== 1) {
                    return res.status(403).json({ error: "DENEGADO", message: "Identidad no verificada." });
                }
    
                const sql = "INSERT INTO audios (titulo, ruta, agente, latitud, longitud, aprobado, fecha_subida, imagen_url) VALUES (?, ?, ?, ?, ?, 0, NOW(), ?)";
                await db.execute(sql, [titulo, ruta, agente, latitud || 0, longitud || 0, imagen_url || null]);
            
            res.json({ mensaje: "✅ Frecuencia captada y enviada a revisión.", archivo: ruta });
        } catch (err) {
            console.error("❌ ERROR DB AUDIO:", err);
            res.status(500).json({ error: "Fallo al registrar psicofonía" });
        }
    });

    // 3. APROBAR UN AUDIO
    router.put('/aprobar/:id', async (req, res) => {
        try {
            await db.execute("UPDATE audios SET aprobado = 1 WHERE id = ?", [req.params.id]);
            res.json({ message: "Audio desclasificado, hermano." });
        } catch (err) {
            res.status(500).json({ error: "Error en la base de datos" });
        }
    });

    // 4. ELIMINAR UN AUDIO
    router.delete('/:id', async (req, res) => {
        try {
            await db.execute("DELETE FROM audios WHERE id = ?", [req.params.id]);
            res.json({ message: "Registro borrado permanentemente." });
        } catch (err) {
            res.status(500).json({ error: "No se pudo eliminar" });
        }
    });

    return router;
};
