const db = require('../db');

async function clearHoroscopo() {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`🧹 Limpiando horóscopo del día ${today}...`);
        await db.execute("DELETE FROM horoscopos WHERE fecha = ?", [today]);
        console.log("✅ Limpieza completada. La próxima vez que alguien entre se generará de nuevo.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error en la limpieza:", err);
        process.exit(1);
    }
}

clearHoroscopo();
