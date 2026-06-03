const db = require('../db');

async function checkAudios() {
    try {
        const results = await db.query("SELECT * FROM audios");
        console.log("Audios en la DB:", JSON.stringify(results, null, 2));
    } catch (err) {
        console.error("Error en la DB:", err);
    }
}

checkAudios();
