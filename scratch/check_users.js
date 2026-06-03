const db = require('../db');

async function checkUsers() {
    try {
        const results = await db.query("SELECT id, nombre, email, aprobado, fecha_registro FROM usuarios ORDER BY id DESC LIMIT 20");
        console.log("📋 ÚLTIMOS REGISTROS EN EL BÚNKER:");
        console.table(results);
        
        const counts = await db.query("SELECT aprobado, COUNT(*) as cantidad FROM usuarios GROUP BY aprobado");
        console.log("\n📊 RESUMEN DE AGENTES:");
        console.table(counts);
        
        process.exit(0);
    } catch (err) {
        console.error("❌ Error al consultar usuarios:", err);
        process.exit(1);
    }
}

checkUsers();
