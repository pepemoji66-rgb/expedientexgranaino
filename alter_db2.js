require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    };

    try {
        const connection = await mysql.createConnection(config);
        console.log("Connected.");
        
        try {
            await connection.execute("ALTER TABLE expedientes ADD COLUMN fuente_url TEXT DEFAULT NULL;");
            console.log("Added fuente_url to expedientes.");
        } catch (e) {
            console.log("expedientes:", e.message);
        }

        try {
            await connection.execute("ALTER TABLE casos_abiertos ADD COLUMN fuente_url TEXT DEFAULT NULL;");
            console.log("Added fuente_url to casos_abiertos.");
        } catch (e) {
            console.log("casos_abiertos:", e.message);
        }

        await connection.end();
        console.log("Done.");
    } catch (e) {
        console.error("Connection Error:", e);
    }
}
main();
