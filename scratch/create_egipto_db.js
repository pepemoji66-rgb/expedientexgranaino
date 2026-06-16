const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
    host: 'mysql-1cd66845-pepemoji66-a012.c.aivencloud.com',
    port: 11475,
    user: 'avnadmin',
    password: 'AVNS_f1PJAUD3s5YOIS98BUr',
    ssl: { rejectUnauthorized: false }
};

async function init() {
    let connection;
    try {
        console.log("📡 Conectando a Aiven MySQL...");
        connection = await mysql.createConnection(config);
        console.log("✅ Conexión establecida.");

        console.log("⚡ Creando base de datos 'egipto_db'...");
        await connection.query("CREATE DATABASE IF NOT EXISTS egipto_db");
        console.log("✅ Base de datos 'egipto_db' creada o ya existente.");

        // Cerrar conexión general y abrir una específica para egipto_db
        await connection.end();
        connection = await mysql.createConnection({ ...config, database: 'egipto_db' });
        console.log("✅ Conectado a la base de datos 'egipto_db'.");

        // Leer el archivo SQL de inicialización
        const sqlPath = path.join(__dirname, 'paginaweb-react', 'database_init.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Eliminar comentarios de una línea y de múltiples líneas del contenido
        const cleanSql = sqlContent
            .replace(/\/\*[\s\S]*?\*\//g, "")
            .replace(/^\s*--.*$/gm, "");

        // Separar las queries por punto y coma
        const queries = cleanSql
            .split(/;\s*$/m)
            .map(q => q.trim())
            .filter(q => q.length > 0);

        console.log(`🚀 Ejecutando ${queries.length} sentencias SQL para crear las tablas...`);
        for (const query of queries) {
            // Eliminar comentarios de una línea que puedan quedar en medio
            const cleanQuery = query.replace(/^\s*--.*$/gm, '').trim();
            if (cleanQuery) {
                console.log(`Executing: ${cleanQuery.substring(0, 100)}...`);
                await connection.query(cleanQuery);
            }
        }
        console.log("🎉 Base de datos inicializada correctamente en Aiven.");

    } catch (error) {
        console.error("❌ ERROR CRÍTICO:", error);
    } finally {
        if (connection) {
            await connection.end();
            console.log("🔌 Conexión cerrada.");
        }
    }
}

init();
