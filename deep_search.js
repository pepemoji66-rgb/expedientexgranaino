const { createClient } = require('@libsql/client');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function deepSearch() {
    // 1. Turso
    const tursoUrl = "libsql://expedientex-pepemoji66-rgb.aws-eu-west-1.turso.io";
    const tursoToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY0MjY3MTAsImlkIjoiMDE5ZDliNDgtNDYwMS03MWU5LWE2Y2UtNTg4OTcyZGNjYzJiIiwicmlkIjoiMjlmMWUyZTQtMDZiOS00Njc4LWI5Y2UtODc0YjUyZmNiMTAyIn0.0d7q5mNGBBdj3CcT2150tOQ3oPXdG4W_0sqavxWhO34rZbfahhQMO_uzOLU0gvW4u9EtwUq8w9vwcSQ6AwswDg";
    const turso = createClient({ url: tursoUrl, authToken: tursoToken });

    // 2. Aiven
    const aiven = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex_bunker',
        ssl: { rejectUnauthorized: false }
    });

    const searchTerms = ['Sierra', 'EVA 9', 'Conjuro', 'niños', 'hola'];

    console.log("🕵️‍♂️ INICIANDO BÚSQUEDA TOTAL EN TURSO...");
    try {
        const resTables = await turso.execute("SELECT name FROM sqlite_master WHERE type='table'");
        for (const t of resTables.rows) {
            const tableName = t.name;
            console.log(`  - Revisando Turso.${tableName}...`);
            const resData = await turso.execute(`SELECT * FROM ${tableName}`);
            for (const row of resData.rows) {
                const rowStr = JSON.stringify(row);
                if (searchTerms.some(term => rowStr.toLowerCase().includes(term.toLowerCase()))) {
                    console.log(`🎯 ¡ENCONTRADO EN TURSO.${tableName}!`);
                    console.log(rowStr);
                }
            }
        }
    } catch (e) { console.error("Error Turso:", e.message); }

    console.log("\n🕵️‍♂️ INICIANDO BÚSQUEDA TOTAL EN AIVEN (expedientex_bunker)...");
    try {
        const [tables] = await aiven.query("SHOW TABLES");
        for (const t of tables) {
            const tableName = Object.values(t)[0];
            console.log(`  - Revisando Aiven.${tableName}...`);
            const [rows] = await aiven.query(`SELECT * FROM \`${tableName}\``);
            for (const row of rows) {
                const rowStr = JSON.stringify(row);
                if (searchTerms.some(term => rowStr.toLowerCase().includes(term.toLowerCase()))) {
                    console.log(`🎯 ¡ENCONTRADO EN AIVEN.${tableName}!`);
                    console.log(rowStr);
                }
            }
        }
    } catch (e) { console.error("Error Aiven:", e.message); }

    await aiven.end();
}

deepSearch();
