const mysql = require('mysql2/promise');
require('dotenv').config();

// --- CONFIGURACIÓN CENTRAL DEL BÚNKER (MYSQL / AIVEN) ---
const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(config);

console.log(`📡 Conexión con el Búnker (MySQL Aiven) preparada.`);

const db = {
    query: async (sql, params, callback) => {
        // Adaptamos para soportar callbacks si es necesario (retrocompatibilidad)
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }

        try {
            // Usamos pool.query en lugar de execute para mayor compatibilidad con LIMIT/OFFSET
            const [rows] = await pool.query(sql, params || []);
            
            if (callback) callback(null, rows);
            return rows;
        } catch (err) {
            console.error("❌ ERROR EN CONSULTA MYSQL:", err);
            if (callback) callback(err);
            throw err;
        }
    },
    execute: async (sql, params) => {
        const [result] = await pool.execute(sql, params || []);
        if (result) {
            result.lastInsertRowid = result.insertId;
            result.rowsAffected = result.affectedRows;
        }
        return [result];
    }
};

module.exports = db;