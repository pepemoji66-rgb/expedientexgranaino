const mysql = require('mysql2/promise');

const config = {
    host: 'mysql-1cd66845-pepemoji66-a012.c.aivencloud.com',
    port: 11475,
    user: 'avnadmin',
    password: 'AVNS_f1PJAUD3s5YOIS98BUr',
    database: 'egipto_db',
    ssl: { rejectUnauthorized: false }
};

async function fix() {
    let connection;
    try {
        console.log("📡 Conectando a Aiven MySQL...");
        connection = await mysql.createConnection(config);
        console.log("✅ Conexión establecida.");

        // Comprobar si existe la columna 'fecha'
        const [columns] = await connection.query("SHOW COLUMNS FROM `noticias`");
        const hasFecha = columns.some(c => c.Field === 'fecha');

        if (!hasFecha) {
            console.log("➕ Añadiendo columna 'fecha' a la tabla noticias...");
            await connection.query("ALTER TABLE `noticias` ADD COLUMN `fecha` TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
            console.log("✅ Columna 'fecha' añadida con éxito.");
        } else {
            console.log("ℹ️ La columna 'fecha' ya existe en la tabla noticias.");
        }

    } catch (error) {
        console.error("❌ Error al reparar la tabla:", error);
    } finally {
        if (connection) {
            await connection.end();
            console.log("🔌 Conexión cerrada.");
        }
    }
}

fix();
