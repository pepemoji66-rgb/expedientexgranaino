const { createClient } = require('@libsql/client');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function findMulhacen() {
    const turso = createClient({
        url: "libsql://expedientex-pepemoji66-rgb.aws-eu-west-1.turso.io",
        authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY0MjY3MTAsImlkIjoiMDE5ZDliNDgtNDYwMS03MWU5LWE2Y2UtNTg4OTcyZGNjYzJiIiwicmlkIjoiMjlmMWUyZTQtMDZiOS00Njc4LWI5Y2UtODc0YjUyZmNiMTAyIn0.0d7q5mNGBBdj3CcT2150tOQ3oPXdG4W_0sqavxWhO34rZbfahhQMO_uzOLU0gvW4u9EtwUq8w9vwcSQ6AwswDg"
    });

    const aiven = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex_bunker',
        ssl: { rejectUnauthorized: false }
    });

    console.log("🔍 BUSCANDO 'Mulhacen'...");

    try {
        const tables = ['noticias', 'expedientes', 'lugares'];
        for (const table of tables) {
            console.log(`  - Buscando en Turso.${table}...`);
            const q = (table === 'noticias') ? "cuerpo" : (table === 'expedientes' ? "contenido" : "descripcion");
            const res = await turso.execute(`SELECT * FROM ${table} WHERE ${q} LIKE '%Mulhacen%' OR titulo LIKE '%Mulhacen%'`);
            if (res.rows.length > 0) {
                console.log(`🎯 ENCONTRADO EN TURSO.${table}:`, JSON.stringify(res.rows, null, 2));
            }

            console.log(`  - Buscando en Aiven.${table}...`);
            const [aRes] = await aiven.query(`SELECT * FROM \`${table}\` WHERE \`${q}\` LIKE '%Mulhacen%' OR \`titulo\` LIKE '%Mulhacen%'`);
            if (aRes.length > 0) {
                console.log(`🎯 ENCONTRADO EN AIVEN.${table}:`, JSON.stringify(aRes, null, 2));
            }
        }
    } catch (err) {
        console.error("Error:", err.message);
    }

    await aiven.end();
}

findMulhacen();
