const mysql = require('mysql2/promise');
require('dotenv').config();

async function vincularImagen() {
    console.log("🔗 VINCULANDO IMAGEN RECUPERADA...");
    
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    });

    try {
        const url = 'https://res.cloudinary.com/dx37worwx/image/upload/v1777110079/expedientex_archivos/1777110078078-1777109822224.png';
        await conn.execute("UPDATE expedientes SET imagen_url = ? WHERE titulo LIKE '%ERA%'", [url]);
        console.log("✅ IMAGEN VINCULADA CORRECTAMENTE A 'LA VISITA EN LA ERA'.");
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    } finally {
        await conn.end();
        process.exit(0);
    }
}

vincularImagen();
