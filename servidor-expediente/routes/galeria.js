const express = require('express');
const router = express.Router();

module.exports = (db, uploadArchivos, uploadGeneral) => {

    // --- IMÁGENES (GALERÍA AGENTES) ---
    router.get('/admin/todas-las-imagenes', (req, res) => {
        db.query("SELECT * FROM imagenes ORDER BY id DESC", (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    });

    router.get('/imagenes-publicas', (req, res) => {
        db.query("SELECT * FROM imagenes WHERE estado = 'publica' ORDER BY id DESC", (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        });
    });

    router.post('/subir-imagen', uploadArchivos.single('imagen'), (req, res) => {
        const { titulo, agente, descripcion, latitud, longitud } = req.body;
        const url_imagen = req.file ? req.file.filename : null;
        if (!url_imagen) return res.status(400).json({ error: "Falta el archivo visual" });
        const sql = "INSERT INTO imagenes (titulo, url_imagen, agente, descripcion, latitud, longitud, estado) VALUES (?, ?, ?, ?, ?, ?, 'pendiente')";
        db.query(sql, [titulo, url_imagen, agente || 'ANÓNIMO', descripcion || '', latitud || 0, longitud || 0], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: "Imagen enviada", archivo: url_imagen });
        });
    });

    router.put(['/admin/aprobar-imagen/:id', '/aprobar-imagen/:id'], (req, res) => {
        db.query("UPDATE imagenes SET estado = 'publica' WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: "Imagen aprobada" });
        });
    });

    router.delete('/borrar-imagen/:id', (req, res) => {
        db.query("DELETE FROM imagenes WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: "Imagen borrada" });
        });
    });

    // --- NOTICIAS ---
    router.get('/admin/todas-noticias', (req, res) => {
        db.query("SELECT * FROM noticias ORDER BY id DESC", (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        });
    });

    router.get('/noticias-publicas', (req, res) => {
        db.query("SELECT * FROM noticias WHERE estado = 'aprobado' ORDER BY fecha DESC", (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        });
    });

    router.post('/proponer-noticia', uploadGeneral.single('imagen'), (req, res) => {
        const { titulo, cuerpo, nivel_alerta, ubicacion, latitud, longitud } = req.body;
        const nombreImagen = req.file ? req.file.filename : null;
        const fechaActual = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const sql = "INSERT INTO noticias (titulo, cuerpo, nivel_alerta, ubicacion, latitud, longitud, imagen, estado, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, 'aprobado', ?)";
        db.query(sql, [titulo, cuerpo, nivel_alerta, ubicacion || 'Sin ubicación', latitud || null, longitud || null, nombreImagen, fechaActual], (err, result) => {
            if (err) return res.status(500).json({ error: "Error de sincronización", detalle: err.message });
            res.json({ mensaje: "Noticia recibida con éxito", id: result.insertId });
        });
    });

    // --- ARCHIVOS DE USUARIOS ---
    router.get('/api/archivos-usuarios', (req, res) => {
        db.query("SELECT * FROM archivos_usuarios ORDER BY id DESC", (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        });
    });

    return router;
};