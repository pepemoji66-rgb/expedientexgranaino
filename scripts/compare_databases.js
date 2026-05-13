const mysql = require('mysql2/promise');
require('dotenv').config();

async function compare() {
    const commonConfig = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: { rejectUnauthorized: false }
    };

    const dbs = ['expedientex', 'expedientex_bunker'];
    const results = {};

    for (const dbName of dbs) {
        console.log(`\n📊 Analizando base de datos: ${dbName}...`);
        const connection = await mysql.createConnection({ ...commonConfig, database: dbName });
        
        const [tables] = await connection.query("SHOW TABLES");
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        results[dbName] = {};
        
        for (const tableName of tableNames) {
            const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            results[dbName][tableName] = countResult[0].count;
            console.log(`  - ${tableName}: ${countResult[0].count} registros`);
        }
        
        await connection.end();
    }

    console.log("\n--- RESUMEN COMPARATIVO ---");
    const allTables = new Set([...Object.keys(results['expedientex']), ...Object.keys(results['expedientex_bunker'])]);
    
    console.log("| Tabla | expedientex | expedientex_bunker |");
    console.log("|-------|-------------|--------------------|");
    for (const table of allTables) {
        const count1 = results['expedientex'][table] || 0;
        const count2 = results['expedientex_bunker'][table] || 0;
        console.log(`| ${table} | ${count1} | ${count2} |`);
    }
}

compare().catch(console.error);
