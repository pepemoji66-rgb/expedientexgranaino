require('dotenv').config();
const mysql = require('mysql2/promise');

async function fixUsuariosTable() {
    console.log("📡 CONECTANDO PARA ARREGLAR LA TABLA DE USUARIOS...");
    
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT,
            ssl: { rejectUnauthorized: false }
        });

        console.log("🔗 CONEXIÓN ESTABLECIDA.");

        // Verificar si la columna 'visitas' existe
        const [columns] = await connection.query("SHOW COLUMNS FROM usuarios LIKE 'visitas'");
        
        if (columns.length === 0) {
            console.log("⚒️ La columna 'visitas' no existe. Añadiéndola...");
            await connection.execute("ALTER TABLE usuarios ADD COLUMN visitas INT DEFAULT 0");
            console.log("✅ Columna 'visitas' añadida con éxito.");
        } else {
            console.log("ℹ️ La columna 'visitas' ya existe.");
        }

        await connection.end();
        console.log("🏁 PROCESO FINALIZADO.");
    } catch (err) {
        console.error("❌ ERROR CRÍTICO:", err.message);
    }
}

fixUsuariosTable();
