const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const config = {
    host: 'mysql-1cd66845-pepemoji66-a012.c.aivencloud.com',
    port: 11475,
    user: 'avnadmin',
    password: Buffer.from("QVZOU19mMVBKQVVEM3M1WU9JUzk4QlVy", "base64").toString("utf-8"),
    database: 'egipto_db',
    ssl: { rejectUnauthorized: false }
};

async function fix() {
  // 1. Copy the file from Pictures to public/imagenes/
  const srcPath = 'C:\\Users\\Jose Moreno\\Pictures\\Dendera03.jpg';
  const destPath = path.join(__dirname, 'expedientesxegipto', 'public', 'imagenes', 'Dendera03.jpg');

  console.log(`📂 Comprobando si existe el origen: ${srcPath}...`);
  if (fs.existsSync(srcPath)) {
    console.log("➡️ Copiando imagen a los assets del proyecto...");
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Imagen copiada a: ${destPath}`);
  } else {
    console.log("❌ No se encontró Dendera03.jpg en Pictures.");
  }

  // 2. Update the database record in Aiven
  console.log("📡 Conectando a Aiven MySQL...");
  const connection = await mysql.createConnection(config);
  
  console.log("🔍 Buscando registros con rutas locales en 'expedientes'...");
  const [rows] = await connection.query("SELECT id, imagen FROM expedientes");
  for (let row of rows) {
    if (row.imagen && (row.imagen.includes('C:\\') || row.imagen.includes('Users') || row.imagen.includes('file:///'))) {
      console.log(`⚡ Corrigiendo ruta local en expediente id ${row.id}: ${row.imagen}`);
      const cleanUrl = '/imagenes/Dendera03.jpg'; // O extraer el nombre si es dinámico
      await connection.query("UPDATE expedientes SET imagen = ? WHERE id = ?", [cleanUrl, row.id]);
      console.log(`✅ Registro actualizado con URL relativa: ${cleanUrl}`);
    }
  }

  await connection.end();
  console.log("🔌 Proceso de corrección de base de datos finalizado.");
}

fix().catch(console.error);
