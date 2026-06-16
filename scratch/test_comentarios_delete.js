require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : null,
    };

    try {
        const connection = await mysql.createConnection(config);
        
        // 1. Insertar comentarios ficticios hasta tener más de 10
        console.log("Insertando comentarios ficticios para test...");
        for (let i = 1; i <= 5; i++) {
            await connection.execute(
                "INSERT INTO comentarios (agente, mensaje, fecha, aprobado) VALUES (?, ?, NOW(), 1)", 
                [`Agente_${i}`, `Mensaje de prueba número ${i}`]
            );
        }

        // 2. Contar comentarios antes
        let [cnt] = await connection.query("SELECT COUNT(*) as count FROM comentarios");
        console.log("Total comentarios antes de podar:", cnt[0].count);

        // 3. Ejecutar poda con límite 10
        const limite = 10;
        // Usamos query en lugar de execute para LIMIT/OFFSET
        const [rows] = await connection.query(`SELECT id FROM comentarios ORDER BY id DESC LIMIT 1 OFFSET ?`, [limite - 1]);
        if (rows.length > 0) {
            const limiteId = rows[0].id;
            console.log(`Límite ID para conservar últimos ${limite} es:`, limiteId);
            const [delResult] = await connection.execute(`DELETE FROM comentarios WHERE id < ?`, [limiteId]);
            console.log("Registros eliminados:", delResult.affectedRows);
        }

        // 4. Contar comentarios después
        [cnt] = await connection.query("SELECT COUNT(*) as count FROM comentarios");
        console.log("Total comentarios después de podar (deberían quedar 10):", cnt[0].count);

        await connection.end();
    } catch (e) {
        console.error("Error general:", e);
    }
}
main();
