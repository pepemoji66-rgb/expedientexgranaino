require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0
});

const queries = [
    // VIDEOS
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8) DEFAULT 0",
    "ALTER TABLE videos ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8) DEFAULT 0",
    
    // AUDIOS
    "ALTER TABLE audios ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8) DEFAULT 0",
    "ALTER TABLE audios ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8) DEFAULT 0",
    "ALTER TABLE audios ADD COLUMN IF NOT EXISTS agente VARCHAR(255) DEFAULT 'Agente Anónimo'",
    
    // EXPEDIENTES
    "ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8) DEFAULT 0",
    "ALTER TABLE expedientes ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8) DEFAULT 0",
    
    // IMAGENES
    "ALTER TABLE imagenes ADD COLUMN IF NOT EXISTS latitud DECIMAL(10, 8) DEFAULT 0",
    "ALTER TABLE imagenes ADD COLUMN IF NOT EXISTS longitud DECIMAL(11, 8) DEFAULT 0",
    "ALTER TABLE imagenes ADD COLUMN IF NOT EXISTS agente VARCHAR(255) DEFAULT 'Agente Anónimo'"
];

console.log("📡 INICIANDO PARCHE DE BASE DE DATOS...");

db.getConnection((err, conn) => {
    if (err) {
        console.error("❌ ERROR DE CONEXIÓN:", err.message);
        process.exit(1);
    }

    let completed = 0;
    queries.forEach(sql => {
        conn.query(sql, (error) => {
            if (error) {
                if (error.code === 'ER_CANT_DROP_FIELD_OR_KEY' || error.code === 'ER_DUP_FIELDNAME') {
                    // Ignorar errores de duplicado si IF NOT EXISTS no funcionara por alguna razón
                } else {
                    console.error(`⚠️ Error en query [${sql}]:`, error.message);
                }
            } else {
                console.log(`✅ Ejecutado: ${sql.substring(0, 50)}...`);
            }
            
            completed++;
            if (completed === queries.length) {
                console.log("🏁 PARCHE FINALIZADO.");
                conn.release();
                process.exit(0);
            }
        });
    });
});
