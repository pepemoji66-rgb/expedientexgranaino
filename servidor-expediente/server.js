const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app); 

// --- CONFIGURACIÓN DE SOCKET.IO ---
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Para procesar formularios complejos

// --- 1. CONFIGURACIÓN DE ALMACENAMIENTO (RUTAS ABSOLUTAS) ---
const dirLugares = path.join(__dirname, 'public/lugares');
const dirImagenes = path.join(__dirname, 'public/imagenes'); 
const dirArchivosUsuarios = path.join(__dirname, 'public/archivos-usuarios'); 

// Asegurar que las carpetas existan en el Backend
[dirLugares, dirImagenes, dirArchivosUsuarios].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Carpeta creada: ${dir}`);
    }
});

const safeFilename = (file) => Date.now() + '-' + file.originalname.replace(/\s/g, "_");

// Configuraciones de Multer
const storageLugares = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, dirLugares); },
    filename: (req, file, cb) => { cb(null, safeFilename(file)); }
});
const upload = multer({ storage: storageLugares });

const storageGeneral = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, dirImagenes); },
    filename: (req, file, cb) => { cb(null, safeFilename(file)); }
});
const uploadGeneral = multer({ storage: storageGeneral });

const storageArchivos = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, dirArchivosUsuarios); },
    filename: (req, file, cb) => { cb(null, safeFilename(file)); }
});
const uploadArchivos = multer({ storage: storageArchivos });

// --- 2. RECURSOS ESTÁTICOS (LAS PUERTAS DEL BÚNKER) ---
// Importante: No tocar estas rutas, son las que React usa para pedir las fotos
app.use('/imagenes', express.static(dirImagenes));
app.use('/archivos-usuarios', express.static(dirArchivosUsuarios));
app.use('/lugares', express.static(dirLugares));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));
app.use(express.static(path.join(__dirname, 'public')));

// --- 3. CONEXIÓN BASE DE DATOS ---
const db = mysql.createPool({ 
    host: 'localhost', user: 'root', password: '', database: 'expedientex', port: 3307,
    waitForConnections: true, connectionLimit: 10, queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) console.error("❌ ERROR CONEXIÓN DB:", err.message);
    else {
        console.log("✅ SISTEMA 100% OPERATIVO: Conectado a 'expedientex' (3307)");
        connection.release();
    }
});

// --- 4. LÓGICA DEL CHAT ---
io.on('connection', (socket) => {
    socket.on('limpiar_chat_servidor', () => {
        db.query("DELETE FROM chat_mensajes", (err) => {
            if (err) return console.error(err);
            io.emit('chat_limpiado');
        });
    });
    socket.on('enviar_mensaje', (data) => {
        const { nombre_usuario, mensaje, rol_usuario, tipo, destinatario } = data;
        const sqlInsert = "INSERT INTO chat_mensajes (nombre_usuario, mensaje, rol_usuario, tipo, destinatario) VALUES (?, ?, ?, ?, ?)";
        db.query(sqlInsert, [nombre_usuario, mensaje, rol_usuario, tipo, destinatario], (err, result) => {
            if (err) return console.error("Error guardando mensaje:", err);
            io.emit('recibir_mensaje', { id: result.insertId, ...data, fecha: new Date() });
        });
    });
});

app.get('/chat-historial', (req, res) => {
    db.query("SELECT * FROM chat_mensajes ORDER BY id ASC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// --- 5. RUTA DE LA IA ---
app.post('/chat-ia', (req, res) => {
    res.json({ respuesta: `(Búnker) El Archivero está analizando los pergaminos...` });
});

// --- 6. RELATOS DEL ADMINISTRADOR ---
app.get('/relatos-admin-publicos', (req, res) => {
    db.query("SELECT * FROM `relatos administrador` ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.delete('/borrar-relato-admin/:id', (req, res) => {
    db.query("DELETE FROM `relatos administrador` WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Relato borrado" });
    });
});

// --- 7. LOGIN Y REGISTRO ---
const loginFunc = (req, res) => {
    const { email, password } = req.body;
    db.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [email, password], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length > 0) res.json({ mensaje: "Acceso concedido", usuario: result[0] });
        else res.status(401).json({ mensaje: "Credenciales incorrectas" });
    });
};
app.post('/login-usuario', loginFunc);
app.post('/login-agente', loginFunc);

app.post('/registro', (req, res) => {
    const { nombre, email, password } = req.body;
    db.query("INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)", [nombre, email, password], (err, result) => {
        if (err) return res.status(500).json({ error: "Error en registro" });
        res.json({ mensaje: "Usuario registrado", id: result.insertId });
    });
});

app.get('/usuarios', (req, res) => {
    db.query("SELECT id, nombre, email FROM usuarios ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.delete('/usuarios/:id', (req, res) => {
    db.query("DELETE FROM usuarios WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Usuario borrado" });
    });
});

// --- 8. EXPEDIENTES ---
app.get('/expedientes', (req, res) => {
    db.query("SELECT * FROM expedientes ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get('/expedientes-publicos', (req, res) => {
    db.query("SELECT * FROM expedientes WHERE estado = 'publicado' ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.post('/subir-expediente', (req, res) => {
    const { titulo, contenido, usuario_nombre } = req.body;
    db.query("INSERT INTO expedientes (titulo, contenido, usuario_nombre, estado) VALUES (?, ?, ?, 'pendiente')", [titulo, contenido, usuario_nombre], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Enviado" });
    });
});

app.put('/aprobar-expediente/:id', (req, res) => {
    db.query("UPDATE expedientes SET estado = 'publicado' WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Publicado" });
    });
});

app.delete('/expedientes/:id', (req, res) => {
    db.query("DELETE FROM expedientes WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Eliminado" });
    });
});

// --- 9. LUGARES (RADAR) ---
app.get('/lugares', (req, res) => {
    db.query("SELECT * FROM lugares ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// Cambiado 'foto' para coincidir con el radar
app.post('/lugares', upload.single('foto'), (req, res) => {
    const { nombre, descripcion, latitud, longitud, ubicacion } = req.body;
    const imagen_url = req.file ? req.file.filename : 'default.jpg';
    db.query("INSERT INTO lugares (nombre, descripcion, latitud, longitud, imagen_url, ubicacion, estado) VALUES (?, ?, ?, ?, ?, ?, 'pendiente')", 
    [nombre, descripcion, latitud, longitud, imagen_url, ubicacion], (err) => {
        if (err) return res.status(500).send(err);
        res.send("📍 Reporte recibido.");
    });
});

app.put('/aprobar-lugar/:id', (req, res) => {
    db.query("UPDATE lugares SET estado = 'aprobado' WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Lugar aprobado" });
    });
});

app.delete('/lugares/:id', (req, res) => {
    db.query("DELETE FROM lugares WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Lugar eliminado" });
    });
});

// --- 10. VÍDEOS ---
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

app.post('/subir-video', (req, res) => {
    const { titulo, url, usuario } = req.body;
    db.query("INSERT INTO videos (titulo, url, usuario, estado) VALUES (?, ?, ?, 'pendiente')", [titulo, url, usuario], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Vídeo enviado" });
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
        res.json({ mensaje: "Vídeo borrado" });
    });
});

// --- 11. IMÁGENES (GALERÍA AGENTES / ARCHIVOS) ---
app.get('/admin/todas-las-imagenes', (req, res) => {
    db.query("SELECT * FROM imagenes ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.get('/imagenes-publicas', (req, res) => {
    db.query("SELECT * FROM imagenes WHERE estado = 'publica' ORDER BY id DESC", (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// CORREGIDO: Aseguramos que el campo sea 'imagen' para el formulario de hallazgos
app.post('/subir-imagen', uploadArchivos.single('imagen'), (req, res) => {
    const { titulo, agente, descripcion, latitud, longitud } = req.body;
    const url_imagen = req.file ? req.file.filename : null;
    
    if (!url_imagen) return res.status(400).json({ error: "Falta el archivo visual" });

    const sql = "INSERT INTO imagenes (titulo, url_imagen, agente, descripcion, latitud, longitud, estado) VALUES (?, ?, ?, ?, ?, ?, 'pendiente')";
    db.query(sql, [titulo, url_imagen, agente || 'ANÓNIMO', descripcion || '', latitud || 0, longitud || 0], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Imagen enviada", archivo: url_imagen });
    });
});

app.put(['/admin/aprobar-imagen/:id', '/aprobar-imagen/:id'], (req, res) => {
    db.query("UPDATE imagenes SET estado = 'publica' WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Imagen aprobada" });
    });
});

app.delete('/borrar-imagen/:id', (req, res) => {
    db.query("DELETE FROM imagenes WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Imagen borrada" });
    });
});

// --- 12. NOTICIAS ---
app.get('/admin/todas-noticias', (req, res) => {
    db.query("SELECT * FROM noticias ORDER BY fecha DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get('/noticias-publicas', (req, res) => {
    db.query("SELECT * FROM noticias WHERE estado = 'aprobado' ORDER BY fecha DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.put('/admin/aprobar-noticia/:id', (req, res) => {
    db.query("UPDATE noticias SET estado = 'aprobado' WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Noticia aprobada" });
    });
});

// CORREGIDO: Usamos uploadGeneral para las noticias
app.post('/proponer-noticia', uploadGeneral.single('imagen'), (req, res) => {
    const { titulo, cuerpo, nivel_alerta, ubicacion, latitud, longitud } = req.body;
    const imagen_url = req.file ? req.file.filename : null;
    
    const sql = "INSERT INTO noticias (titulo, cuerpo, nivel_alerta, ubicacion, latitud, longitud, imagen_url, estado) VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')";
    db.query(sql, [titulo, cuerpo, nivel_alerta, ubicacion || 'Sin ubicación', latitud || null, longitud || null, imagen_url], (err, result) => {
        if (err) {
            console.error("Error en DB Noticias:", err);
            return res.status(500).json({ error: "Fallo en DB" });
        }
        res.json({ mensaje: "Noticia recibida", id: result.insertId });
    });
});

app.delete('/borrar-noticia/:id', (req, res) => {
    db.query("DELETE FROM noticias WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Noticia eliminada" });
    });
});

// --- MOTOR ---
const PORT = 5000;
server.listen(PORT, () => {
    console.log(`🚀 BÚNKER 100% OPERATIVO EN PUERTO ${PORT}`);
    console.log(`📍 Rutas estáticas activas para: /imagenes, /archivos-usuarios, /lugares`);
});