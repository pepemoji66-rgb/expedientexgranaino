const mysql = require('mysql2/promise');

async function test() {
  const getPass = () => Buffer.from("QVZOU19mMVBKQVVEM3M1WU9JUzk4QlVy", "base64").toString("utf-8");
  
  const dbs = ["egipto_db", "expedientex_dev"];
  
  for (let dbName of dbs) {
    try {
      const connection = await mysql.createConnection({
        host: "mysql-1cd66845-pepemoji66-a012.c.aivencloud.com",
        port: 11475,
        user: "avnadmin",
        password: getPass(),
        database: dbName,
        ssl: { rejectUnauthorized: false }
      });

      console.log(`\n✅ Conectado a ${dbName}`);
      const [tables] = await connection.query("SHOW TABLES");
      console.log("Tablas:", tables.map(t => Object.values(t)[0]));

      for (let t of tables) {
        const tableName = Object.values(t)[0];
        const [rows] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        console.log(` - Tabla ${tableName}: ${rows[0].count} filas`);
      }

      await connection.end();
    } catch (e) {
      console.log(`❌ Error con ${dbName}: ${e.message}`);
    }
  }
}

test().catch(err => console.error("❌ Error general:", err));
