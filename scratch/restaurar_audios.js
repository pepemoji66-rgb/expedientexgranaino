const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function restaurarAudios() {
    console.log("🔊 INICIANDO RESTAURACIÓN DE AUDIOS...");
    
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    });

    try {
        // 1. Cargar backup
        const data = JSON.parse(fs.readFileSync('backup_data.json', 'utf8'));
        const backupAudios = data.audios || [];

        for (const aud of backupAudios) {
            console.log(`📦 Restaurando desde backup: ${aud.titulo}...`);
            const sql = `UPDATE audios SET 
                         titulo = ?, ruta = ?, aprobado = 1, agente = ?, autor = ?, fecha_subida = ?
                         WHERE id = ?`;
            await conn.execute(sql, [
                aud.titulo, 
                aud.ruta, 
                aud.agente || 'Agente Anónimo', 
                aud.autor || 'Pepe Moreno',
                aud.fecha_subida.replace('T', ' ').replace('.000Z', ''),
                aud.id
            ]);
        }

        // 2. Aprobar el resto que puedan estar pendientes
        console.log("🔓 Aprobando todos los audios para visibilidad total...");
        await conn.execute("UPDATE audios SET aprobado = 1");

        console.log("✅ AUDIOS RESTAURADOS Y VISIBLES.");
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    } finally {
        await conn.end();
        process.exit(0);
    }
}

restaurarAudios();
