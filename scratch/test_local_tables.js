const mysql = require('mysql2/promise');

const localConfig = {
    host: '127.0.0.1',
    port: 3307,
    user: 'root',
    password: '',
    database: 'egipto_db'
};

async function test() {
    let conn;
    try {
        console.log("📡 Conectando a XAMPP MySQL...");
        conn = await mysql.createConnection(localConfig);
        console.log("✅ Conectado.");

        const [tables] = await conn.query("SHOW TABLES");
        console.log("Tablas encontradas:", tables);

        for (const row of tables) {
            const tableName = Object.values(row)[0];
            console.log(`\n🔍 Probando tabla: ${tableName}`);
            try {
                const [check] = await conn.query(`CHECK TABLE \`${tableName}\``);
                console.log(`   Check:`, check);
            } catch (err) {
                console.error(`   ❌ Check falló para ${tableName}:`, err.message);
            }

            try {
                const [select] = await conn.query(`SELECT * FROM \`${tableName}\` LIMIT 1`);
                console.log(`   Select 1 ok! Columnas:`, Object.keys(select[0] || {}));
            } catch (err) {
                console.error(`   ❌ Select falló para ${tableName}:`, err.message);
            }
        }
    } catch (err) {
        console.error("Error general:", err);
    } finally {
        if (conn) await conn.end();
    }
}

test();
