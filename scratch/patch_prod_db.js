const mysql = require('mysql2/promise');

async function patch() {
    const conn = await mysql.createConnection({
        host: 'mysql-1cd66845-pepemoji66-a012.c.aivencloud.com',
        port: 11475,
        user: 'avnadmin',
        password: 'AVNS_f1PJAUD3s5YOIS98BUr',
        database: 'expedientex',
        ssl: { rejectUnauthorized: false }
    });

    console.log("Conectado a BD de producción");

    const [cols] = await conn.query(`SHOW COLUMNS FROM usuarios LIKE 'rango'`);
    if (cols.length === 0) {
        console.log("Añadiendo columnas de rango...");
        await conn.query(`ALTER TABLE usuarios 
            ADD COLUMN rango VARCHAR(50) DEFAULT 'Agente en Prácticas',
            ADD COLUMN puntos_experiencia INT DEFAULT 0,
            ADD COLUMN misiones_completadas INT DEFAULT 0`);
        
        await conn.query(`UPDATE usuarios SET rango = 'Comandante', puntos_experiencia = 5000, misiones_completadas = 100 WHERE nombre LIKE '%Jose Moreno%' OR email = 'archipegv2@gmail.com'`);
        console.log("Columnas añadidas.");
    } else {
        console.log("Columnas ya existen.");
    }

    const [colsVer] = await conn.query(`SHOW COLUMNS FROM usuarios LIKE 'verificado'`);
    if (colsVer.length === 0) {
        await conn.query(`ALTER TABLE usuarios ADD COLUMN verificado TINYINT(1) DEFAULT 1`);
    }
    
    // Add null password handling column to usuarios maybe? No, we handle that in code.
    
    await conn.end();
}

patch().catch(console.error);
