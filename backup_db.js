require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: '',
    database: process.env.DB_NAME || 'expedientex',
    port: process.env.DB_PORT || 3307,
    ssl: process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : null
});

const tables = [
    'archivos_usuarios',
    'audios',
    'chat_mensajes',
    'expedientes',
    'imagenes',
    'lugares',
    'noticias',
    'usuarios',
    'videos'
];

const backup = {};

console.log("📡 INICIANDO PROTOCOLO DE RESCATE DE DATOS...");

db.connect((err) => {
    if (err) {
        console.error("❌ ERROR AL CONECTAR AL BÚNKER MYSQL:", err.message);
        console.log("👉 Asegúrate de tener XAMPP abierto y que los datos en el .env sean correctos.");
        process.exit(1);
    }

    console.log("✅ CONECTADO AL BÚNKER MYSQL. EMPEZANDO EXTRACCIÓN...");

    let completed = 0;

    tables.forEach(table => {
        const query = `SELECT * FROM \`${table}\``;
        db.query(query, (error, results) => {
            if (error) {
                console.warn(`⚠️ No se pudo extraer la tabla [${table}]:`, error.message);
                backup[table] = [];
            } else {
                console.log(`📦 Datos rescatados de [${table}]: ${results.length} registros.`);
                backup[table] = results;
            }

            completed++;
            if (completed === tables.length) {
                fs.writeFileSync('backup_data.json', JSON.stringify(backup, null, 2));
                console.log("\n🏁 PROTOCOLO FINALIZADO CON ÉXITO.");
                console.log("💾 Los datos están a salvo en 'backup_data.json'.");
                db.end();
                process.exit(0);
            }
        });
    });
});
