const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// --- 0. IMPORTACIÓN DE SOCKET.IO ---
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app); // Necesario para que Socket trabaje con Express
const io = new Server(server, {
    cors: {
        origin: "*", // En producción cambiaremos esto por tu dominio
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(bodyParser.json());

// --- 1. CONFIGURACIÓN DE ALMACENAMIENTO ---
const dirLugares = path.join(__dirname, '../public/lugares');
if (!fs.existsSync(dirLugares)) { fs.mkdirSync(dirLugares, { recursive: true }); }

const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, dirLugares); },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, "_"));
    }
});
const upload = multer({ storage: storage });

// --- 2. RECURSOS ESTÁTICOS ---
app.use('/imagenes', express.static(path.join(__dirname, 'public/imagenes')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));
app.use('/lugares', express.static(dirLugares));

// --- 3. CONEXIÓN (Puerto 3307) ---
const db = mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'expedientex', port: 3307
});

db.connect(err => {
    if (err) console.error("❌ ERROR MySQL:", err.message);
    else console.log("✅ SISTEMA 100% OPERATIVO: Conectado a 'expedientex' (3307)");
});

// =========================================================================
// --- 4. LÓGICA DEL CHAT EN TIEMPO REAL (SOCKET.IO) ---
// =========================================================================

io.on('connection', (socket) => {
    console.log('📡 Usuario conectado al canal de comunicación');
    // Dentro de io.on('connection', (socket) => { ...

    socket.on('limpiar_chat_servidor', () => {
        // Borramos todo de la tabla
        db.query("DELETE FROM chat_mensajes", (err) => {
            if (err) return console.error(err);
            // Avisamos a todos los clientes que el chat se ha vaciado
            io.emit('chat_limpiado');
        });
    });

// ... })

    // Escuchar cuando un usuario envía un mensaje
    socket.on('enviar_mensaje', (data) => {
        const { nombre_usuario, mensaje, rol_usuario, tipo, destinatario } = data;

        // Guardar en la DB
        const sqlInsert = "INSERT INTO chat_mensajes (nombre_usuario, mensaje, rol_usuario, tipo, destinatario) VALUES (?, ?, ?, ?, ?)";
        db.query(sqlInsert, [nombre_usuario, mensaje, rol_usuario, tipo, destinatario], (err, result) => {
            if (err) return console.error("Error guardando mensaje:", err);

            // EMITIR EL MENSAJE A TODOS (Si es público)
            io.emit('recibir_mensaje', {
                id: result.insertId,
                ...data,
                fecha: new Date()
            });

            // 🧹 AUTO-LIMPIEZA: Mantener solo los últimos 100 mensajes
            db.query("DELETE FROM chat_mensajes WHERE id NOT IN (SELECT id FROM (SELECT id FROM chat_mensajes ORDER BY id DESC LIMIT 100) as temp)", (err) => {
                if (err) console.error("Error en auto-limpieza:", err);
            });
        });
    });

    socket.on('disconnect', () => {
        console.log('🔌 Usuario desconectado');
    });
});

// Ruta para cargar el historial inicial del chat
app.get('/chat-historial', (req, res) => {
    db.query("SELECT * FROM chat_mensajes ORDER BY id ASC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// =========================================================================
// --- 5. RUTAS DE ESTADÍSTICAS ---
// =========================================================================
app.get('/admin/conteo-total', (req, res) => {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM usuarios) as usuarios,
            (SELECT COUNT(*) FROM videos) as videos,
            (SELECT COUNT(*) FROM expedientes) as expedientes,
            (SELECT COUNT(*) FROM lugares) as lugares
    `;
    db.query(sql, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result[0]);
    });
});

// =========================================================================
// --- 6. LOGIN Y USUARIOS ---
// =========================================================================
function loginFunc(req, res) {
    const { email, password } = req.body;
    db.query("SELECT * FROM usuarios WHERE email = ? AND password = ?", [email, password], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.length > 0) res.json({ mensaje: "Acceso concedido", usuario: result[0] });
        else res.status(401).json({ mensaje: "Credenciales incorrectas" });
    });
}
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

// =========================================================================
// --- 7. GESTIÓN DE EXPEDIENTES ---
// =========================================================================
app.get('/expedientes', (req, res) => {
    db.query("SELECT * FROM expedientes ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.get('/expedientes-publicos', (req, res) => {
    db.query("SELECT id, usuario_nombre, titulo, contenido FROM expedientes WHERE estado = 'publicado' ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.post('/subir-expediente', (req, res) => {
    const { titulo, contenido, usuario_nombre } = req.body;
    db.query("INSERT INTO expedientes (titulo, contenido, usuario_nombre, estado) VALUES (?, ?, ?, 'pendiente')", [titulo, contenido, usuario_nombre], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Expediente enviado" });
    });
});

app.put('/aprobar-expediente/:id', (req, res) => {
    db.query("UPDATE expedientes SET estado = 'publicado' WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Expediente publicado" });
    });
});

app.delete('/expedientes/:id', (req, res) => {
    db.query("DELETE FROM expedientes WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Expediente eliminado" });
    });
});

// =========================================================================
// --- 8. RADAR TÁCTICO (LUGARES) ---
// =========================================================================
app.get('/lugares', (req, res) => {
    db.query("SELECT * FROM lugares ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

app.post('/lugares', upload.single('foto'), (req, res) => {
    const { nombre, descripcion, latitud, longitud, ubicacion } = req.body;
    const imagen_url = req.file ? `/lugares/${req.file.filename}` : '/lugares/default.jpg';
    const sql = "INSERT INTO lugares (nombre, descripcion, latitud, longitud, imagen_url, ubicacion, estado) VALUES (?, ?, ?, ?, ?, ?, 'pendiente')";
    db.query(sql, [nombre, descripcion, latitud, longitud, imagen_url, ubicacion], (err, result) => {
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

// =========================================================================
// --- 9. VÍDEOS ---
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

// =========================================================================
// --- 10. IMÁGENES Y RELATOS ---
// =========================================================================
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

app.delete('/borrar-imagen/:id', (req, res) => {
    db.query("DELETE FROM imagenes WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ mensaje: "Imagen borrada" });
    });
});

app.get('/relatos-administrador', (req, res) => {
    db.query("SELECT * FROM `relatos administrador` ORDER BY id DESC", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// --- FINAL: USAMOS server.listen EN VEZ DE app.listen PARA SOCKET ---
server.listen(5000, () => console.log(`🚀 BÚNKER CON CHAT OPERATIVO EN PUERTO 5000`));