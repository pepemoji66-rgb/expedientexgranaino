const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });
    const [rows] = await db.query("SELECT id, titulo, ruta, imagen_url FROM audios ORDER BY id DESC");

    console.log(JSON.stringify(rows, null, 2));
    await db.end();
}
run();
