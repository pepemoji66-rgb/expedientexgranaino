require('dotenv').config();
const db = require('../db');

async function debug() {
    try {
        const results = await db.query("SELECT * FROM expedientes WHERE titulo LIKE '%Rambla%'");
        console.log(JSON.stringify(results[0], null, 2));
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
debug();
