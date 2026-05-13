const db = require('../db');

async function testRegistrationNotification() {
    console.log("🚀 INICIANDO PRUEBA DE REGISTRO TÁCTICO...");

    const fakeAgent = {
        nombre: "Agente_Prueba_" + Math.floor(Math.random() * 1000),
        email: "test" + Math.floor(Math.random() * 1000) + "@expediente.com"
    };

    try {
        console.log(`📡 Simulando registro de: ${fakeAgent.nombre}`);
        
        // 1. Simular la inserción que hace routes/auth.js
        await db.execute("INSERT INTO usuarios (nombre, email, password, ciudad, edad, rol, aprobado, fecha_registro) VALUES (?, ?, 'secret', 'Granada', 33, 'agente', 0, datetime('now'))", 
            [fakeAgent.nombre, fakeAgent.email]);

        // 2. Simular la notificación en comentarios que acabo de añadir
        await db.execute("INSERT INTO comentarios (agente, mensaje, fecha, aprobado) VALUES (?, ?, datetime('now'), 1)", 
            ['SISTEMA', `📡 ALERTA DE REGISTRO: El aspirante ${fakeAgent.nombre.toUpperCase()} ha enviado su solicitud. Pendiente de validación del Mando.`]);

        console.log("✅ REGISTRO Y NOTIFICACIÓN SIMULADOS CON ÉXITO.");

        // 3. Ver los últimos comentarios para confirmar
        console.log("\n💬 ÚLTIMAS COMUNICACIONES EN EL MURO:");
        const comentarios = await db.query("SELECT * FROM comentarios ORDER BY id DESC LIMIT 3");
        comentarios.forEach(c => {
            console.log(`[${c.fecha}] ${c.agente}: ${c.mensaje}`);
        });

    } catch (err) {
        console.error("❌ ERROR EN LA PRUEBA:", err.message);
    } finally {
        process.exit();
    }
}

testRegistrationNotification();
