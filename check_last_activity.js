const db = require('./db');

async function checkActivity() {
    console.log("🔍 COMPROBANDO ACTIVIDAD RECIENTE EN EL BÚNKER (AIVEN)...");
    
    const tables = ['chat_mensajes', 'comentarios', 'expedientes', 'lugares', 'usuarios'];
    
    for (const table of tables) {
        try {
            const results = await db.query(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 5`);
            console.log(`\n--- 📊 Tabla: ${table} (${results.length} registros recientes) ---`);
            results.forEach(row => {
                const date = row.fecha || row.createdAt || "N/A";
                console.log(`[${date}] ID: ${row.id} - ${row.nombre_usuario || row.agente || row.titulo || row.nombre || "Sin nombre"}`);
            });
        } catch (err) {
            console.error(`❌ Error en tabla ${table}:`, err.message);
        }
    }
    
    process.exit();
}

checkActivity();
