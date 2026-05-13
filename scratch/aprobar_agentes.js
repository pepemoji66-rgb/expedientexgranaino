require('dotenv').config();
const mysql = require('mysql2/promise');

async function aprobarTodos() {
    console.log("🚀 INICIANDO PROTOCOLO DE APROBACIÓN MASIVA...");
    
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    };

    let connection;
    try {
        connection = await mysql.createConnection(config);
        
        // Operación relámpago: Poner aprobado = 1 a todos los usuarios que no lo estén
        const [result] = await connection.execute("UPDATE usuarios SET aprobado = 1 WHERE aprobado = 0 OR aprobado IS NULL");
        
        console.log(`✅ OPERACIÓN COMPLETADA: ${result.affectedRows} agentes han sido validados y ya pueden entrar al búnker.`);
        
    } catch (err) {
        console.error("❌ ERROR EN EL PROTOCOLO:", err.message);
    } finally {
        if (connection) await connection.end();
    }
}

aprobarTodos();
