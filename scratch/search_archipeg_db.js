const db = require('../db');

async function search() {
    console.log("🔍 Searching for 'archipeg' in database expedientex_dev...");
    const tables = ['chat_mensajes', 'comentarios', 'expedientes', 'lugares', 'usuarios', 'noticias', 'videos', 'audios'];
    for (const table of tables) {
        try {
            const rows = await db.query(`SELECT * FROM ${table}`);
            for (const row of rows) {
                const rowStr = JSON.stringify(row);
                if (rowStr.toLowerCase().includes('archipeg')) {
                    console.log(`🎯 Found in table ${table}:`);
                    console.log(rowStr);
                }
            }
        } catch (e) {
            console.error(`Error in table ${table}:`, e.message);
        }
    }
    console.log("Search finished.");
    process.exit(0);
}

search();
