const express = require('express');
const router = express.Router();

module.exports = (db, upload) => {
    // --- RELATOS DEL ADMINISTRADOR ---
    router.get('/relatos-admin-publicos', (req, res) => {
        db.query("SELECT * FROM `relatos administrador` ORDER BY id DESC", (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        });
    });

    router.delete('/borrar-relato-admin/:id', (req, res) => {
        db.query("DELETE FROM `relatos administrador` WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: "Relato borrado" });
        });
    });

    // --- EXPEDIENTES ---
    router.get('/expedientes', (req, res) => {
        db.query("SELECT * FROM expedientes ORDER BY id DESC", (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        });
    });

    router.get('/expedientes-publicos', (req, res) => {
        db.query("SELECT * FROM expedientes WHERE estado = 'publicado' ORDER BY id DESC", (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        });
    });

    router.post('/subir-expediente', (req, res) => {
        const { titulo, contenido, usuario_nombre } = req.body;
        db.query("INSERT INTO expedientes (titulo, contenido, usuario_nombre, estado) VALUES (?, ?, ?, 'pendiente')", [titulo, contenido, usuario_nombre], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: "Enviado" });
        });
    });

    router.put('/aprobar-expediente/:id', (req, res) => {
        db.query("UPDATE expedientes SET estado = 'publicado' WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: "Publicado" });
        });
    });

    router.delete('/expedientes/:id', (req, res) => {
        db.query("DELETE FROM expedientes WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: "Eliminado" });
        });
    });

    // --- LUGARES (RADAR) ---
    router.get('/lugares', (req, res) => {
        db.query("SELECT * FROM lugares ORDER BY id DESC", (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        });
    });

    router.post('/lugares', upload.single('foto'), (req, res) => {
        const { nombre, descripcion, latitud, longitud, ubicacion } = req.body;
        const imagen_url = req.file ? req.file.filename : 'default.jpg';
        db.query("INSERT INTO lugares (nombre, descripcion, latitud, longitud, imagen_url, ubicacion, estado) VALUES (?, ?, ?, ?, ?, ?, 'pendiente')",
            [nombre, descripcion, latitud, longitud, imagen_url, ubicacion], (err) => {
                if (err) return res.status(500).send(err);
                res.send("📍 Reporte recibido.");
            });
    });

    return router;
};