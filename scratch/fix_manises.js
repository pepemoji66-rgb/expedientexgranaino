const db = require('../db');
async function fixManises() {
    try {
        await db.execute("UPDATE noticias SET estado = 'aprobado', aprobado = 1 WHERE titulo LIKE '%Manises%'");
        console.log("✅ Caso Manises aprobado correctamente.");
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        process.exit();
    }
}
fixManises();
