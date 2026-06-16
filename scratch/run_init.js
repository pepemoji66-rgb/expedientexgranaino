const db = require('../db');
const dbInit = require('../db_init');

async function run() {
    try {
        console.log("Running db_init manually...");
        await dbInit(db);
        console.log("db_init completed successfully!");
        process.exit(0);
    } catch (err) {
        console.error("Error running db_init:", err);
        process.exit(1);
    }
}

run();
