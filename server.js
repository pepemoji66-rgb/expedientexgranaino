require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// --- 1. IMPORTACIÓN DEL BÚNKER DE DATOS (MYSQL / AIVEN) ---
const db = require('./db');
// Protocolo de auto-inicialización robusto
try {
    require('./db_init')(db).catch(err => console.warn("🚧 Inicialización parcial:", err.message));
} catch (e) {
    console.error("⚠️ Fallo crítico en arranque, pero el servidor seguirá intentando conectar.");
}

// --- 2. IMPORTACIÓN DE RUTAS ---
const videosRoutes = require('./routes/videos');
const audiosRoutes = require('./routes/audios');
const authRoutes = require('./routes/auth');
const expedientesRoutes = require('./routes/expedientes');
const galeriaRoutes = require('./routes/galeria');
const adminRoutes = require('./routes/adminRoutes');
const horoscopoRoutes = require('./routes/horoscopo');
const cartaAstralRoutes = require('./routes/carta_astral');
const tarotRoutes = require('./routes/tarot');
const efemeridesRoutes = require('./routes/efemerides');
const noticiasExternasRoutes = require('./routes/noticias_externas');


// --- 2.5 INICIALIZACIÓN DE LA IA Y CLOUDINARY ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'no-key-found', { apiVersion: 'v1' });

// Configuración de la Nube (Cloudinary)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// --- CONFIGURACIÓN DE ALERTAS TELEGRAM ---
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'TU_TOKEN_AQUI';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || 'TU_CHAT_ID_AQUI';

const enviarAlertaTelegram = async (mensaje) => {
    if (!TELEGRAM_TOKEN || TELEGRAM_TOKEN === 'TU_TOKEN_AQUI') return;
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        await axios.post(url, {
            chat_id: TELEGRAM_CHAT_ID,
            text: `🛰️ BÚNKER ALERTA: ${mensaje}`,
            parse_mode: 'Markdown'
        });
        console.log("📡 ALERTA TELEGRAM ENVIADA");
    } catch (err) {
        console.error("❌ ERROR AL ENVIAR ALERTA TELEGRAM:", err.message);
    }
};


const app = express();
const server = http.createServer(app);

// --- 3. SOCKET.IO ---
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

const PORT = process.env.PORT || 10000;

// --- 4. MIDDLEWARES ---
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- 5. CONFIGURACIÓN DE CARPETAS Y STORAGE ---
const storageLocal = (folder) => multer.diskStorage({
    destination: (req, file, cb) => cb(null, folder),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
    }
});

// Selector de almacenamiento: Cloudinary si hay claves, si no Local
const storageCloudinary = (folderName) => {
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== '') {
        console.log(`☁️  Activando almacenamiento remoto para: ${folderName}`);
        return new CloudinaryStorage({
            cloudinary: cloudinary,
            params: {
                folder: folderName,
                resource_type: 'auto',
                public_id: (req, file) => `${Date.now()}-${file.originalname.split('.')[0]}`
            }
        });
    } else {
        console.log(`💾 Usando disco local para: ${folderName}`);
        const localFolder = `uploads/${folderName.split('_')[1] || 'imagenes'}`;
        return storageLocal(localFolder);
    }
};

const uploadGeneral = multer({ storage: storageCloudinary('expedientex_imagenes') });
const uploadArchivos = multer({ storage: storageCloudinary('expedientex_archivos') });
const uploadLugares = multer({ storage: storageCloudinary('expedientex_lugares') });
const uploadAudios = multer({ storage: storageCloudinary('expedientex_audios') });

// Aseguramos carpetas locales para el fallback
['uploads/imagenes', 'uploads/archivos', 'uploads/lugares', 'uploads/audios'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ==========================================
//    RUTAS DE LA API (CHATS Y OTROS GLOBAL)
// ==========================================

// --- ESTADÍSTICAS Y VISITAS ---
app.post('/api/visitas', async (req, res) => {
    try {
        await db.execute("UPDATE visitas SET cuenta = cuenta + 1 WHERE id = 1");
        const result = await db.query("SELECT cuenta FROM visitas WHERE id = 1");
        res.json({ cuenta: result[0]?.cuenta || 1 });
    } catch (err) {
        console.error("Error al registrar visita:", err);
        res.status(500).json({ error: "Error de servidor" });
    }
});

app.get('/api/visitas', async (req, res) => {
    try {
        const result = await db.query("SELECT cuenta FROM visitas WHERE id = 1");
        res.json({ cuenta: result[0]?.cuenta || 1 });
    } catch (err) {
        res.status(500).json({ error: "Error de servidor" });
    }
});

app.get('/api/usuarios', async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM usuarios ORDER BY id DESC");
        console.log(`📡 BÚNKER: Recuperados ${results.length} agentes.`);
        res.json(results);
    } catch (err) { res.status(200).json([]); }
});

app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        await db.execute("DELETE FROM usuarios WHERE id = ?", [req.params.id]);
        res.json({ mensaje: "Agente expulsado del búnker." });
    } catch (err) {
        res.status(500).json({ error: "No se pudo eliminar al agente" });
    }
});

app.put('/api/usuarios/:id/rango', async (req, res) => {
    try {
        const { rango } = req.body;
        if (!rango) {
            return res.status(400).json({ error: "Falta el rango a aplicar." });
        }

        await db.execute("UPDATE usuarios SET rango = ? WHERE id = ?", [rango, req.params.id]);
        res.json({ mensaje: `Rango actualizado a ${rango}.` });
    } catch (err) {
        console.error("Error actualizando rango:", err);
        res.status(500).json({ error: "No se pudo actualizar el rango del agente." });
    }
});

app.put('/api/usuarios/aprobar/:id', async (req, res) => {
    try {
        // Obtenemos el nombre del agente antes de aprobar para la notificación
        const result = await db.query("SELECT nombre FROM usuarios WHERE id = ?", [req.params.id]);
        const nombreAgente = result[0]?.nombre || "Nuevo Agente";

        await db.execute("UPDATE usuarios SET aprobado = 1 WHERE id = ?", [req.params.id]);

        // Notificación automática al canal táctico para que el usuario sepa que está aprobado
        const msgData = {
            nombre_usuario: 'SISTEMA',
            mensaje: `🚀 ¡ALERTA DE SEGURIDAD! El agente ${nombreAgente.toUpperCase()} ha sido validado y ya tiene acceso total al búnker.`,
            rol_usuario: 'admin',
            tipo: 'publico',
            fecha: new Date()
        };

        await db.execute("INSERT INTO chat_mensajes (nombre_usuario, mensaje, rol_usuario, tipo, fecha) VALUES (?, ?, ?, ?, NOW())",
            [msgData.nombre_usuario, msgData.mensaje, msgData.rol_usuario, msgData.tipo]);

        // También lo publicamos en Comentarios (Página Principal) para máxima visibilidad
        await db.execute("INSERT INTO comentarios (agente, mensaje, fecha, aprobado) VALUES (?, ?, NOW(), 1)",
            ['SISTEMA', `🛡️ NUEVO AGENTE: El investigador ${nombreAgente.toUpperCase()} ha sido validado para el acceso al búnker.`]);

        // Emitimos por socket para tiempo real si está disponible
        if (typeof io !== 'undefined') {
            io.emit('recibir_mensaje', { ...msgData, id: Date.now() });
        }

        res.json({ mensaje: "Agente autorizado y notificado en todos los canales." });
    } catch (err) {
        console.error("Error al aprobar agente:", err);
        res.status(500).json({ error: "No se pudo autorizar al agente" });
    }
});

app.get('/api/expedientes', async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM expedientes WHERE estado = 'aprobado' ORDER BY id DESC");
        res.json(results);
    } catch (err) { res.status(200).json([]); }
});

app.get('/api/lugares', async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM lugares WHERE estado = 'aprobado' OR estado IS NULL ORDER BY id DESC");
        res.json(results);
    } catch (err) { res.status(200).json([]); }
});

app.get('/api/lugares-publicos', async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM lugares WHERE estado = 'aprobado' ORDER BY id DESC");
        res.json(results);
    } catch (err) { res.status(200).json([]); }
});

// --- PROTOCOLO DE LIMPIEZA C-100 ---
async function podarRegistros(tabla, limite = 100) {
    try {
        // Obtenemos el total para informar
        const countRes = await db.query(`SELECT COUNT(*) as total FROM ${tabla}`);
        const total = countRes[0]?.total || 0;

        if (total > limite) {
            console.log(`🧹 LIMPIEZA: El sector ${tabla} excede el límite (${total}/${limite}). Ejecutando poda...`);
            // Borramos todo lo que NO esté entre los últimos X registros
            await db.execute(`
                DELETE FROM ${tabla} 
                WHERE id NOT IN (
                    SELECT id FROM ${tabla} 
                    ORDER BY id DESC 
                    LIMIT ?
                )
            `, [limite]);
        }
    } catch (err) {
        console.error(`❌ Error en protocolo C-100 para ${tabla}:`, err.message);
    }
}

// --- COMENTARIOS DE AGENTES ---
app.get('/api/admin/todos-comentarios', async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM comentarios ORDER BY id DESC");
        res.json(results);
    } catch (err) { res.status(200).json([]); }
});

app.get('/api/comentarios', async (req, res) => {
    try {
        // En la home mostramos solo los aprobados o los últimos 50
        const results = await db.query("SELECT * FROM comentarios ORDER BY id DESC LIMIT 50");
        res.json(results);
    } catch (err) { res.status(200).json([]); }
});

app.post('/api/comentarios', async (req, res) => {
    const { agente, mensaje } = req.body;
    if (!agente || !mensaje) return res.status(400).json({ error: "Faltan datos." });
    try {
        await db.execute("INSERT INTO comentarios (agente, mensaje, fecha, aprobado) VALUES (?, ?, NOW(), 1)", [agente, mensaje]);
        await podarRegistros('comentarios', 100); // Auto-limpieza

        // ALERTA TELEGRAM: Nuevo comentario
        enviarAlertaTelegram(`💬 NUEVO COMENTARIO en la Home de ${agente}: "${mensaje.substring(0, 50)}${mensaje.length > 50 ? '...' : ''}"`);

        res.json({ mensaje: "Comunicación enviada al archivo." });
    } catch (err) {
        console.error("Error al guardar comentario:", err);
        res.status(500).json({ error: "Error al guardar comentario." });
    }
});

app.delete('/api/comentarios/:id', async (req, res) => {
    try {
        await db.execute("DELETE FROM comentarios WHERE id = ?", [req.params.id]);
        res.json({ mensaje: "Comentario eliminado." });
    } catch (err) {
        res.status(500).json({ error: "No se pudo eliminar el comentario." });
    }
});

app.get('/api/chat-historial', async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM chat_mensajes ORDER BY id DESC LIMIT 100");
        res.json(results.reverse());
    } catch (err) {
        console.error("❌ ERROR EN EL BÚNKER (CHAT):", err);
        res.status(200).json([]);
    }
});

app.delete('/api/borrar-mensaje/:id', async (req, res) => {
    try {
        await db.execute("DELETE FROM chat_mensajes WHERE id = ?", [req.params.id]);
        res.json({ mensaje: "Mensaje borrado del flujo." });
    } catch (err) {
        res.status(500).json({ error: "No se pudo borrar el mensaje" });
    }
});

app.post('/api/chat-ia', async (req, res) => {
    const { pregunta } = req.body;
    if (!pregunta) return res.status(400).json({ respuesta: "Falta señal de entrada, hermano." });

    const modelosAProbar = ["gemini-2.0-flash-lite", "gemini-1.5-flash", "gemini-1.0-pro"];
    for (const modName of modelosAProbar) {
        try {
            const targetModel = genAI.getGenerativeModel({ model: modName });
            const result = await targetModel.generateContent(`Eres el Archivero del Búnker de ExpedienteX. Responde brevemente (máximo 50 palabras) y con misterio a: "${pregunta}"`);
            const responseData = await result.response;
            return res.json({ respuesta: responseData.text() });
        } catch (error) {
            console.error(`❌ Fallo con modelo ${modName}:`, error.message);
            if (modName === modelosAProbar[modelosAProbar.length - 1]) {
                return res.status(500).json({ respuesta: "SISTEMA INESTABLE: El Archivero no puede descifrar los archivos ahora mismo." });
            }
        }
    }
});

app.post('/api/traducir-tactico', async (req, res) => {
    const { texto } = req.body;
    if (!texto) return res.status(400).json({ respuesta: "Sin datos para descifrar." });

    const modelosAProbar = ["gemini-1.5-flash", "gemini-2.0-flash-lite", "gemini-1.0-pro"];

    for (const modName of modelosAProbar) {
        try {
            console.log(`🤖 TRADUCTOR: Intentando descifrar con ${modName}...`);
            const targetModel = genAI.getGenerativeModel({ model: modName });
            const prompt = `Eres el traductor del Búnker de ExpedienteX. Traduce el siguiente mensaje al español (si ya está en español, corrígelo con estilo de misterio). Sé breve y táctico. Texto: "${texto}"`;

            const result = await targetModel.generateContent(prompt);
            const responseData = await result.response;
            return res.json({ respuesta: responseData.text() });
        } catch (error) {
            console.error(`❌ Fallo en descifrado con ${modName}:`, error.message);
            if (modName === modelosAProbar[modelosAProbar.length - 1]) {
                res.status(500).json({ respuesta: "ERROR DE ENCRIPTACIÓN: No se puede descifrar la señal ahora mismo." });
            }
        }
    }
});



// --- MONTAR RUTAS MODULARES ---
app.use('/api/videos', videosRoutes(db, uploadGeneral));
app.use('/api/audios', audiosRoutes(db, uploadAudios));
app.use('/api/galeria', galeriaRoutes(db, uploadArchivos, uploadGeneral));
app.use('/api/auth', authRoutes(db));
app.use('/api/expedientes', expedientesRoutes(db, uploadLugares));
app.use('/api/admin', adminRoutes(db));
app.use('/api/horoscopo', horoscopoRoutes(db, genAI));
app.use('/api/carta-astral', cartaAstralRoutes(db, genAI));
app.use('/api/tarot', tarotRoutes(db, genAI));
app.use('/api/efemerides', efemeridesRoutes(db, genAI));
app.use('/api/noticias-externas', noticiasExternasRoutes(db, genAI));

// --- SERVIDORES ESTÁTICOS ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/videos', express.static(path.join(__dirname, 'public/videos')));
app.use('/audios', express.static(path.join(__dirname, 'uploads/audios')));
app.use('/lugares', express.static(path.join(__dirname, 'uploads/lugares')));

app.use('/audios-ambiente', express.static(path.join(__dirname, 'public/audios')));

// Unificamos /imagenes para que busque en todos los sectores posibles (retrocompatibilidad local)
['uploads/imagenes', 'uploads/archivos', 'uploads/lugares'].forEach(dir => {
    app.use('/imagenes', express.static(path.join(__dirname, dir)));
});

app.use(express.static(path.join(__dirname, 'build')));

// --- 9. CHAT (SOCKET.IO) ---
io.on('connection', (socket) => {
    socket.on('enviar_mensaje', async (data) => {
        const { nombre_usuario, mensaje, rol_usuario, tipo, destinatario } = data;
        const sql = "INSERT INTO chat_mensajes (nombre_usuario, mensaje, rol_usuario, tipo, destinatario, fecha) VALUES (?, ?, ?, ?, ?, NOW())";
        try {
            const [result] = await db.execute(sql, [nombre_usuario, mensaje, rol_usuario, tipo, destinatario || null]);
            io.emit('recibir_mensaje', { id: Number(result.lastInsertRowid), ...data, fecha: new Date() });

            // ALERTA TELEGRAM: Actividad en el chat (solo si no es el sistema)
            if (nombre_usuario !== 'SISTEMA') {
                enviarAlertaTelegram(`📱 CHAT TÁCTICO - ${nombre_usuario}: ${mensaje.substring(0, 100)}`);
            }

            await podarRegistros('chat_mensajes', 100); // Auto-limpieza chat
        } catch (err) {

            console.error("Error en socket chat:", err);
        }
    });

    socket.on('limpiar_chat_servidor', async () => {
        try {
            await db.execute("DELETE FROM chat_mensajes");
            io.emit('chat_limpiado');
            console.log("🧹 Frecuencia del chat limpiada por orden superior.");
        } catch (err) {
            console.error("Error al limpiar chat:", err);
        }
    });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BÚNKER EXPEDIENTE X ABIERTO EN PUERTO ${PORT}`);
});