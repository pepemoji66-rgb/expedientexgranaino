const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// --- UTILIDAD DE ALERTA TELEGRAM ---
const enviarAlertaTelegram = async (mensaje) => {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || token === 'TU_TOKEN_AQUI') {
        console.warn("⚠️ TELEGRAM: Token no configurado, alerta no enviada.");
        return;
    }
    if (!chatId) {
        console.warn("⚠️ TELEGRAM: Chat ID no configurado.");
        return;
    }
    try {
        const res = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: `🛰️ BÚNKER ALERTA: ${mensaje}`
        });
        console.log("✅ TELEGRAM: Alerta enviada correctamente.");
    } catch (err) {
        console.error("❌ TELEGRAM ERROR:", err.response?.data || err.message);
    }
};

module.exports = (db, uploadArchivos, uploadGeneral) => {

    // --- 🖼️ SECTOR IMÁGENES (GALERÍA DE AGENTES) ---

    // Obtener todas para el Panel de Mando
    router.get('/admin/todas-las-imagenes', async (req, res) => {
        try {
            const results = await db.query("SELECT * FROM imagenes ORDER BY id DESC");
            res.json(results);
        } catch (err) {
            console.error("❌ ERROR GET ALL IMAGENES:", err);
            res.status(200).json([]);
        }
    });

    // Obtener solo las desclasificadas para la Galería pública
    router.get('/imagenes-publicas', async (req, res) => {
        try {
            const results = await db.query("SELECT * FROM imagenes WHERE estado = 'publica' ORDER BY id DESC");
            res.json(results);
        } catch (err) {
            res.status(200).json([]);
        }
    });

    // RUTA BLINDADA: Subida de hallazgos visuales
    router.post('/subir-imagen', uploadArchivos.single('imagen'), async (req, res) => {
        const { titulo, agente, descripcion, latitud, longitud } = req.body;
        
        // Multer-Cloudinary pone la URL completa en path, Multer local pone el nombre en filename
        const url_imagen = req.file ? (req.file.path || req.file.filename) : null;

        if (!url_imagen) return res.status(400).json({ error: "No se ha detectado ningún archivo visual." });

        try {
            // 🛡️ PROTOCOLO DE IDENTIDAD: Solo agentes activos y aprobados
            const userResult = await db.query("SELECT aprobado FROM usuarios WHERE nombre = ?", [agente]);
            
            if (userResult.length === 0 || userResult[0].aprobado !== 1) {
                // Si es local y no tiene permiso, eliminamos el archivo
                if (req.file && !req.file.path.startsWith('http')) {
                    const filePath = path.join(__dirname, '../uploads/archivos', req.file.filename);
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                }

                return res.status(403).json({
                    error: "ACCESO DENEGADO",
                    mensaje: "Identidad no verificada o pendiente de aprobación."
                });
            }

            // Registro en la base de datos con estado 'pendiente'
            const sql = "INSERT INTO imagenes (titulo, url_imagen, agente, descripcion, latitud, longitud, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, 'pendiente', NOW())";
            await db.execute(sql, [titulo, url_imagen, agente, descripcion || '', latitud || 0, longitud || 0]);
            
            // ALERTA TELEGRAM
            enviarAlertaTelegram(`📸 NUEVA EVIDENCIA SUBIDA por ${agente}: "${titulo}"\n📍 Sector: ${latitud}, ${longitud}\n🔍 Estado: PENDIENTE DE VALIDACIÓN`);
            
            res.json({ mensaje: "Hallazgo enviado a central. Esperando revisión.", archivo: url_imagen });
        } catch (err) {
            console.error("❌ ERROR POST IMAGEN:", err);
            res.status(500).json({ error: "Fallo en el registro de la imagen" });
        }
    });

    // Actualizar metadatos de imagen
    router.put('/imagenes/:id', uploadArchivos.single('imagen'), async (req, res) => {
        const { titulo, descripcion, estado, latitud, longitud } = req.body;
        const url_imagen = req.file ? (req.file.path || req.file.filename) : null;
        
        try {
            if (url_imagen) {
                await db.execute(
                    "UPDATE imagenes SET titulo = ?, descripcion = ?, estado = ?, latitud = ?, longitud = ?, es_atarfe = ?, url_imagen = ? WHERE id = ?",
                    [titulo, descripcion, estado, latitud, longitud, req.body.es_atarfe || 0, url_imagen, req.params.id]
                );
            } else {
                await db.execute(
                    "UPDATE imagenes SET titulo = ?, descripcion = ?, estado = ?, latitud = ?, longitud = ?, es_atarfe = ? WHERE id = ?",
                    [titulo, descripcion, estado, latitud, longitud, req.body.es_atarfe || 0, req.params.id]
                );
            }
            res.json({ mensaje: "Metadatos de imagen actualizados." });
        } catch (err) {
            console.error("❌ Error al actualizar imagen:", err);
            res.status(500).json({ error: "Fallo al actualizar imagen" });
        }
    });

    // Desclasificar imagen (Aprobar)
    router.put('/admin/aprobar-imagen/:id', async (req, res) => {
        try {
            await db.execute("UPDATE imagenes SET estado = 'publica' WHERE id = ?", [req.params.id]);
            res.json({ mensaje: "La imagen ahora es de acceso público." });
        } catch (err) {
            res.status(500).json({ error: "Error al desclasificar" });
        }
    });

    // Borrado permanente de imagen
    router.delete('/borrar-imagen/:id', async (req, res) => {
        try {
            await db.execute("DELETE FROM imagenes WHERE id = ?", [req.params.id]);
            res.json({ mensaje: "Imagen eliminada de los registros del búnker." });
        } catch (err) {
            res.status(500).json({ error: "Error al eliminar registro" });
        }
    });

    // --- 📰 SECTOR NOTICIAS (ALERTAS TÁCTICAS) ---

    router.get('/admin/todas-noticias', async (req, res) => {
        try {
            const result = await db.query("SELECT * FROM noticias ORDER BY id DESC");
            res.json(result);
        } catch (err) {
            res.status(200).json([]);
        }
    });

    router.get('/noticias-publicas', async (req, res) => {
        try {
            const result = await db.query("SELECT * FROM noticias WHERE estado = 'aprobado' ORDER BY fecha DESC");
            res.json(result);
        } catch (err) {
            res.status(200).json([]);
        }
    });

    router.get('/noticias/detalle/:id', async (req, res) => {
        try {
            const result = await db.query("SELECT * FROM noticias WHERE id = ?", [req.params.id]);
            if (result && result.length > 0) {
                res.json(result[0]);
            } else {
                res.status(404).json({ error: "Noticia no encontrada" });
            }
        } catch (err) {
            res.status(500).json({ error: "Error al obtener noticia por ID" });
        }
    });

    // Publicación de noticias (Uso exclusivo del Alto Mando)
    router.post('/proponer-noticia', uploadGeneral.single('imagen'), async (req, res) => {
        const { titulo, cuerpo, nivel_alerta, ubicacion, latitud, longitud, agente, fuente_url, youtube_url } = req.body;
        const nombreImagen = req.file ? (req.file.path || req.file.filename) : null;

        try {
            const sql = "INSERT INTO noticias (titulo, cuerpo, nivel_alerta, ubicacion, latitud, longitud, imagen_url, estado, fecha, aprobado, agente, fuente_url, youtube_url) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', NOW(), 0, ?, ?, ?)";
            const [result] = await db.execute(sql, [titulo, cuerpo, nivel_alerta, ubicacion || 'Sin ubicación', latitud || null, longitud || null, nombreImagen, agente || 'Agente Anónimo', fuente_url || '', youtube_url || null]);
            
            // 📸 AUTO-GALERÍA: Si hay imagen, la insertamos en la galería
            if (nombreImagen) {
                try {
                    const sqlGaleria = "INSERT INTO imagenes (titulo, url_imagen, agente, descripcion, latitud, longitud, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, 'publica', NOW())";
                    await db.execute(sqlGaleria, [
                        titulo || 'Evidencia de Noticia',
                        nombreImagen,
                        agente || 'Sistema',
                        `Imagen de la noticia: ${titulo || ''}`,
                        latitud || 0,
                        longitud || 0
                    ]);
                    console.log('📸 Imagen de noticia añadida automáticamente a la galería.');
                } catch (galErr) {
                    console.warn('⚠️ No se pudo auto-insertar en galería (noticia):', galErr.message);
                }
            }

            // ALERTA TELEGRAM
            enviarAlertaTelegram(`📰 NUEVA NOTICIA PROPUESTA: "${titulo}"\n🚨 Nivel: ${nivel_alerta}\n👤 Agente: ${agente}`);
            
            res.json({ mensaje: "Noticia publicada y transmitida a todos los agentes.", id: result.insertId });
        } catch (err) {
            console.error("Error en noticia:", err);
            res.status(500).json({ error: "Fallo en la sincronización de la noticia." });
        }
    });

    router.put('/noticias/:id', uploadGeneral.single('imagen'), async (req, res) => {
        const { titulo, cuerpo, nivel_alerta, ubicacion, latitud, longitud, fuente_url, estado, youtube_url } = req.body;
        const imagen_url = req.file ? (req.file.path || req.file.filename) : null;
        
        try {
            if (imagen_url) {
                await db.execute(
                    "UPDATE noticias SET titulo = ?, cuerpo = ?, nivel_alerta = ?, ubicacion = ?, latitud = ?, longitud = ?, fuente_url = ?, estado = ?, imagen_url = ?, youtube_url = ? WHERE id = ?",
                    [titulo, cuerpo, nivel_alerta, ubicacion, latitud, longitud, fuente_url, estado, imagen_url, youtube_url || null, req.params.id]
                );
                // 📸 AUTO-GALERÍA: nueva imagen al editar noticia
                try {
                    const sqlGaleria = "INSERT INTO imagenes (titulo, url_imagen, agente, descripcion, latitud, longitud, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, 'publica', NOW())";
                    await db.execute(sqlGaleria, [
                        titulo || 'Evidencia de Noticia',
                        imagen_url,
                        'Sistema',
                        `Imagen actualizada de la noticia: ${titulo || ''}`,
                        latitud || 0,
                        longitud || 0
                    ]);
                } catch (galErr) {
                    console.warn('⚠️ No se pudo auto-insertar en galería (edición noticia):', galErr.message);
                }
            } else {
                await db.execute(
                    "UPDATE noticias SET titulo = ?, cuerpo = ?, nivel_alerta = ?, ubicacion = ?, latitud = ?, longitud = ?, fuente_url = ?, estado = ?, youtube_url = ? WHERE id = ?",
                    [titulo, cuerpo, nivel_alerta, ubicacion, latitud, longitud, fuente_url, estado, youtube_url || null, req.params.id]
                );
            }
            res.json({ mensaje: "Noticia actualizada en el búnker." });
        } catch (err) {
            console.error("Error al actualizar noticia:", err);
            res.status(500).json({ error: "Fallo en la actualización" });
        }
    });

    // --- ALIASES ADMIN PARA NOTICIAS ---
    router.put('/admin/aprobar-noticia/:id', async (req, res) => {
        try {
            await db.execute("UPDATE noticias SET estado = 'aprobado', aprobado = 1 WHERE id = ?", [req.params.id]);
            res.json({ mensaje: "Noticia desclasificada." });
        } catch (err) { res.status(500).json({ error: "Error en aprobación" }); }
    });

    router.delete('/borrar-noticia/:id', async (req, res) => {
        try {
            await db.execute("DELETE FROM noticias WHERE id = ?", [req.params.id]);
            res.json({ mensaje: "Noticia eliminada correctamente." });
        } catch (err) { res.status(500).json({ error: "Error al borrar noticia" }); }
    });

    return router;
};