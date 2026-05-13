const mysql = require('mysql2/promise');
require('dotenv').config();

async function liberarEsquema() {
    console.log("🔓 LIBERANDO ESQUEMA DE EXPEDIENTES (ENUM -> VARCHAR)...");
    
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    });

    try {
        // 1. Cambiar tipos
        await conn.execute("ALTER TABLE expedientes MODIFY COLUMN estado VARCHAR(50) DEFAULT 'pendiente'");
        await conn.execute("ALTER TABLE expedientes MODIFY COLUMN tipo VARCHAR(50) DEFAULT 'agente'");
        console.log("✅ Tipos actualizados.");

        // 2. Corregir datos
        console.log("📝 Sincronizando datos...");
        await conn.execute("UPDATE expedientes SET estado = 'aprobado' WHERE estado IN ('publicado', '', 'pendiente') OR estado IS NULL");
        await conn.execute("UPDATE expedientes SET tipo = 'agente' WHERE tipo IN ('usuario', '', 'agente') OR tipo IS NULL");
        
        // La Visita en la Era como Jefe
        await conn.execute("UPDATE expedientes SET tipo = 'jefe' WHERE titulo LIKE '%ERA%' OR titulo LIKE '%abuela%'");
        await conn.execute("UPDATE expedientes SET tipo = 'jefe' WHERE tipo = 'maestro'");

        console.log("✅ TODO SINCRONIZADO.");
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    } finally {
        await conn.end();
        process.exit(0);
    }
}

liberarEsquema();
