const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

console.log('⏳ Intentando conectar al búnker...');

db.connect(err => {
    if (err) {
        console.error('❌ ERROR DE CONEXIÓN:', err.message);
        process.exit();
    }
    console.log('✅ CONECTADO A AIVEN');
    
    // Probamos a insertar un agente de prueba
    const sql = "INSERT INTO usuarios (username, email, password, ciudad, edad, rol) VALUES ('agente_test', 'test@bunker.com', '1234', 'Granada', 30, 'agente')";
    
    db.query(sql, (err, res) => {
        if (err) {
            console.error('❌ ERROR AL INSERTAR:', err.message);
        } else {
            console.log('🚀 ¡EXITO! Agente de prueba creado. La base de datos está PERFECTA.');
        }
        db.end();
        process.exit();
    });
});