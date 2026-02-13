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

// --- 3. RECURSOS ESTÁTICOS (Tuberías) ---
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

// --- 6. LÓGICA DEL CHAT ---
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

app.post('/chat-ia', (req, res) => res.json({ respuesta: `(Búnker) El Archivero está analizando los pergaminos...` }));

// --- MOTOR ---
const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 BÚNKER EN PUERTO ${PORT}`));