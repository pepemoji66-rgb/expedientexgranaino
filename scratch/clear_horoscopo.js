const db = require('../db');
const today = new Date().toISOString().split('T')[0];

async function clearHoroscope() {
    try {
        await db.execute("DELETE FROM horoscopos WHERE fecha = ?", [today]);
        console.log("✅ Caché de horóscopo borrada correctamente.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error borrando caché:", err);
        process.exit(1);
    }
}

clearHoroscope();
