const { createClient } = require('@libsql/client');
require('dotenv').config();

async function check() {
    const turso = createClient({ 
        url: "libsql://expedientex-pepemoji66-rgb.aws-eu-west-1.turso.io", 
        authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY0MjY3MTAsImlkIjoiMDE5ZDliNDgtNDYwMS03MWU5LWE2Y2UtNTg4OTcyZGNjYzJiIiwicmlkIjoiMjlmMWUyZTQtMDZiOS00Njc4LWI5Y2UtODc0YjUyZmNiMTAyIn0.0d7q5mNGBBdj3CcT2150tOQ3oPXdG4W_0sqavxWhO34rZbfahhQMO_uzOLU0gvW4u9EtwUq8w9vwcSQ6AwswDg" 
    });

    try {
        const tables = await turso.execute("SELECT name FROM sqlite_master WHERE type='table'");
        for (const t of tables.rows) {
            const count = await turso.execute(`SELECT COUNT(*) as c FROM \`${t.name}\``);
            console.log(`📊 Tabla: ${t.name} | Registros: ${count.rows[0].c}`);
            if (t.name === 'expedientes') {
                const names = await turso.execute("SELECT titulo FROM expedientes ORDER BY id DESC");
                names.rows.forEach(n => console.log(`  - ${n.titulo}`));
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
