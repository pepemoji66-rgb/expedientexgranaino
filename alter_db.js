require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null,
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log("Connected. Adding columns...");
        await connection.execute("ALTER TABLE casos_abiertos ADD COLUMN titulo_en VARCHAR(255) DEFAULT NULL;");
        console.log("Added titulo_en");
        await connection.execute("ALTER TABLE casos_abiertos ADD COLUMN contenido_en TEXT DEFAULT NULL;");
        console.log("Added contenido_en");
        await connection.end();
        console.log("Done.");
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
