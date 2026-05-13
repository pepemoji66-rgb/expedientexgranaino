const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const axios = require('axios');

// --- UTILIDAD DE ALERTA TELEGRAM ---
const enviarAlertaTelegram = async (mensaje) => {
    const token = process.env.TELEGRAM_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (!token || token === 'TU_TOKEN_AQUI') {
        console.warn("⚠️ TELEGRAM: Token no configurado, alerta no enviada.");
        return;
    }
    if (!chatId) {
        console.warn("⚠️ TELEGRAM: Chat ID no configurado.");
        return;
    }
    try {
        const res = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: `🛰️ BÚNKER ALERTA: ${mensaje}`
        });
        console.log("✅ TELEGRAM: Alerta enviada correctamente.");
    } catch (err) {
        console.error("❌ TELEGRAM ERROR:", err.response?.data || err.message);
    }
};

module.exports = (db) => {

    // --- FUNCIÓN DE AUTENTICACIÓN (LOGIN) ---
    const loginFunc = async (req, res) => {
        const { email, password } = req.body;
        const identificador = email; // Puede ser alias o email

        console.log(`🔑 Intento de acceso para: ${identificador}`);

        try {
            // Buscamos al agente por email O por alias (nombre)
            const results = await db.query("SELECT * FROM usuarios WHERE email = ? OR nombre = ?", [identificador, identificador]);

            if (results.length > 0) {
                const user = results[0];
                // --- ASCENSO AUTOMÁTICO AL ALTO MANDO ---
                const adminEmailOficial = (process.env.REACT_APP_ADMIN_EMAIL || "archipegv2@gmail.com").toLowerCase();
                const userEmail = (user.email || "").toLowerCase();

                if (userEmail && userEmail === adminEmailOficial && user.rol !== 'admin') {
                    console.log(`⚡ PROMOVIENDO A: ${user.email} AL ALTO MANDO`);
                    await db.execute("UPDATE usuarios SET rol = 'admin', aprobado = 1 WHERE email = ?", [user.email]);
                    user.rol = 'admin';
                    user.aprobado = 1;
                }

                // Comparamos el hash de la contraseña
                const match = await bcrypt.compare(password, user.password);

                if (match) {
                    if (user.aprobado !== 1) {
                        console.warn(`⚠️ Intento de acceso de agente no validado: ${email}`);
                        return res.status(403).json({ mensaje: "TU FICHA ESTÁ SIENDO ANALIZADA. ESPERA LA VALIDACIÓN DEL ALTO MANDO." });
                    }
                    console.log(`✅ Acceso concedido a: ${user.nombre}`);

                    // --- SISTEMA DE JERARQUÍA AUTOMÁTICA (Y MANUAL) ---
                    let nuevasVisitas = (user.visitas || 0) + 1;
                    let rangoAntiguo = user.rango || 'Agente en Prácticas';
                    let nuevoRango = rangoAntiguo;

                    const jerarquia = {
                        'Agente en Prácticas': 0,
                        'Cabo': 1,
                        'Cabo 1º': 2,
                        'Sargento': 3,
                        'Teniente': 4,
                        'Capitán': 5,
                        'Comandante': 6
                    };

                    let rangoActualIndex = jerarquia[rangoAntiguo] !== undefined ? jerarquia[rangoAntiguo] : -1;

                    let rangoPorVisitas = 'Agente en Prácticas';
                    if (nuevasVisitas >= 100) rangoPorVisitas = 'Capitán';
                    else if (nuevasVisitas >= 50) rangoPorVisitas = 'Teniente';
                    else if (nuevasVisitas >= 20) rangoPorVisitas = 'Sargento';
                    else if (nuevasVisitas >= 10) rangoPorVisitas = 'Cabo 1º';
                    else if (nuevasVisitas >= 3) rangoPorVisitas = 'Cabo';

                    let rangoPorVisitasIndex = jerarquia[rangoPorVisitas];

                    if (user.rol === 'admin' || rangoAntiguo === 'Comandante') {
                        nuevoRango = 'Comandante';
                    } else if (rangoPorVisitasIndex > rangoActualIndex) {
                        // Solo ascendemos automáticamente si el nuevo rango por visitas es MAYOR al que ya tiene
                        nuevoRango = rangoPorVisitas;
                    }

                    let haAscendido = (nuevoRango !== rangoAntiguo && user.rol !== 'admin' && rangoAntiguo !== 'Agente' && rangoAntiguo !== 'Comandante');

                    // Actualizamos en la base de datos de manera silenciosa
                    try {
                        await db.execute("UPDATE usuarios SET visitas = ?, rango = ? WHERE id = ?", [nuevasVisitas, nuevoRango, user.id]);
                        user.visitas = nuevasVisitas;
                        user.rango = nuevoRango;
                    } catch (err) {
                        console.error("⚠️ Error actualizando rango y visitas:", err.message);
                    }

                    // No enviamos el hash al front por seguridad
                    const { password: _, ...userSafe } = user;

                    res.json({
                        mensaje: "Acceso concedido al Búnker",
                        ascenso: haAscendido,
                        usuario: userSafe
                    });
                } else {
                    console.warn(`⚠️ Contraseña incorrecta para: ${email}`);
                    res.status(401).json({ mensaje: "Credenciales incorrectas, intruso" });
                }
            } else {
                console.warn(`⚠️ Agente no encontrado: ${email}`);
                res.status(401).json({ mensaje: "Agente no registrado en el búnker" });
            }
        } catch (err) {
            console.error("❌ Error en la consulta de login:", err);
            res.status(500).json({
                error: "Fallo en el servidor del búnker",
                mensaje: "Error interno en el sistema de autenticación.",
                detalle: err.message
            });
        }
    };

    // Endpoints de acceso unificados
    router.post('/login', loginFunc);
    router.post('/login-usuario', loginFunc);
    router.post('/login-agente', loginFunc);

    // --- REGISTRO DE NUEVOS AGENTES ---
    router.post('/registro', async (req, res) => {
        try {
            const { username, nombre, email, password, ciudad, edad } = req.body;

            // Hashing de la contraseña antes de guardar
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Valores por defecto robustos y simplificados
            const finalNombre = (username || nombre).trim();
            const finalCiudad = (ciudad || 'Desconocida').trim();
            const finalEdad = parseInt(edad) || 0;
            const finalEmail = email ? email.trim() : `${finalNombre.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}@bunker.local`;

            // REGISTRO AUTOMÁTICO: Ahora se registran como 'aprobado = 1' para acceso inmediato
            const sql = "INSERT INTO usuarios (nombre, email, password, ciudad, edad, rol, rango, aprobado, fecha_registro, visitas) VALUES (?, ?, ?, ?, ?, 'agente', 'Agente en Prácticas', 1, NOW(), 0)";

            await db.execute(sql, [finalNombre, finalEmail, hashedPassword, finalCiudad, finalEdad]);

            // Notificación al sistema para que el admin sepa que hay alguien nuevo
            try {
                await db.execute("INSERT INTO comentarios (agente, mensaje, fecha, aprobado) VALUES (?, ?, NOW(), 1)",
                    ['SISTEMA', `🚀 ¡NUEVO AGENTE! El investigador ${finalNombre.toUpperCase()} acaba de unirse a la red táctica.`]);

                // ALERTA TELEGRAM
                enviarAlertaTelegram(`👤 NUEVO AGENTE REGISTRADO: ${finalNombre.toUpperCase()}\n📍 Ciudad: ${finalCiudad}`);
            } catch (comErr) {
                console.warn("⚠️ No se pudo enviar la alerta de sistema.");
            }

            res.json({ mensaje: "¡Bienvenido al Búnker! Registro completado. Ya puedes acceder al sistema." });
        } catch (err) {
            console.error("❌ Error en Registro:", err.message);
            res.status(500).json({
                error: "Error en el servidor de registro",
                detalle: "Asegúrese de que el email no esté ya registrado."
            });
        }
    });

    // --- GESTIÓN DE USUARIOS (CON RED DE SEGURIDAD) ---
    router.get('/usuarios', async (req, res) => {
        try {
            const results = await db.query("SELECT id, nombre, email, rol, rango, ciudad, edad, visitas, aprobado FROM usuarios ORDER BY id DESC");
            res.json(results);
        } catch (err) {
            console.error("❌ Error listando usuarios:", err);
            res.status(200).json([]);
        }
    });

    router.delete('/usuarios/:id', async (req, res) => {
        try {
            await db.execute("DELETE FROM usuarios WHERE id = ?", [req.params.id]);
            res.json({ mensaje: "Usuario eliminado del búnker" });
        } catch (err) {
            res.status(500).json({ error: "No se pudo eliminar al sujeto" });
        }
    });

    router.put('/usuarios/:id/rango', async (req, res) => {
        try {
            const { rango } = req.body;
            if (!rango) return res.status(400).json({ error: "Falta el rango" });
            
            await db.execute("UPDATE usuarios SET rango = ? WHERE id = ?", [rango, req.params.id]);
            res.json({ mensaje: `Rango actualizado a ${rango}` });
        } catch (err) {
            console.error("❌ Error actualizando rango:", err);
            res.status(500).json({ error: "No se pudo actualizar el rango" });
        }
    });

    return router;
};
