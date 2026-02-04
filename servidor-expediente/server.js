const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- 1. RECURSOS ESTÁTICOS ---
app.use('/imagenes', express.static(path.join(__dirname, 'public/imagenes')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));

// --- 2. CONEXIÓN (Puerto 3307) ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'expedientex',
    port: 3307
});

db.connect(err => {
    if (err) console.error("❌ ERROR MySQL:", err.message);
    else console.log("✅ SISTEMA UNIFICADO: Conectado a 'expedientex' en puerto 3307");
});

// =========================================================================
// --- 3. LOGIN Y USUARIOS ---
// =========================================================================

app.post('/login-usuario', loginFunc);
app.post('/login-agente', loginFunc);

function loginFunc(req, res) {
    const { email, password } = req.body;
    console.log("Intentando login con:", email);
    db.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [email, password], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length > 0) {
            res.json({ mensaje: "Acceso concedido", usuario: result[0] });
        } else {
            res.status(401).json({ mensaje: "Credenciales incorrectas" });
        }
    });
}
/// =========================================================================
// --- GESTIÓN DE USUARIOS (SÓLO CAMPOS EXISTENTES) ---
// =========================================================================

// RUTA DE REGISTRO
app.post('/registro', (req, res) => {
    const { nombre, email, password } = req.body;
    
    // Solo insertamos los 3 campos que tienes en la tabla
    const sql = "INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)";
    
    db.query(sql, [nombre, email, password], (err, result) => {
        if (err) {
            console.error("❌ Error en el registro:", err);
            return res.status(500).json({ error: "Error al guardar en la base de datos" });
        }
        res.json({ mensaje: "Agente reclutado con éxito", id: result.insertId });
    });
});

// LISTAR TODOS LOS USUARIOS
app.get('/usuarios', (req, res) => {
    const sql = "SELECT id, nombre, email FROM usuarios ORDER BY id DESC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// ELIMINAR USUARIO
app.delete('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM usuarios WHERE id = ?", [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Usuario borrado del sistema" });
    });
});

/// =========================================================================
// --- 4. GESTIÓN DE EXPEDIENTES (UNIFICADO Y CORREGIDO) ---
// =========================================================================

// OBTENER EXPEDIENTES PARA LA SECCIÓN PÚBLICA
app.get('/expedientes-publicos', (req, res) => {
    // CORRECCIÓN: Buscamos 'publicado', NO 'aprobado', para que coincida con el UPDATE de abajo
    const sql = "SELECT id, usuario_nombre, titulo, contenido FROM expedientes WHERE estado = 'publicado' ORDER BY id DESC";
    db.query(sql, (err, result) => {
        if (err) {
            console.error("❌ Error al obtener públicos:", err);
            return res.status(500).json(err);
        }
        res.json(result);
    });
});

// OBTENER TODOS PARA EL PANEL DE ADMIN
app.get('/expedientes', (req, res) => {
    db.query("SELECT * FROM expedientes ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// ACCIÓN DE APROBAR (CAMBIAR ESTADO A PUBLICADO)
app.put('/aprobar-expediente/:id', (req, res) => {
    const { id } = req.params;
    // IMPORTANTE: Usamos 'publicado' porque tu columna ENUM de la DB así lo pide
    db.query("UPDATE expedientes SET estado = 'publicado' WHERE id = ?", [id], (err) => {
        if (err) {
            console.error("❌ Error al aprobar:", err);
            return res.status(500).json(err);
        }
        res.json({ mensaje: "Expediente publicado con éxito" });
    });
});

// ELIMINAR EXPEDIENTE
app.delete('/expedientes/:id', (req, res) => {
    db.query("DELETE FROM expedientes WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Expediente eliminado" });
    });
});

// SUBIR NUEVO (ENTRA COMO PENDIENTE)
app.post('/subir-expediente', (req, res) => {
    const { titulo, contenido, usuario_nombre } = req.body;
    const sql = "INSERT INTO expedientes (titulo, contenido, usuario_nombre, estado) VALUES (?, ?, ?, 'pendiente')";
    db.query(sql, [titulo, contenido, usuario_nombre], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Expediente enviado" });
    });
});

// =========================================================================
// --- 5. RELATOS ADMINISTRADOR (NUEVA TABLA) ---
// =========================================================================

app.get('/relatos-administrador', (req, res) => {
    // Usamos comillas invertidas porque la tabla tiene un espacio
    const sql = "SELECT * FROM `relatos administrador` ORDER BY id DESC";
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// =========================================================================
// --- 6. VÍDEOS Y IMÁGENES ---
// =========================================================================

app.get('/videos-publicos', (req, res) => {
    db.query("SELECT * FROM videos WHERE estado = 'aprobado' ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get('/admin/todos-los-videos', (req, res) => {
    db.query("SELECT * FROM videos ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.put('/aprobar-video/:id', (req, res) => {
    db.query("UPDATE videos SET estado = 'aprobado' WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Vídeo aprobado" });
    });
});

app.post('/subir-video', (req, res) => {
    const { titulo, url, usuario } = req.body;
    const sql = "INSERT INTO videos (titulo, url, usuario, estado) VALUES (?, ?, ?, 'pendiente')";
    db.query(sql, [titulo, url, usuario], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Vídeo enviado" });
    });
});

// --- RUTA PARA IMÁGENES ---
app.get('/admin/todas-las-imagenes', (req, res) => {
    db.query("SELECT * FROM imagenes ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.put('/aprobar-imagen/:id', (req, res) => {
    db.query("UPDATE imagenes SET estado = 'publica' WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Imagen aprobada" });
    });
});

app.listen(5000, () => console.log(`🚀 SERVIDOR UNIFICADO EN PUERTO 5000`));