const db = require('../db');

async function getStory() {
    try {
        const rows = await db.query("SELECT * FROM expedientes WHERE id = 7");
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

getStory();
