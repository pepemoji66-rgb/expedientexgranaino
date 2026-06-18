require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
    });

    try {
        await db.query("ALTER TABLE misterios_historicos ADD COLUMN fuente_url VARCHAR(255) NULL");
        console.log("Columna fuente_url añadida a misterios_historicos");
    } catch (err) {
        console.log("Error o ya existe: ", err.message);
    }

    db.end();
}

run().catch(console.error);
