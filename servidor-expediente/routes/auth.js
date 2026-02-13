const express = require('express');
const router = express.Router();

module.exports = (db) => {
    // LOGIN
    const loginFunc = (req, res) => {
        const { email, password } = req.body;
        db.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [email, password], (err, result) => {
            if (err) return res.status(500).json(err);
            if (result.length > 0) res.json({ mensaje: "Acceso concedido", usuario: result[0] });
            else res.status(401).json({ mensaje: "Credenciales incorrectas" });
        });
    };
    router.post('/login-usuario', loginFunc);
    router.post('/login-agente', loginFunc);

    // REGISTRO
    router.post('/registro', (req, res) => {
        const { nombre, email, password } = req.body;
        db.query("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)", [nombre, email, password], (err, result) => {
            if (err) return res.status(500).json({ error: "Error en registro" });
            res.json({ mensaje: "Usuario registrado", id: result.insertId });
        });
    });

    // GESTIÓN DE USUARIOS
    router.get('/usuarios', (req, res) => {
        db.query("SELECT id, nombre, email FROM usuarios ORDER BY id DESC", (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        });
    });

    router.delete('/usuarios/:id', (req, res) => {
        db.query("DELETE FROM usuarios WHERE id = ?", [req.params.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ mensaje: "Usuario borrado" });
        });
    });

    return router;
};