const express = require('express');
const router = express.Router();
const db = require('../db');

// Traer todos los audios (GET)
router.get('/', (req, res) => {
    const sql = "SELECT * FROM audios"; // Asegúrate de que tu tabla se llame 'audios'
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error al obtener audios:", err);
            return res.status(500).json({ error: "Error en la BD" });
        }
        res.json(results);
    });
});

// Guardar un audio nuevo (POST)
router.post('/', (req, res) => {
    const { titulo, url } = req.body;
    const sql = "INSERT INTO audios (titulo, url) VALUES (?, ?)";
    db.query(sql, [titulo, url], (err, result) => {
        if (err) return res.status(500).json({ error: "No se pudo guardar" });
        res.json({ message: "Audio guardado", id: result.insertId });
    });
});

module.exports = router;