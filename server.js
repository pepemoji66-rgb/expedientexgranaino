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
const cartaAstralRoutes = require('./routes/carta_astral');
const tarotRoutes = require('./routes/tarot');
const efemeridesRoutes = require('./routes/efemerides');
const noticiasExternasRoutes = require('./routes/noticias_externas');
const archipegRoutes = require('./routes/archipeg');
const casosAbiertosRoutes = require('./routes/casosAbiertos');
const socialRoutes = require('./routes/socialRoutes');
const misteriosHistoricosRoutes = require('./routes/misteriosHistoricos');


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

// --- PROTOCOLO DE LIMPIEZA C-100 ---
async function podarRegistros(tabla, limite = 100) {
    try {
        // Obtenemos el total para informar
        const countRes = await db.query(`SELECT COUNT(*) as total FROM ${tabla}`);
        const total = countRes[0]?.total || 0;

        if (total > limite) {
            console.log(`🧹 LIMPIEZA: El sector ${tabla} excede el límite (${total}/${limite}). Ejecutando poda...`);
            // Obtenemos el ID del registro en la posición 'limite' (el último que queremos conservar)
            // Usamos query en vez de execute para dar soporte a LIMIT/OFFSET en mysql2
            const rows = await db.query(`SELECT id FROM ${tabla} ORDER BY id DESC LIMIT 1 OFFSET ?`, [limite - 1]);
            if (rows.length > 0) {
                const limiteId = rows[0].id;
                await db.execute(`DELETE FROM ${tabla} WHERE id < ?`, [limiteId]);
                console.log(`🧹 LIMPIEZA: Eliminados registros antiguos con ID menor a ${limiteId} en la tabla ${tabla}`);
            }
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
app.use('/api/archipeg', archipegRoutes(db));
app.use('/api/casos', casosAbiertosRoutes(uploadArchivos));
app.use('/api/social', socialRoutes(db, enviarAlertaTelegram));
app.use('/api/misterios-historicos', misteriosHistoricosRoutes(uploadArchivos));

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

app.use(express.static(path.join(__dirname, 'build'), {
    maxAge: '1y',
    etag: false,
    index: false // El SSR sirve el index.html, no el static handler
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
// Inyecta contenido HTML rico antes de servir el SPA
// ==============================================

const inyectarContenidoSEO = (html, titulo, descripcion, contenidoSeo, imagenUrl = null, paginaUrl = null) => {
    // Reemplazamos el title genérico por uno específico de página
    html = html.replace(
        /<title>[^<]*<\/title>/,
        `<title>${titulo}</title>`
    );

    const desc = (descripcion || '').replace(/"/g, '&quot;');
    const title = (titulo || '').replace(/"/g, '&quot;');
    const img = imagenUrl || 'https://expedientexgranaino.com/social-preview.png?v=5.0';
    const url = paginaUrl || 'https://expedientexgranaino.com/';

    // Limpiamos los tags originales en index.html para evitar duplicaciones
    html = html.replace(/<meta [^>]*property=["']og:[^"']*["'][^>]*>/gi, '');
    html = html.replace(/<meta [^>]*name=["']twitter:[^"']*["'][^>]*>/gi, '');
    html = html.replace(/<meta [^>]*name=["']description["'][^>]*>/gi, '');
    html = html.replace(/<meta [^>]*name=["']keywords["'][^>]*>/gi, '');

    // Generación de Datos Estructurados (JSON-LD) para SEO
    let schemaType = "WebSite";
    if (url.includes('/leer-historia/')) {
        schemaType = "NewsArticle";
    }

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

    // Inyectamos meta description, OG, Twitter Cards, canonical y JSON-LD
    html = html.replace(
        '</head>',
        `<meta name="description" content="${desc}" />
<meta name="keywords" content="OVNI Granada, fenómenos paranormales, ufología Andalucía, avistamientos UFO, psicofonías, misterio, investigación paranormal, Expediente X" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${desc}" />
<meta property="og:image" content="${img}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="${url}" />
<meta name="twitter:title" content="${title}" />
<meta name="twitter:description" content="${desc}" />
<meta name="twitter:image" content="${img}" />
<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>`
    );

    // Eliminamos el aviso por defecto de React para que el bot de Google (y AdSense) no lo lea como prioritario
    html = html.replace(/<noscript>You need to enable JavaScript to run this app\.<\/noscript>/ig, '');

    // Inyectamos el bloque de contenido estático ANTES del div#root
    // Visible para bots (AdSense, Googlebot) y revisores humanos
    // Visually hidden para usuarios que tienen JS activo (React lo oculta al montar)
    html = html.replace(
        '<div id="root"></div>',
        `<div id="seo-static-content" aria-hidden="true" style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;font-size:0;">
${contenidoSeo}
</div>
<div id="root"></div>`
    );

    return html;
};

const obtenerUrlsRequest = (req) => {
    const protocol = req.protocol === 'http' || req.protocol === 'https' ? req.protocol : 'https';
    const host = req.get('host');
    const paginaUrl = `${protocol}://${host}${req.originalUrl}`;
    const baseImgUrl = `${protocol}://${host}`;
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

// Sección de Aviso Legal (/legal) - SEO enriquecido
app.get('/legal', (req, res) => {
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

        const pagina = inyectarContenidoSEO(
            html,
            'Aviso Legal | Términos de Uso — Expediente X Granaíno',
            'Aviso Legal y condiciones generales de uso del portal de investigación Expediente X Granaíno.',
            contenidoSeo
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

        const pagina = inyectarContenidoSEO(
            html,
            'Política de Privacidad | Protección de Datos — Expediente X Granaíno',
            'Política de Privacidad de Expediente X Granaíno. Información detallada sobre el tratamiento de sus datos personales y derechos ARCO.',
            contenidoSeo
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

        const pagina = inyectarContenidoSEO(
            html,
            'Política de Cookies | Frecuencia de Rastreo — Expediente X Granaíno',
            'Conozca qué cookies utiliza el Búnker de Expediente X Granaíno y cómo puede gestionarlas o desactivarlas en su navegador.',
            contenidoSeo
        );
        res.send(pagina);
    });
});

// Sección Horóscopo (/horoscopo) - SEO enriquecido
app.get('/horoscopo', (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">✨ HORÓSCOPO DEL BÚNKER — Frecuencias Estelares</h1>
    <p>El <strong>Horóscopo de Expediente X Granaíno</strong> es una herramienta de calibración astrológica basada en la monitorización de frecuencias cosmológicas e inteligencia artificial. Las estrellas revelan lo que las sombras ocultan. Cada día analizamos las posiciones planetarias de los doce signos del zodiaco para descifrar las tendencias y advertencias energéticas.</p>
    
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">Los Doce Sectores Zodiacales</h2>
    <ul>
        <li><strong>Aries:</strong> Impulso de energía cósmica y acción. Vigilancia ante posibles interferencias.</li>
        <li><strong>Tauro:</strong> Estabilidad en las frecuencias de campo. Momento para consolidar el archivo.</li>
        <li><strong>Géminis:</strong> Transmisión dual. Flujo rápido de información en la red de agentes.</li>
        <li><strong>Cáncer:</strong> Sensibilidad a las psicofonías y anomalías electromagnéticas. Proteja su búnker emocional.</li>
        <li><strong>Leo:</strong> Brillo estelar. Su liderazgo en el sector es visible, mantenga el radar activo.</li>
        <li><strong>Virgo:</strong> Análisis minucioso de datos. La triangulación de testimonios dará resultados.</li>
        <li><strong>Libra:</strong> Equilibrio energético. Armonice sus instrumentos de detección paranormal.</li>
        <li><strong>Escorpio:</strong> Profundidades del misterio. Intensidad en el rastreo de señales anómalas.</li>
        <li><strong>Sagitario:</strong> Exploración y búsqueda de la verdad. Nuevos horizontes en ufología.</li>
        <li><strong>Capricornio:</strong> Disciplina táctica. Estructuración sólida de informes clasificados.</li>
        <li><strong>Acuario:</strong> Innovación tecnológica en la detección UAP. Conexión con la red global.</li>
        <li><strong>Piscis:</strong> Conexión intuitiva. Percepción agudizada de sucesos inexplicables.</li>
    </ul>
    <p style="margin-top:20px;color:#666;font-size:0.75rem;">Advertencia: Las predicciones astrológicas del búnker son generadas para el entretenimiento y la reflexión sobre la influencia del cosmos. El destino está en sus manos, agente.</p>
</article>`;

        const pagina = inyectarContenidoSEO(
            html,
            'Horóscopo del Búnker | Astrología y Frecuencias — Expediente X Granaíno',
            'Consulte el horóscopo diario generado por inteligencia artificial en el Búnker. Predicciones energéticas para todos los signos del zodiaco.',
            contenidoSeo
        );
        res.send(pagina);
    });
});

// Sección Tarot (/tarot) - SEO enriquecido
app.get('/tarot', (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">🔮 EL ORÁCULO DEL BÚNKER: RITUAL DEL TAROT</h1>
    <p>El <strong>Tarot de Expediente X Granaíno</strong> es una interfaz mística interactiva diseñada para canalizar el inconsciente colectivo de los investigadores. A través de la selección de 5 Arcanos Mayores, el sistema sintoniza su vibración para interpretar su estado actual, sus desafíos y la proyección del misterio en su camino personal.</p>
    
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">El Significado de la Tirada Táctica</h2>
    <p>La consulta al oráculo se realiza mediante un ritual de cinco posiciones que estructuran la lectura:</p>
    <ul>
        <li><strong>Posición 1 (El Origen / Pasado reciente):</strong> Representa las influencias previas y los cimientos de la situación actual.</li>
        <li><strong>Posición 2 (El Desafío / Presente):</strong> Señala el obstáculo principal o la anomalía que debe enfrentar en este momento.</li>
        <li><strong>Posición 3 (El Destino / Futuro próximo):</strong> Indica el sendero hacia el cual se dirigen las energías si no hay interferencia.</li>
        <li><strong>Posición 4 (La Herramienta / Consejo):</strong> La frecuencia o cualidad que el agente debe potenciar para resolver su conflicto.</li>
        <li><strong>Posición 5 (La Revelación / Conclusión):</strong> El resultado final de la sintonización cósmica.</li>
    </ul>
    <p style="margin-top:20px;color:#666;font-size:0.75rem;">Consulte al oráculo con respeto y de forma pausada. No sature la frecuencia con lecturas consecutivas para mantener la pureza de la señal.</p>
</article>`;

        const pagina = inyectarContenidoSEO(
            html,
            'El Oráculo del Búnker | Lectura de Tarot Online — Expediente X Granaíno',
            'Realice el ritual de los Arcanos en el Oráculo del Búnker. Tirada interactiva de 5 cartas para descifrar sus frecuencias energéticas.',
            contenidoSeo
        );
        res.send(pagina);
    });
});

// Sección Carta Astral (/carta-astral) - SEO enriquecido
app.get('/carta-astral', (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', (err, html) => {
        if (err) return res.sendFile(indexPath);

        const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">🌌 CARTA ASTRAL DEL AGENTE: COORDENADAS NATALES</h1>
    <p>La <strong>Carta Astral de Expediente X Granaíno</strong> calcula la posición exacta de los cuerpos celestes en el momento y lugar de nacimiento del agente. Este mapa natal sirve como huella cósmica del investigador, revelando su predisposición hacia la percepción anómala y sus cualidades analíticas.</p>
    
    <h2 style="color:#00d4ff;font-size:0.95rem;margin-top:20px">Componentes Críticos de la Sintonización Astral</h2>
    <ul>
        <li><strong>Signo Solar:</strong> Representa el núcleo de la personalidad, la voluntad y la energía vital básica del agente.</li>
        <li><strong>Signo Lunar:</strong> Define el mundo emocional, los instintos subconscientes y la capacidad intuitiva ante fenómenos paranormales.</li>
        <li><strong>Ascendente:</strong> La máscara exterior, cómo se presenta el investigador ante el mundo y el inicio del camino de su vida.</li>
        <li><strong>Posiciones Planetarias:</strong> Mercurio (comunicación e informes), Venus (relaciones de red), Marte (acción de campo) y los planetas exteriores que marcan las tendencias generacionales del misterio.</li>
    </ul>
    <p style="margin-top:20px;color:#666;font-size:0.75rem;">Para obtener una lectura precisa, ingrese su fecha, hora y ciudad de nacimiento en los módulos del búnker. Los datos son procesados localmente con fines de cálculo astrológico.</p>
</article>`;

        const pagina = inyectarContenidoSEO(
            html,
            'Carta Astral del Agente | Coordenadas Celestes Natales — Expediente X Granaíno',
            'Calcule su carta natal en el Búnker. Análisis detallado de su signo solar, lunar, ascendente y posiciones planetarias.',
            contenidoSeo
        );
        res.send(pagina);
    });
});

// Sección de Noticias (/noticias) - SEO enriquecido
app.get('/noticias', async (req, res) => {
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

// Sección de Vídeos (/videos) - SEO enriquecido
app.get('/videos', async (req, res) => {
    const indexPath = path.join(__dirname, 'build', 'index.html');
    fs.readFile(indexPath, 'utf8', async (err, html) => {
        if (err) return res.sendFile(indexPath);

        let contenidoSeo = `
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

        const { paginaUrl, baseImgUrl } = obtenerUrlsRequest(req);
        const imagenUrl = `${baseImgUrl}/presentacion_hero.png`;

        const pagina = inyectarContenidoSEO(
            html,
            'Galería de Vídeos de Avistamientos y OVNIS — Expediente X Granaíno',
            'Grabaciones originales de avistamientos de OVNIS y anomalías aéreas registradas por nuestra red de observadores.',
            contenidoSeo,
            imagenUrl,
            paginaUrl
        );
        res.send(pagina);
    });
});

// Sección de Expedientes (/expedientes) - SEO enriquecido
app.get('/expedientes', async (req, res) => {
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
        const imagenUrl = `${baseImgUrl}/presentacion_hero.png`;

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
    const indexPath = path.join(__dirname, 'build', 'index.html');
    
    fs.readFile(indexPath, 'utf8', async (err, html) => {
        if (err) return res.sendFile(indexPath);

        let historia = null;
        let esRelatoAdmin = false;
        let esNoticia = false;
        let esMisterio = false;

        try {
            // 1. Buscar en relatos del admin / jefe
            const relatosAdmin = await db.query(
                "SELECT * FROM expedientes WHERE id = ? AND (estado = 'aprobado' OR estado = 'publicado' OR estado = 'publicada' OR estado = 'activo') AND tipo = 'jefe'",
                [id]
            );
            if (relatosAdmin && relatosAdmin.length > 0) {
                historia = relatosAdmin[0];
                esRelatoAdmin = true;
            } else {
                // 2. Buscar en expedientes de agentes
                const expedientesPublicos = await db.query(
                    "SELECT * FROM expedientes WHERE id = ? AND (estado = 'aprobado' OR estado = 'publicado' OR estado = 'publicada' OR estado = 'activo') AND (tipo = 'agente' OR tipo IS NULL)",
                    [id]
                );
                if (expedientesPublicos && expedientesPublicos.length > 0) {
                    historia = expedientesPublicos[0];
                } else {
                    // 3. Buscar en noticias
                    const noticias = await db.query(
                        "SELECT * FROM noticias WHERE id = ? AND (estado = 'aprobado' OR estado IS NULL)",
                        [id]
                    );
                    if (noticias && noticias.length > 0) {
                        historia = noticias[0];
                        esNoticia = true;
                    } else {
                        // 4. Buscar en misterios históricos
                        const misterios = await db.query(
                            "SELECT * FROM misterios_historicos WHERE id = ?",
                            [id]
                        );
                        if (misterios && misterios.length > 0) {
                            historia = misterios[0];
                            esMisterio = true;
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
            const { paginaUrl } = obtenerUrlsRequest(req);

            const contenidoSeo = `
<article style="max-width:900px;margin:40px auto;padding:30px;font-family:monospace;color:#aaa;font-size:0.85rem;line-height:1.8;background:#050505;border-left:3px solid #1a4a4a">
    <h1 style="color:#00d4ff;font-size:1.1rem;letter-spacing:3px;margin-bottom:20px">${historia.titulo ? historia.titulo.toUpperCase() : 'SIN TÍTULO'}</h1>
    <p><strong>Clasificación:</strong> ${esRelatoAdmin ? 'Relato del Administrador' : esNoticia ? 'Noticia de Alerta' : esMisterio ? 'Misterio Histórico' : 'Expediente de Agente'}</p>
    <p><strong>Autor:</strong> ${historia.usuario_nombre || historia.agente || 'Administrador'}</p>
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
            res.send(pagina);
        } else {
            res.sendFile(indexPath);
        }
    });
});

// --- ENDPOINTS PARA AFILIADOS DE AMAZON (NINJA) ---
app.get('/api/amazon/todos', async (req, res) => {
    try {
        const rows = await db.query("SELECT datos_json FROM amazon_afiliados");
        if (rows && rows.length > 0) {
            const todosLosLibros = rows.map(row => JSON.parse(row.datos_json));
            res.json(todosLosLibros);
        } else {
            res.json([]);
        }
    } catch (err) {
        console.error("Error al obtener todos los datos de amazon:", err);
        res.status(500).json({ error: "Error en el servidor" });
    }
});
app.get('/api/amazon/:itemKey', async (req, res) => {
    try {
        const itemKey = req.params.itemKey;
        const rows = await db.query("SELECT datos_json FROM amazon_afiliados WHERE item_key = ?", [itemKey]);
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

// Ruta de captura general: el resto de páginas del SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BÚNKER EXPEDIENTE X ABIERTO EN PUERTO ${PORT}`);
});