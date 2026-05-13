const { createClient } = require('@libsql/client');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function phoenixSync() {
    console.log("🔥 INICIANDO PROTOCOLO FÉNIX: RESCATE TOTAL DE TURSO A AIVEN");

    const turso = createClient({ 
        url: "libsql://expedientex-pepemoji66-rgb.aws-eu-west-1.turso.io", 
        authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY0MjY3MTAsImlkIjoiMDE5ZDliNDgtNDYwMS03MWU5LWE2Y2UtNTg4OTcyZGNjYzJiIiwicmlkIjoiMjlmMWUyZTQtMDZiOS00Njc4LWI5Y2UtODc0YjUyZmNiMTAyIn0.0d7q5mNGBBdj3CcT2150tOQ3oPXdG4W_0sqavxWhO34rZbfahhQMO_uzOLU0gvW4u9EtwUq8w9vwcSQ6AwswDg" 
    });

    const mysqlConn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    const tables = ['usuarios', 'expedientes', 'noticias', 'lugares', 'videos', 'audios', 'imagenes', 'comentarios'];

    try {
        for (const table of tables) {
            console.log(`📡 Escaneando sector [${table}]...`);
            const res = await turso.execute(`SELECT * FROM \`${table}\``);
            const rows = res.rows;

            if (rows.length > 0) {
                console.log(`📥 Rescatados ${rows.length} registros.`);
                for (const row of rows) {
                    const keys = Object.keys(row);
                    const values = Object.values(row);
                    const columns = keys.map(k => `\`${k}\``).join(', ');
                    const placeholders = keys.map(() => '?').join(', ');

                    const cleanValues = values.map(v => {
                        if (typeof v === 'string' && v.includes('T') && v.includes('Z')) {
                            return v.replace('T', ' ').replace('.000Z', '');
                        }
                        return v;
                    });

                    const sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE id=id`;
                    await mysqlConn.execute(sql, cleanValues);
                }
            }
        }

        console.log("🔢 RESTAURANDO CONTADOR A 2120...");
        await mysqlConn.execute("UPDATE visitas SET cuenta = 2120 WHERE id = 1");
        
        console.log("✨ PROTOCOLO FÉNIX COMPLETADO. EL BÚNKER ESTÁ ÍNTEGRO EN AIVEN.");
    } catch (err) {
        console.error("❌ ERROR CRÍTICO EN EL RESCATE:", err.message);
    } finally {
        await mysqlConn.end();
        process.exit(0);
    }
}

phoenixSync();
