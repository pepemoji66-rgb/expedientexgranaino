const express = require('express');
const router = express.Router();

// Recibimos 'db' y 'upload' desde el server.js
module.exports = (db, upload) => {

    // --- 1. OBTENER VÍDEOS PÚBLICOS (GET) ---
    router.get('/publicos', async (req, res) => {
        try {
            const sql = "SELECT * FROM videos WHERE estado = 'aprobado' ORDER BY id DESC";
            const results = await db.query(sql);
            res.json(results);
        } catch (err) {
            console.error("❌ ERROR EN DB (GET VIDEOS PUBLICOS):", err);
            res.status(200).json([]);
        }
    });

    // --- 2. OBTENER TODOS PARA EL ADMIN (GET) ---
    const obtenerTodos = async (req, res) => {
        try {
            const results = await db.query("SELECT * FROM videos ORDER BY id DESC");
            res.json(results);
        } catch (err) {
            console.error("❌ ERROR EN DB (GET TODOS):", err);
            res.status(200).json([]);
        }
    };

    router.get('/todos', obtenerTodos);
    router.get('/', obtenerTodos);

    // --- 3. ENVIAR VÍDEO A REVISIÓN (POST) ---
    router.post('/', async (req, res) => {
        const { titulo, url, usuario_nombre, latitud, longitud, capturas, descripcion } = req.body;

        if (!usuario_nombre) {
            return res.status(400).json({ error: "Identidad necesaria para subir material." });
        }

        try {
            // Verificamos si el usuario existe y está aprobado
            const userResult = await db.query("SELECT aprobado FROM usuarios WHERE nombre = ?", [usuario_nombre]);
            
            if (userResult.length === 0 || userResult[0].aprobado !== 1) {
                return res.status(403).json({ error: "DENEGADO", message: "Cuenta no validada en el búnker." });
            }

            const sql = "INSERT INTO videos (titulo, url, estado, usuario, latitud, longitud, capturas, descripcion, fecha) VALUES (?, ?, 'pendiente', ?, ?, ?, ?, ?, NOW())";
            const [result] = await db.execute(sql, [titulo, url, usuario_nombre, latitud || 0, longitud || 0, capturas || '', descripcion || '']);
            
            res.json({ message: "📼 Vídeo enviado a revisión, hermano.", id: result.insertId });
        } catch (err) {
            console.error("❌ ERROR EN DB (POST VIDEO):", err);
            res.status(500).json({ error: "Error de registro en el búnker" });
        }
    });

    // --- 4. APROBAR VÍDEO (PUT) ---
    router.put('/aprobar/:id', async (req, res) => {
        try {
            await db.execute("UPDATE videos SET estado = 'aprobado' WHERE id = ?", [req.params.id]);
            res.json({ message: "Vídeo desclasificado y listo para el búnker." });
        } catch (err) {
            res.status(500).json({ error: "Error al actualizar estado" });
        }
    });

    // --- 4.5 ACTUALIZAR VÍDEO (PUT) ---
    router.put('/:id', async (req, res) => {
        const { titulo, url, latitud, longitud, estado, capturas, descripcion } = req.body;
        
        // Limpiamos capturas y url de cualquier ruta local del ordenador
        const cleanCapturas = capturas 
            ? capturas.split(',').map(u => u.trim()).filter(u => u && !(u.includes('\\') || u.startsWith('C:') || u.includes('/Users/'))).join(',') 
            : '';
        const cleanUrl = url && !(url.includes('\\') || url.startsWith('C:') || url.includes('/Users/')) ? url : '';

        try {
            await db.execute(
                "UPDATE videos SET titulo = ?, url = ?, latitud = ?, longitud = ?, estado = ?, capturas = ?, descripcion = ? WHERE id = ?",
                [titulo, cleanUrl, latitud, longitud, estado, cleanCapturas, descripcion || '', req.params.id]
            );
            res.json({ mensaje: "Vídeo actualizado en el búnker." });
        } catch (err) {
            console.error("Error al actualizar vídeo:", err);
            res.status(500).json({ error: "Fallo en la actualización" });
        }
    });

    // --- 4.6 SUBIR CAPTURAS A VÍDEO EXISTENTE ---
    router.post('/:id/capturas', upload.array('capturas', 10), async (req, res) => {
        try {
            const urls = req.files.map(f => f.path || f.filename).join(',');
            // Obtenemos las capturas actuales para no borrarlas
            const current = await db.query("SELECT capturas FROM videos WHERE id = ?", [req.params.id]);
            const prevCapturas = current[0]?.capturas || '';
            
            // Limpiamos de rutas locales la lista anterior
            const cleanPrev = prevCapturas
                .split(',')
                .map(u => u.trim())
                .filter(u => u && !(u.includes('\\') || u.startsWith('C:') || u.includes('/Users/')))
                .join(',');

            const newCapturas = cleanPrev ? `${cleanPrev},${urls}` : urls;

            await db.execute("UPDATE videos SET capturas = ? WHERE id = ?", [newCapturas, req.params.id]);
            res.json({ mensaje: "Capturas añadidas al expediente del vídeo.", urls: newCapturas });
        } catch (err) {
            console.error("Error al subir capturas:", err);
            res.status(500).json({ error: "Fallo en la carga de evidencias" });
        }
    });

    // --- 5. ELIMINAR VÍDEO (DELETE) ---
    router.delete('/:id', async (req, res) => {
        try {
            await db.execute("DELETE FROM videos WHERE id = ?", [req.params.id]);
            res.json({ message: "Registro eliminado permanentemente." });
        } catch (err) {
            res.status(500).json({ error: "Error al borrar registro" });
        }
    });

    return router;
};