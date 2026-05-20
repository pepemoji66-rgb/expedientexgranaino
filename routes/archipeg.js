const express = require('express');
const router = express.Router();
const axios = require('axios');

// --- MOTOR DE ENVÍO DE EMAIL "GOOGLE-BRIDGE" (BYPASS TOTAL RENDER) ---
const GOOGLE_BRIDGE_URL = 'https://script.google.com/macros/s/AKfycbwSArSjyS40pUSnFCtEcsFOzJ9CHgmj5WKHKZdKInc9ZsaPuAvzkqFppvBfHfDoAUZVQw/exec';
const BRIDGE_KEY = 'ARCHIPEG_BRIDGE_2026';

/**
 * Función central para enviar emails vía Google Apps Script Bridge
 */
async function enviarViaGoogleBridge({ to, subject, html, text }) {
    console.log(`📡 [GOOGLE-BRIDGE]: Enviando email a ${to} vía Puente Google...`);
    try {
        const response = await axios.post(GOOGLE_BRIDGE_URL, {
            key: BRIDGE_KEY,
            to: to,
            subject: subject,
            html: html,
            text: text || ""
        });
        
        if (response.data !== "OK_ENVIADO") {
            throw new Error(`Error en el puente: ${response.data}`);
        }
        console.log(`✅ [BRIDGE-SUCCESS]: Email enviado con éxito vía Google.`);
        return true;
    } catch (error) {
        console.error(`🔥 [BRIDGE-ERROR]: No se pudo enviar el correo:`, error.message);
        throw error;
    }
}

module.exports = (db) => {

    // --- 1. SOLICITAR VERSIÓN (DEMO O PRO) ---
    router.post('/solicitar', async (req, res) => {
        const { usuario_id, tipo } = req.body;

        if (!usuario_id || !tipo) {
            return res.status(400).json({ error: "Datos incompletos para procesar la solicitud." });
        }

        if (tipo !== 'demo' && tipo !== 'pro') {
            return res.status(400).json({ error: "Tipo de solicitud no válido." });
        }

        try {
            // Obtenemos los datos del usuario
            const userResult = await db.query("SELECT nombre, email, aprobado FROM usuarios WHERE id = ?", [usuario_id]);
            if (userResult.length === 0) {
                return res.status(404).json({ error: "Usuario no encontrado en el búnker." });
            }

            const user = userResult[0];
            if (user.aprobado !== 1) {
                return res.status(403).json({ error: "Cuenta no aprobada para realizar operaciones tácticas." });
            }

            // Verificamos si ya existe una solicitud del mismo tipo
            const existing = await db.query("SELECT id, estado FROM archipeg_solicitudes WHERE usuario_id = ? AND tipo = ?", [usuario_id, tipo]);
            if (existing.length > 0) {
                return res.status(409).json({ 
                    error: "Solicitud duplicada", 
                    mensaje: `Ya tienes una solicitud de tipo ${tipo.toUpperCase()} en estado: ${existing[0].estado}.` 
                });
            }

            // Insertamos la solicitud
            const sql = "INSERT INTO archipeg_solicitudes (usuario_id, nombre, email, tipo, estado, fecha) VALUES (?, ?, ?, ?, 'pendiente', NOW())";
            await db.execute(sql, [usuario_id, user.nombre, user.email, tipo]);

            // Enviar correo de aviso al administrador (Jose Moreno)
            const adminEmail = process.env.REACT_APP_ADMIN_EMAIL || "archipegv2@gmail.com";
            const adminText = `Aviso de Sistema: Nueva solicitud de Archipeg (${tipo.toUpperCase()}) registrada por el usuario ${user.nombre} (${user.email}). Requiere tu atención en el Panel de Administrador.`;
            const adminHtml = `
                <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px; background-color: #f8f9fa;">
                    <h2 style="color: #d9534f;">Aviso de Sistema Expediente X 🛸</h2>
                    <p>Se ha registrado una nueva solicitud de Archipeg que requiere tu validación:</p>
                    <p style="margin: 5px 0;"><b>👤 Nombre:</b> ${user.nombre}</p>
                    <p style="margin: 5px 0;"><b>📧 Email:</b> ${user.email}</p>
                    <p style="margin: 5px 0;"><b>💻 Versión solicitada:</b> ${tipo.toUpperCase()}</p>
                    <div style="margin: 30px 0;">
                        <p>Puedes verificarla y aprobarla entrando en el Panel de Mando Unificado de Expediente X Granaíno.</p>
                    </div>
                    <hr>
                    <p style="font-size: 0.8em; color: #666;">Motor de Notificaciones Tácticas de Expediente X.</p>
                </div>
            `;

            enviarViaGoogleBridge({
                to: adminEmail,
                subject: `🔔 NUEVA SOLICITUD DE ARCHIPEG (${tipo.toUpperCase()}) - Acción requerida`,
                text: adminText,
                html: adminHtml
            }).catch(err => console.error("⚠️ Fallo al notificar al admin por email:", err.message));

            res.json({ message: `Solicitud de versión ${tipo.toUpperCase()} recibida correctamente. Pendiente de aprobación.` });
        } catch (err) {
            console.error("❌ ERROR AL SOLICITAR ARCHIPEG:", err);
            res.status(500).json({ error: "Fallo interno al registrar la solicitud." });
        }
    });

    // --- 2. OBTENER ESTADO DE TODAS LAS SOLICITUDES DE UN USUARIO ---
    router.get('/estado/:usuario_id', async (req, res) => {
        try {
            const results = await db.query("SELECT tipo, estado, fecha, fecha_envio FROM archipeg_solicitudes WHERE usuario_id = ?", [req.params.usuario_id]);
            res.json(results);
        } catch (err) {
            console.error("❌ ERROR AL CONSULTAR ESTADO DE SOLICITUDES:", err);
            res.status(500).json({ error: "Fallo al consultar historial." });
        }
    });

    // --- 3. LISTAR TODAS LAS SOLICITUDES PARA EL ADMIN ---
    router.get('/solicitudes', async (req, res) => {
        try {
            const results = await db.query("SELECT * FROM archipeg_solicitudes ORDER BY id DESC");
            res.json(results);
        } catch (err) {
            console.error("❌ ERROR AL LISTAR SOLICITUDES:", err);
            res.status(200).json([]);
        }
    });

    // --- 4. APROBAR Y ENVIAR SOLICITUD ---
    router.put('/solicitudes/:id/aprobar', async (req, res) => {
        const id = req.params.id;

        try {
            // Obtenemos los datos de la solicitud
            const requestResult = await db.query("SELECT * FROM archipeg_solicitudes WHERE id = ?", [id]);
            if (requestResult.length === 0) {
                return res.status(404).json({ error: "Solicitud no encontrada." });
            }

            const solicitud = requestResult[0];
            if (solicitud.estado === 'enviado') {
                return res.status(400).json({ error: "Esta solicitud ya ha sido enviada y procesada." });
            }

            const isDemo = solicitud.tipo === 'demo';
            const demoLink = process.env.ARCHIPEG_DEMO_LINK || "https://drive.google.com/file/d/1q8F9zO7qQ9OEqMshbPrOhyyPU3wQvJJj/view?usp=drive_link";
            const proLink = process.env.ARCHIPEG_PRO_LINK || "https://drive.google.com/file/d/1q8F9zO7qQ9OEqMshbPrOhyyPU3wQvJJj/view?usp=drive_link";
            const downloadLink = isDemo ? demoLink : proLink;

            let subject = isDemo ? '¡Tu demo de Archipeg está lista para descargar! 🚀' : '¡Tu versión de Archipeg Pro ha sido aprobada! 🛡️';
            let textContent = isDemo 
                ? `¡Hola historiador! 👋\n\nTu solicitud de la Versión Demo de Archipeg ha sido aprobada por un administrador.\n\nYa puedes descargar la versión de escritorio para empezar a probar la potencia y soberanía de tu archivo digital sin límites:\n\n🔗 Enlace de descarga:\n${downloadLink}\n\nEsta versión Demo te permite archivar hasta 50 imágenes y 10 vídeos totalmente gratis y fuera de la red.\n\n⚠️ NOTA IMPORTANTE PARA USUARIOS DE WINDOWS:\nAl ser una aplicación independiente (fuera de la tienda de Microsoft), es normal que Windows Defender muestre una pantalla azul de aviso (SmartScreen) al ejecutarla por primera vez. Es totalmente seguro. Simplemente haz clic en "Más información" y luego pulsa en "Ejecutar de todas formas" para abrir el programa.\n\n¡Bienvenido al futuro de tus recuerdos digitales!`
                : `¡Bienvenido a Archipeg Pro! 🛡️\n\nTu cuenta ha sido aprobada con éxito. Ya puedes descargar la versión de escritorio completa para Windows:\n\n🔗 Enlace de descarga:\n${downloadLink}\n\n⚠️ NOTA IMPORTANTE PARA USUARIOS DE WINDOWS:\nAl ser una aplicación independiente (fuera de la tienda de Microsoft), es normal que Windows Defender muestre una pantalla azul de aviso (SmartScreen) al ejecutarla por primera vez. Es totalmente seguro. Simplemente haz clic en "Más información" y luego pulsa en "Ejecutar de todas formas" para abrir el programa.\n\nGracias por confiar en Archipeg para proteger tu legado familiar de forma 100% privada y fuera de la nube.`;

            let htmlContent = isDemo ? `
                <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #007bff;">¡Hola historiador! 👋</h2>
                    <p>Tu solicitud de la <b>Versión Demo de Archipeg</b> ha sido aprobada por un administrador.</p>
                    <p>Ya puedes descargar la versión de escritorio para empezar a probar la potencia y soberanía de tu archivo digital sin límites:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${downloadLink}" style="background-color: #28a745; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            DESCARGAR ARCHIPEG DEMO
                        </a>
                    </div>
                    <p>Esta versión Demo te permite archivar hasta 50 imágenes y 10 vídeos totalmente gratis y fuera de la red.</p>
                    
                    <div style="margin-top: 25px; padding: 15px; background-color: #e9f7fd; border-left: 4px solid #0288d1; color: #0277bd; font-size: 0.9em; border-radius: 4px;">
                        <p style="margin: 0 0 8px 0; font-weight: bold;">⚠️ NOTA IMPORTANTE PARA USUARIOS DE WINDOWS:</p>
                        <p style="margin: 0 0 8px 0;">Al ser una aplicación independiente y soberana (fuera de la tienda oficial de Microsoft), es completamente normal y habitual que Windows Defender muestre una pantalla azul de aviso (SmartScreen) al intentar ejecutarla.</p>
                        <p style="margin: 0;">Para abrir el programa de forma segura, simplemente haz clic en <b>"Más información"</b> y luego presiona el botón <b>"Ejecutar de todas formas"</b>. ¡Tu legado digital está 100% seguro!</p>
                    </div>

                    <p style="margin-top: 20px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all;"><a href="${downloadLink}">${downloadLink}</a></p>
                    <hr>
                    <p style="font-size: 0.8em; color: #666;">Has recibido este correo de forma automatizada por tu solicitud en Expediente X Granaíno.</p>
                </div>
            ` : `
                <div style="font-family: sans-serif; max-width: 600px; border: 1px solid #eee; padding: 20px;">
                    <h2 style="color: #007bff;">¡Bienvenido a Archipeg Pro! 🛡️</h2>
                    <p>Tu cuenta ha sido aprobada con éxito. Ya puedes descargar la versión de escritorio completa para Windows:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${downloadLink}" style="background-color: #28a745; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                            DESCARGAR ARCHIPEG PRO
                        </a>
                    </div>

                    <div style="margin-top: 25px; padding: 15px; background-color: #e9f7fd; border-left: 4px solid #0288d1; color: #0277bd; font-size: 0.9em; border-radius: 4px;">
                        <p style="margin: 0 0 8px 0; font-weight: bold;">⚠️ NOTA IMPORTANTE PARA USUARIOS DE WINDOWS:</p>
                        <p style="margin: 0 0 8px 0;">Al ser una aplicación independiente y soberana (fuera de la tienda oficial de Microsoft), es completamente normal y habitual que Windows Defender muestre una pantalla azul de aviso (SmartScreen) al intentar ejecutarla.</p>
                        <p style="margin: 0;">Para abrir el programa de forma segura, simplemente haz clic en <b>"Más información"</b> y luego presiona el botón <b>"Ejecutar de todas formas"</b>. ¡Tu legado digital está 100% seguro!</p>
                    </div>

                    <p style="margin-top: 20px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                    <p style="word-break: break-all;"><a href="${downloadLink}">${downloadLink}</a></p>
                    <hr>
                    <p style="font-size: 0.8em; color: #666;">Has recibido este correo porque tu pago y registro de Archipeg Pro han sido validados.</p>
                </div>
            `;

            // Enviar el correo usando el Google Apps Script Bridge
            await enviarViaGoogleBridge({
                to: solicitud.email,
                subject: subject,
                text: textContent,
                html: htmlContent
            });

            // Actualizamos la base de datos
            await db.execute("UPDATE archipeg_solicitudes SET estado = 'enviado', fecha_envio = NOW() WHERE id = ?", [id]);

            res.json({ message: `Solicitud aprobada y correo con ejecutable enviado a ${solicitud.email} con éxito.` });
        } catch (err) {
            console.error("❌ ERROR AL APROBAR SOLICITUD:", err);
            res.status(500).json({ error: "Fallo al procesar la aprobación o al enviar el correo." });
        }
    });

    // --- 5. BORRAR SOLICITUD ---
    router.delete('/solicitudes/:id', async (req, res) => {
        try {
            await db.execute("DELETE FROM archipeg_solicitudes WHERE id = ?", [req.params.id]);
            res.json({ message: "Solicitud eliminada correctamente del registro." });
        } catch (err) {
            console.error("❌ ERROR AL BORRAR SOLICITUD:", err);
            res.status(500).json({ error: "Fallo al eliminar solicitud." });
        }
    });

    return router;
};
