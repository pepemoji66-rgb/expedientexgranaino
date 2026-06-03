const mysql = require('mysql2/promise');
require('dotenv').config();

async function parcharEsquema() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    };

    const conn = await mysql.createConnection(config);
    console.log("🩹 PARCHEANDO ESQUEMA DE [expedientex] (MODO ROBUSTO)...");

    const getColumns = async (table) => {
        try {
            const [rows] = await conn.execute(`DESCRIBE \`${table}\``);
            return rows.map(r => r.Field);
        } catch (e) {
            return [];
        }
    };

    const addColumn = async (table, columns, column, definition) => {
        if (!columns.includes(column)) {
            console.log(`➕ Añadiendo ${column} a ${table}...`);
            await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        } else {
            console.log(`✅ ${column} ya existe en ${table}.`);
        }
    };

    try {
        const userCols = await getColumns('usuarios');
        await addColumn('usuarios', userCols, 'apellidos', 'VARCHAR(255) AFTER nombre');
        await addColumn('usuarios', userCols, 'fecha_nacimiento', 'VARCHAR(100)');
        await addColumn('usuarios', userCols, 'hora_nacimiento', 'VARCHAR(100)');
        await addColumn('usuarios', userCols, 'ciudad_nacimiento', 'VARCHAR(255)');
        await addColumn('usuarios', userCols, 'lat_nacimiento', 'DOUBLE');
        await addColumn('usuarios', userCols, 'lon_nacimiento', 'DOUBLE');

        const expCols = await getColumns('expedientes');
        await addColumn('expedientes', expCols, 'imagen_url', 'VARCHAR(255)');
        
        await conn.execute(`CREATE TABLE IF NOT EXISTS comentarios (
            id INT AUTO_INCREMENT PRIMARY KEY, 
            agente VARCHAR(255), 
            mensaje TEXT, 
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP, 
            aprobado INT DEFAULT 1
        )`);
        
        console.log("✅ PARCHEO FINALIZADO.");
    } catch (e) {
        console.error("❌ ERROR PARCHEANDO:", e.message);
    }

    await conn.end();
}

parcharEsquema();
