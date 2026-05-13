const { createClient } = require('@libsql/client');

async function list() {
    const db = createClient({ 
        url: 'libsql://expedientex-pepemoji66-rgb.aws-eu-west-1.turso.io', 
        authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY0MjY3MTAsImlkIjoiMDE5ZDliNDgtNDYwMS03MWU5LWE2Y2UtNTg4OTcyZGNjYzJiIiwicmlkIjoiMjlmMWUyZTQtMDZiOS00Njc4LWI5Y2UtODc0YjUyZmNiMTAyIn0.0d7q5mNGBBdj3CcT2150tOQ3oPXdG4W_0sqavxWhO34rZbfahhQMO_uzOLU0gvW4u9EtwUq8w9vwcSQ6AwswDg' 
    });
    
    try {
        const res = await db.execute("SELECT name FROM sqlite_master WHERE type='table'");
        console.log("TABLAS ENCONTRADAS:", res.rows.map(r => r.name).join(', '));
        
        for (const r of res.rows) {
            const count = await db.execute(`SELECT COUNT(*) as count FROM \`${r.name}\``);
            console.log(`${r.name}: ${count.rows[0].count} registros`);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
    process.exit(0);
}
list();
