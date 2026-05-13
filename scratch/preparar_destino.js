const dbInit = require('../db_init');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function initTarget() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    };

    const pool = mysql.createPool(config);
    const db = {
        query: async (sql, params) => {
            const [rows] = await pool.execute(sql, params || []);
            return rows;
        },
        execute: async (sql, params) => {
            const [result] = await pool.execute(sql, params || []);
            return { lastInsertRowid: result.insertId, rowsAffected: result.affectedRows };
        }
    };

    console.log("🛠️ ASEGURANDO ESQUEMA EN [expedientex]...");
    await dbInit(db);
    console.log("✅ ESQUEMA PREPARADO.");
    await pool.end();
}

initTarget();
