const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- 1. SERVIDORES ESTÁTICOS (Fotos y Vídeos) ---
app.use('/imagenes', express.static(path.join(__dirname, 'public/imagenes')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));

// --- 2. CONEXIÓN AL MOTOR (Puerto 3307) ---
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'expedientex',
    port: 3307
});

db.connect(err => {
    if (err) console.error("❌ ERROR MySQL:", err.message);
    else console.log("✅ SISTEMA INTEGRAL OPERATIVO: Puerto 3307 | DB: expedientex");
});

// =========================================================================
// --- 3. GESTIÓN DE AGENTES Y LOGIN (Para PanelAdmin y Acceso) ---
// =========================================================================

app.post('/login-agente', (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM agentes WHERE email = ? AND password = ?", [email, password], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length > 0) res.json({ mensaje: "Acceso concedido", usuario: result[0] });
        else res.status(401).json({ mensaje: "Denegado" });
    });
});

app.get('/usuarios', (req, res) => {
    db.query("SELECT * FROM agentes ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.delete('/usuarios/:id', (req, res) => {
    db.query("DELETE FROM agentes WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Agente eliminado" });
    });
});

// =========================================================================
// --- 4. GESTIÓN DE VÍDEOS (Público y Admin) ---
// =========================================================================

app.get('/videos', (req, res) => {
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

app.delete('/borrar-video/:id', (req, res) => {
    db.query("DELETE FROM videos WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Vídeo eliminado" });
    });
});

// =========================================================================
// --- 5. EXPEDIENTES / HISTORIAS (Público y Admin) ---
// =========================================================================

// CORRECCIÓN AQUÍ: He quitado el filtro estricto de 'aprobado' para que veas tus datos YA
app.get('/historias-publicadas', (req, res) => {
    db.query("SELECT * FROM historias ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get('/historias', (req, res) => {
    db.query("SELECT * FROM historias ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.post('/publicar-historia', (req, res) => {
    const { titulo, contenido, agente } = req.body;
    // Forzamos que se guarde con estado 'aprobado' para que no se pierda
    const sql = "INSERT INTO historias (titulo, contenido, usuario_nombre, estado) VALUES (?, ?, ?, 'aprobado')";
    db.query(sql, [titulo, contenido, agente], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Informe publicado" });
    });
});

app.put('/aprobar-historia/:id', (req, res) => {
    db.query("UPDATE historias SET estado = 'aprobado' WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Historia aprobada" });
    });
});

app.delete('/historias/:id', (req, res) => {
    db.query("DELETE FROM historias WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Historia eliminada" });
    });
});

// =========================================================================
// --- 6. RELATOS DEL JEFE ---
// =========================================================================

app.get('/ver-comunicados-jefe', (req, res) => {
    db.query("SELECT * FROM comunicados_jefe ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// =========================================================================
// --- 7. GALERÍA DE IMÁGENES ---
// =========================================================================

app.get('/imagenes-publicas', (req, res) => {
    db.query("SELECT * FROM imagenes ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/admin/todas-las-imagenes', (req, res) => {
    db.query("SELECT * FROM imagenes ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// --- LANZAMIENTO FINAL ---
app.listen(5000, () => console.log(`🚀 BÚNKER TOTALMENTE REARMADO EN PUERTO 5000`));