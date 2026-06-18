require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function testRegister() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const username = "TestUser";
        const email = "test_" + Date.now() + "@gmail.com";
        const password = "password123";
        const ciudad = "Granada";
        const edad = 30;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const finalNombre = username.trim();
        const finalCiudad = ciudad.trim();
        const finalEdad = parseInt(edad) || 0;
        const finalEmail = email.trim();

        console.log("Intentando insertar en usuarios...");
        const sql = "INSERT INTO usuarios (nombre, email, password, ciudad, edad, rol, rango, aprobado, fecha_registro, visitas) VALUES (?, ?, ?, ?, ?, 'agente', 'Agente en Prácticas', 1, NOW(), 0)";
        await db.execute(sql, [finalNombre, finalEmail, hashedPassword, finalCiudad, finalEdad]);
        console.log("✅ Usuario insertado.");

        console.log("Intentando insertar en comentarios...");
        await db.execute("INSERT INTO comentarios (agente, mensaje, fecha, aprobado) VALUES (?, ?, NOW(), 1)",
            ['SISTEMA', `🚀 ¡NUEVO AGENTE! El investigador ${finalNombre.toUpperCase()} acaba de unirse a la red táctica.`]);
        console.log("✅ Comentario insertado.");

    } catch (err) {
        console.error("❌ ERROR DETECTADO:", err);
    } finally {
        await db.end();
    }
}

testRegister();
