const mysql = require('mysql2/promise');
require('dotenv').config();

async function fijarExpedientes() {
    console.log("📝 CORRIGIENDO ESTADOS DE EXPEDIENTES...");
    
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    });

    try {
        // 1. Poner todo en 'aprobado' y 'agente' si están vacíos
        console.log("🔓 Aprobando expedientes vacíos...");
        await conn.execute("UPDATE expedientes SET estado = 'aprobado' WHERE estado = '' OR estado IS NULL");
        await conn.execute("UPDATE expedientes SET tipo = 'agente' WHERE tipo = '' OR tipo IS NULL");
        
        // 2. Caso especial: La Visita en la Era
        console.log("🌟 Configurando LA VISITA EN LA ERA...");
        await conn.execute("UPDATE expedientes SET estado = 'aprobado', tipo = 'jefe' WHERE titulo LIKE '%ERA%'");

        // 3. Otros tipos antiguos que no coinciden con la query
        await conn.execute("UPDATE expedientes SET tipo = 'agente' WHERE tipo = 'usuario'");
        await conn.execute("UPDATE expedientes SET tipo = 'jefe' WHERE tipo = 'maestro'");

        console.log("✅ EXPEDIENTES SINCRONIZADOS Y VISIBLES.");
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    } finally {
        await conn.end();
        process.exit(0);
    }
}

fijarExpedientes();
