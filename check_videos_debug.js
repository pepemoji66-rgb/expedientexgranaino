require('dotenv').config();
const db = require('./db');

async function check() {
    try {
        const rows = await db.query("SELECT id, titulo, url, capturas, estado, fecha FROM videos ORDER BY id DESC LIMIT 5");
        console.log("=== ÚLTIMOS VÍDEOS EN LA BD ===");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error("Error al consultar:", e);
        process.exit(1);
    }
}
check();
