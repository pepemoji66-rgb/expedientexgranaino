require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTableSchema() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });

        const [columns] = await connection.query("SHOW COLUMNS FROM usuarios");
        console.log("COLUMNS IN 'usuarios':");
        console.table(columns);

        await connection.end();
    } catch (err) {
        console.error("❌ ERROR:", err.message);
    }
}

checkTableSchema();
