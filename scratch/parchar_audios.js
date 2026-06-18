const mysql = require('mysql2/promise');
require('dotenv').config();

async function parcharAudios() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    };

    const conn = await mysql.createConnection(config);
    try {
        const [cols] = await conn.execute('DESCRIBE audios');
        const names = cols.map(c => c.Field);
        if (!names.includes('agente')) await conn.execute("ALTER TABLE audios ADD COLUMN agente VARCHAR(255)");
        if (!names.includes('autor')) await conn.execute("ALTER TABLE audios ADD COLUMN autor VARCHAR(255)");
        if (!names.includes('latitud')) await conn.execute("ALTER TABLE audios ADD COLUMN latitud DOUBLE DEFAULT 0");
        if (!names.includes('longitud')) await conn.execute("ALTER TABLE audios ADD COLUMN longitud DOUBLE DEFAULT 0");
        if (!names.includes('estado')) await conn.execute("ALTER TABLE audios ADD COLUMN estado VARCHAR(50) DEFAULT 'pendiente'");
        console.log('✅ Audios parchados (manual)');
    } catch (e) {
        console.error("❌ ERROR:", e.message);
    }
    await conn.end();
}

parcharAudios();
