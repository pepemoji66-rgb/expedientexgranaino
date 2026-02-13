const express = require('express');
const router = express.Router();
const db = require('../db');

// 1. RUTA PARA TRAER TODOS LOS VÍDEOS (GET)
router.get('/', (req, res) => {
    db.query("SELECT * FROM videos", (err, results) => {
        if (err) {
            console.error("Error al obtener vídeos:", err);
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// 2. RUTA PARA GUARDAR UN VÍDEO NUEVO (POST)
router.post('/', (req, res) => {
    const { titulo, url } = req.body;
    const sql = "INSERT INTO videos (titulo, url) VALUES (?, ?)";

    db.query(sql, [titulo, url], (err, result) => {
        if (err) {
            console.error("Error al guardar vídeo:", err);
            return res.status(500).json({ error: "No se pudo guardar el vídeo" });
        }
        res.json({ message: "Vídeo guardado con éxito", id: result.insertId });
    });
});

// EL EXPORTS SIEMPRE AL FINAL DEL TODO
module.exports = router;