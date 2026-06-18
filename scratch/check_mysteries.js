const db = require('../db');

async function check() {
    try {
        console.log("Checking misterios_historicos...");
        const misterios = await db.query("SELECT id, titulo, estado, fecha FROM misterios_historicos");
        console.log("Misterios found:", misterios);

        console.log("\nChecking casos_abiertos...");
        const casos = await db.query("SELECT id, titulo, estado, fecha FROM casos_abiertos");
        console.log("Casos found:", casos);

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

check();
