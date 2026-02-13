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

// --- 1. RUTAS MODULARES ---
const galeriaRoutes = require('./routes/galeria');
const authRoutes = require('./routes/auth');
const expedientesRoutes = require('./routes/expedientes');
const videosRoutes = require('./routes/videos');
const audiosRoutes = require('./routes/audios');

const io = new Server(server, {
    cors: { origin: "http://localhost:3000", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- 2. CONFIGURACIÓN DE ALMACENAMIENTO ---
const dirLugares = path.join(__dirname, 'public/lugares');
const dirImagenes = path.join(__dirname, 'public/imagenes');
const dirArchivosUsuarios = path.join(__dirname, 'public/archivos-usuarios');
const dirVideos = path.join(__dirname, 'public/videos');
const dirAudios = path.join(__dirname, 'public/audio');

[dirLugares, dirImagenes, dirArchivosUsuarios, dirVideos, dirAudios].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const safeFilename = (file) => Date.now() + '-' + file.originalname.replace(/\s/g, "_");

// Configuraciones de Multer
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => { cb(null, dirLugares); },
        filename: (req, file, cb) => { cb(null, safeFilename(file)); }
    })
});

const uploadGeneral = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => { cb(null, dirImagenes); },
        filename: (req, file, cb) => { cb(null, safeFilename(file)); }
    })
});

const uploadArchivos = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => { cb(null, dirArchivosUsuarios); },
        filename: (req, file, cb) => { cb(null, safeFilename(file)); }
    })
});

const uploadAdmin = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            const { seccion } = req.body;
            let dest = dirImagenes; 
            if (seccion === 'videos') dest = dirVideos;
            else if (seccion === 'audios') dest = dirAudios;
            else if (seccion === 'noticias') dest = dirImagenes;
            cb(null, dest);
        },
        filename: (req, file, cb) => { cb(null, safeFilename(file)); }
    })
});

// --- 3. RECURSOS ESTÁTICOS ---
app.use('/imagenes', express.static(dirImagenes));
app.use('/archivos-usuarios', express.static(dirArchivosUsuarios));
app.use('/lugares', express.static(dirLugares));
app.use('/ver-videos', express.static(dirVideos));
app.use('/ver-audios', express.static(dirAudios));
app.use(express.static(path.join(__dirname, 'public')));

// --- 4. CONEXIÓN BASE DE DATOS ---
const db = mysql.createPool({
    host: 'localhost', user: 'root', password: '', database: 'expedientex', port: 3307,
    waitForConnections: true, connectionLimit: 10
});

// --- 5. CARGAR RUTAS DE LA API ---
app.use('/api/videos', videosRoutes);
app.use('/api/audios', audiosRoutes);
app.use('/', galeriaRoutes(db, uploadArchivos, uploadGeneral));
app.use('/', authRoutes(db));
app.use('/', expedientesRoutes(db, upload));

// --- 6. RUTAS PANEL DE CONTROL (REVISADO) ---

app.get('/usuarios', (req, res) => {
    db.query("SELECT id, nombre, email FROM usuarios", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get('/videos-publicos', (req, res) => {
    db.query("SELECT * FROM videos WHERE estado = 'aprobado'", (err, result) => {
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

app.get('/admin/todas-las-imagenes', (req, res) => {
    db.query("SELECT * FROM imagenes ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get('/admin/todas-noticias', (req, res) => {
    db.query("SELECT * FROM noticias ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get('/relatos-admin-publicos', (req, res) => {
    db.query("SELECT * FROM expedientes WHERE usuario_id = 0 OR usuario_id IS NULL ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// RUTA MAESTRA DE SUBIDA (CORREGIDA AL 100%)
app.post('/admin/subir-todo', uploadAdmin.single('archivo'), (req, res) => {
    const { seccion, titulo } = req.body;
    if (!req.file) return res.status(400).send("No hay archivo");

    const nombreArchivo = req.file.filename;
    let sql = "";
    let params = [];

    switch (seccion) {
        case 'videos':
            sql = "INSERT INTO videos (titulo, url, estado, usuario) VALUES (?, ?, 'aprobado', 'ADMIN')";
            params = [titulo, nombreArchivo];
            break;
        case 'imagenes_publicas':
            // ✅ CORRECCIÓN: Tabla 'imagenes', columna 'url_imagen' y 'agente'
            sql = "INSERT INTO imagenes (titulo, url_imagen, estado, agente, fecha) VALUES (?, ?, 'publica', 'ADMIN', NOW())";
            params = [titulo, nombreArchivo];
            break;
        case 'noticias':
            sql = "INSERT INTO noticias (titulo, imagen, estado, fecha) VALUES (?, ?, 'aprobado', NOW())";
            params = [titulo, nombreArchivo];
            break;
        case 'audios':
            sql = "INSERT INTO audios (titulo, ruta) VALUES (?, ?)";
            params = [titulo, nombreArchivo];
            break;
        case 'expedientes':
            sql = "INSERT INTO expedientes (titulo, contenido, estado, usuario_nombre) VALUES (?, 'Subida Admin', 'publicado', 'ADMIN')";
            params = [titulo];
            break;
        default:
            return res.status(400).send("Sección no válida");
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            console.error("❌ ERROR EN DB:", err.sqlMessage);
            return res.status(500).json({ error: err.sqlMessage });
        }
        res.json({ message: "Carga completada, pichica", id: result.insertId });
    });
});

// --- 7. LÓGICA DEL CHAT ---
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
            if (err) return console.error("Error:", err);
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

app.post('/chat-ia', (req, res) => res.json({ respuesta: `(Búnker) El Archivero está analizando...` }));

const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 BÚNKER EN PUERTO ${PORT} (DB: 3307)`));