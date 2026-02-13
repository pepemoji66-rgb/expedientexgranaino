const mysql = require('mysql2');

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'expedientex',
    port: 3307, // Tu puerto de MySQL
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = db;