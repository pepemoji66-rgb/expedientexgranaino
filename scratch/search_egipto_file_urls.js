const mysql = require('mysql2/promise');

async function search() {
  const connection = await mysql.createConnection({
    host: "mysql-1cd66845-pepemoji66-a012.c.aivencloud.com",
    port: 11475,
    user: "avnadmin",
    password: Buffer.from("QVZOU19mMVBKQVVEM3M1WU9JUzk4QlVy", "base64").toString("utf-8"),
    database: "egipto_db",
    ssl: { rejectUnauthorized: false }
  });

  const tables = ['contenido_inicio', 'expedientes', 'misterios', 'usuarios', 'chat_messages'];
  for (let t of tables) {
    console.log(`\n--- ${t} ---`);
    const [rows] = await connection.query(`SELECT * FROM \`${t}\``);
    console.log(rows);
  }
  await connection.end();
}

search().catch(console.error);
