const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

module.exports = (db, upload) => {

    // --- 🖋️ SECTOR EXPEDIENTES (TEXTO Y CAMPO) ---

    // Obtener expedientes públicos (de Agentes)
    router.get('/expedientes-publicos', async (req, res) => {
        try {
            const results = await db.query("SELECT * FROM expedientes WHERE (estado = 'aprobado' OR estado = 'publicado' OR estado = 'publicada' OR estado = 'activo') AND (tipo = 'agente' OR tipo IS NULL) ORDER BY fecha DESC");
            res.json(results);
        } catch (err) { res.status(200).json([]); }
    });

    // Obtener relatos públicos del Administrador (Jefe)
    router.get('/relatos-admin-publicos', async (req, res) => {
        try {
            const results = await db.query("SELECT * FROM expedientes WHERE (estado = 'aprobado' OR estado = 'publicado' OR estado = 'publicada' OR estado = 'activo') AND tipo = 'jefe' ORDER BY fecha DESC");
            res.json(results);
        } catch (err) { res.status(200).json([]); }
    });

    // Obtener el ÚLTIMO expediente publicado (para el Banner de Vigilancia)
    router.get('/ultimo', async (req, res) => {
        try {
            const sql = "SELECT * FROM expedientes WHERE (estado = 'aprobado' OR estado = 'publicado' OR estado = 'activo') ORDER BY fecha DESC LIMIT 1";
            const results = await db.query(sql);
            res.json(results[0] || null);
        } catch (err) {
            res.status(500).json({ error: "Error al captar señal del último expediente." });
        }
    });

    // Incrementar Relevancia (Likes)
    router.post('/relevancia/:id', async (req, res) => {
        try {
            await db.execute("UPDATE expedientes SET relevancia = relevancia + 1 WHERE id = ?", [req.params.id]);
            const results = await db.query("SELECT relevancia FROM expedientes WHERE id = ?", [req.params.id]);
            res.json({ mensaje: "Relevancia aumentada.", relevancia: results[0]?.relevancia || 0 });
        } catch (err) {
            console.error("Error relevancia:", err);
            res.status(500).json({ error: "Error al registrar relevancia táctica." });
        }
    });

    // Obtener todos los expedientes (Panel de Control)
    router.get('/todos', async (req, res) => {
        try {
            const results = await db.query("SELECT * FROM expedientes ORDER BY fecha DESC");
            res.json(results);
        } catch (err) {
            console.error("❌ ERROR GET EXPEDIENTES:", err);
            res.status(200).json([]);
        }
    });

    // Subir un nuevo expediente (Desde la App o Panel)
    router.post('/subir-expediente', upload.single('imagen'), async (req, res) => {
        const { titulo, contenido, usuario_nombre, latitud, longitud, tipo } = req.body;
        const imagen_url = req.file ? (req.file.path || req.file.filename) : null;

        if (!usuario_nombre || !contenido) {
            return res.status(400).json({ error: "Faltan datos críticos para el registro." });
        }

        try {
            // Verificamos si el agente está en el búnker y aprobado
            const userResult = await db.query("SELECT aprobado, rol FROM usuarios WHERE nombre = ?", [usuario_nombre]);
            
            if (userResult.length === 0 || userResult[0].aprobado !== 1) {
                return res.status(403).json({ error: "DENEGADO", message: "Identidad no autorizada para documentar." });
            }

            // Si el usuario es admin, el estado es aprobado automáticamente y el tipo puede ser 'jefe'
            const finalTipo = tipo || (userResult[0].rol === 'admin' ? 'jefe' : 'agente');
            const estado = userResult[0].rol === 'admin' ? 'aprobado' : 'pendiente';

            const sql = "INSERT INTO expedientes (titulo, contenido, usuario_nombre, latitud, longitud, estado, tipo, imagen_url, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())";
            const [result] = await db.execute(sql, [titulo, contenido, usuario_nombre, latitud || 0, longitud || 0, estado, finalTipo, imagen_url]);
            
            res.json({ mensaje: "✅ Expediente registrado y archivado.", id: result.insertId });
        } catch (err) {
            console.error("❌ ERROR POST EXPEDIENTE:", err);
            res.status(500).json({ error: "Fallo al archivar el expediente." });
        }
    });

    // --- ALIASES PARA EL PANEL DE MANDO ---
    router.get('/expedientes', async (req, res) => {
        try {
            const results = await db.query("SELECT * FROM expedientes ORDER BY id DESC");
            res.json(results);
        } catch (err) { res.status(200).json([]); }
    });

    router.put('/aprobar-expediente/:id', async (req, res) => {
        try {
            await db.execute("UPDATE expedientes SET estado = 'aprobado' WHERE id = ?", [req.params.id]);
            res.json({ mensaje: "Expediente validado y desclasificado." });
        } catch (err) { res.status(500).json({ error: "Error en la actualización" }); }
    });

    // --- 📍 SECTOR LUGARES (RADAR DE CAMPO) ---

    // Obtener lugares para el Mapa público
    router.get('/lugares-publicos', async (req, res) => {
        try {
            const sql = "SELECT * FROM lugares WHERE estado = 'aprobado' OR estado IS NULL ORDER BY id DESC";
            const results = await db.query(sql);
            res.json(results);
        } catch (err) {
            res.status(200).json([]);
        }
    });

    // Proponer un nuevo lugar (Agentes en campo)
    router.post('/subir-lugar', upload.single('imagen'), async (req, res) => {
        const { nombre, descripcion, latitud, longitud, ubicacion } = req.body;
        const imagen_url = req.file ? (req.file.path || req.file.filename) : null;

        try {
            const sql = "INSERT INTO lugares (nombre, descripcion, latitud, longitud, imagen_url, ubicacion, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, 'pendiente', NOW())";
            await db.execute(sql, [nombre, descripcion, latitud, longitud, imagen_url, ubicacion || 'Pendiente']);
            
            res.json({ mensaje: "✅ Lugar detectado y enviado al radar de central." });
        } catch (err) {
            console.error("❌ ERROR POST LUGAR:", err);
            res.status(500).json({ error: "Fallo al registrar el hallazgo geográfico." });
        }
    });

    // Actualizar lugar (Mando central)
    router.put('/lugares/:id', upload.single('imagen'), async (req, res) => {
        const { nombre, descripcion, estado, latitud, longitud, ubicacion } = req.body;
        const imagen_url = req.file ? (req.file.path || req.file.filename) : null;
        try {
            if (imagen_url) {
                await db.execute(
                    "UPDATE lugares SET nombre = ?, descripcion = ?, estado = ?, latitud = ?, longitud = ?, ubicacion = ?, imagen_url = ? WHERE id = ?",
                    [nombre, descripcion, estado, latitud, longitud, ubicacion, imagen_url, req.params.id]
                );
            } else {
                await db.execute(
                    "UPDATE lugares SET nombre = ?, descripcion = ?, estado = ?, latitud = ?, longitud = ?, ubicacion = ? WHERE id = ?",
                    [nombre, descripcion, estado, latitud, longitud, ubicacion, req.params.id]
                );
            }
            res.json({ mensaje: "Lugar actualizado en el búnker." });
        } catch (err) {
            res.status(500).json({ error: "Fallo al actualizar lugar" });
        }
    });

    router.put('/aprobar/:id', async (req, res) => {
        try {
            await db.execute("UPDATE lugares SET estado = 'aprobado' WHERE id = ?", [req.params.id]);
            res.json({ mensaje: "Lugar visible ahora en el radar público." });
        } catch (err) { res.status(500).json({ error: "Error de aprobación" }); }
    });

    router.put('/:id', upload.single('imagen'), async (req, res) => {
        const { titulo, contenido, latitud, longitud, estado, tipo } = req.body;
        const imagen_url = req.file ? (req.file.path || req.file.filename) : null;
        try {
            if (imagen_url) {
                await db.execute(
                    "UPDATE expedientes SET titulo = ?, contenido = ?, latitud = ?, longitud = ?, estado = ?, tipo = ?, imagen_url = ? WHERE id = ?",
                    [titulo, contenido, latitud, longitud, estado, tipo, imagen_url, req.params.id]
                );
            } else {
                await db.execute(
                    "UPDATE expedientes SET titulo = ?, contenido = ?, latitud = ?, longitud = ?, estado = ?, tipo = ? WHERE id = ?",
                    [titulo, contenido, latitud, longitud, estado, tipo, req.params.id]
                );
            }
            res.json({ mensaje: "Expediente actualizado con éxito." });
        } catch (err) {
            console.error("Error al actualizar expediente:", err);
            res.status(500).json({ error: "Error al actualizar" });
        }
    });

    router.delete('/borrar-expediente/:id', async (req, res) => {
        try {
            await db.execute("DELETE FROM expedientes WHERE id = ?", [req.params.id]);
            res.json({ mensaje: "Expediente eliminado de los anales." });
        } catch (err) { res.status(500).json({ error: "Error al borrar expediente" }); }
    });

    router.delete('/borrar-lugar/:id', async (req, res) => {
        try {
            await db.execute("DELETE FROM lugares WHERE id = ?", [req.params.id]);
            res.json({ mensaje: "Lugar eliminado del radar." });
        } catch (err) { res.status(500).json({ error: "Error al borrar lugar" }); }
    });


    return router;
};