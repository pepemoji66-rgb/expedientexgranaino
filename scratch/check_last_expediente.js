const db = require('../db');

async function check() {
    try {
        const rows = await db.query("SELECT * FROM expedientes ORDER BY id DESC LIMIT 1");
        console.log("🔍 ÚLTIMO EXPEDIENTE ENCONTRADO EN DB:");
        console.log(JSON.stringify(rows[0], null, 2));
    } catch (err) {
        console.error("❌ ERROR AL CONSULTAR:", err);
    } finally {
        process.exit();
    }
}

check();
