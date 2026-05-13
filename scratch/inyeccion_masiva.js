const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function inyeccionMasiva() {
    console.log("💉 INICIANDO INYECCIÓN MASIVA: BACKUP -> AIVEN");

    const data = JSON.parse(fs.readFileSync('backup_data.json', 'utf8'));
    
    const mysqlConn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    const tables = ['usuarios', 'expedientes', 'noticias', 'lugares', 'videos', 'audios', 'imagenes'];

    try {
        for (const table of tables) {
            const rows = data[table];
            if (rows && rows.length > 0) {
                console.log(`📥 Inyectando ${rows.length} registros en [${table}]...`);
                for (const row of rows) {
                    // Limpieza de campos para MySQL
                    const cleanRow = {};
                    for (let key in row) {
                        let val = row[key];
                        // Ajuste de fechas
                        if (typeof val === 'string' && val.includes('T') && val.includes('Z')) {
                            val = val.replace('T', ' ').replace('.000Z', '');
                        }
                        // Ajuste de booleanos o nulos
                        if (val === undefined) val = null;
                        cleanRow[key] = val;
                    }

                    const keys = Object.keys(cleanRow);
                    const values = Object.values(cleanRow);
                    const columns = keys.map(k => `\`${k}\``).join(', ');
                    const placeholders = keys.map(() => '?').join(', ');

                    const sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE id=id`;
                    await mysqlConn.execute(sql, values);
                }
            }
        }

        console.log("🔢 FIJANDO CONTADOR EN 2120...");
        await mysqlConn.execute("UPDATE visitas SET cuenta = 2120 WHERE id = 1");

        console.log("✨ INYECCIÓN COMPLETADA. EL BÚNKER ESTÁ RESTAURADO.");
    } catch (err) {
        console.error("❌ ERROR EN LA INYECCIÓN:", err.message);
    } finally {
        await mysqlConn.end();
        process.exit(0);
    }
}

inyeccionMasiva();
