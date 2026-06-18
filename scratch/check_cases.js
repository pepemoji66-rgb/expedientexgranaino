require('dotenv').config({ path: '../.env' });
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
        
        console.log(`Querying last 5 rows from relatos_administrador:`);
        const [rows] = await connection.execute(`SELECT * FROM relatos_administrador ORDER BY id DESC LIMIT 5;`);
        
        rows.forEach(r => {
            console.log(`- ID: ${r.id}, Title: ${r.titulo}, Image: ${r.imagen_url || r.imagen || 'N/A'}`);
        });

        await connection.end();
    } catch (e) {
        console.error("Error:", e);
    }
}
main();
