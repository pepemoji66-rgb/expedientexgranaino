const { createClient } = require('@libsql/client');
require('dotenv').config();

async function buscar() {
    const turso = createClient({ 
        url: "libsql://expedientex-pepemoji66-rgb.aws-eu-west-1.turso.io", 
        authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY0MjY3MTAsImlkIjoiMDE5ZDliNDgtNDYwMS03MWU5LWE2Y2UtNTg4OTcyZGNjYzJiIiwicmlkIjoiMjlmMWUyZTQtMDZiOS00Njc4LWI5Y2UtODc0YjUyZmNiMTAyIn0.0d7q5mNGBBdj3CcT2150tOQ3oPXdG4W_0sqavxWhO34rZbfahhQMO_uzOLU0gvW4u9EtwUq8w9vwcSQ6AwswDg" 
    });

    try {
        console.log("🔍 BUSCANDO 'MAFASCA' EN TURSO...");
        const res = await turso.execute("SELECT * FROM expedientes WHERE titulo LIKE '%Mafasca%' OR contenido LIKE '%Mafasca%'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
buscar();
