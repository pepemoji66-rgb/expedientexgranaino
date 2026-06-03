const mysql = require('mysql2/promise');

async function patch() {
    console.log("🚀 INICIANDO PARCHE REMOTO EN PRODUCCIÓN (expedientex)...");
    
    const conn = await mysql.createConnection({
        host: 'mysql-1cd66845-pepemoji66-a012.c.aivencloud.com',
        port: 11475,
        user: 'avnadmin',
        password: 'AVNS_f1PJAUD3s5YOIS98BUr',
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log("✅ Conexión establecida con éxito.");

        // 1. PARCHE EXPEDIENTES (RELEVANCIA)
        const [colsExp] = await conn.query(`SHOW COLUMNS FROM expedientes LIKE 'relevancia'`);
        if (colsExp.length === 0) {
            console.log("📡 Añadiendo columna 'relevancia' a la tabla expedientes...");
            await conn.query(`ALTER TABLE expedientes ADD COLUMN relevancia INT DEFAULT 0`);
            console.log("✅ Columna 'relevancia' añadida.");
        } else {
            console.log("ℹ️ La columna 'relevancia' ya existe en expedientes.");
        }

        // 2. PARCHE USUARIOS (VISITAS Y RANGOS)
        const [colsVisitas] = await conn.query(`SHOW COLUMNS FROM usuarios LIKE 'visitas'`);
        if (colsVisitas.length === 0) {
            console.log("📡 Añadiendo columna 'visitas' a la tabla usuarios...");
            await conn.query(`ALTER TABLE usuarios ADD COLUMN visitas INT DEFAULT 0`);
            console.log("✅ Columna 'visitas' añadida.");
        }

        const [colsRango] = await conn.query(`SHOW COLUMNS FROM usuarios LIKE 'rango'`);
        if (colsRango.length === 0) {
            console.log("📡 Añadiendo columna 'rango' a la tabla usuarios...");
            await conn.query(`ALTER TABLE usuarios ADD COLUMN rango VARCHAR(50) DEFAULT 'Agente en Prácticas'`);
            console.log("✅ Columna 'rango' añadida.");
        }

        // 3. ASEGURAR RANGO DEL ADMINISTRADOR
        console.log("🎖️ Asegurando estatus de Comandante para el mando central...");
        await conn.query(`UPDATE usuarios SET rango = 'Comandante', rol = 'admin', aprobado = 1 WHERE email = 'archipegv2@gmail.com'`);
        
        console.log("\n✨ PARCHE COMPLETADO CON ÉXITO EN PRODUCCIÓN.");
        console.log("📡 La base de datos 'expedientex' ya está sincronizada con las nuevas funciones.");

    } catch (err) {
        console.error("❌ ERROR CRÍTICO DURANTE EL PARCHE:", err.message);
    } finally {
        await conn.end();
        console.log("🔌 Desconectado de la base de datos.");
    }
}

patch().catch(console.error);
