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
        const [rows] = await connection.execute("SELECT id, titulo, titulo_en, contenido, contenido_en FROM casos_abiertos;");
        console.log(JSON.stringify(rows, null, 2));
        await connection.end();
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
