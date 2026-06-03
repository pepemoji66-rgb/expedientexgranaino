require('dotenv').config();
const db = require('../db');

async function restaurar() {
    try {
        console.log("🚀 RESTAURANDO CONTADOR A 2000...");
        await db.execute("UPDATE visitas SET cuenta = 2000 WHERE id = 1");
        
        console.log("🔓 ASEGURANDO VISIBILIDAD DE EXPEDIENTES...");
        // Nos aseguramos de que todos los expedientes 'aprobados' tengan el tipo correcto
        await db.execute("UPDATE expedientes SET tipo = 'agente' WHERE tipo IS NULL OR tipo = ''");
        
        console.log("✅ OPERACIÓN COMPLETADA.");
        process.exit(0);
    } catch (err) {
        console.error("❌ ERROR:", err.message);
        process.exit(1);
    }
}
restaurar();
