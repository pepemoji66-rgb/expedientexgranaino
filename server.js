require('dotenv').config();
const express = require('express');
const compression = require('compression');
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

const efemeridesRoutes = require('./routes/efemerides');
const noticiasExternasRoutes = require('./routes/noticias_externas');
const archipegRoutes = require('./routes/archipeg');
const casosAbiertosRoutes = require('./routes/casosAbiertos');
const socialRoutes = require('./routes/socialRoutes');
const misteriosHistoricosRoutes = require('./routes/misteriosHistoricos');
const ruletaRoutes = require('./routes/ruleta');


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
app.use(compression()); // Gzip/Brotli — mejora TTFB y Core Web Vitals
app.use(cors());
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- LOG DE OPERACIONES ---
app.use((req, res, next) => {
    console.log(`📡 [${new Date().toLocaleTimeString()}] REQUERIMIENTO: ${req.method} ${req.url}`);
    next();
});

// --- 🛡️ MIDDLEWARE ANTI-BOTS Y TRÁFICO FANTASMA DE CENTROS DE DATOS ---
app.use((req, res, next) => {
    const userAgent = req.headers['user-agent'] || '';
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

    // Solo bloqueamos peticiones a páginas HTML — no bloqueamos assets (imágenes, CSS, JS, txt, ads.txt)
    const esRecursoEstatico = /\.(js|css|png|jpg|jpeg|gif|webp|ico|svg|woff|woff2|ttf|map|json|txt)(\?.*)?$/.test(req.path);
    if (esRecursoEstatico || req.path === '/ads.txt') return next();

    // Lista blanca: Buscadores, redes sociales Y Amazon (afiliados, verificación de enlaces)
    const isLegitBot = /googlebot|google-adwords|adsbot-google|mediapartners-google|bingbot|yandexbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot|amazonbot|amazon|ia_archiver|slurp/i.test(userAgent);
    if (isLegitBot) return next();

    // Lista negra por User-Agent: Firmas de bots claramente maliciosos
    const isMaliciousUA = /headless|selenium|puppeteer|webdriver|scrapy|libwww|perl|python-urllib|python-requests|wget|curl\/|go-http|java\/|apachebench|mj12bot|semrushbot|ahrefsbot|dotbot|rogerbot|exabot|semrush|sogou|megaindex|semalt|uipresence|zgrab|masscan|nmap|sqlmap/i.test(userAgent);
    if (isMaliciousUA) {
        console.warn(`🛡️ ANTI-BOTS [UA]: Bloqueado -> UA: "${userAgent.substring(0, 80)}" | IP: ${ip}`);
        return res.status(403).send("🔒 Acceso no autorizado por el protocolo del Búnker.");
    }

    // Bloqueo por IP de datacenter SOLO si además el User-Agent está vacío o es muy genérico
    // Así protegemos los bots legítimos de Amazon Afiliados que vienen de IPs de AWS
    const sinUserAgent = !userAgent || userAgent.trim() === '';
    const uaGenerico = /^mozilla\/5\.0\s*$/i.test(userAgent.trim());

    if (sinUserAgent || uaGenerico) {
        const ipPartes = ip.split('.').map(Number);
        const primerOcteto = ipPartes[0];
        const segundoOcteto = ipPartes[1];

        const esDatacenter = (
            (primerOcteto === 3 && segundoOcteto >= 80 && segundoOcteto <= 130) ||
            (primerOcteto === 52 && [32, 33, 34, 35, 36, 37, 38, 39, 88, 89].includes(segundoOcteto)) ||
            (primerOcteto === 54 && segundoOcteto >= 148) ||
            (primerOcteto === 104 && segundoOcteto >= 16 && segundoOcteto <= 31)
        );

        if (esDatacenter) {
            console.warn(`🛡️ ANTI-BOTS [IP+UA vacío]: Bloqueado -> IP: ${ip} | UA: "${userAgent.substring(0, 60)}"`);
            return res.status(403).send("🔒 Acceso no autorizado por el protocolo del Búnker.");
        }
    }

    next();
});


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

// ============================================================
// 📊 RADAR DE RETENCIÓN — Tracking de sesiones de usuario
// ============================================================

// Registrar inicio de sesión
app.post('/api/sesion/inicio', async (req, res) => {
    try {
        const { sesion_id, ruta_entrada, dispositivo, agente } = req.body;
        if (!sesion_id) return res.status(400).json({ error: 'sesion_id requerido' });
        
        await db.execute(
            `INSERT INTO sesiones_retencion (sesion_id, ruta_entrada, dispositivo, agente) VALUES (?, ?, ?, ?)`,
            [sesion_id, ruta_entrada || '/', dispositivo || 'desktop', agente || null]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error("📊 Error al iniciar sesión de retención:", err.message);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// Heartbeat: actualizar duración y páginas vistas
app.post('/api/sesion/heartbeat', async (req, res) => {
    try {
        const { sesion_id, duracion_segundos, duracion_total_segundos, paginas_vistas, agente } = req.body;
        if (!sesion_id) return res.status(400).json({ error: 'sesion_id requerido' });

        const campos = [
            'duracion_segundos = ?',
            'duracion_total_segundos = ?',
            'paginas_vistas = ?',
            'fecha_fin = NOW()'
        ];
        const valores = [
            duracion_segundos || 0,
            duracion_total_segundos || 0,
            paginas_vistas || 1
        ];

        // Actualizar agente si se proporciona (usuario hizo login durante la sesión)
        if (agente) {
            campos.push('agente = ?');
            valores.push(agente);
        }

        valores.push(sesion_id);

        await db.execute(
            `UPDATE sesiones_retencion SET ${campos.join(', ')} WHERE sesion_id = ? AND activa = 1`,
            valores
        );
        res.json({ ok: true });
    } catch (err) {
        console.error("📊 Error en heartbeat de retención:", err.message);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

// Fin de sesión: marcar como cerrada
app.post('/api/sesion/fin', async (req, res) => {
    try {
        const { sesion_id, duracion_segundos, duracion_total_segundos, paginas_vistas } = req.body;
        if (!sesion_id) return res.status(400).json({ error: 'sesion_id requerido' });

        await db.execute(
            `UPDATE sesiones_retencion 
             SET duracion_segundos = ?, duracion_total_segundos = ?, paginas_vistas = ?, 
                 fecha_fin = NOW(), activa = 0 
             WHERE sesion_id = ? AND activa = 1`,
            [duracion_segundos || 0, duracion_total_segundos || 0, paginas_vistas || 1, sesion_id]
        );
        res.json({ ok: true });
    } catch (err) {
        console.error("📊 Error al finalizar sesión de retención:", err.message);
        res.status(500).json({ error: 'Error de servidor' });
    }
});

app.get('/api/usuarios', async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM usuarios ORDER BY id DESC");
        console.log(`📡 BÚNKER: Recuperados ${results.length} agentes.`);
        res.json(results);
    } catch (err) { res.status(200).json([]); }
});

app.get('/api/noticias/ultima', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM noticias ORDER BY id DESC LIMIT 1");
        res.json(result[0] || null);
    } catch (err) { res.status(200).json(null); }
});

app.get('/api/noticias/ultimas', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM noticias ORDER BY id DESC LIMIT 3");
        res.json(result);
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

// --- PROTOCOLO DE LIMPIEZA DE COMENTARIOS ---
async function podarComentarios(itemKey = null, limite = 100) {
    try {
        let total = 0;
        let rows = [];

        if (itemKey === null) {
            // Podar comentarios de la Home (donde item_key es NULL)
            const countRes = await db.query("SELECT COUNT(*) as total FROM comentarios WHERE item_key IS NULL");
            total = countRes[0]?.total || 0;
            if (total > limite) {
                console.log(`🧹 LIMPIEZA HOME: Hay ${total}/${limite} comentarios. Podando...`);
                rows = await db.query("SELECT id FROM comentarios WHERE item_key IS NULL ORDER BY id DESC LIMIT 1 OFFSET ?", [limite - 1]);
                if (rows.length > 0) {
                    const limiteId = rows[0].id;
                    await db.execute("DELETE FROM comentarios WHERE item_key IS NULL AND id < ?", [limiteId]);
                    console.log(`🧹 LIMPIEZA HOME: Eliminados comentarios de home antiguos con ID menor a ${limiteId}`);
                }
            }
        } else {
            // Podar comentarios de un expediente específico
            const countRes = await db.query("SELECT COUNT(*) as total FROM comentarios WHERE item_key = ?", [itemKey]);
            total = countRes[0]?.total || 0;
            if (total > limite) {
                console.log(`🧹 LIMPIEZA EXPEDIENTE [${itemKey}]: Hay ${total}/${limite} comentarios. Podando...`);
                rows = await db.query("SELECT id FROM comentarios WHERE item_key = ? ORDER BY id DESC LIMIT 1 OFFSET ?", [itemKey, limite - 1]);
                if (rows.length > 0) {
                    const limiteId = rows[0].id;
                    await db.execute("DELETE FROM comentarios WHERE item_key = ? AND id < ?", [itemKey, limiteId]);
                    console.log(`🧹 LIMPIEZA EXPEDIENTE [${itemKey}]: Eliminados comentarios antiguos con ID menor a ${limiteId}`);
                }
            }
        }
    } catch (err) {
        console.error(`❌ Error en protocolo de poda de comentarios:`, err.message);
    }
}

// --- COMENTARIOS DE AGENTES ---
app.get('/api/admin/todos-comentarios', async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM comentarios ORDER BY id DESC");
        res.json(results);
    } catch (err) { res.status(200).json([]); }
});

// --- CONTEO DE COMENTARIOS PENDIENTES (para badge de alerta en panel admin) ---
app.get('/api/comentarios/pendientes/count', async (req, res) => {
    try {
        const result = await db.query("SELECT COUNT(*) as total FROM comentarios WHERE aprobado = 0");
        res.json({ total: result[0].total });
    } catch (err) { res.status(200).json({ total: 0 }); }
});

// --- APROBAR COMENTARIO ---
app.put('/api/comentarios/:id/aprobar', async (req, res) => {
    try {
        await db.execute("UPDATE comentarios SET aprobado = 1 WHERE id = ?", [req.params.id]);
        res.json({ mensaje: "Comentario aprobado y publicado." });
    } catch (err) {
        res.status(500).json({ error: "No se pudo aprobar el comentario." });
    }
});

app.get('/api/comentarios', async (req, res) => {
    try {
        // Solo mostramos comentarios aprobados por el admin
        const results = await db.query("SELECT * FROM comentarios WHERE item_key IS NULL AND aprobado = 1 ORDER BY id DESC LIMIT 50");
        res.json(results);
    } catch (err) { res.status(200).json([]); }
});

app.get('/api/comentarios/recientes', async (req, res) => {
    try {
        const comentarios = await db.query("SELECT * FROM comentarios WHERE item_key IS NOT NULL ORDER BY id DESC LIMIT 5");
        const resultados = [];
        
        for (const c of comentarios) {
            let titulo = "Expediente";
            const itemKey = c.item_key;
            if (itemKey) {
                const parts = itemKey.split('-');
                const tipo = parts[0];
                const id = parts[1];
                
                try {
                    let art = [];
                    if (tipo === 'exp') {
                        art = await db.query("SELECT titulo FROM expedientes WHERE id = ?", [id]);
                    } else if (tipo === 'caso') {
                        art = await db.query("SELECT titulo FROM casos_abiertos WHERE id = ?", [id]);
                    } else if (tipo === 'misterio') {
                        art = await db.query("SELECT titulo FROM misterios_historicos WHERE id = ?", [id]);
                    } else if (tipo === 'noticia') {
                        art = await db.query("SELECT titulo FROM noticias WHERE id = ?", [id]);
                    }
                    if (art && art.length > 0) {
                        titulo = art[0].titulo;
                    }
                } catch (e) {
                    console.error("Error looking up article title for comment:", e);
                }
            }
            resultados.push({
                ...c,
                titulo_articulo: titulo
            });
        }
        res.json(resultados);
    } catch (err) { 
        console.error("Error en /api/comentarios/recientes:", err);
        res.status(200).json([]); 
    }
});

// --- ENDPOINT: Último comentario global (para sistema de notificaciones) ---
app.get('/api/comentarios/ultimo', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM comentarios ORDER BY id DESC LIMIT 1");
        res.json(result[0] || null);
    } catch (err) { res.status(200).json(null); }
});

app.get('/api/comentarios/:itemKey', async (req, res) => {
    const { itemKey } = req.params;
    try {
        // Solo mostramos comentarios aprobados por el admin
        const results = await db.query("SELECT * FROM comentarios WHERE item_key = ? AND aprobado = 1 ORDER BY id ASC", [itemKey]);
        res.json(results);
    } catch (err) {
        console.error("Error al obtener comentarios de item:", err);
        res.status(200).json([]);
    }
});

app.post('/api/comentarios', async (req, res) => {
    const { agente, mensaje } = req.body;
    if (!agente || !mensaje) return res.status(400).json({ error: "Faltan datos." });
    try {
        // aprobado = 0: queda pendiente de revisión por el admin
        await db.execute("INSERT INTO comentarios (agente, mensaje, fecha, aprobado) VALUES (?, ?, NOW(), 0)", [agente, mensaje]);

        // ALERTA TELEGRAM: Nuevo comentario pendiente de aprobación
        enviarAlertaTelegram(`🔔 NUEVO COMENTARIO PENDIENTE de ${agente}: "${mensaje.substring(0, 50)}${mensaje.length > 50 ? '...' : ''}"\n⚡ Entra al Panel de Mando para aprobarlo.`);

        res.json({ mensaje: "Comunicación enviada. Pendiente de revisión por el administrador." });
    } catch (err) {
        console.error("Error al guardar comentario:", err);
        res.status(500).json({ error: "Error al guardar comentario." });
    }
});

app.post('/api/comentarios/:itemKey', async (req, res) => {
    const { itemKey } = req.params;
    const { agente, mensaje } = req.body;
    if (!agente || !mensaje) return res.status(400).json({ error: "Faltan datos." });
    try {
        // aprobado = 0: queda pendiente de revisión por el admin
        await db.execute("INSERT INTO comentarios (agente, mensaje, item_key, fecha, aprobado) VALUES (?, ?, ?, NOW(), 0)", [agente, mensaje, itemKey]);

        // ALERTA TELEGRAM: Nuevo comentario pendiente de aprobación
        enviarAlertaTelegram(`🔔 NUEVO COMENTARIO PENDIENTE en [${itemKey}] de ${agente}: "${mensaje.substring(0, 50)}${mensaje.length > 50 ? '...' : ''}"\n⚡ Entra al Panel de Mando para aprobarlo.`);

        res.json({ mensaje: "Comunicación enviada. Pendiente de revisión por el administrador." });
    } catch (err) {
        console.error("Error al guardar comentario en expediente:", err);
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

// Migraciones para añadir youtube_url a las tablas de artículos
db.query("ALTER TABLE expedientes ADD COLUMN youtube_url VARCHAR(500) DEFAULT NULL").catch(() => {});
db.query("ALTER TABLE casos_abiertos ADD COLUMN youtube_url VARCHAR(500) DEFAULT NULL").catch(() => {});
db.query("ALTER TABLE misterios_historicos ADD COLUMN youtube_url VARCHAR(500) DEFAULT NULL").catch(() => {});
db.query("ALTER TABLE noticias ADD COLUMN youtube_url VARCHAR(500) DEFAULT NULL").catch(() => {});

// --- COLABORADORES DEL BÚNKER ---
// Inicializar tabla si no existe
db.query(`CREATE TABLE IF NOT EXISTS colaboradores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(300),
    redes VARCHAR(200),
    fecha_alta DATE,
    avatar VARCHAR(10) DEFAULT '🛸',
    destacado TINYINT(1) DEFAULT 0,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => { if (err) console.warn('Tabla colaboradores ya existe o error:', err.message); });

app.get('/api/colaboradores', async (req, res) => {
    try {
        const results = await db.query("SELECT * FROM colaboradores ORDER BY destacado DESC, creado_en DESC");
        res.json(results);
    } catch (err) { res.status(200).json([]); }
});

app.post('/api/colaboradores', async (req, res) => {
    const { nombre, descripcion, redes, fecha_alta, avatar, destacado } = req.body;
    if (!nombre) return res.status(400).json({ error: "Falta el nombre." });
    try {
        await db.execute(
            "INSERT INTO colaboradores (nombre, descripcion, redes, fecha_alta, avatar, destacado) VALUES (?, ?, ?, ?, ?, ?)",
            [nombre, descripcion || '', redes || '', fecha_alta || null, avatar || '🛸', destacado ? 1 : 0]
        );
        res.json({ mensaje: "Colaborador añadido al búnker." });
    } catch (err) {
        res.status(500).json({ error: "Error al añadir colaborador." });
    }
});

app.delete('/api/colaboradores/:id', async (req, res) => {
    try {
        await db.execute("DELETE FROM colaboradores WHERE id = ?", [req.params.id]);
        res.json({ mensaje: "Colaborador eliminado." });
    } catch (err) {
        res.status(500).json({ error: "Error al eliminar colaborador." });
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

app.use('/api/efemerides', efemeridesRoutes(db, genAI));
app.use('/api/noticias-externas', noticiasExternasRoutes(db, genAI));
app.use('/api/archipeg', archipegRoutes(db));
app.use('/api/casos', casosAbiertosRoutes(uploadArchivos));
app.use('/api/social', socialRoutes(db, enviarAlertaTelegram));
app.use('/api/misterios-historicos', misteriosHistoricosRoutes(uploadArchivos));
app.use('/api/ruleta', ruletaRoutes(db));

// Servir ads.txt directamente para Google AdSense
app.get('/ads.txt', (req, res) => {
    res.type('text/plain');
    res.send('google.com, pub-2318415961583536, DIRECT, f08c47fec0942fa0');
});

// --- SERVIDORES ESTÁTICOS ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Para /videos y /lugares: solo servir archivos estáticos reales (no la raíz '/')
// Así la petición a /videos y /lugares pasa a la ruta SSR con contenido SEO
app.use('/videos', (req, res, next) => {
    if (req.path === '/' || req.path === '') return next();
    express.static(path.join(__dirname, 'public/videos'))(req, res, next);
});
app.use('/audios', express.static(path.join(__dirname, 'uploads/audios')));
app.use('/lugares', (req, res, next) => {
    if (req.path === '/' || req.path === '') return next();
    express.static(path.join(__dirname, 'uploads/lugares'))(req, res, next);
});

app.use('/audios-ambiente', express.static(path.join(__dirname, 'public/audios')));

// Unificamos /imagenes para que busque en todos los sectores posibles (retrocompatibilidad local)
['uploads/imagenes', 'uploads/archivos', 'uploads/lugares'].forEach(dir => {
    app.use('/imagenes', express.static(path.join(__dirname, dir)));
});

app.use(express.static(path.join(__dirname, 'build'), {
    maxAge: '1y',
    etag: false,
    index: false, // El SSR sirve el index.html, no el static handler
    redirect: false // Evitar 301 automático cuando /videos o /lugares coinciden con carpetas en build/
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '7d'
}));

// --- 9. SOCKET.IO (SIN CHAT) ---
io.on('connection', (socket) => {
    // Espacio reservado para futuros módulos en tiempo real
});

// ==============================================
// PRE-RENDER SSR PARA BOTS (AdSense / Googlebot)
// Transforma URLs de Cloudinary para que tengan el tamaño mínimo exigido por Facebook (200x200)
// y el tamaño óptimo para redes sociales (1200x630)
const cloudinaryOgImage = (url) => {
    if (!url) return url;
    if (!url.includes('res.cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/w_1200,h_630,c_fill,f_jpg,q_auto/');
};

// ==============================================
// Inyecta contenido HTML rico antes de servir el SPA
// ==============================================

const inyectarContenidoSEO = (html, titulo, descripcion, contenidoSeo, imagenUrl = null, paginaUrl = null) => {
    // Reemplazamos el title genérico por uno específico de página
    html = html.replace(
        /<title>[^<]*<\/title>/i,
        `<title>${titulo}</title>`
    );

    const desc = (descripcion || '').replace(/"/g, '&quot;').replace(/\n/g, ' ').trim();
    const title = (titulo || '').replace(/"/g, '&quot;');
    const rawImg = imagenUrl || 'https://expedientexgranaino.com/social-preview.png?v=7.0';
    const img = cloudinaryOgImage(rawImg);
    const url = paginaUrl || 'https://expedientexgranaino.com/';
    const esHistoria = url.includes('/leer-historia/') || url.includes('/expedientes/') || url.includes('/noticias/') || url.includes('/casos-abiertos/') || url.includes('/misterios-historicos/');

    // Limpiamos los tags originales en index.html para evitar duplicaciones
    html = html.replace(/<meta [^>]*property=["']og:[^"']*["'][^>]*>/gi, '');
    html = html.replace(/<meta [^>]*name=["']twitter:[^"']*["'][^>]*>/gi, '');
    html = html.replace(/<meta [^>]*name=["']description["'][^>]*>/gi, '');
    html = html.replace(/<meta [^>]*name=["']keywords["'][^>]*>/gi, '');
    html = html.replace(/<link [^>]*rel=["']canonical["'][^>]*>/gi, '');

    // Generación de Datos Estructurados (JSON-LD) para SEO
    let schemaType = esHistoria ? "NewsArticle" : "WebSite";

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": schemaType,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": url
        },
        "headline": title,
        "description": desc,
        "image": img,
        "publisher": {
            "@type": "Organization",
            "name": "Expediente X Granaíno",
            "url": "https://expedientexgranaino.com",
            "logo": {
                "@type": "ImageObject",
                "url": "https://expedientexgranaino.com/logoexpedientex.jpeg"
            }
        }
    };

    if (schemaType === "NewsArticle") {
        jsonLd.author = {
            "@type": "Organization",
            "name": "Expediente X Granaíno",
            "url": "https://expedientexgranaino.com"
        };
    }

    // Palabras clave y etiquetas temáticas dinámicas para SEO y Redes
    let keywordsDinamicas = "OVNI Granada, fenómenos paranormales, ufología Andalucía, avistamientos UFO, psicofonías, misterio, investigación paranormal, Expediente X Granaíno";
    let articleTags = "";

    if (url.includes('casos')) {
        keywordsDinamicas = "True Crime Granada, crónica negra, casos abiertos, investigación criminal, sucesos Granada, misterio, Expediente X";
        articleTags = `
<meta property="article:tag" content="True Crime" />
<meta property="article:tag" content="Crónica Negra" />
<meta property="article:tag" content="Casos Abiertos" />
<meta property="article:tag" content="Granada" />
<meta property="article:tag" content="Expediente X Granaíno" />`;
    } else if (url.includes('misterios')) {
        keywordsDinamicas = "misterios históricos, historia oculta Granada, leyendas Andalucía, patrimonio misterioso, secretos históricos, Expediente X";
        articleTags = `
<meta property="article:tag" content="Misterios Históricos" />
<meta property="article:tag" content="Historia Oculta" />
<meta property="article:tag" content="Leyendas" />
<meta property="article:tag" content="Granada" />
<meta property="article:tag" content="Expediente X Granaíno" />`;
    } else if (url.includes('noticias')) {
        keywordsDinamicas = "última hora misterio, noticias paranormales, alertas ovni, fenómenos extraños Granada, actualidad ufológica, Expediente X";
        articleTags = `
<meta property="article:tag" content="Noticias" />
<meta property="article:tag" content="Última Hora" />
<meta property="article:tag" content="Alerta Paranormal" />
<meta property="article:tag" content="Granada" />`;
    } else if (url.includes('lugares')) {
        keywordsDinamicas = "mapa misterio Granada, lugares encantados Andalucía, ubicaciones ovni, coordenadas paranormales, rutas del misterio";
        articleTags = `
<meta property="article:tag" content="Mapa del Misterio" />
<meta property="article:tag" content="Lugares Encantados" />
<meta property="article:tag" content="Granada" />`;
    } else if (esHistoria) {
        articleTags = `
<meta property="article:tag" content="OVNI" />
<meta property="article:tag" content="Ufología" />
<meta property="article:tag" content="Fenómenos Paranormales" />
<meta property="article:tag" content="Granada" />
<meta property="article:tag" content="Expediente X Granaíno" />`;
    }

    // Inyectamos meta description, OG, Twitter Cards, canonical y JSON-LD
    const ogBlock = `
<meta name="google-site-verification" content="wu1T4bL_7euJUjS-742pfAGN6xKEynd3X9P9BDUr0Dc" />
<meta name="description" content="${desc}" />
<meta name="keywords" content="${keywordsDinamicas}" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="${esHistoria ? 'article' : 'website'}" />
<meta property="og:site_name" content="Expediente X Granaíno" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${img}" />
<meta property="og:image:secure_url" content="${img}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
${articleTags}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="${url}" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${img}" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;

    html = html.replace('</head>', `${ogBlock}\n</head>`);

    // Eliminamos el aviso por defecto de React para que el bot de Google (y AdSense) no lo lea como prioritario
    html = html.replace(/<noscript>You need to enable JavaScript to run this app\.<\/noscript>/ig, '');

    // Inyectamos el bloque de contenido estático dentro del div#root para SSR limpio
    // Legible directamente por los robots de Googlebot y AdSense como contenido real visible
    html = html.replace(
        /<div id="root">[\s\S]*?<\/div>/i,
        `<div id="root">
            <main id="seo-prerendered-content" style="max-width:1000px;margin:20px auto;padding:25px;font-family:sans-serif;color:#222;line-height:1.7;background:#ffffff;border-radius:8px;">
                ${contenidoSeo}
                <hr style="margin:30px 0;border:0;border-top:1px solid #ddd;" />
                <footer style="font-size:0.85rem;color:#555;">
                    <p><strong>Expediente X Granaíno — Archivo de Investigación Paranormal y Ufológica</strong></p>
                    <p style="display:flex;gap:12px;flex-wrap:wrap;">
                        <a href="https://expedientexgranaino.com/">Inicio</a> | 
                        <a href="https://expedientexgranaino.com/expedientes">Expedientes OVNI</a> | 
                        <a href="https://expedientexgranaino.com/casos-abiertos">Casos Abiertos / True Crime</a> | 
                        <a href="https://expedientexgranaino.com/misterios-historicos">Misterios Históricos</a> | 
                        <a href="https://expedientexgranaino.com/noticias">Noticias Paranormales</a> | 
                        <a href="https://expedientexgranaino.com/sobre-nosotros">Sobre Nosotros</a> | 
                        <a href="https://expedientexgranaino.com/privacidad">Política de Privacidad</a> | 
                        <a href="https://expedientexgranaino.com/cookies">Política de Cookies</a> | 
                        <a href="https://expedientexgranaino.com/aviso-legal">Aviso Legal</a>
                    </p>
                    <p>© ${new Date().getFullYear()} Expediente X Granaíno. Todos los derechos reservados.</p>
                </footer>
            </main>
        </div>`
    );

    return html;
};

const obtenerUrlsRequest = (req) => {
    // En Render (y otros proxies), req.protocol devuelve 'http' aunque la web usa HTTPS
    // Usamos x-forwarded-proto para detectar el protocolo real del cliente
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    // Siempre forzamos https en producción (expedientexgranaino.com)
    const finalProtocol = (protocol === 'https' || req.get('host').includes('expedientexgranaino.com')) ? 'https' : protocol;
    const host = req.get('host');
    const paginaUrl = `${finalProtocol}://${host}${req.originalUrl}`;
    const baseImgUrl = `${finalProtocol}://${host}`;
    return { paginaUrl, baseImgUrl };
};

const resolverImagenUrl = (req, rawImg) => {
    if (!rawImg) return null;
    let url = rawImg;
    if (!rawImg.startsWith('http://') && !rawImg.startsWith('https://')) {
        const fileName = rawImg.split('/').pop();
        const { baseImgUrl } = obtenerUrlsRequest(req);
        url = `${baseImgUrl}/imagenes/${fileName}`;
    }
    return url.replace(/ /g, '%20');
};

// Página de Inicio (/) - SEO enriquecido
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">EXPEDIENTE X GRANAÍNO — Investigación OVNI y Fenómenos Paranormales en Granada</h1>
    <p><strong>Expediente X Granaíno</strong> es la plataforma líder de investigación ufológica y fenómenos paranormales del sur de España.
    Desde nuestro búnker digital monitorizamos en <strong>tiempo real alertas OVNI</strong>, avistamientos aéreos no identificados,
    crónicas del misterio y eventos inexplicables que ocurren en la provincia de Granada y su área de influencia.
    Nuestros agentes sobre el terreno documentan cada caso con coordenadas GPS, fotografías de evidencia y relatos detallados
    para construir el mayor archivo de <strong>casos históricos en Granada</strong> jamás compilado por una red civil de investigadores.</p>
    <p>La red de observadores analiza constantemente el espacio aéreo, las anomalías electromagnéticas
    y los fenómenos de energía anómala registrados en Sierra Nevada, la Vega de Granada, la Costa Tropical y la comarca de Guadix.
    Cada expediente clasificado recibe una valoración de relevancia táctica por parte de la comunidad,
    asegurando que los <strong>fenómenos paranormales</strong> más significativos queden debidamente registrados.
    Únete a nuestra red y contribuye con tus propios avistamientos, fotografías y testimonios anónimos.</p>
    <p>Explora nuestra galería de evidencias clasificadas, escucha las frecuencias de radio del búnker donde se registran
    <strong>psicofonías</strong> y comunicaciones anómalas, y consulta nuestros expedientes históricos sobre
    los casos más relevantes de <strong>ufología en Andalucía</strong>. La verdad está ahí fuera, y nosotros la documentamos.
    Alertas OVNI en tiempo real, análisis de ondas paranormales, dossiers sobre lugares de poder en Granada y
    crónicas del misterio que desafían cualquier explicación convencional. Bienvenido al archivo más oscuro de la red.</p>
</article>`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        const imagenUrl = `${baseImgUrl}/social-preview.png?v=5.0`;

        const pagina = inyectarContenidoSEO(
            html,
            'Expediente X Granaíno | Investigación OVNI y Fenómenos Paranormales en Granada',
            'La plataforma de investigación ufológica más completa del sur de España. Alertas OVNI en tiempo real, psicofonías, casos históricos en Granada y crónicas del misterio.',
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// Sección de Audios/Radio (/audios) - Redireccionada permanente a la home por SEO
app.get('/audios', (req, res) => {
    res.redirect(301, '/');
});

// Sección de Casos Abiertos (/casos-abiertos) - SEO enriquecido
app.get('/casos-abiertos', async (req, res) => {
    const casoId = req.query.id;
    if (casoId) {
        return res.redirect(301, `/leer-historia/${casoId}?src=casos`);
    }
    const indexPath = path.join(__dirname, 'build', 'index.html');
    
    fs.readFile(indexPath, 'utf8', async (err, html) => {
        if (err) return res.sendFile(indexPath);

        let caso = null;
        if (casoId) {
            try {
                const results = await db.query(
                    "SELECT * FROM casos_abiertos WHERE id = ? AND (estado = 'aprobado' OR estado = 'publicado' OR estado = 'publicada' OR estado = 'activo' OR estado IS NULL OR estado = 'pendiente')", 
                    [casoId]
                );
                if (results && results.length > 0) {
                    caso = results[0];
                }
            } catch (dbErr) {
                console.error("Error al buscar caso abierto para SEO:", dbErr);
            }
        }

        if (caso) {
            const titulo = `${caso.titulo ? caso.titulo.toUpperCase() : 'CASO ABIERTO'} | Casos Abiertos — Expediente X Granaíno`;
            
            let cuerpoTexto = caso.contenido || 'Sin contenido adicional.';
            cuerpoTexto = cuerpoTexto.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
            const desc = cuerpoTexto.length > 160 ? cuerpoTexto.substring(0, 157) + '...' : cuerpoTexto;

            const rawImg = caso.imagen_url;
            const imagenUrl = resolverImagenUrl(req, rawImg) || resolverImagenUrl(req, 'assets/Evidencia en Soportújar.webp');
            const { paginaUrl } = obtenerUrlsRequest(req);

            const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#ffb100;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">[CASO CLASIFICADO #${caso.id}] ${caso.titulo ? caso.titulo.toUpperCase() : 'SIN TÍTULO'}</h1>
    <p><strong>Estado:</strong> Bajo investigación del búnker</p>
    <div style="white-space:pre-line;">${cuerpoTexto}</div>
</article>`;

            const pagina = inyectarContenidoSEO(
                html,
                titulo,
                desc,
                contenidoSeo,
                imagenUrl,
                paginaUrl
            );
            return res.send(pagina);
        }

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">Casos Abiertos / Unsolved Cases — True Crime y Misterio</h1>
    <p>Adéntrate en los <strong>Casos Abiertos</strong> del Búnker. Una colección de crímenes reales, desapariciones inexplicables y misterios 
    sin resolver (True Crime) documentados en detalle. Investigaciones que desafían la lógica y donde los principales sospechosos 
    aún deambulan en las sombras.</p>
</article>`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        let description = 'Explora casos abiertos y misterios sin resolver. Crímenes reales y desapariciones inexplicables documentados en el Búnker de Expediente X Granaíno.';
        let imagenUrl = `${baseImgUrl}/assets/Evidencia%20en%20Soportújar.webp`;

        try {
            const casos = await db.query(
                "SELECT id, titulo, imagen_url FROM casos_abiertos WHERE (estado = 'aprobado' OR estado = 'publicado' OR estado = 'publicada' OR estado = 'activo' OR estado IS NULL) ORDER BY id DESC LIMIT 3"
            );
            if (casos && casos.length > 0) {
                // Generar descripción dinámica con los 3 últimos casos
                const ultimosTres = casos.map(c => c.titulo).join(' | ');
                description = `Últimos casos abiertos: ${ultimosTres}. True Crime y misterios sin resolver.`;

                // Usar la imagen del caso más reciente si tiene
                if (casos[0].imagen_url) {
                    imagenUrl = resolverImagenUrl(req, casos[0].imagen_url);
                }
            }
        } catch (dbErr) {
            console.error("Error al obtener casos abiertos para SEO:", dbErr);
        }

        const pagina = inyectarContenidoSEO(
            html,
            'Casos Abiertos (True Crime) | Misterios sin resolver — Expediente X Granaíno',
            description,
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// Sección de Misterios Históricos (/misterios-historicos) - SEO enriquecido
app.get('/misterios-historicos', async (req, res) => {
    if (req.query.id) {
        return res.redirect(301, `/leer-historia/${req.query.id}?src=misterios`);
    }
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', async (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">👁️ Misterios Históricos del Planeta — Expediente X Granaíno</h1>
    <p>Dossier enciclopédico de los enigmas más grandes de la humanidad. El manuscrito Voynich, el incidente Roswell, la colonia Roanoke, el triángulo de las Bermudas o el asesino del Zodiaco. Compilaciones detalladas con coordenadas y archivos desclasificados.</p>
</article>`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        let description = 'Explora los enigmas y misterios históricos desclasificados. Roswell, Triángulo de las Bermudas, Manuscrito Voynich y más.';
        let imagenUrl = `${baseImgUrl}/promo/img/mysterious_granada.png`;

        try {
            const misterios = await db.query(
                "SELECT id, titulo, imagen_url FROM misterios_historicos ORDER BY id DESC LIMIT 3"
            );
            if (misterios && misterios.length > 0) {
                // Generar descripción dinámica con los 3 últimos misterios
                const ultimosTres = misterios.map(m => m.titulo).join(' | ');
                description = `Últimos misterios: ${ultimosTres}. Grandes enigmas de la historia desclasificados.`;

                // Usar la imagen del misterio más reciente si tiene
                if (misterios[0].imagen_url) {
                    imagenUrl = resolverImagenUrl(req, misterios[0].imagen_url);
                }
            }
        } catch (dbErr) {
            console.error("Error al obtener misterios para SEO:", dbErr);
        }

        const pagina = inyectarContenidoSEO(
            html,
            'Misterios Históricos y Grandes Enigmas — Expediente X Granaíno',
            description,
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// Sección Sobre Nosotros (/sobre-nosotros) - SEO enriquecido
app.get('/sobre-nosotros', (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">📂 DOSSIER DEL PROYECTO: SOBRE NOSOTROS — Expediente X Granaíno</h1>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">¿Qué es Expediente X Granaíno?</h2>
    <p>Expediente X Granaino no es solo una página web; es un repositorio digital táctico diseñado para centralizar y documentar el fenómeno paranormal, anómalo y ufológico, nacido en las tierras de Granada pero con un radar abierto a todo el mundo.</p>
    <p>Desde el año 2024, nuestro objetivo ha sido proporcionar una plataforma segura para que investigadores, testigos y entusiastas de cualquier país puedan compartir sus experiencias sin temor al juicio, fomentando un intercambio cultural y de investigación que nos ayude a preservar la historia oculta de nuestro planeta.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">El Origen del Búnker</h2>
    <p>Detrás de este búnker se encuentra José Moreno Jiménez, un aficionado al misterio cuya curiosidad se disparó tras grabar personalmente unos objetos a los que no encontró ninguna explicación (puedes ver la grabación original en nuestra sección de vídeos).</p>
    <p>Ese suceso fue el motor que impulsó la creación de esta página. La idea nació con la necesidad de comparar aquel avistamiento con otros sucesos similares, al mismo tiempo que se recogen testimonios, leyendas y evidencias tanto de Granada como de cualquier parte del mundo. Aquí no buscamos imponer verdades, sino compartir preguntas.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">Metodología de Análisis</h2>
    <p>En el Búnker de EXPEDIENTEXGRANAINO, seguimos un protocolo de validación para cada evidencia recibida. Nuestra metodología se basa en la triangulación de datos: combinamos testimonios directos de testigos con análisis visual y geolocalización precisa a través de nuestro radar interactivo. Colaboramos con una red creciente de observadores independientes para verificar la veracidad de los reportes, asegurando que el material publicado mantenga un estándar de interés para la comunidad de investigación técnica de fenómenos UAP.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">Misión, Visión y Valores</h2>
    <p><strong>Misión:</strong> Documentar lo inexplicable con rigor táctico internacional.</p>
    <p><strong>Visión:</strong> Convertirse en un referente mundial en el archivo de fenomenología anómala.</p>
    <p><strong>Valores:</strong> Veracidad, Neutralidad y Comunidad.</p>
</article>`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        const imagenUrl = `${baseImgUrl}/social-preview.png?v=5.0`;

        const pagina = inyectarContenidoSEO(
            html,
            'Sobre el Proyecto | Dossier y Origen del Búnker — Expediente X Granaíno',
            'Descubre el origen del Búnker de Expediente X Granaíno, fundado por José Moreno Jiménez. Conoce nuestra misión, visión y metodología de análisis de fenómenos UAP.',
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// Sección Dossier Atarfe (/especial-atarfe) - SEO enriquecido
app.get('/especial-atarfe', (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">🛸 INFORME TÉCNICO: INCIDENTE OVNI EN ATARFE Y ALBOLOTE (GRANADA)</h1>
    <p><strong>Caso OVNI de Atarfe y Albolote:</strong> El expediente de contacto y avistamiento OVNI más documentado de los últimos años en Andalucía (Granada, España). Este informe detalla el suceso real investigado por José Moreno Jiménez, el cual sirvió como motor principal para fundar el Búnker de Expediente X Granaíno.</p>
    
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">Crónica del Incidente: Testimonio Directo de los Testigos</h2>
    <h3 style="color:#00d4ff;font-size:0.85rem;margin-top:15px">Fase 1: Agosto 2021 | Avistamiento en Sierra Elvira</h3>
    <p><em>"Nos encontrábamos mi pareja y yo en la terraza de mi piso, era agosto del 2021. Estábamos tomando una copa de vino cuando observé una especie de avión que me llamó mucho la atención. Estamos acostumbrados a ver aviones por el aeropuerto cercano, pero este era muy raro. Al llegar a la altura de Sierra Elvira, se paró en seco. Cambió de dirección, como si fuese marcha atrás, cambió de altura... Fui a por el móvil corriendo, un Huawei, y así grabé el primer vídeo donde se ve un solo objeto."</em></p>
    <p>El testigo analizó la grabación en una pantalla grande de televisión, observando que el objeto no se apagó, sino que salió disparado a gran velocidad dejando una estela visible. El suceso transcurrió en absoluto silencio.</p>
    
    <h3 style="color:#00d4ff;font-size:0.85rem;margin-top:15px">Fase 2: Junio 2022 | Retorno sobre la vertical de Albolote</h3>
    <p><em>"Un año después, en junio de 2022, salí a la terraza a fumar y, como siempre desde el primer incidente, miré al cielo. Sobre la vertical de Albolote aparecieron dos objetos similares al primero. Grabé todo lo que pude; se ven los tejados de los bloques de enfrente como referencia. De nuevo, silencio absoluto, solo el tráfico de la calle."</em></p>
    <p>El segundo avistamiento constó de dos esferas luminosas volando en formación coordinada y realizando maniobras de vuelo imposibles de reproducir por aeronaves comerciales o militares terrestres.</p>
    
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">Conclusiones de la Investigación Técnica</h2>
    <p>Los movimientos aéreos extremos de detención en seco, marcha atrás y aceleración instantánea, junto a la ausencia completa de ruido aéreo en una zona tan próxima al aeropuerto de Granada, descartan el uso de drones domésticos, globos o aviación civil convencional. Actualmente, las grabaciones y capturas de este avistamiento dual están siendo analizadas por especialistas de la organización internacional de ufología MUFON.</p>
</article>`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        const imagenUrl = `${baseImgUrl}/promo/img/alhambra_ufo.png`;

        const pagina = inyectarContenidoSEO(
            html,
            'Caso OVNI en Atarfe y Albolote | Dossier Desclasificado — Expediente X Granaíno',
            'Investigación técnica y grabaciones del avistamiento OVNI ocurrido en Atarfe y Albolote (Granada). Testimonio real y análisis de evidencias.',
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// Sección de Aviso Legal (/legal y /aviso-legal) - SEO enriquecido
app.get(['/legal', '/aviso-legal'], (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">⚖️ AVISO LEGAL — Expediente X Granaíno</h1>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">1. Datos Identificativos</h2>
    <p>En cumplimiento con el deber de información recogido en artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSICE), el titular de la web es <strong>José Moreno Jiménez</strong>, con correo de contacto: <strong>archipegv2@gmail.com</strong>.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">2. Uso del Portal</h2>
    <p>El acceso y/o uso de este portal de Expediente X Granaino atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas. El portal proporciona acceso a multitud de informaciones, servicios, programas o datos (en adelante, "los contenidos") en Internet pertenecientes a la administración o a sus licenciantes.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">3. Propiedad Intelectual e Industrial</h2>
    <p>El titular por sí o como cesionario, es dueño de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (a título enunciativo, imágenes, sonido, audio, vídeo, software o textos; marcas o logotipos, combinaciones de colores, estructura y diseño, selección de materiales usados, etc.). Todos los derechos reservados. Queda expresamente prohibida la reproducción, la distribución y la comunicación pública sin la autorización del titular.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">4. Exclusión de Garantías y Responsabilidad</h2>
    <p>El titular no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos o lesivos en los contenidos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.</p>
</article>`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        // Canonical siempre apunta a /aviso-legal (URL canónica oficial)
        const canonicalUrl = 'https://expedientexgranaino.com/aviso-legal';
        const pagina = inyectarContenidoSEO(
            html,
            'Aviso Legal | Términos de Uso — Expediente X Granaíno',
            'Aviso Legal y condiciones generales de uso del portal de investigación Expediente X Granaíno.',
            contenidoSeo,
            `${baseImgUrl}/social-preview.png?v=8.0`,
            canonicalUrl
        );
        res.send(pagina);
    });
});


// Sección de Política de Privacidad (/privacidad) - SEO enriquecido
app.get('/privacidad', (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">🛡️ POLÍTICA DE PRIVACIDAD — Expediente X Granaíno</h1>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">1. Información al Usuario</h2>
    <p>Expediente X Granaino (el Sitio Web), de conformidad con lo dispuesto en el Reglamento (UE) 2016/679 (GDPR) y la Ley Orgánica 3/2018 (LOPDGDD), le informa de que los datos personales que nos facilite serán tratados con la máxima confidencialidad y seguridad. Responsable del tratamiento: <strong>José Moreno Jiménez</strong>. Email: <strong>archipegv2@gmail.com</strong>.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">2. Finalidad y Legitimación</h2>
    <p>Tratamos sus datos para gestionar su registro como agente/colaborador, mantener la seguridad del búnker digital y prevenir accesos no autorizados, analizar el tráfico mediante herramientas estadísticas y mostrar publicidad personalizada basada en sus intereses (Google AdSense).</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">3. Publicidad de Terceros (Google AdSense)</h2>
    <p>Este sitio web utiliza Google AdSense para mostrar anuncios. Google utiliza cookies para mostrar anuncios basados en las visitas anteriores de un usuario a este sitio web o a otros sitios web de Internet. Usted puede inhabilitar la publicidad personalizada visitando la Configuración de anuncios de Google.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">4. Análisis de Datos (Google Analytics)</h2>
    <p>Utilizamos Google Analytics para entender cómo interactúan los usuarios con el búnker. Esta herramienta utiliza cookies para recopilar información de forma anónima y elaborar informes de tendencias del sitio web sin identificar a usuarios individuales.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">5. Derechos ARCO</h2>
    <p>Usted tiene derecho a acceso, rectificación, supresión ("derecho al olvido"), oposición y limitación del tratamiento. Para ejercer estos derechos, contacte con archipegv2@gmail.com.</p>
</article>`;

        const { paginaUrl: privUrl, baseImgUrl: privImgUrl } = obtenerUrlsRequest(req);
        const pagina = inyectarContenidoSEO(
            html,
            'Política de Privacidad | Protección de Datos — Expediente X Granaíno',
            'Política de Privacidad de Expediente X Granaíno. Información detallada sobre el tratamiento de sus datos personales y derechos ARCO.',
            contenidoSeo,
            `${privImgUrl}/social-preview.png?v=8.0`,
            'https://expedientexgranaino.com/privacidad'
        );
        res.send(pagina);
    });
});

// Sección de Política de Cookies (/cookies) - SEO enriquecido
app.get('/cookies', (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">🍪 POLÍTICA DE COOKIES — Expediente X Granaíno</h1>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">1. ¿Qué son las Cookies?</h2>
    <p>Una cookie es un fichero que se descarga en su ordenador al acceder a determinadas páginas web. Las cookies permiten a una página web, entre otras cosas, almacenar y recuperar información sobre los hábitos de navegación de un usuario o de su equipo.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">2. Tipos de Cookies que utiliza este Sitio</h2>
    <p><strong>Cookies Técnicas:</strong> Necesarias para el funcionamiento del búnker y la gestión de sesiones.</p>
    <p><strong>Cookies de Análisis:</strong> Aquellas que, tratadas por nosotros o por terceros (Google Analytics), nos permiten cuantificar el número de usuarios y realizar la medición y análisis estadístico.</p>
    <p><strong>Cookies Publicitarias:</strong> Aquellas que, tratadas por nosotros o por terceros (Google AdSense), nos permiten gestionar de la forma más eficaz posible la oferta de los espacios publicitarios.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">3. Cookies de Terceros</h2>
    <p>Este sitio web utiliza servicios de terceros para recopilar información con fines estadísticos y de publicidad (Google Analytics y Google AdSense).</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">4. Cómo Desactivar las Cookies</h2>
    <p>Usted puede permitir, bloquear o eliminar las cookies instaladas en su equipo mediante la configuración de las opciones de su navegador de Internet (Chrome, Safari, Firefox, Edge, etc.).</p>
</article>`;

        const { paginaUrl: cookUrl, baseImgUrl: cookImgUrl } = obtenerUrlsRequest(req);
        const pagina = inyectarContenidoSEO(
            html,
            'Política de Cookies | Frecuencia de Rastreo — Expediente X Granaíno',
            'Conozca qué cookies utiliza el Búnker de Expediente X Granaíno y cómo puede gestionarlas o desactivarlas en su navegador.',
            contenidoSeo,
            `${cookImgUrl}/social-preview.png?v=8.0`,
            'https://expedientexgranaino.com/cookies'
        );
        res.send(pagina);
    });
});

// Sección Horóscopo (/horoscopo) - SEO enriquecido
// Redirección 301 del horóscopo a la ruleta (mantener SEO)
app.get('/horoscopo', (req, res) => {
    res.redirect(301, '/la-ruleta');
});

// Sección La Ruleta del Búnker (/la-ruleta) - SEO enriquecido
app.get('/la-ruleta', (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00ff41;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">🎡 LA RULETA DEL BÚNKER — Radar de Contenido Aleatorio</h1>
    <p>La <strong>Ruleta del Búnker</strong> es la herramienta de exploración exclusiva de <strong>Expediente X Granaíno</strong>. Un radar interactivo que selecciona al azar expedientes OVNI, crónicas negras, misterios históricos y noticias paranormales de nuestros archivos clasificados. Gira la ruleta y descubre qué tiene preparado el búnker para ti.</p>
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">Cinco Sectores de Investigación</h2>
    <ul>
        <li><strong>🛸 Expedientes:</strong> Dossieres de campo sobre avistamientos OVNI, fenómenos paranormales y testimonios directos de agentes.</li>
        <li><strong>🔪 Crónica Negra:</strong> True crime e investigaciones de casos sin resolver que rodean la provincia de Granada y más allá.</li>
        <li><strong>🏛️ Misterios Históricos:</strong> Enigmas ancestrales, leyendas, lugares encantados y sucesos inexplicables del pasado.</li>
        <li><strong>📡 Noticias:</strong> Últimas noticias sobre fenómenos aéreos no identificados, desclasificaciones oficiales y actividad paranormal.</li>
        <li><strong>🎲 Sorpresa:</strong> El sector más impredecible: ni la categoría ni el artículo se revelan hasta que la ruleta se detiene.</li>
    </ul>
    <p>Con más de 150 artículos en nuestra base de datos, cada giro es una aventura diferente. Explora, descubre y comparte los hallazgos del búnker con otros agentes de la red.</p>
</article>`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        const imagenUrl = `${baseImgUrl}/assets/ruleta_bunker.jpg`;

        const pagina = inyectarContenidoSEO(
            html,
            'La Ruleta del Búnker — Descubre Contenido Aleatorio | Expediente X Granaíno',
            'Gira la ruleta del búnker y descubre expedientes OVNI, crónica negra, misterios históricos y noticias paranormales al azar. Exploración interactiva de Expediente X Granaíno.',
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});


// Sección de Noticias (/noticias) - SEO enriquecido
app.get('/noticias', async (req, res) => {
    if (req.query.id) {
        return res.redirect(301, `/leer-historia/${req.query.id}?src=noticias`);
    }
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', async (err, html) => {
        if (err) return res.sendFile(indexPath);

        let contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">📰 TELETIPO DE ALERTAS GLOBALES Y NOTICIAS — Expediente X Granaíno</h1>
    <p>Canal oficial de noticias del búnker. A continuación se listan las últimas informaciones sobre ufología, fenómenos anómalos y sucesos misteriosos registrados en nuestro radar:</p>
    <ul style="list-style-type:none;padding:0;">`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        let description = 'Últimas noticias y alertas de avistamientos OVNI, misterios históricos y ufología en Granada y a nivel mundial.';
        let imagenUrl = `${baseImgUrl}/assets/incidente-eva9-lujar.png`;

        try {
            const noticias = await db.query("SELECT titulo, cuerpo, nivel_alerta, ubicacion, fecha, imagen_url FROM noticias WHERE estado = 'aprobado' ORDER BY fecha DESC LIMIT 20");
            if (noticias && noticias.length > 0) {
                // Generar descripción dinámica con los 3 últimos titulares
                const ultimasTres = noticias.slice(0, 3).map(n => n.titulo).join(' | ');
                description = `Últimas noticias: ${ultimasTres}. Sigue las alertas del búnker.`;

                // Usar la imagen de la noticia más reciente si tiene
                if (noticias[0].imagen_url) {
                    imagenUrl = resolverImagenUrl(req, noticias[0].imagen_url);
                }

                noticias.forEach(n => {
                    const fechaStr = n.fecha ? new Date(n.fecha).toLocaleDateString('es-ES') : '';
                    contenidoSeo += `
        <li style="margin-bottom:25px;border-bottom:1px solid #222;padding-bottom:15px;">
            <h3 style="color:#00d4ff;margin:0 0 5px 0;">${n.titulo}</h3>
            <span style="color:#666;font-size:0.75rem;">📍 Ubicación: ${n.ubicacion || 'Desconocida'} | Alerta: ${n.nivel_alerta || 'Normal'} | Fecha: ${fechaStr}</span>
            <p style="margin:8px 0 0 0;">${n.cuerpo}</p>
        </li>`;
                });
            } else {
                contenidoSeo += `<li>📡 Escaneando sector... No se detectan registros de noticias actualmente.</li>`;
            }
        } catch (dbErr) {
            console.error("Error al obtener noticias para SEO:", dbErr);
            contenidoSeo += `<li>Error temporal al conectar con el archivo central.</li>`;
        }

        contenidoSeo += `
    </ul>
</article>`;

        const pagina = inyectarContenidoSEO(
            html,
            'Noticias de Ufología y Fenómenos Anómalos — Expediente X Granaíno',
            description,
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// Sección de Lugares del Misterio (/lugares) - SEO enriquecido
app.get('/lugares', (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">📍 MAPA TÁCTICO DE LUGARES DEL MISTERIO — Expediente X Granaíno</h1>
    <p>Radar interactivo con las coordenadas GPS exactas de los avistamientos OVNI, fenómenos paranormales y enclaves misteriosos documentados por la red de investigadores del Búnker. Desde Sierra Nevada hasta la Costa Tropical, pasando por la Vega de Granada y el Albaicín, cada punto del mapa representa un caso real investigado y catalogado en nuestro archivo.</p>
    <p>Explora el mapa, descubre los puntos calientes de actividad anómala y accede directamente a los expedientes clasificados de cada ubicación. Un recurso único para investigadores de campo y entusiastas del misterio en Andalucía y el mundo.</p>
</article>`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        const imagenUrl = `${baseImgUrl}/mapa-preview.jpg?v=1.0`;

        const pagina = inyectarContenidoSEO(
            html,
            'Mapa Táctico de Lugares del Misterio | Radar de Avistamientos — Expediente X Granaíno',
            'Mapa interactivo con coordenadas GPS de avistamientos OVNI, fenómenos paranormales y enclaves misteriosos en Granada y Andalucía.',
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// Helper para extraer ID de YouTube
function extraerYoutubeId(url) {
    if (!url) return null;
    const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Sección de Vídeos (/videos) - SEO enriquecido
app.get('/videos', async (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', async (err, html) => {
        if (err) return res.sendFile(indexPath);

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        const videoId = req.query.id ? parseInt(req.query.id, 10) : null;

        let tituloSeo = 'Galería de Vídeos de Avistamientos y OVNIS — Expediente X Granaíno';
        let descSeo = 'Grabaciones originales de avistamientos de OVNIS y anomalías aéreas registradas por nuestra red de observadores.';
        let imagenUrl = `${baseImgUrl}/social-preview.png?v=8.0`;
        let contenidoSeo = '';

        if (videoId && !isNaN(videoId)) {
            try {
                const videoRows = await db.query("SELECT * FROM videos WHERE id = ?", [videoId]);
                if (videoRows && videoRows.length > 0) {
                    const vid = videoRows[0];
                    tituloSeo = `📼 ${vid.titulo} — Evidencia en Vídeo | Expediente X Granaíno`;
                    descSeo = (vid.descripcion || '').replace(/\r?\n|\r/g, ' ').slice(0, 220) || descSeo;

                    // Si tiene enlace de YouTube, usamos su miniatura oficial de YouTube
                    const ytId = extraerYoutubeId(vid.url);
                    if (ytId) {
                        imagenUrl = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                    } else if (vid.capturas) {
                        try {
                            const caps = JSON.parse(vid.capturas);
                            if (Array.isArray(caps) && caps.length > 0 && caps[0]) imagenUrl = caps[0];
                        } catch (_) {
                            if (typeof vid.capturas === 'string' && vid.capturas.startsWith('http')) imagenUrl = vid.capturas;
                        }
                    }

                    contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">📼 EVIDENCIA EN VÍDEO: ${vid.titulo} — Expediente X Granaíno</h1>
    <p><strong>Investigador:</strong> ${vid.usuario || 'Agente del Búnker'}</p>
    <p>${vid.descripcion || 'Sin descripción adicional en el archivo.'}</p>
</article>`;
                }
            } catch (dbErr) {
                console.error("Error al buscar vídeo específico para SEO:", dbErr);
            }
        }

        if (!contenidoSeo) {
            contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">📼 ARCHIVO DE VÍDEOS CLASIFICADOS Y AVISTAMIENTOS — Expediente X Granaíno</h1>
    <p>Repositorio de grabaciones de campo del búnker. A continuación se listan las evidencias de vídeo desclasificadas por el mando central:</p>
    <ul style="list-style-type:none;padding:0;">`;

            try {
                const videos = await db.query("SELECT titulo, descripcion, usuario, fecha FROM videos WHERE estado = 'aprobado' ORDER BY id DESC LIMIT 30");
                if (videos && videos.length > 0) {
                    videos.forEach(v => {
                        const fechaStr = v.fecha ? new Date(v.fecha).toLocaleDateString('es-ES') : '';
                        contenidoSeo += `
        <li style="margin-bottom:25px;border-bottom:1px solid #222;padding-bottom:15px;">
            <h3 style="color:#00d4ff;margin:0 0 5px 0;">${v.titulo}</h3>
            <span style="color:#666;font-size:0.75rem;">👤 Investigador: ${v.usuario || 'Agente de campo'} | Fecha: ${fechaStr}</span>
            <p style="margin:8px 0 0 0;">${v.descripcion || 'Sin descripción adicional en el archivo.'}</p>
        </li>`;
                    });
                } else {
                    contenidoSeo += `<li>📡 Escaneando sector... No se detectan registros de vídeo aprobados.</li>`;
                }
            } catch (dbErr) {
                console.error("Error al obtener videos para SEO:", dbErr);
                contenidoSeo += `<li>Error temporal al conectar con el archivo de vídeo.</li>`;
            }

            contenidoSeo += `
    </ul>
</article>`;
        }

        const pagina = inyectarContenidoSEO(
            html,
            tituloSeo,
            descSeo,
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// Sección de Expedientes (/expedientes) - SEO enriquecido
app.get('/expedientes', async (req, res) => {
    if (req.query.id) {
        return res.redirect(301, `/leer-historia/${req.query.id}?src=expedientes`);
    }
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', async (err, html) => {
        if (err) return res.sendFile(indexPath);

        let contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">📑 EXPEDIENTES CLASIFICADOS DEL BÚNKER — Informes de Campo</h1>
    <p>Base de datos desclasificada de crónicas del misterio y reportes de investigación paranormal redactados por agentes autorizados:</p>
    <ul style="list-style-type:none;padding:0;">`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        let description = 'Informes detallados y crónicas de campo sobre avistamientos de OVNIS y misterios sin resolver.';
        let imagenUrl = `${baseImgUrl}/assets/ovni-mulhacen-1958.png`;

        try {
            const expedientes = await db.query(
                "SELECT titulo, contenido, usuario_nombre, tipo, fecha, imagen_url FROM expedientes WHERE (estado = 'aprobado' OR estado = 'publicado' OR estado = 'publicada' OR estado = 'activo') ORDER BY fecha DESC LIMIT 30"
            );
            if (expedientes && expedientes.length > 0) {
                // Generar descripción dinámica con los 3 últimos expedientes
                const ultimosTres = expedientes.slice(0, 3).map(e => e.titulo || 'Sin título').join(' | ');
                description = `Últimos expedientes: ${ultimosTres}. Explora los informes desclasificados del búnker.`;

                // Usar la imagen del expediente más reciente si tiene
                if (expedientes[0].imagen_url) {
                    imagenUrl = resolverImagenUrl(req, expedientes[0].imagen_url);
                }

                expedientes.forEach(e => {
                    const fechaStr = e.fecha ? new Date(e.fecha).toLocaleDateString('es-ES') : '';
                    const autor = e.usuario_nombre || (e.tipo === 'jefe' ? 'Administrador' : 'Agente');
                    const contCorto = e.contenido && e.contenido.length > 300 ? e.contenido.substring(0, 300) + '...' : (e.contenido || '');
                    contenidoSeo += `
        <li style="margin-bottom:25px;border-bottom:1px solid #222;padding-bottom:15px;">
            <h3 style="color:#00d4ff;margin:0 0 5px 0;">${e.titulo || 'Expediente Sin Título'}</h3>
            <span style="color:#666;font-size:0.75rem;">👤 Autor: ${autor} | Fecha: ${fechaStr} | Tipo: ${e.tipo || 'Agente'}</span>
            <p style="margin:8px 0 0 0;white-space:pre-line;">${contCorto}</p>
        </li>`;
                });
            } else {
                contenidoSeo += `<li>📡 Escaneando sector... No se detectan expedientes aprobados en el archivo central.</li>`;
            }
        } catch (dbErr) {
            console.error("Error al obtener expedientes para SEO:", dbErr);
            contenidoSeo += `<li>Error temporal al conectar con el archivo central.</li>`;
        }

        contenidoSeo += `
    </ul>
</article>`;

        const pagina = inyectarContenidoSEO(
            html,
            'Expedientes y Relatos del Misterio — Expediente X Granaíno',
            description,
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// Sección de Galería (/galeria) - SEO enriquecido
app.get('/galeria', async (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', async (err, html) => {
        if (err) return res.sendFile(indexPath);

        let contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">📸 GALERÍA DE EVIDENCIAS GRÁFICAS Y ANOMALÍAS — Expediente X Granaíno</h1>
    <p>Registros visuales capturados por agentes del sector. Fotografías de fenómenos anómalos desclasificadas para su análisis:</p>
    <ul style="list-style-type:none;padding:0;">`;

        try {
            const imagenes = await db.query("SELECT titulo, descripcion, agente, fecha FROM imagenes WHERE estado = 'publica' ORDER BY id DESC LIMIT 30");
            if (imagenes && imagenes.length > 0) {
                imagenes.forEach(img => {
                    const fechaStr = img.fecha ? new Date(img.fecha).toLocaleDateString('es-ES') : '';
                    contenidoSeo += `
        <li style="margin-bottom:25px;border-bottom:1px solid #222;padding-bottom:15px;">
            <h3 style="color:#00d4ff;margin:0 0 5px 0;">${img.titulo || 'Evidencia Gráfica'}</h3>
            <span style="color:#666;font-size:0.75rem;">👤 Agente: ${img.agente || 'Agente de campo'} | Fecha: ${fechaStr}</span>
            <p style="margin:8px 0 0 0;">${img.descripcion || 'Sin descripción adicional en el archivo.'}</p>
        </li>`;
                });
            } else {
                contenidoSeo += `<li>📡 Escaneando sector... No se detectan registros gráficos aprobados.</li>`;
            }
        } catch (dbErr) {
            console.error("Error al obtener imagenes para SEO:", dbErr);
            contenidoSeo += `<li>Error temporal al conectar con la galería.</li>`;
        }

        contenidoSeo += `
    </ul>
</article>`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        const imagenUrl = `${baseImgUrl}/social-preview.png?v=8.0`;

        const pagina = inyectarContenidoSEO(
            html,
            'Galería de Evidencias Fotográficas — Expediente X Granaíno',
            'Archivo fotográfico de fenómenos UAP, avistamientos OVNI y anomalías de campo registradas en alta resolución.',
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// Ruta para leer un expediente/noticia/misterio individual con SEO dinámico
app.get('/leer-historia/:id', async (req, res) => {
    const id = req.params.id;
    const src = req.query.src; // Leer ?src= del query string
    const indexPath = path.join(__dirname, 'build', 'index.html');
    
    fs.readFile(indexPath, 'utf8', async (err, html) => {
        if (err) return res.sendFile(indexPath);

        let historia = null;
        let esRelatoAdmin = false;
        let esNoticia = false;
        let esMisterio = false;
        let esCaso = false;

        try {
            const srcLow = (src || '').toLowerCase();

            // Intentar primero búsqueda dirigida según 'src'
            if (srcLow.includes('caso') || srcLow.includes('truecrime') || srcLow.includes('cronica')) {
                const casos = await db.query("SELECT * FROM casos_abiertos WHERE id = ?", [id]);
                if (casos && casos.length > 0) {
                    historia = casos[0];
                    esCaso = true;
                }
            } else if (srcLow.includes('misterio')) {
                const misterios = await db.query("SELECT * FROM misterios_historicos WHERE id = ?", [id]);
                if (misterios && misterios.length > 0) {
                    historia = misterios[0];
                    esMisterio = true;
                }
            } else if (srcLow.includes('noticia')) {
                const noticias = await db.query("SELECT * FROM noticias WHERE id = ?", [id]);
                if (noticias && noticias.length > 0) {
                    historia = noticias[0];
                    esNoticia = true;
                }
            } else if (srcLow.includes('expediente') || srcLow === 'exp') {
                const relatosAdmin = await db.query(
                    "SELECT * FROM expedientes WHERE id = ? AND tipo = 'jefe'",
                    [id]
                );
                if (relatosAdmin && relatosAdmin.length > 0) {
                    historia = relatosAdmin[0];
                    esRelatoAdmin = true;
                } else {
                    const expedientesPublicos = await db.query(
                        "SELECT * FROM expedientes WHERE id = ? AND (tipo = 'agente' OR tipo IS NULL)",
                        [id]
                    );
                    if (expedientesPublicos && expedientesPublicos.length > 0) {
                        historia = expedientesPublicos[0];
                    }
                }
            }

            // Fallback inteligente: Si no se especificó src o no se encontró en la dirigida
            if (!historia) {
                // 1. Buscar en casos abiertos / True Crime
                const casos = await db.query("SELECT * FROM casos_abiertos WHERE id = ?", [id]);
                if (casos && casos.length > 0) {
                    historia = casos[0];
                    esCaso = true;
                } else {
                    // 2. Buscar en noticias
                    const noticias = await db.query("SELECT * FROM noticias WHERE id = ?", [id]);
                    if (noticias && noticias.length > 0) {
                        historia = noticias[0];
                        esNoticia = true;
                    } else {
                        // 3. Buscar en misterios históricos
                        const misterios = await db.query("SELECT * FROM misterios_historicos WHERE id = ?", [id]);
                        if (misterios && misterios.length > 0) {
                            historia = misterios[0];
                            esMisterio = true;
                        } else {
                            // 4. Buscar en expedientes de jefe / admin
                            const relatosAdmin = await db.query(
                                "SELECT * FROM expedientes WHERE id = ? AND tipo = 'jefe'",
                                [id]
                            );
                            if (relatosAdmin && relatosAdmin.length > 0) {
                                historia = relatosAdmin[0];
                                esRelatoAdmin = true;
                            } else {
                                // 5. Buscar en expedientes de agentes
                                const expedientesPublicos = await db.query(
                                    "SELECT * FROM expedientes WHERE id = ?",
                                    [id]
                                );
                                if (expedientesPublicos && expedientesPublicos.length > 0) {
                                    historia = expedientesPublicos[0];
                                }
                            }
                        }
                    }
                }
            }
        } catch (dbErr) {
            console.error("Error al buscar historia para SEO dinámico:", dbErr);
        }

        if (historia) {
            const titulo = `${historia.titulo ? historia.titulo.toUpperCase() : 'EXPEDIENTE'} | Expediente X Granaíno`;
            
            // Truncar contenido para la descripción (máximo 160 caracteres)
            let cuerpoTexto = historia.contenido || historia.cuerpo || 'Sin contenido adicional.';
            cuerpoTexto = cuerpoTexto.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
            const desc = cuerpoTexto.length > 160 ? cuerpoTexto.substring(0, 157) + '...' : cuerpoTexto;

            // Formar URL de la imagen
            const rawImg = historia.imagen_url || historia.url_imagen;
            const imagenUrl = resolverImagenUrl(req, rawImg) || resolverImagenUrl(req, 'social-preview.png');
            
            // Construir el parámetro src correspondiente
            const params = src ? `?src=${src}` : (esCaso ? '?src=casos' : esMisterio ? '?src=misterios' : esNoticia ? '?src=noticias' : '?src=expedientes');
            
            // Forzar URL canónica LIMPIA PERO ÚNICA PARA CADA TIPO (usando baseImgUrl HTTPS segura)
            const { baseImgUrl } = obtenerUrlsRequest(req);
            const paginaUrl = `${baseImgUrl}/leer-historia/${historia.id}${params}`;

            const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">${historia.titulo ? historia.titulo.toUpperCase() : 'SIN TÍTULO'}</h1>
    <p><strong>Clasificación:</strong> ${esRelatoAdmin ? 'Relato del Administrador' : esNoticia ? 'Noticia de Alerta' : esMisterio ? 'Misterio Histórico' : esCaso ? 'Caso Abierto / True Crime' : 'Expediente de Agente'}</p>
    <p><strong>Autor:</strong> ${historia.usuario_nombre || historia.agente || 'Administrador'}</p>
    <div style="white-space:pre-line;">${cuerpoTexto}</div>
</article>`;

            // Sanitizar objeto para inyección en script tag de forma segura
            const jsonHistoria = JSON.stringify(historia).replace(/</g, '\\u003c');
            const jsonTypes = JSON.stringify({ esRelatoAdmin, esNoticia, esMisterio, esCaso }).replace(/</g, '\\u003c');
            const initialScript = `<script>window.__INITIAL_HISTORIA__ = ${jsonHistoria}; window.__INITIAL_HISTORIA_TYPE__ = ${jsonTypes};</script>`;

            let pagina = inyectarContenidoSEO(
                html,
                titulo,
                desc,
                contenidoSeo,
                imagenUrl,
                paginaUrl
            );
            pagina = pagina.replace('</head>', `${initialScript}\n</head>`);
            res.send(pagina);
        } else {
            res.sendFile(indexPath);
        }
    });
});

// --- ENDPOINTS PARA AFILIADOS DE AMAZON (NINJA) ---
app.get('/api/amazon/todos', async (req, res) => {
    try {
        const rows = await db.query("SELECT item_key, datos_json FROM amazon_afiliados");
        if (rows && rows.length > 0) {
            const todosLosLibros = rows.map(row => {
                const parsed = JSON.parse(row.datos_json);
                return {
                    item_key: row.item_key,
                    ...parsed
                };
            });
            res.json(todosLosLibros);
        } else {
            res.json([]);
        }
    } catch (err) {
        console.error("Error al obtener todos los datos de amazon:", err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Devuelve todas las item_keys que tienen configuración Amazon (para badge en galería)
app.get('/api/amazon-keys', async (req, res) => {
    try {
        const rows = await db.query("SELECT item_key FROM amazon_afiliados");
        res.json(rows.map(r => r.item_key));
    } catch (err) {
        console.error("Error al obtener claves amazon:", err);
        res.status(500).json([]);
    }
});
app.get('/api/amazon/:itemKey', async (req, res) => {
    try {
        const itemKey = req.params.itemKey;
        let rows = await db.query("SELECT datos_json FROM amazon_afiliados WHERE item_key = ?", [itemKey]);
        
        // FALLBACK: compatibilidad con datos existentes guardados con claves antiguas
        // El panel guardaba casos como "exp-XX" (era el tipo por defecto), ahora usa "caso-XX"
        if (!rows || rows.length === 0) {
            const fallbackKeys = [];
            if (itemKey.startsWith('caso-')) {
                const id = itemKey.replace('caso-', '');
                // Buscar también con el formato antiguo (exp-) que era el default del panel
                fallbackKeys.push('exp-' + id);
                fallbackKeys.push('casos_abiertos-' + id);
            } else if (itemKey.startsWith('misterio-')) {
                const id = itemKey.replace('misterio-', '');
                fallbackKeys.push('misterios_historicos-' + id);
            }
            for (const fk of fallbackKeys) {
                const fr = await db.query("SELECT datos_json FROM amazon_afiliados WHERE item_key = ?", [fk]);
                if (fr && fr.length > 0) { rows = fr; break; }
            }
        }
        
        if (rows && rows.length > 0) {
            res.json(JSON.parse(rows[0].datos_json));
        } else {
            res.json(null);
        }
    } catch (err) {
        console.error("Error al obtener datos de amazon:", err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

app.post('/api/amazon/:itemKey', async (req, res) => {
    try {
        const itemKey = req.params.itemKey;
        const datos_json = JSON.stringify(req.body);
        
        // Usamos INSERT ... ON DUPLICATE KEY UPDATE para MySQL
        await db.execute(
            "INSERT INTO amazon_afiliados (item_key, datos_json) VALUES (?, ?) ON DUPLICATE KEY UPDATE datos_json = ?", 
            [itemKey, datos_json, datos_json]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Error al guardar datos de amazon:", err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});

// Página de Biblioteca (/biblioteca) - SEO enriquecido
app.get('/biblioteca', (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #ffb100">
    <h1 style="color:#ffb100;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">BIBLIOTECA DEL BÚNKER - Expediente X Granaíno</h1>
    <p>Nuestra selección de obras imprescindibles para investigar fenómenos anómalos, misterios históricos y crónicas ufológicas. 
    Desde relatos de abducciones hasta investigaciones de campo sobre entidades desconocidas.</p>
</article>`;

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        const imagenUrl = `${baseImgUrl}/imagenes/biblioteca_banner.png`;

        const pagina = inyectarContenidoSEO(
            html,
            'Biblioteca del Búnker | Libros recomendados de Misterio y Ufología',
            'Selección de obras imprescindibles sobre OVNIs, fenómenos paranormales y misterios históricos recomendadas por el Búnker de Expediente X Granaíno.',
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// --- 🗺️ GENERACIÓN DINÁMICA DE SITEMAP.XML PARA GOOGLE Y MOTORES DE BÚSQUEDA ---
app.get('/sitemap.xml', async (req, res) => {
    try {
        const domain = 'https://expedientexgranaino.com';
        const today = new Date().toISOString().split('T')[0];

        // Array de URLs con sus metadatos individuales
        const urls = [];

        // 1. URLs estáticas principales del Búnker
        const estaticas = [
            { path: '/',                     priority: '1.0', changefreq: 'daily' },
            { path: '/expedientes',          priority: '0.9', changefreq: 'daily' },
            { path: '/casos-abiertos',       priority: '0.9', changefreq: 'daily' },
            { path: '/misterios-historicos', priority: '0.9', changefreq: 'daily' },
            { path: '/noticias',             priority: '0.9', changefreq: 'daily' },
            { path: '/especial-atarfe',      priority: '0.8', changefreq: 'weekly' },
            { path: '/videos',               priority: '0.7', changefreq: 'weekly' },
            { path: '/galeria',              priority: '0.7', changefreq: 'weekly' },
            { path: '/lugares',              priority: '0.7', changefreq: 'weekly' },
            { path: '/biblioteca',           priority: '0.7', changefreq: 'weekly' },
            { path: '/la-ruleta',            priority: '0.8', changefreq: 'daily' },
            { path: '/colaboradores',        priority: '0.5', changefreq: 'monthly' },
            { path: '/archipeg',             priority: '0.5', changefreq: 'monthly' },
            { path: '/sobre-nosotros',       priority: '0.5', changefreq: 'monthly' },
            { path: '/acceso',               priority: '0.4', changefreq: 'monthly' },
            { path: '/privacidad',           priority: '0.3', changefreq: 'yearly' },
            { path: '/cookies',              priority: '0.3', changefreq: 'yearly' },
            { path: '/aviso-legal',          priority: '0.3', changefreq: 'yearly' }
        ];

        estaticas.forEach(p => {
            urls.push({
                loc: `${domain}${p.path}`,
                lastmod: today,
                changefreq: p.changefreq,
                priority: p.priority
            });
        });

        // Consulta unificada: incluimos todos los estados activos para TODAS las tablas
        const estadosActivos = "estado = 'aprobado' OR estado = 'publicado' OR estado = 'activo'";

        // Set para evitar duplicados de ID entre tablas (mismo ID puede existir en varias tablas)
        const idsArticulosYaIncluidos = new Set();

        // 2. Expedientes / Relatos — URL canónica SIN ?src= para que Google no duplique
        try {
            const exps = await db.query(`SELECT id, COALESCE(DATE_FORMAT(fecha, '%Y-%m-%d'), '${today}') AS lastmod FROM expedientes WHERE ${estadosActivos}`);
            exps.forEach(e => {
                if (!idsArticulosYaIncluidos.has(e.id)) {
                    idsArticulosYaIncluidos.add(e.id);
                    urls.push({
                        loc: `${domain}/leer-historia/${e.id}`,
                        lastmod: e.lastmod || today,
                        changefreq: 'weekly',
                        priority: '0.8'
                    });
                }
            });
        } catch (e) { console.error("Sitemap exps:", e.message); }

        // 3. Casos Abiertos / True Crime
        try {
            const casos = await db.query(`SELECT id, COALESCE(DATE_FORMAT(fecha, '%Y-%m-%d'), '${today}') AS lastmod FROM casos_abiertos WHERE ${estadosActivos}`);
            casos.forEach(c => {
                if (!idsArticulosYaIncluidos.has(c.id)) {
                    idsArticulosYaIncluidos.add(c.id);
                    urls.push({
                        loc: `${domain}/leer-historia/${c.id}`,
                        lastmod: c.lastmod || today,
                        changefreq: 'weekly',
                        priority: '0.8'
                    });
                }
            });
        } catch (e) { console.error("Sitemap casos:", e.message); }

        // 4. Misterios Históricos
        try {
            const misterios = await db.query(`SELECT id, COALESCE(DATE_FORMAT(fecha, '%Y-%m-%d'), '${today}') AS lastmod FROM misterios_historicos WHERE ${estadosActivos}`);
            misterios.forEach(m => {
                if (!idsArticulosYaIncluidos.has(m.id)) {
                    idsArticulosYaIncluidos.add(m.id);
                    urls.push({
                        loc: `${domain}/leer-historia/${m.id}`,
                        lastmod: m.lastmod || today,
                        changefreq: 'weekly',
                        priority: '0.8'
                    });
                }
            });
        } catch (e) { console.error("Sitemap misterios:", e.message); }

        // 5. Noticias
        try {
            const noticias = await db.query(`SELECT id, COALESCE(DATE_FORMAT(fecha, '%Y-%m-%d'), '${today}') AS lastmod FROM noticias WHERE ${estadosActivos}`);
            noticias.forEach(n => {
                if (!idsArticulosYaIncluidos.has(n.id)) {
                    idsArticulosYaIncluidos.add(n.id);
                    urls.push({
                        loc: `${domain}/leer-historia/${n.id}`,
                        lastmod: n.lastmod || today,
                        changefreq: 'weekly',
                        priority: '0.8'
                    });
                }
            });
        } catch (e) { console.error("Sitemap noticias:", e.message); }

        // Eliminar duplicados por URL (por seguridad extra)
        const urlsUnicas = new Map();
        urls.forEach(u => { if (!urlsUnicas.has(u.loc)) urlsUnicas.set(u.loc, u); });

        // Construir el XML final
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

        urlsUnicas.forEach(u => {
            xml += `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>\n`;
        });

        xml += `</urlset>`;

        console.log(`🗺️ Sitemap generado: ${urlsUnicas.size} URLs indexadas`);
        res.header('Content-Type', 'application/xml');
        res.header('Cache-Control', 'public, max-age=3600'); // Cache 1 hora
        res.send(xml);
    } catch (err) {
        console.error("Fallo general en generación de sitemap.xml:", err);
        res.status(500).send("Error generating sitemap");
    }
});

// =====================================================================
// OPEN GRAPH DINÁMICO — Para que Facebook/WhatsApp/Twitter muestren
// la imagen y título correctos al compartir una página de contenido
// =====================================================================
const isSocialCrawler = (ua) => {
    if (!ua) return false;
    const bots = ['facebookexternalhit', 'twitterbot', 'whatsapp', 'telegrambot', 'linkedinbot', 'slackbot', 'discordbot', 'applebot', 'googlebot'];
    const uaLow = ua.toLowerCase();
    return bots.some(bot => uaLow.includes(bot));
};

const injectOgTags = (html, tags) => {
    // Escapamos caracteres especiales para evitar problemas en los atributos HTML
    const esc = (str) => (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Inyectamos las metatags dinámicas justo después de <head>
    // Los crawlers respetan la PRIMERA ocurrencia de cada propiedad OG,
    // así que estas tienen prioridad sobre las estáticas que vienen después
    const ogBlock = `
  <!-- OG DINÁMICO SERVIDOR -->
  <title>${esc(tags.title)}</title>
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="Expediente X Granaíno" />
  <meta property="og:url" content="${esc(tags.url)}" />
  <meta property="og:title" content="${esc(tags.title)}" />
  <meta property="og:description" content="${esc(tags.description)}" />
  <meta property="og:image" content="${esc(tags.image)}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(tags.title)}" />
  <meta name="twitter:description" content="${esc(tags.description)}" />
  <meta name="twitter:image" content="${esc(tags.image)}" />
  <!-- /OG DINÁMICO -->`;

    // Insertamos justo después de <head> (funciona aunque el HTML esté minificado)
    return html.replace(/<head>/, `<head>${ogBlock}`);
};

const getIndexHtml = () => {

    const indexPath = path.join(__dirname, 'build', 'index.html');
    return fs.readFileSync(indexPath, 'utf-8');
};

const SITE_URL = 'https://expedientexgranaino.com';
const DEFAULT_IMAGE = `${SITE_URL}/social-preview.png?v=7.0`;

// Redirecciones 301 limpias para URLs directas de sección hacia la ruta unificada /leer-historia/:id?src=
app.get('/noticias/:id', (req, res) => {
    res.redirect(301, `/leer-historia/${req.params.id}?src=noticias`);
});

app.get('/expedientes/:id', (req, res) => {
    res.redirect(301, `/leer-historia/${req.params.id}?src=expedientes`);
});

app.get('/casos-abiertos/:id', (req, res) => {
    res.redirect(301, `/leer-historia/${req.params.id}?src=casos`);
});

app.get('/misterios-historicos/:id', (req, res) => {
    res.redirect(301, `/leer-historia/${req.params.id}?src=misterios`);
});

// Ruta de captura general: el resto de páginas del SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BÚNKER EXPEDIENTE X ABIERTO EN PUERTO ${PORT}`);
});