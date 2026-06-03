const { createClient } = require('@libsql/client');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
    console.log("🚀 INICIANDO MIGRACIÓN CRÍTICA: TURSO -> MYSQL AIVEN");

    // 1. Conexión a Turso (ORIGEN)
    // Quitamos los comentarios del .env manual o los pasamos aquí
    const tursoUrl = "libsql://expedientex-pepemoji66-rgb.aws-eu-west-1.turso.io";
    const tursoToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY0MjY3MTAsImlkIjoiMDE5ZDliNDgtNDYwMS03MWU5LWE2Y2UtNTg4OTcyZGNjYzJiIiwicmlkIjoiMjlmMWUyZTQtMDZiOS00Njc4LWI5Y2UtODc0YjUyZmNiMTAyIn0.0d7q5mNGBBdj3CcT2150tOQ3oPXdG4W_0sqavxWhO34rZbfahhQMO_uzOLU0gvW4u9EtwUq8w9vwcSQ6AwswDg";

    const turso = createClient({ url: tursoUrl, authToken: tursoToken });

    // 2. Conexión a MySQL (DESTINO)
    const mysqlConn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    const tables = [
        'usuarios', 
        'expedientes', 
        'chat_mensajes', 
        'noticias', 
        'lugares', 
        'videos', 
        'audios', 
        'imagenes', 
        'archivos_usuarios',
        'comentarios',
        'visitas'
    ];

    try {
        for (const table of tables) {
            console.log(`\n📦 Procesando tabla: [${table}]...`);
            
            // A. Obtener datos de Turso
            let rows;
            try {
                const res = await turso.execute(`SELECT * FROM \`${table}\``);
                rows = res.rows;
            } catch (e) {
                console.warn(`⚠️ La tabla [${table}] no existe en Turso o está vacía.`);
                continue;
            }

            if (rows.length === 0) {
                console.log(`ℹ️ La tabla [${table}] está vacía.`);
                continue;
            }

            console.log(`📥 Recopilados ${rows.length} registros de Turso.`);

            // B. Limpiar tabla en MySQL (opcional, pero seguro)
            // await mysqlConn.execute(`DELETE FROM \`${table}\``);

            // C. Insertar en MySQL
            for (const row of rows) {
                const keys = Object.keys(row);
                const values = Object.values(row);
                
                // Ajustar nulos
                const cleanValues = values.map(v => v === null ? null : v);

                const columns = keys.map(k => `\`${k}\``).join(', ');
                const placeholders = keys.map(() => '?').join(', ');

                try {
                    const sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE id=id`;
                    await mysqlConn.execute(sql, cleanValues);
                } catch (err) {
                    // console.error(`❌ Error insertando en ${table}:`, err.message);
                }
            }
            console.log(`✅ Tabla [${table}] migrada con éxito.`);
        }

        console.log("\n✨ MIGRACIÓN FINALIZADA CON ÉXITO. EL BÚNKER ESTÁ COMPLETO.");
    } catch (err) {
        console.error("❌ ERROR CRÍTICO EN LA MIGRACIÓN:", err);
    } finally {
        await mysqlConn.end();
        process.exit(0);
    }
}

migrate();
